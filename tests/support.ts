import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { randomInt } from 'node:crypto';

export const ZONE = 'Ribera Norte';
export const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==', 'base64');

class ReportSubmissionError extends Error {}

export function mark(info: TestInfo): string {
  const id = info.title.match(/CP-\d{2}/)?.[0] || 'CP-XX';
  return `${process.env.SAT_RUN_ID || 'E2E'}-${id}`;
}

export function blocked(info: TestInfo, reason: string): never {
  info.annotations.push({ type: 'BLOQUEADO', description: reason });
  test.skip(true, `BLOQUEADO: ${reason}`);
  throw new Error(`BLOQUEADO: ${reason}`);
}

export function credentials(info: TestInfo, role: 'OPERATOR' | 'ADMIN'): { user: string; password: string } {
  const user = process.env[`${role}_USER`];
  const password = process.env[`${role}_PASSWORD`];
  if (!user || !password) blocked(info, `Faltan ${role}_USER o ${role}_PASSWORD en .env`);
  return { user, password };
}

export async function start(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#s-login')).toBeVisible();
}

export async function login(page: Page, user: string, password: string): Promise<void> {
  await expect(page.locator('#s-login')).toBeVisible();
  await page.locator('#login-user').fill(user);
  await page.locator('#login-pass').fill(password);
  await page.locator('#s-login button[onclick="login()"] ').click();
  await expect(page.locator('#s-dash')).toBeVisible();
}

export async function loginAs(page: Page, info: TestInfo, role: 'OPERATOR' | 'ADMIN' = 'OPERATOR'): Promise<void> {
  const account = credentials(info, role);
  await login(page, account.user, account.password);
}

export async function screen(page: Page, id: string): Promise<void> {
  if (await page.locator(`#${id}`).isVisible()) return;
  await page.locator(`.screen.active .nav-item[onclick="navigate('${id}')"]`).first().click();
  await expect(page.locator(`#${id}`)).toBeVisible();
}

export async function publicReport(page: Page): Promise<void> {
  await page.locator('#s-login .login-report-btn').click();
  await expect(page.locator('#s-reporte')).toBeVisible();
}

export async function fillReport(page: Page, marker: string, options: { dni?: string; missing?: string } = {}): Promise<void> {
  const values: Record<string, string> = {
    '#rep-nombre': 'Prueba Automatizada',
    '#rep-dni': options.dni ?? '12345678',
    '#rep-desc': `Incidencia ${marker}`,
    '#rep-loc': `Referencia ${marker}`
  };
  for (const [selector, value] of Object.entries(values)) {
    await page.locator(selector).fill(options.missing === selector ? '' : value);
  }
  await page.locator('#rep-zona').selectOption({ label: ZONE });
  await page.locator('#rep-tipo').selectOption({ label: 'Inundación de calles' });
}

export async function sendReport(page: Page, info: TestInfo): Promise<string> {
  const [response] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname === '/api/incidencias' && r.request().method() === 'POST'),
    page.locator('#mobile-form-footer button[onclick="sendReporte()"] ').click()
  ]);
  if (!response.ok()) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new ReportSubmissionError(`El reporte público fue rechazado (HTTP ${response.status()}): ${body.error || 'sin detalle del servidor'}`);
  }
  await expect(page.locator('#rep-success')).toBeVisible();
  const code = (await page.locator('#rep-success strong').innerText()).trim();
  expect(code).toMatch(/^INC-/);
  await info.attach('codigo-reporte', { body: Buffer.from(code), contentType: 'text/plain' });
  await page.locator('#rep-success button[onclick="volverPantallaPrincipal()"] ').click();
  await expect(page.locator('#s-login')).toBeVisible();
  return code;
}

export async function makePendingReport(page: Page, info: TestInfo, marker: string): Promise<string> {
  await start(page);
  await publicReport(page);
  await fillReport(page, marker);
  try {
    return await sendReport(page, info);
  } catch (error) {
    if (error instanceof ReportSubmissionError) blocked(info, `No se pudo crear la alerta vecinal requerida: ${error.message}`);
    throw error;
  }
}

export async function ownPending(page: Page, marker: string): Promise<Locator> {
  await screen(page, 's-validar');
  const cards = page.locator('#validar-alert-list .validation-alert-card');
  await expect(cards.first()).toBeVisible();
  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    await cards.nth(i).click();
    if (await page.locator('#s-validar .validar-grid').getByText(marker, { exact: false }).count()) {
      await expect(page.locator('#s-validar .validar-grid')).toContainText(marker);
      return cards.nth(i);
    }
  }
  throw new Error(`No apareció la alerta pendiente de ${marker}`);
}

export async function historyEntry(page: Page, marker: string): Promise<Locator> {
  await screen(page, 's-historial');
  await expect(page.locator('#s-historial .hist-entry').first()).toBeVisible();
  const entry = page.locator('#s-historial .hist-entry').filter({ hasText: marker }).first();
  for (let pageNo = 0; pageNo < 20; pageNo++) {
    if (await entry.isVisible()) return entry;
    const more = page.locator('#s-historial [data-history-load-more]');
    if (!(await more.isVisible())) break;
    await more.click();
  }
  throw new Error(`No apareció ${marker} en Historial`);
}

export async function manualHistoryEntry(page: Page): Promise<Locator> {
  await screen(page, 's-historial');
  const entry = page.locator('#s-historial .hist-entry').filter({ hasText: 'Alerta manual' }).first();
  await expect(entry).toBeVisible();
  return entry;
}

export async function createContact(page: Page, marker: string): Promise<string> {
  const name = `Contacto ${marker}`;
  await screen(page, 's-contactos');
  await page.locator('#s-contactos button[onclick="addContact()"] ').click();
  await expect(page.locator('#m-add-contacto')).toBeVisible();
  await page.locator('#new-c-nombre').fill(name);
  await page.locator('#new-c-tipo').selectOption({ label: 'Vecino ribereño' });
  await page.locator('#new-c-zona').selectOption({ label: ZONE });
  // El SAT rechaza teléfonos duplicados incluso entre sesiones de navegador.
  await page.locator('#new-c-telefono').fill(`376${randomInt(0, 10_000_000).toString().padStart(7, '0')}`);
  await page.locator('#new-c-canal').selectOption({ label: '📱 WhatsApp' });
  const [response] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname === '/api/contactos' && r.request().method() === 'POST'),
    page.locator('#m-add-contacto button[onclick="saveNewContact()"] ').click()
  ]);
  if (!response.ok()) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(`No se pudo crear el contacto (HTTP ${response.status()}): ${body.error || 'sin detalle del servidor'}`);
  }
  await expect(page.locator('#s-contactos tbody tr').filter({ hasText: name })).toBeVisible();
  return name;
}

export async function prepareManual(page: Page, marker: string, contactName?: string): Promise<void> {
  await screen(page, 's-emit');
  await page.locator('#emit-fuente').selectOption({ label: 'Defensa Civil — Evaluación operativa' });
  await page.locator('#emit-riesgo').selectOption({ label: '🟠 Alerta Naranja — Riesgo Medio' });
  await page.locator('#emit-zona').selectOption({ label: ZONE });
  await page.locator('#emit-msg').fill(`Alerta de prueba ${marker}`);
  await page.locator('#emit-step-1 label').filter({ hasText: 'WhatsApp' }).locator('input[type="checkbox"]').check();
  await page.locator('#emit-step-1 label').filter({ hasText: 'SMS' }).locator('input[type="checkbox"]').uncheck();
  await page.locator('#emit-step-1 button[onclick="emitStep(2)"]').click();
  await expect(page.locator('#emit-step-2')).toBeVisible();
  await expect(page.locator('#emit-dest-tbody tr').first()).not.toContainText('Cargando destinatarios');
  const rows = page.locator('#emit-dest-tbody tr[data-tipo]');
  if (contactName) {
    const choices = rows.locator('input[type="checkbox"]');
    for (let i = 0; i < await choices.count(); i++) await choices.nth(i).uncheck();
    await rows.filter({ hasText: contactName }).locator('input[type="checkbox"]').check();
  }
}

export async function emitManual(page: Page, marker: string): Promise<number> {
  await page.locator('#emit-step-2 button[onclick="emitStep(3)"]').click();
  await expect(page.locator('#emit-step-3')).toBeVisible();
  await expect(page.locator('#emit-res-msg')).toContainText(marker);
  await page.locator('#emit-step-3 button[onclick="openModal(\'m-emit-confirm\')"]').click();
  await expect(page.locator('#m-emit-confirm')).toBeVisible();
  const [response] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname === '/api/alertas/manuales' && r.request().method() === 'POST'),
    page.locator('#m-emit-confirm button[onclick="emitManualAlert()"] ').click()
  ]);
  if (!response.ok()) throw new Error(`No se pudo emitir la alerta manual (HTTP ${response.status()})`);
  const body = await response.json() as { id?: number };
  if (typeof body.id !== 'number') throw new Error('La emisión no devolvió el ID de la alerta manual');
  await expect(page.locator('#s-dash')).toBeVisible();
  return body.id;
}

export async function createUser(page: Page, marker: string, role: string): Promise<{ user: string; password: string }> {
  const user = `e2e_${marker.toLowerCase().replace(/[^a-z0-9]/g, '').slice(-22)}`;
  const password = `SatTest-${marker.slice(-6)}!`;
  await screen(page, 's-usuarios');
  await page.locator('#usr-nombre').fill(`Usuario ${marker}`);
  await page.locator('#usr-usuario').fill(user);
  await page.locator('#usr-password').fill(password);
  await page.locator('#usr-rol').selectOption({ label: role });
  await page.locator('#s-usuarios button[onclick="createUser()"] ').click();
  await expect(page.locator('#users-tbody tr').filter({ hasText: user })).toBeVisible();
  return { user, password };
}
