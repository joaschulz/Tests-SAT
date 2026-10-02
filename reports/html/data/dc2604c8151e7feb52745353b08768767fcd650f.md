# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf-t04.spec.ts >> CP-26 RF-T01 RF-T04 rol no autorizado no puede emitir
- Location: tests\rf-t04.spec.ts:102:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#global-toast')
Expected pattern: /autoriz|permiso|acceso|rol/i
Received string:  "✅ Alerta enviada a 1 contactos."
Timeout: 12000ms

Call log:
  - Expect "toContainText" locator('#global-toast') with timeout 12000ms
  - waiting for locator('#global-toast')
    4 × locator resolved to <div class="toast" id="global-toast">Bienvenido, Usuario E2E-20261001125858-3EAI-CP-26.</div>
      - unexpected value "Bienvenido, Usuario E2E-20261001125858-3EAI-CP-26."
    7 × locator resolved to <div id="global-toast" class="toast visible">✅ Alerta enviada a 1 contactos.</div>
      - unexpected value "✅ Alerta enviada a 1 contactos."
    16 × locator resolved to <div class="toast" id="global-toast">✅ Alerta enviada a 1 contactos.</div>
       - unexpected value "✅ Alerta enviada a 1 contactos."

```

```yaml
- link "Ir al Panel Principal":
  - img "SAT Panambí"
  - text: SAT Inundaciones Panambí, Misiones
- text: 10:01:11
- button "🌙"
- button "Abrir menú de cuenta de Usuario E2E-20261001125858-3EAI-CP-26": UE Usuario E2E-20261001125858-3EAI-CP-26 Personal Técnico
- text: Monitoreo
- img
- text: Panel Principal
- img
- text: Validar Alerta 5 Acciones
- img
- text: Emitir Alerta Manual Gestión
- img
- text: Contactos
- img
- text: Sensores
- img
- text: Historial
- img
- text: "ALERTA AMARILLO ACTIVA — Costa Sur Sensor S-03 · Amarillo: nivel de río 5.05 m detectado por sensor S-03. · 5 alertas pendientes de validación."
- button "Ver alertas"
- text: "Panel de Control Última actualización: hace 2 min"
- button "Ver historial"
- button "Emitir Alerta Manual":
  - img
  - text: Emitir Alerta Manual
- img
- text: 5.95 m Nivel actual del río ▲ +0.03 m en 5 min
- img
- text: "Subiendo Tendencia Ritmo estimado: +0.50 m/h"
- img
- text: Ahora Tiempo estimado de llegada Ribera Norte · próximo umbral 7.20 m
- img
- text: 5/6 Sensores activos 1 con intermitencia
- img
- text: 5 Alertas pendientes Requieren validación Evolución del Nivel del Río Uruguay — Últimas 24 hs ALERTA NARANJA
- img: 7.2 m (umbral) 8.0 m (crítico) 00:00 06:00 12:00 18:00 ahora
- text: Mapa referencial de zonas y sensores 5 ZONAS CON ALERTA
- button
- button
- button
- button
- button
- button
- button "!"
- button "!"
- button "!"
- button "!"
- button "!"
- button "!"
- button "!"
- button "!"
- button "Zoom in"
- button "Zoom out"
- text: En vivo · 10:01:11
- button "Ampliar mapa": ⤢
- strong: Referencias
- text: Sensor fijo Zona de referencia Alerta activa Las pendientes pulsan y desaparecen al validarse.
- link "Leaflet":
  - /url: https://leafletjs.com
- text: ©
- link "OpenStreetMap":
  - /url: https://www.openstreetmap.org/copyright
- text: contributors Mapa referencial de Panambí. Los puntos indican la ubicación aproximada de los sensores simulados del sistema local. Estado de sensores
- button "Ver todos"
- text: "S-01 Ribera Norte 7.56 m Activo S-02 Bajo Uruguay 6.68 m Activo S-03 Costa Sur 5.05 m Intermitente S-04 Zona Alta 2.71 m Activo S-05 Puente 5.26 m Activo S-06 Arroyo 5.95 m Activo Alertas recientes 5 pendientes Automática · Costa Sur 09:49 Sensor S-03 · Amarillo: nivel de río 5.05 m detectado por sensor S-03. PENDIENTE Automática · Arroyo 09:19 Sensor S-06 · Amarillo: nivel de río 5.93 m detectado por sensor S-06. PENDIENTE Automática · Puente 09:19 Sensor S-05 · Amarillo: nivel de río 5.45 m detectado por sensor S-05. PENDIENTE Automática · Bajo Uruguay 08:56 Sensor S-02 · Umbral naranja superado por sensor S-02. PENDIENTE Automática · Ribera Norte 08:56 Sensor S-01 · Nivel crítico detectado por sensor S-01. PENDIENTE Manual · Ribera Norte 10:01 Alerta emitida por operador · Alerta de prueba E2E-20261001125858-3EAI-CP-26 EMITIDA Manual · Ribera Norte 10:00 Alerta emitida por operador · Alerta de prueba E2E-20261001125858-3EAI-CP-22 EMITIDA Manual · Ribera Norte 10:00 Alerta emitida por operador · Alerta de prueba E2E-20261001125858-3EAI-CP-21 EMITIDA Manual · Ribera Norte 09:54 Alerta emitida por operador · Alerta de prueba E2E-20261001125436-M587-CP-27 FINALIZADA Manual · Ribera Norte 09:53 Alerta emitida por operador · Alerta de prueba E2E-20261001125344-29OV-CP-27 FINALIZADA"
- button "Ver historial completo"
```

# Test source

```ts
  24  |   const excludedRow = page.locator('#emit-dest-tbody tr').filter({ hasText: excluded });
  25  |   await expect(selectedRow.locator('input[type="checkbox"]')).toBeChecked();
  26  |   await expect(excludedRow.locator('input[type="checkbox"]')).not.toBeChecked();
  27  |   await expect(page.locator('#emit-dest-summary')).toContainText('1 contacto');
  28  |   await page.locator('#emit-step-2 button[onclick="emitStep(3)"]').click();
  29  |   await expect(page.locator('#emit-res-contactos')).toContainText('1 contacto');
  30  |   await expect(page.locator('#emit-res-canales')).toContainText('WhatsApp');
  31  |   await expect(page.locator('#emit-res-canales')).not.toContainText('SMS');
  32  |   await page.locator('#emit-step-3 button[onclick="openModal(\'m-emit-confirm\')"]').click();
  33  |   await expect(page.locator('#emit-confirm-title')).toContainText('1 contacto');
  34  |   await page.locator('#m-emit-confirm button[onclick="emitManualAlert()"] ').click();
  35  |   await expect(page.locator('#s-dash')).toBeVisible();
  36  |   const entry = await manualHistoryEntry(page);
  37  |   await expect(entry).toContainText(/EMITIDA|Emitida/i);
  38  |   const detail = await entry.innerText();
  39  |   if (!/1 contacto/i.test(detail) || !/WhatsApp/i.test(detail)) {
  40  |     blocked(info, 'El Historial no expone destinatarios y canales registrados para verificar la selección después de emitir');
  41  |   }
  42  | });
  43  | 
  44  | test('CP-23 RF-T04 faltan fuente, riesgo, zona o mensaje', async ({ page }, info) => {
  45  |   await start(page);
  46  |   await loginAs(page, info);
  47  |   await screen(page, 's-emit');
  48  |   const cases: Array<{ field: string; label: string }> = [
  49  |     { field: '#emit-riesgo', label: 'nivel de riesgo' },
  50  |     { field: '#emit-zona', label: 'zona afectada' },
  51  |     { field: '#emit-msg', label: 'mensaje de la alerta' }
  52  |   ];
  53  |   for (const item of cases) {
  54  |     await page.locator('#emit-fuente').selectOption({ label: 'Defensa Civil — Evaluación operativa' });
  55  |     await page.locator('#emit-riesgo').selectOption({ label: '🟠 Alerta Naranja — Riesgo Medio' });
  56  |     await page.locator('#emit-zona').selectOption({ label: ZONE });
  57  |     await page.locator('#emit-msg').fill('Texto de prueba');
  58  |     if (item.field === '#emit-msg') await page.locator(item.field).fill('');
  59  |     else await page.locator(item.field).selectOption({ index: 0 });
  60  |     await page.locator('#emit-step-1 button[onclick="emitStep(2)"]').click();
  61  |     await expect(page.locator('#global-toast')).toContainText(item.label);
  62  |     await expect(page.locator('#emit-step-1')).toBeVisible();
  63  |   }
  64  |   const sourceHasEmptyOption = await page.locator('#emit-fuente option[value=""]').count();
  65  |   if (!sourceHasEmptyOption) blocked(info, 'La fuente sólo ofrece opciones no vacías; no puede omitirse desde la interfaz pública');
  66  |   await page.locator('#emit-fuente').selectOption('');
  67  |   await page.locator('#emit-msg').fill('Texto de prueba');
  68  |   await page.locator('#emit-step-1 button[onclick="emitStep(2)"]').click();
  69  |   await expect(page.locator('#global-toast')).toContainText('fuente de la alerta');
  70  | });
  71  | 
  72  | test('CP-24 RF-T04 sin canal seleccionado no avanza', async ({ page }, info) => {
  73  |   await start(page);
  74  |   await loginAs(page, info);
  75  |   await screen(page, 's-emit');
  76  |   await page.locator('#emit-fuente').selectOption({ label: 'Defensa Civil — Evaluación operativa' });
  77  |   await page.locator('#emit-riesgo').selectOption({ label: '🟠 Alerta Naranja — Riesgo Medio' });
  78  |   await page.locator('#emit-zona').selectOption({ label: ZONE });
  79  |   await page.locator('#emit-msg').fill(`Canales ${mark(info)}`);
  80  |   const channels = page.locator('#emit-step-1 input[type="checkbox"]');
  81  |   for (let i = 0; i < await channels.count(); i++) await channels.nth(i).uncheck();
  82  |   await page.locator('#emit-step-1 button[onclick="emitStep(2)"]').click();
  83  |   await expect(page.locator('#global-toast')).toContainText('Seleccione al menos un canal');
  84  |   await expect(page.locator('#emit-step-1')).toBeVisible();
  85  | });
  86  | 
  87  | test('CP-25 RF-T04 sin destinatarios no confirma la alerta', async ({ page }, info) => {
  88  |   const marker = mark(info);
  89  |   await start(page);
  90  |   await loginAs(page, info);
  91  |   const contact = await createContact(page, marker);
  92  |   await prepareManual(page, marker, contact);
  93  |   await page.locator('#emit-dest-tbody tr').filter({ hasText: contact }).locator('input[type="checkbox"]').uncheck();
  94  |   await expect(page.locator('#emit-dest-summary')).toContainText('0 contactos');
  95  |   await page.locator('#emit-step-2 button[onclick="emitStep(3)"]').click();
  96  |   await page.locator('#emit-step-3 button[onclick="openModal(\'m-emit-confirm\')"]').click();
  97  |   await page.locator('#m-emit-confirm button[onclick="emitManualAlert()"] ').click();
  98  |   await expect(page.locator('#global-toast')).toContainText('al menos un destinatario');
  99  |   await expect(page.locator('#s-emit')).toBeVisible();
  100 | });
  101 | 
  102 | test('CP-26 RF-T01 RF-T04 rol no autorizado no puede emitir', async ({ browser }, info) => {
  103 |   const admin = { user: process.env.ADMIN_USER, password: process.env.ADMIN_PASSWORD };
  104 |   if (!admin.user || !admin.password) blocked(info, 'Faltan credenciales ADMIN para crear un usuario de rol no autorizado');
  105 |   const marker = mark(info);
  106 |   const adminContext = await browser.newContext();
  107 |   const technicalContext = await browser.newContext();
  108 |   try {
  109 |     const adminPage = await adminContext.newPage();
  110 |     await start(adminPage);
  111 |     await login(adminPage, admin.user, admin.password);
  112 |     const contact = await createContact(adminPage, marker);
  113 |     const technical = await createUser(adminPage, marker, 'Personal Técnico');
  114 | 
  115 |     const page = await technicalContext.newPage();
  116 |     await start(page);
  117 |     await login(page, technical.user, technical.password);
  118 |     const emitNav = page.locator('#s-dash .nav-item[onclick="navigate(\'s-emit\')"]');
  119 |     if (!(await emitNav.isVisible())) return;
  120 |     await prepareManual(page, marker, contact);
  121 |     await page.locator('#emit-step-2 button[onclick="emitStep(3)"]').click();
  122 |     await page.locator('#emit-step-3 button[onclick="openModal(\'m-emit-confirm\')"]').click();
  123 |     await page.locator('#m-emit-confirm button[onclick="emitManualAlert()"] ').click();
> 124 |     await expect(page.locator('#global-toast')).toContainText(/autoriz|permiso|acceso|rol/i);
      |                                                 ^ Error: expect(locator).toContainText(expected) failed
  125 |     await expect(page.locator('#s-emit')).toBeVisible();
  126 |   } finally {
  127 |     await technicalContext.close();
  128 |     await adminContext.close();
  129 |   }
  130 | });
  131 | 
  132 | test('CP-27 RF-T04 alerta manual emitida se finaliza y pasa a Historial', async ({ page }, info) => {
  133 |   const marker = mark(info);
  134 |   await start(page);
  135 |   await loginAs(page, info);
  136 |   const contact = await createContact(page, marker);
  137 |   await prepareManual(page, marker, contact);
  138 |   const alertId = await emitManual(page, marker);
  139 |   await expect(page.locator('#s-dash')).toContainText(marker);
  140 |   await page.getByRole('button', { name: 'Ver historial completo' }).click();
  141 |   await expect(page.locator('#s-historial')).toBeVisible();
  142 |   const entry = page.locator(`#s-historial .hist-entry[data-alerta-id="${alertId}"]`);
  143 |   await expect(entry).toContainText('EMITIDA');
  144 |   const finalize = entry.getByRole('button', { name: 'Finalizar alerta' });
  145 |   await expect(finalize).toBeVisible();
  146 |   page.once('dialog', dialog => dialog.accept());
  147 |   await finalize.click();
  148 |   await expect(entry.filter({ hasText: 'FINALIZADA' })).toBeVisible();
  149 |   await expect(entry.getByRole('button', { name: 'Finalizar alerta' })).toHaveCount(0);
  150 | });
  151 | 
```