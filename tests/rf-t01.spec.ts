import { expect, test } from '@playwright/test';
import { credentials, login, loginAs, start } from './support';

test('CP-01 RF-T01 inicio de sesión con credenciales válidas', async ({ page }, info) => {
  await start(page);
  await loginAs(page, info);
  await expect(page.locator('#s-dash .topbar-username').first()).not.toBeEmpty();
  await expect(page.locator('#s-dash .sidebar')).toContainText('Panel Principal');
});

test('CP-02 RF-T01 contraseña incorrecta impide el acceso', async ({ page }, info) => {
  const account = credentials(info, 'OPERATOR');
  await start(page);
  await page.locator('#login-user').fill(account.user);
  await page.locator('#login-pass').fill(`${account.password}-incorrecta`);
  await page.locator('#s-login button[onclick="login()"] ').click();
  await expect(page.locator('#s-login')).toBeVisible();
  await expect(page.locator('#s-dash')).toBeHidden();
  await expect(page.locator('#global-toast, #login-error').filter({ hasText: /incorrect|inválid|error|credencial/i }).first()).toBeVisible();
});

test('CP-03 RF-T01 usuario o contraseña vacíos impiden el acceso @smoke', async ({ page }) => {
  await start(page);
  for (const [user, password] of [['', 'cualquiera'], ['usuario', '']]) {
    await page.locator('#login-user').fill(user);
    await page.locator('#login-pass').fill(password);
    await page.locator('#s-login button[onclick="login()"] ').click();
    await expect(page.locator('#s-login')).toBeVisible();
    await expect(page.locator('#s-dash')).toBeHidden();
    await expect(page.locator('#global-toast, #login-error').filter({ hasText: /complet|usuario|contraseña/i }).first()).toBeVisible();
  }
});

test('CP-04 RF-T01 funciones visibles según el rol', async ({ browser }, info) => {
  const operator = credentials(info, 'OPERATOR');
  const admin = credentials(info, 'ADMIN');
  const operatorContext = await browser.newContext();
  const adminContext = await browser.newContext();
  try {
    const operatorPage = await operatorContext.newPage();
    await start(operatorPage);
    await login(operatorPage, operator.user, operator.password);
    await expect(operatorPage.locator('#s-dash .nav-item[onclick="navigate(\'s-usuarios\')"]')).toBeHidden();
    await expect(operatorPage.locator('#s-dash .nav-item[onclick="navigate(\'s-emit\')"]')).toBeVisible();

    const adminPage = await adminContext.newPage();
    await start(adminPage);
    await login(adminPage, admin.user, admin.password);
    await expect(adminPage.locator('#s-dash .nav-item[onclick="navigate(\'s-usuarios\')"]')).toBeVisible();
  } finally {
    await operatorContext.close();
    await adminContext.close();
  }
});
