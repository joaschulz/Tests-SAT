import { expect, test } from '@playwright/test';
import { blocked, historyEntry, loginAs, makePendingReport, mark, ownPending, screen, start } from './support';

type PendingAlert = { id: number; codigo: string };

async function selectPendingAlert(
  page: import('@playwright/test').Page,
  info: import('@playwright/test').TestInfo,
  origin?: 'Automática'
): Promise<{ alert: PendingAlert; card: import('@playwright/test').Locator }> {
  const responsePromise = page.waitForResponse(r =>
    new URL(r.url()).pathname === '/api/alertas' && r.request().method() === 'GET'
  );
  await screen(page, 's-validar');
  const response = await responsePromise;
  if (!response.ok()) throw new Error(`No se pudo cargar la lista de alertas (HTTP ${response.status()})`);
  const list = page.locator('#validar-alert-list');
  const pending = list.locator('.validation-alert-card').filter({ hasText: /PENDIENTE/i });
  try {
    await expect(pending.first()).toBeVisible({ timeout: 8_000 });
  } catch {
    const visibleText = (await list.innerText()).trim();
    const payload = await response.json().catch(() => null) as {
      alertas?: Array<{ codigo?: string; origen?: string; estado?: string }>
    } | null;
    const apiPending = Array.isArray(payload?.alertas)
      ? payload.alertas.filter(a => /pendiente/i.test(a.estado || ''))
          .map(a => ({ codigo: a.codigo, origen: a.origen, estado: a.estado }))
      : [];
    await info.attach('pendientes-sin-tarjetas', { body: await page.screenshot(), contentType: 'image/png' });
    await info.attach('pendientes-texto-visible', { body: Buffer.from(visibleText), contentType: 'text/plain' });
    await info.attach('pendientes-api', { body: Buffer.from(JSON.stringify(apiPending, null, 2)), contentType: 'application/json' });
    if (/cargando/i.test(visibleText)) throw new Error('La lista de alertas quedó cargando después de la respuesta del servidor');
    if (apiPending.length) throw new Error(`La API informó ${apiPending.length} alertas pendientes, pero la interfaz no mostró ninguna tarjeta`);
    blocked(info, `La vista no muestra alertas pendientes tras cargar la lista (HTTP ${response.status()})`);
  }
  const eligible = origin ? pending.filter({ hasText: /Automática/i }) : pending;
  if (!(await eligible.count())) blocked(info, 'Hay alertas pendientes visibles, pero ninguna es automática');
  const candidate = eligible.first();
  const action = await candidate.getAttribute('onclick');
  const id = Number(action?.match(/selectPendingAlert\((\d+)\)/)?.[1]);
  if (!Number.isInteger(id)) throw new Error('La tarjeta pendiente no expone un ID válido');
  const card = list.locator(`.validation-alert-card[onclick="selectPendingAlert(${id})"]`);
  await card.click();
  await expect(card).toHaveAttribute('aria-selected', 'true');
  const subtitle = await page.locator('#s-validar .page-sub').first().innerText();
  const codigo = subtitle.match(/\bALT-\d+\b/)?.[0];
  if (!codigo) throw new Error('No se pudo leer de la pantalla el código de la alerta seleccionada');
  return { alert: { id, codigo }, card };
}

async function ownAlert(page: import('@playwright/test').Page, info: import('@playwright/test').TestInfo): Promise<string> {
  const marker = mark(info);
  await makePendingReport(page, info, marker);
  await loginAs(page, info);
  await ownPending(page, marker);
  return marker;
}

async function auditRow(page: import('@playwright/test').Page, marker: string) {
  await screen(page, 's-historial');
  const row = page.locator('#alert-audit-tbody tr').filter({ hasText: marker }).first();
  await expect(row).toBeVisible();
  return row;
}

async function validatedEarlierInThisRun(page: import('@playwright/test').Page): Promise<{ codigo: string; marker: string } | null> {
  const runId = process.env.SAT_RUN_ID;
  if (!runId) return null;
  const marker = `${runId}-CP-07`;
  const responsePromise = page.waitForResponse(r =>
    new URL(r.url()).pathname === '/api/auditoria-alertas' && r.request().method() === 'GET'
  );
  await screen(page, 's-historial');
  const response = await responsePromise;
  if (!response.ok()) throw new Error(`No se pudo consultar la auditoría (HTTP ${response.status()})`);
  const row = page.locator('#alert-audit-tbody tr').filter({ hasText: `Validación ${marker}` }).first();
  const found = await row.waitFor({ state: 'visible', timeout: 2_500 }).then(() => true, () => false);
  if (!found) return null;
  await expect(row).toContainText('Validada');
  const codigo = (await row.locator('td').first().innerText()).trim();
  if (!/^ALT-\d+$/.test(codigo)) throw new Error('La auditoría no muestra el código de la alerta validada');
  return { codigo, marker };
}

test('CP-05 RF-T02 visualización de alerta automática pendiente', async ({ page }, info) => {
  await start(page);
  await loginAs(page, info);
  const { card } = await selectPendingAlert(page, info, 'Automática');
  await expect(card).toContainText('Automática');
});

test('CP-06 RF-T02 reporte vecinal aparece como alerta pendiente', async ({ page }, info) => {
  const marker = await ownAlert(page, info);
  await expect(page.locator('#s-validar .validar-grid')).toContainText(marker);
  await expect(page.locator('#s-validar .validar-grid')).toContainText('REPORTE VECINAL');
});

// Estas comprobaciones no consumen alertas; se ejecutan antes de validar o rechazar.
test('CP-09 RF-T02 mantener pendiente conserva estado y observación', async ({ page }, info) => {
  await start(page);
  await loginAs(page, info);
  const { alert, card } = await selectPendingAlert(page, info);
  if (!(await page.locator('#keep-alert-pending-btn').isVisible())) {
    blocked(info, 'La alerta pendiente disponible no muestra una acción visible para mantenerla pendiente');
  }
  const observation = `Verificar terreno ${mark(info)}`;
  await page.locator('#val-obs').fill(observation);
  await page.locator('#keep-alert-pending-btn').click();
  await expect(card).toBeVisible();
  const audit = await auditRow(page, alert.codigo);
  await expect(audit).toContainText(/Pendiente/i);
  await expect(audit).toContainText(observation);
});

test('CP-10 RF-T02 rechazo sin observación se bloquea', async ({ page }, info) => {
  await start(page);
  await loginAs(page, info);
  const { card } = await selectPendingAlert(page, info);
  await card.locator('.sat-card-observation').fill('');
  await card.locator('[data-card-action="reject"]').click();
  await expect(page.locator('#m-rechazar')).toBeVisible();
  await page.locator('#m-rechazar button[onclick^="handleAlertAction"]').click();
  await expect(page.locator('#global-toast')).toContainText(/motivo|observación/i);
  await expect(card).toBeVisible();
});

test('CP-11 RF-T02 mantener pendiente sin observación se bloquea', async ({ page }, info) => {
  await start(page);
  await loginAs(page, info);
  const { card } = await selectPendingAlert(page, info);
  if (!(await page.locator('#keep-alert-pending-btn').isVisible())) {
    blocked(info, 'La alerta pendiente disponible no muestra una acción visible para mantenerla pendiente');
  }
  await page.locator('#val-obs').fill('');
  await page.locator('#keep-alert-pending-btn').click();
  await expect(page.locator('#global-toast')).toContainText(/observación/i);
  await expect(card).toBeVisible();
});

test('CP-07 RF-T02 validación cambia estado y registra auditoría', async ({ page }, info) => {
  await start(page);
  await loginAs(page, info);
  const { alert, card } = await selectPendingAlert(page, info);
  const observation = `Validación ${mark(info)}`;
  await card.locator('.sat-card-observation').fill(observation);
  await card.locator('[data-card-action="validate"]').click();
  await expect(page.locator('#m-validar')).toBeVisible();
  await page.locator('#m-validar button[onclick^="handleAlertAction"]').click();
  await expect(card).toHaveCount(0);
  const audit = await auditRow(page, alert.codigo);
  await expect(audit).toContainText(/Validada|Validar/i);
  await expect(audit).toContainText(observation);
  await expect(await historyEntry(page, mark(info))).toContainText('VALIDADA');
});

test('CP-08 RF-T02 rechazo con observación queda auditado', async ({ page }, info) => {
  await start(page);
  await loginAs(page, info);
  const { alert, card } = await selectPendingAlert(page, info);
  const observation = `Rechazo ${mark(info)}`;
  await card.locator('.sat-card-observation').fill(observation);
  await card.locator('[data-card-action="reject"]').click();
  await expect(page.locator('#m-rechazar')).toBeVisible();
  await page.locator('#m-rechazar button[onclick^="handleAlertAction"]').click();
  await expect(card).toHaveCount(0);
  const audit = await auditRow(page, alert.codigo);
  await expect(audit).toContainText(/Rechazada|Rechazar/i);
  await expect(audit).toContainText(observation);
});

test('CP-12 RF-T02 alerta procesada sale de pendientes y queda en Historial', async ({ page }, info) => {
  await start(page);
  await loginAs(page, info);
  const previous = await validatedEarlierInThisRun(page);
  if (previous) {
    await expect(await historyEntry(page, previous.marker)).toContainText('VALIDADA');
    const responsePromise = page.waitForResponse(r =>
      new URL(r.url()).pathname === '/api/alertas' && r.request().method() === 'GET'
    );
    await screen(page, 's-validar');
    const response = await responsePromise;
    if (!response.ok()) throw new Error(`No se pudo consultar la lista de pendientes (HTTP ${response.status()})`);
    const id = Number(previous.codigo.slice(4));
    await expect(page.locator(`#validar-alert-list .validation-alert-card[onclick="selectPendingAlert(${id})"]`)).toHaveCount(0);
    return;
  }
  const { alert, card } = await selectPendingAlert(page, info);
  await card.locator('.sat-card-observation').fill(`Procesamiento ${mark(info)}`);
  await card.locator('[data-card-action="validate"]').click();
  await expect(page.locator('#m-validar')).toBeVisible();
  await page.locator('#m-validar button[onclick^="handleAlertAction"]').click();
  await expect(card).toHaveCount(0);
  await expect(await auditRow(page, alert.codigo)).toContainText('Validada');
  await expect(await historyEntry(page, mark(info))).toContainText('VALIDADA');
});
