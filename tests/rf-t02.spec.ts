import { expect, test } from '@playwright/test';
import { blocked, historyEntry, loginAs, makePendingReport, mark, ownPending, screen, start } from './support';

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

test('CP-05 RF-T02 visualización de alerta automática pendiente', async ({ page }, info) => {
  await start(page);
  await loginAs(page, info);
  await screen(page, 's-validar');
  const automatic = page.locator('#validar-alert-list .validation-alert-card').filter({ hasText: /automátic/i });
  if (!(await automatic.count())) blocked(info, 'No hay alerta automática pendiente visible en esta sesión');
  await expect(automatic.first()).toBeVisible();
  await automatic.first().click();
  await expect(page.locator('#s-validar .validar-grid')).toContainText('Datos de la alerta');
});

test('CP-06 RF-T02 reporte vecinal aparece como alerta pendiente', async ({ page }, info) => {
  const marker = await ownAlert(page, info);
  await expect(page.locator('#s-validar .validar-grid')).toContainText(marker);
  await expect(page.locator('#s-validar .validar-grid')).toContainText('REPORTE VECINAL');
});

test('CP-07 RF-T02 validación cambia estado y registra auditoría', async ({ page }, info) => {
  const marker = await ownAlert(page, info);
  await page.locator('#val-obs').fill(`Validación ${marker}`);
  await page.locator('#s-validar button[onclick="openModal(\'m-validar\')"]').click();
  await page.locator('#m-validar button[onclick^="handleAlertAction"]').click();
  await expect(page.locator('#validar-alert-list')).not.toContainText(marker);
  await expect(await auditRow(page, marker)).toContainText(/Validada|Validar/i);
});

test('CP-08 RF-T02 rechazo con observación queda auditado', async ({ page }, info) => {
  const marker = await ownAlert(page, info);
  await page.locator('#val-obs').fill(`Rechazo ${marker}`);
  await page.locator('#s-validar button[onclick="openModal(\'m-rechazar\')"]').click();
  await page.locator('#m-rechazar button[onclick^="handleAlertAction"]').click();
  await expect(page.locator('#validar-alert-list')).not.toContainText(marker);
  await expect(await auditRow(page, marker)).toContainText(/Rechazada|Rechazar/i);
});

test('CP-09 RF-T02 mantener pendiente conserva estado y observación', async ({ page }, info) => {
  const marker = await ownAlert(page, info);
  await page.locator('#val-obs').fill(`Verificar terreno ${marker}`);
  await page.locator('#keep-alert-pending-btn').click();
  await expect(page.locator('#validar-alert-list')).toContainText(marker);
  await expect(await auditRow(page, marker)).toContainText(/Pendiente/i);
});

test('CP-10 RF-T02 rechazo sin observación se bloquea', async ({ page }, info) => {
  const marker = await ownAlert(page, info);
  await page.locator('#val-obs').fill('');
  await page.locator('#s-validar button[onclick="openModal(\'m-rechazar\')"]').click();
  await page.locator('#m-rechazar button[onclick^="handleAlertAction"]').click();
  await expect(page.locator('#global-toast')).toContainText(/motivo|observación/i);
  await expect(page.locator('#validar-alert-list')).toContainText(marker);
});

test('CP-11 RF-T02 mantener pendiente sin observación se bloquea', async ({ page }, info) => {
  const marker = await ownAlert(page, info);
  await page.locator('#val-obs').fill('');
  await page.locator('#keep-alert-pending-btn').click();
  await expect(page.locator('#global-toast')).toContainText(/observación/i);
  await expect(page.locator('#validar-alert-list')).toContainText(marker);
});

test('CP-12 RF-T02 alerta procesada sale de pendientes y queda en Historial', async ({ page }, info) => {
  const marker = await ownAlert(page, info);
  await page.locator('#val-obs').fill(`Procesamiento ${marker}`);
  await page.locator('#s-validar button[onclick="openModal(\'m-validar\')"]').click();
  await page.locator('#m-validar button[onclick^="handleAlertAction"]').click();
  await expect(page.locator('#validar-alert-list')).not.toContainText(marker);
  await expect(await auditRow(page, marker)).toContainText('Validada');
  await expect(await historyEntry(page, marker)).toBeVisible();
});
