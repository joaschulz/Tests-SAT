import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { PNG, fillReport, loginAs, mark, ownPending, publicReport, sendReport, start } from './support';

async function begin(page: Page, info: TestInfo, suffix = ''): Promise<string> {
  const marker = `${mark(info)}${suffix}`;
  await start(page);
  await publicReport(page);
  await fillReport(page, marker);
  return marker;
}

async function verifyCreated(page: Page, info: TestInfo, marker: string): Promise<string> {
  const code = await sendReport(page, info);
  await loginAs(page, info);
  await ownPending(page, marker);
  await expect(page.locator('#s-validar .validar-grid')).toContainText(code);
  return code;
}

test('CP-13 RF-T03 reporte ciudadano válido sin iniciar sesión', async ({ page }, info) => {
  const marker = await begin(page, info);
  await expect(page.locator('#s-reporte')).toBeVisible();
  await verifyCreated(page, info, marker);
});

test('CP-14 RF-T03 reporte válido sin imagen', async ({ page }, info) => {
  const marker = await begin(page, info);
  await verifyCreated(page, info, marker);
  await expect(page.locator('#s-validar .validar-grid')).toContainText('Sin imagen adjunta');
});

test('CP-15 RF-T03 reporte válido con imagen consultable', async ({ page }, info) => {
  const marker = await begin(page, info);
  await page.locator('#rep-img').setInputFiles({ name: `foto-${marker}.png`, mimeType: 'image/png', buffer: PNG });
  await expect(page.locator('#rep-img-text')).toContainText(`foto-${marker}.png`);
  await verifyCreated(page, info, marker);
  await expect(page.locator('#s-validar .validar-grid')).toContainText(`foto-${marker}.png`);
  await expect(page.locator('#s-validar .validar-grid button').filter({ hasText: /Ver archivo adjunto/i })).toBeVisible();
});

test('CP-16 RF-T03 DNI válidos de 7 y 8 dígitos', async ({ page }, info) => {
  for (const [dni, suffix] of [['1234567', '-7'], ['12345678', '-8']]) {
    const marker = `${mark(info)}${suffix}`;
    if (suffix === '-7') await start(page);
    await publicReport(page);
    await fillReport(page, marker, { dni });
    await sendReport(page, info);
  }
  await loginAs(page, info);
  for (const suffix of ['-7', '-8']) {
    await ownPending(page, `${mark(info)}${suffix}`);
    await expect(page.locator('#s-validar .validar-grid')).toContainText(suffix === '-7' ? '1234567' : '12345678');
  }
});

test('CP-17 RF-T03 DNI menor a 7 dígitos se rechaza', async ({ page }, info) => {
  const marker = await begin(page, info);
  await page.locator('#rep-dni').fill('123456');
  await page.locator('#mobile-form-footer button[onclick="sendReporte()"] ').click();
  await expect(page.locator('#rep-error')).toContainText('7 u 8 números');
  await expect(page.locator('#rep-success')).toBeHidden();
  await page.locator('#rep-back-small').click();
  await loginAs(page, info);
  await page.locator('.screen.active .nav-item[onclick="navigate(\'s-validar\')"]').first().click();
  await expect(page.locator('#validar-alert-list')).not.toContainText(marker);
});

test('CP-18 RF-T03 campo obligatorio vacío se rechaza', async ({ page }, info) => {
  const marker = await begin(page, info);
  await page.locator('#rep-desc').fill('');
  await page.locator('#mobile-form-footer button[onclick="sendReporte()"] ').click();
  await expect(page.locator('#rep-error')).toContainText('Completar nombre, DNI, zona, tipo, descripción y ubicación');
  await expect(page.locator('#rep-success')).toBeHidden();
  await page.locator('#rep-back-small').click();
  await loginAs(page, info);
  await page.locator('.screen.active .nav-item[onclick="navigate(\'s-validar\')"]').first().click();
  await expect(page.locator('#validar-alert-list')).not.toContainText(marker);
});

test('CP-19 RF-T03 adjunto que no es imagen se rechaza @smoke', async ({ page }, info) => {
  const marker = await begin(page, info);
  await page.locator('#rep-img').setInputFiles({ name: `archivo-${marker}.txt`, mimeType: 'text/plain', buffer: Buffer.from('No es una imagen') });
  await expect(page.locator('#global-toast')).toContainText('Solo se permiten archivos de imagen');
  await expect(page.locator('#rep-img-text')).not.toContainText(`archivo-${marker}.txt`);
  await expect(page.locator('#rep-img-preview')).toBeHidden();
});

test('CP-20 RF-T03 imagen superior a 3 MB se rechaza @smoke', async ({ page }, info) => {
  const marker = await begin(page, info);
  const tooLarge = Buffer.concat([PNG, Buffer.alloc(3 * 1024 * 1024)]);
  await page.locator('#rep-img').setInputFiles({ name: `grande-${marker}.png`, mimeType: 'image/png', buffer: tooLarge });
  await expect(page.locator('#global-toast')).toContainText('no puede superar los 3 MB');
  await expect(page.locator('#rep-img-preview')).toBeHidden();
});
