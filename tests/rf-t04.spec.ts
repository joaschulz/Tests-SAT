import { expect, test } from '@playwright/test';
import { blocked, createContact, createUser, emitManual, login, loginAs, manualHistoryEntry, mark, prepareManual, screen, start, ZONE } from './support';

test('CP-21 RF-T04 emisión manual completa queda emitida y activa', async ({ page }, info) => {
  const marker = mark(info);
  await start(page);
  await loginAs(page, info);
  const contact = await createContact(page, marker);
  await prepareManual(page, marker, contact);
  await expect(page.locator('#emit-dest-summary')).toContainText('1 contacto');
  await emitManual(page, marker);
  await expect(page.locator('#s-dash')).toContainText(marker);
  await expect(await manualHistoryEntry(page)).toContainText(/EMITIDA|Emitida/i);
});

test('CP-22 RF-T04 emisión a destinatarios seleccionados de la zona', async ({ page }, info) => {
  const marker = mark(info);
  await start(page);
  await loginAs(page, info);
  const selected = await createContact(page, `${marker}-A`);
  const excluded = await createContact(page, `${marker}-B`);
  await prepareManual(page, marker, selected);
  const selectedRow = page.locator('#emit-dest-tbody tr').filter({ hasText: selected });
  const excludedRow = page.locator('#emit-dest-tbody tr').filter({ hasText: excluded });
  await expect(selectedRow.locator('input[type="checkbox"]')).toBeChecked();
  await expect(excludedRow.locator('input[type="checkbox"]')).not.toBeChecked();
  await expect(page.locator('#emit-dest-summary')).toContainText('1 contacto');
  await page.locator('#emit-step-2 button[onclick="emitStep(3)"]').click();
  await expect(page.locator('#emit-res-contactos')).toContainText('1 contacto');
  await expect(page.locator('#emit-res-canales')).toContainText('WhatsApp');
  await expect(page.locator('#emit-res-canales')).not.toContainText('SMS');
  await page.locator('#emit-step-3 button[onclick="openModal(\'m-emit-confirm\')"]').click();
  await expect(page.locator('#emit-confirm-title')).toContainText('1 contacto');
  await page.locator('#m-emit-confirm button[onclick="emitManualAlert()"] ').click();
  await expect(page.locator('#s-dash')).toBeVisible();
  const entry = await manualHistoryEntry(page);
  await expect(entry).toContainText(/EMITIDA|Emitida/i);
  const detail = await entry.innerText();
  if (!/1 contacto/i.test(detail) || !/WhatsApp/i.test(detail)) {
    blocked(info, 'El Historial no expone destinatarios y canales registrados para verificar la selección después de emitir');
  }
});

test('CP-23 RF-T04 faltan fuente, riesgo, zona o mensaje', async ({ page }, info) => {
  await start(page);
  await loginAs(page, info);
  await screen(page, 's-emit');
  const cases: Array<{ field: string; label: string }> = [
    { field: '#emit-riesgo', label: 'nivel de riesgo' },
    { field: '#emit-zona', label: 'zona afectada' },
    { field: '#emit-msg', label: 'mensaje de la alerta' }
  ];
  for (const item of cases) {
    await page.locator('#emit-fuente').selectOption({ label: 'Defensa Civil — Evaluación operativa' });
    await page.locator('#emit-riesgo').selectOption({ label: '🟠 Alerta Naranja — Riesgo Medio' });
    await page.locator('#emit-zona').selectOption({ label: ZONE });
    await page.locator('#emit-msg').fill('Texto de prueba');
    if (item.field === '#emit-msg') await page.locator(item.field).fill('');
    else await page.locator(item.field).selectOption({ index: 0 });
    await page.locator('#emit-step-1 button[onclick="emitStep(2)"]').click();
    await expect(page.locator('#global-toast')).toContainText(item.label);
    await expect(page.locator('#emit-step-1')).toBeVisible();
  }
  const sourceHasEmptyOption = await page.locator('#emit-fuente option[value=""]').count();
  if (!sourceHasEmptyOption) blocked(info, 'La fuente sólo ofrece opciones no vacías; no puede omitirse desde la interfaz pública');
  await page.locator('#emit-fuente').selectOption('');
  await page.locator('#emit-msg').fill('Texto de prueba');
  await page.locator('#emit-step-1 button[onclick="emitStep(2)"]').click();
  await expect(page.locator('#global-toast')).toContainText('fuente de la alerta');
});

test('CP-24 RF-T04 sin canal seleccionado no avanza', async ({ page }, info) => {
  await start(page);
  await loginAs(page, info);
  await screen(page, 's-emit');
  await page.locator('#emit-fuente').selectOption({ label: 'Defensa Civil — Evaluación operativa' });
  await page.locator('#emit-riesgo').selectOption({ label: '🟠 Alerta Naranja — Riesgo Medio' });
  await page.locator('#emit-zona').selectOption({ label: ZONE });
  await page.locator('#emit-msg').fill(`Canales ${mark(info)}`);
  const channels = page.locator('#emit-step-1 input[type="checkbox"]');
  for (let i = 0; i < await channels.count(); i++) await channels.nth(i).uncheck();
  await page.locator('#emit-step-1 button[onclick="emitStep(2)"]').click();
  await expect(page.locator('#global-toast')).toContainText('Seleccione al menos un canal');
  await expect(page.locator('#emit-step-1')).toBeVisible();
});

test('CP-25 RF-T04 sin destinatarios no confirma la alerta', async ({ page }, info) => {
  const marker = mark(info);
  await start(page);
  await loginAs(page, info);
  const contact = await createContact(page, marker);
  await prepareManual(page, marker, contact);
  await page.locator('#emit-dest-tbody tr').filter({ hasText: contact }).locator('input[type="checkbox"]').uncheck();
  await expect(page.locator('#emit-dest-summary')).toContainText('0 contactos');
  await page.locator('#emit-step-2 button[onclick="emitStep(3)"]').click();
  await page.locator('#emit-step-3 button[onclick="openModal(\'m-emit-confirm\')"]').click();
  await page.locator('#m-emit-confirm button[onclick="emitManualAlert()"] ').click();
  await expect(page.locator('#global-toast')).toContainText('al menos un destinatario');
  await expect(page.locator('#s-emit')).toBeVisible();
});

test('CP-26 RF-T01 RF-T04 rol no autorizado no puede emitir', async ({ browser }, info) => {
  const admin = { user: process.env.ADMIN_USER, password: process.env.ADMIN_PASSWORD };
  if (!admin.user || !admin.password) blocked(info, 'Faltan credenciales ADMIN para crear un usuario de rol no autorizado');
  const marker = mark(info);
  const adminContext = await browser.newContext();
  const technicalContext = await browser.newContext();
  try {
    const adminPage = await adminContext.newPage();
    await start(adminPage);
    await login(adminPage, admin.user, admin.password);
    const contact = await createContact(adminPage, marker);
    const technical = await createUser(adminPage, marker, 'Personal Técnico');

    const page = await technicalContext.newPage();
    await start(page);
    await login(page, technical.user, technical.password);
    const emitNav = page.locator('#s-dash .nav-item[onclick="navigate(\'s-emit\')"]');
    if (!(await emitNav.isVisible())) return;
    await prepareManual(page, marker, contact);
    await page.locator('#emit-step-2 button[onclick="emitStep(3)"]').click();
    await page.locator('#emit-step-3 button[onclick="openModal(\'m-emit-confirm\')"]').click();
    await page.locator('#m-emit-confirm button[onclick="emitManualAlert()"] ').click();
    await expect(page.locator('#global-toast')).toContainText(/autoriz|permiso|acceso|rol/i);
    await expect(page.locator('#s-emit')).toBeVisible();
  } finally {
    await technicalContext.close();
    await adminContext.close();
  }
});

test('CP-27 RF-T04 alerta manual emitida se finaliza y pasa a Historial', async ({ page }, info) => {
  const marker = mark(info);
  await start(page);
  await loginAs(page, info);
  const contact = await createContact(page, marker);
  await prepareManual(page, marker, contact);
  const alertId = await emitManual(page, marker);
  await expect(page.locator('#s-dash')).toContainText(marker);
  await page.getByRole('button', { name: 'Ver historial completo' }).click();
  await expect(page.locator('#s-historial')).toBeVisible();
  const entry = page.locator(`#s-historial .hist-entry[data-alerta-id="${alertId}"]`);
  await expect(entry).toContainText('EMITIDA');
  const finalize = entry.getByRole('button', { name: 'Finalizar alerta' });
  await expect(finalize).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await finalize.click();
  await expect(entry.filter({ hasText: 'FINALIZADA' })).toBeVisible();
  await expect(entry.getByRole('button', { name: 'Finalizar alerta' })).toHaveCount(0);
});
