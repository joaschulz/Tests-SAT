# Pruebas automatizadas del SAT Panambí

Este proyecto ejecuta los 27 casos CP-01 a CP-27 del documento **Casos de prueba SAT Inundaciones Panambi - final** mediante el navegador. Es independiente del código del SAT y usa únicamente sus pantallas públicas. CP-13 conserva el reporte ciudadano sin inicio de sesión.

## Preparación

Se necesita Node.js 20 o superior y `pnpm`. Desde esta carpeta:

```powershell
pnpm install
pnpm exec playwright install chromium
Copy-Item .env.example .env
```

Completar `.env` con una cuenta de Operador y una de Administrador. La URL predeterminada es la instancia de Render; `BASE_URL` permite apuntar a otra instancia con la misma interfaz. No se deben incorporar credenciales al repositorio.

## Ejecución

```powershell
pnpm test:e2e:list
pnpm test:e2e:smoke
pnpm test:e2e
pnpm test:e2e:report
```

`test:e2e:smoke` ejecuta sólo CP-03, CP-19 y CP-20, que validan campos y archivos sin enviar reportes. Para ejecutar un caso aislado: `pnpm exec playwright test --grep CP-13`. La suite completa se ejecuta con un solo navegador a la vez y sin reintentos. Los tests que crean reportes, usuarios, contactos o alertas hacen cambios en la instancia configurada; por eso la ejecución es manual, bajo demanda.

Cada test usa un marcador `E2E-...-CP-XX` en los datos que crea y verifica el resultado antes de cerrar su sesión. La suite no supone que cerrar y volver a entrar restaure un estado determinado. Puede haber casos `BLOQUEADO` cuando falta una cuenta configurada, una alerta automática pendiente o una acción que la interfaz no ofrece.

Los contactos reciben teléfonos distintos: la instancia puede conservar datos entre sesiones y rechaza los números duplicados. Si el SAT rechaza el reporte público, CP-13 a CP-16 fallan con el estado HTTP y el mensaje del servidor; sólo CP-06 requiere una alerta vecinal y queda bloqueado por esa precondición. CP-07 a CP-12 admiten cualquier alerta pendiente, incluidas las automáticas. Cada uno espera la carga de la lista y se bloquea sólo si no hay una alerta disponible o si la acción requerida no aparece en la interfaz. Validar y rechazar consumen alertas pendientes, por lo que la disponibilidad puede cambiar durante una ejecución completa.

En RF-T02 la suite selecciona tarjetas `PENDIENTE` visibles y lee de la pantalla el código de la alerta; la respuesta HTTP sólo sincroniza la carga y sirve como evidencia si la lista no aparece. Los casos que no consumen alertas corren antes de CP-07 y CP-08. CP-12 comprueba la alerta validada por CP-07 dentro de la misma ejecución; si se ejecuta aisladamente y no existe esa acción, valida una pendiente propia. Así se pueden cubrir los casos con dos alertas automáticas, sin depender de que el servidor conserve o reinicie los datos entre sesiones.

En la interfaz revisada, CP-09 y CP-11 no encontraron una acción visible «Mantener pendiente» para la alerta automática seleccionada y quedaron bloqueados por ese motivo. Que una incidencia figure en Historial pero no en Pendientes no demuestra que sea un *mock*; podría ser un registro histórico u otra clase de dato precargado. La suite no infiere su implementación interna a partir de esa diferencia.

Los resultados se guardan en:

- `reports/html/`: pasos, errores, capturas, video y traza de fallos.
- `reports/resumen.md` y `reports/resumen.json`: una fila por caso, requisito, estado y duración.

Las evidencias publicadas incluyen el informe HTML, capturas, videos y contextos de error de la ejecución. Los archivos ZIP de trazas de Playwright se excluyen del repositorio porque registran valores de acceso de la sesión. El archivo `.env` también queda excluido; `.env.example` documenta las variables necesarias sin credenciales.

Los documentos de casos de prueba, flujos y requisitos se encuentran en `docs/`.

`APROBADO` significa que se observó el resultado esperado. `FALLIDO` identifica una diferencia comprobada o un error de la automatización que debe investigarse. `BLOQUEADO` indica que una precondición o acción no está disponible; nunca cuenta como aprobado.

## Cobertura y límites

| Requisito | Casos | Comportamiento |
| --- | --- | --- |
| RF-T01 | CP-01 a CP-04 | Acceso y funciones por rol |
| RF-T02 | CP-05 a CP-12 | Alertas pendientes, decisiones y auditoría |
| RF-T03 | CP-13 a CP-20 | Reporte público, DNI, campos e imágenes |
| RF-T04 | CP-21 a CP-27 | Emisión manual, restricciones y finalización |

CP-05 requiere una alerta automática existente; la suite no la reemplaza por una vecinal. CP-23 comprueba las validaciones que permite accionar la interfaz y queda bloqueado si el selector de fuente no ofrece un valor vacío. CP-27 finaliza en «Ver historial completo» la alerta identificada por su ID y verifica su estado final. CP-26 crea un usuario de rol Personal Técnico desde Administración y comprueba si puede emitir: una emisión aceptada se considera fallo.

La entrega externa de WhatsApp, SMS, llamadas o altoparlante está simulada por el SAT y queda fuera de las verificaciones. La suite comprueba las opciones y el registro visible dentro de la aplicación.
