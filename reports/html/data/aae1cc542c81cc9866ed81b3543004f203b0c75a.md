# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf-t03.spec.ts >> CP-14 RF-T03 reporte válido sin imagen
- Location: tests\rf-t03.spec.ts:26:5

# Error details

```
Error: El reporte público fue rechazado (HTTP 401): Sesión inválida o vencida. Inicie sesión nuevamente.
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - text: Acceso público para vecinos — no requiere usuario
    - generic [ref=e4]:
      - generic [ref=e5]: Vista Ciudadano — Dispositivo Móvil
      - generic [ref=e6]:
        - generic [ref=e7]:
          - heading "Reportar Incidencia" [level=2] [ref=e11]
          - paragraph [ref=e12]: Defensa Civil · Municipalidad de Panambí
          - button "← Volver al inicio" [ref=e13] [cursor=pointer]
        - generic [ref=e14]:
          - generic [ref=e15]: Sesión inválida o vencida. Inicie sesión nuevamente.
          - generic [ref=e16]:
            - generic [ref=e17]: Nombre y apellido *
            - 'textbox "Ej: Carlos Gómez" [ref=e18]': Prueba Automatizada
          - generic [ref=e19]:
            - generic [ref=e20]: DNI *
            - textbox "Solo números" [ref=e21]: "12345678"
          - generic [ref=e22]:
            - generic [ref=e23]: Zona aproximada *
            - combobox [ref=e24]:
              - option "Seleccionar..."
              - option "Ribera Norte" [selected]
              - option "Bajo Uruguay"
              - option "Costa Sur"
              - option "Zona Alta"
              - option "Puente"
              - option "Arroyo"
              - option "Otra zona"
          - generic [ref=e25]:
            - generic [ref=e26]: Tipo de incidencia *
            - combobox [ref=e27]:
              - option "Seleccionar..."
              - option "Inundación de calles" [selected]
              - option "Desborde de zanja o arroyo"
              - option "Daños en vivienda"
              - option "Persona en riesgo"
              - option "Corte de camino"
              - option "Otro"
          - generic [ref=e28]:
            - generic [ref=e29]: Descripción breve *
            - textbox "Describa lo que observa..." [ref=e30]: Incidencia E2E-20261001125858-3EAI-CP-14
          - generic [ref=e31]:
            - generic [ref=e32]: Ubicación o referencia *
            - 'textbox "Ej: Calle Mitre 420, esquina frente al almacén" [ref=e33]': Referencia E2E-20261001125858-3EAI-CP-14
          - generic [ref=e34]:
            - generic [ref=e35]: Imagen (opcional)
            - generic [ref=e36] [cursor=pointer]:
              - generic [ref=e37]: 📷
              - generic [ref=e38]: Tocar para adjuntar foto o seleccionar archivo
        - button "Enviar Reporte" [active] [ref=e40] [cursor=pointer]
  - status:
    - generic: Procesando cambios…
```

# Test source

```ts
  1   | import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
  2   | import { randomInt } from 'node:crypto';
  3   | 
  4   | export const ZONE = 'Ribera Norte';
  5   | export const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==', 'base64');
  6   | 
  7   | class ReportSubmissionError extends Error {}
  8   | 
  9   | export function mark(info: TestInfo): string {
  10  |   const id = info.title.match(/CP-\d{2}/)?.[0] || 'CP-XX';
  11  |   return `${process.env.SAT_RUN_ID || 'E2E'}-${id}`;
  12  | }
  13  | 
  14  | export function blocked(info: TestInfo, reason: string): never {
  15  |   info.annotations.push({ type: 'BLOQUEADO', description: reason });
  16  |   test.skip(true, `BLOQUEADO: ${reason}`);
  17  |   throw new Error(`BLOQUEADO: ${reason}`);
  18  | }
  19  | 
  20  | export function credentials(info: TestInfo, role: 'OPERATOR' | 'ADMIN'): { user: string; password: string } {
  21  |   const user = process.env[`${role}_USER`];
  22  |   const password = process.env[`${role}_PASSWORD`];
  23  |   if (!user || !password) blocked(info, `Faltan ${role}_USER o ${role}_PASSWORD en .env`);
  24  |   return { user, password };
  25  | }
  26  | 
  27  | export async function start(page: Page): Promise<void> {
  28  |   await page.goto('/');
  29  |   await expect(page.locator('#s-login')).toBeVisible();
  30  | }
  31  | 
  32  | export async function login(page: Page, user: string, password: string): Promise<void> {
  33  |   await expect(page.locator('#s-login')).toBeVisible();
  34  |   await page.locator('#login-user').fill(user);
  35  |   await page.locator('#login-pass').fill(password);
  36  |   await page.locator('#s-login button[onclick="login()"] ').click();
  37  |   await expect(page.locator('#s-dash')).toBeVisible();
  38  | }
  39  | 
  40  | export async function loginAs(page: Page, info: TestInfo, role: 'OPERATOR' | 'ADMIN' = 'OPERATOR'): Promise<void> {
  41  |   const account = credentials(info, role);
  42  |   await login(page, account.user, account.password);
  43  | }
  44  | 
  45  | export async function screen(page: Page, id: string): Promise<void> {
  46  |   if (await page.locator(`#${id}`).isVisible()) return;
  47  |   await page.locator(`.screen.active .nav-item[onclick="navigate('${id}')"]`).first().click();
  48  |   await expect(page.locator(`#${id}`)).toBeVisible();
  49  | }
  50  | 
  51  | export async function publicReport(page: Page): Promise<void> {
  52  |   await page.locator('#s-login .login-report-btn').click();
  53  |   await expect(page.locator('#s-reporte')).toBeVisible();
  54  | }
  55  | 
  56  | export async function fillReport(page: Page, marker: string, options: { dni?: string; missing?: string } = {}): Promise<void> {
  57  |   const values: Record<string, string> = {
  58  |     '#rep-nombre': 'Prueba Automatizada',
  59  |     '#rep-dni': options.dni ?? '12345678',
  60  |     '#rep-desc': `Incidencia ${marker}`,
  61  |     '#rep-loc': `Referencia ${marker}`
  62  |   };
  63  |   for (const [selector, value] of Object.entries(values)) {
  64  |     await page.locator(selector).fill(options.missing === selector ? '' : value);
  65  |   }
  66  |   await page.locator('#rep-zona').selectOption({ label: ZONE });
  67  |   await page.locator('#rep-tipo').selectOption({ label: 'Inundación de calles' });
  68  | }
  69  | 
  70  | export async function sendReport(page: Page, info: TestInfo): Promise<string> {
  71  |   const [response] = await Promise.all([
  72  |     page.waitForResponse(r => new URL(r.url()).pathname === '/api/incidencias' && r.request().method() === 'POST'),
  73  |     page.locator('#mobile-form-footer button[onclick="sendReporte()"] ').click()
  74  |   ]);
  75  |   if (!response.ok()) {
  76  |     const body = await response.json().catch(() => ({})) as { error?: string };
> 77  |     throw new ReportSubmissionError(`El reporte público fue rechazado (HTTP ${response.status()}): ${body.error || 'sin detalle del servidor'}`);
      |           ^ Error: El reporte público fue rechazado (HTTP 401): Sesión inválida o vencida. Inicie sesión nuevamente.
  78  |   }
  79  |   await expect(page.locator('#rep-success')).toBeVisible();
  80  |   const code = (await page.locator('#rep-success strong').innerText()).trim();
  81  |   expect(code).toMatch(/^INC-/);
  82  |   await info.attach('codigo-reporte', { body: Buffer.from(code), contentType: 'text/plain' });
  83  |   await page.locator('#rep-success button[onclick="volverPantallaPrincipal()"] ').click();
  84  |   await expect(page.locator('#s-login')).toBeVisible();
  85  |   return code;
  86  | }
  87  | 
  88  | export async function makePendingReport(page: Page, info: TestInfo, marker: string): Promise<string> {
  89  |   await start(page);
  90  |   await publicReport(page);
  91  |   await fillReport(page, marker);
  92  |   try {
  93  |     return await sendReport(page, info);
  94  |   } catch (error) {
  95  |     if (error instanceof ReportSubmissionError) blocked(info, `No se pudo crear la alerta vecinal requerida: ${error.message}`);
  96  |     throw error;
  97  |   }
  98  | }
  99  | 
  100 | export async function ownPending(page: Page, marker: string): Promise<Locator> {
  101 |   await screen(page, 's-validar');
  102 |   const cards = page.locator('#validar-alert-list .validation-alert-card');
  103 |   await expect(cards.first()).toBeVisible();
  104 |   const count = await cards.count();
  105 |   for (let i = 0; i < count; i++) {
  106 |     await cards.nth(i).click();
  107 |     if (await page.locator('#s-validar .validar-grid').getByText(marker, { exact: false }).count()) {
  108 |       await expect(page.locator('#s-validar .validar-grid')).toContainText(marker);
  109 |       return cards.nth(i);
  110 |     }
  111 |   }
  112 |   throw new Error(`No apareció la alerta pendiente de ${marker}`);
  113 | }
  114 | 
  115 | export async function historyEntry(page: Page, marker: string): Promise<Locator> {
  116 |   await screen(page, 's-historial');
  117 |   await expect(page.locator('#s-historial .hist-entry').first()).toBeVisible();
  118 |   const entry = page.locator('#s-historial .hist-entry').filter({ hasText: marker }).first();
  119 |   for (let pageNo = 0; pageNo < 20; pageNo++) {
  120 |     if (await entry.isVisible()) return entry;
  121 |     const more = page.locator('#s-historial [data-history-load-more]');
  122 |     if (!(await more.isVisible())) break;
  123 |     await more.click();
  124 |   }
  125 |   throw new Error(`No apareció ${marker} en Historial`);
  126 | }
  127 | 
  128 | export async function manualHistoryEntry(page: Page): Promise<Locator> {
  129 |   await screen(page, 's-historial');
  130 |   const entry = page.locator('#s-historial .hist-entry').filter({ hasText: 'Alerta manual' }).first();
  131 |   await expect(entry).toBeVisible();
  132 |   return entry;
  133 | }
  134 | 
  135 | export async function createContact(page: Page, marker: string): Promise<string> {
  136 |   const name = `Contacto ${marker}`;
  137 |   await screen(page, 's-contactos');
  138 |   await page.locator('#s-contactos button[onclick="addContact()"] ').click();
  139 |   await expect(page.locator('#m-add-contacto')).toBeVisible();
  140 |   await page.locator('#new-c-nombre').fill(name);
  141 |   await page.locator('#new-c-tipo').selectOption({ label: 'Vecino ribereño' });
  142 |   await page.locator('#new-c-zona').selectOption({ label: ZONE });
  143 |   // El SAT rechaza teléfonos duplicados incluso entre sesiones de navegador.
  144 |   await page.locator('#new-c-telefono').fill(`376${randomInt(0, 10_000_000).toString().padStart(7, '0')}`);
  145 |   await page.locator('#new-c-canal').selectOption({ label: '📱 WhatsApp' });
  146 |   const [response] = await Promise.all([
  147 |     page.waitForResponse(r => new URL(r.url()).pathname === '/api/contactos' && r.request().method() === 'POST'),
  148 |     page.locator('#m-add-contacto button[onclick="saveNewContact()"] ').click()
  149 |   ]);
  150 |   if (!response.ok()) {
  151 |     const body = await response.json().catch(() => ({})) as { error?: string };
  152 |     throw new Error(`No se pudo crear el contacto (HTTP ${response.status()}): ${body.error || 'sin detalle del servidor'}`);
  153 |   }
  154 |   await expect(page.locator('#s-contactos tbody tr').filter({ hasText: name })).toBeVisible();
  155 |   return name;
  156 | }
  157 | 
  158 | export async function prepareManual(page: Page, marker: string, contactName?: string): Promise<void> {
  159 |   await screen(page, 's-emit');
  160 |   await page.locator('#emit-fuente').selectOption({ label: 'Defensa Civil — Evaluación operativa' });
  161 |   await page.locator('#emit-riesgo').selectOption({ label: '🟠 Alerta Naranja — Riesgo Medio' });
  162 |   await page.locator('#emit-zona').selectOption({ label: ZONE });
  163 |   await page.locator('#emit-msg').fill(`Alerta de prueba ${marker}`);
  164 |   await page.locator('#emit-step-1 label').filter({ hasText: 'WhatsApp' }).locator('input[type="checkbox"]').check();
  165 |   await page.locator('#emit-step-1 label').filter({ hasText: 'SMS' }).locator('input[type="checkbox"]').uncheck();
  166 |   await page.locator('#emit-step-1 button[onclick="emitStep(2)"]').click();
  167 |   await expect(page.locator('#emit-step-2')).toBeVisible();
  168 |   await expect(page.locator('#emit-dest-tbody tr').first()).not.toContainText('Cargando destinatarios');
  169 |   const rows = page.locator('#emit-dest-tbody tr[data-tipo]');
  170 |   if (contactName) {
  171 |     const choices = rows.locator('input[type="checkbox"]');
  172 |     for (let i = 0; i < await choices.count(); i++) await choices.nth(i).uncheck();
  173 |     await rows.filter({ hasText: contactName }).locator('input[type="checkbox"]').check();
  174 |   }
  175 | }
  176 | 
  177 | export async function emitManual(page: Page, marker: string): Promise<number> {
```