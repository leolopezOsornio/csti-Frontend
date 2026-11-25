# Pruebas ejecutadas y matriz pendiente

**Actualización 24/11/2026:** esta primera sección describe la auditoría original; ahora existen pruebas persistentes para F02/F03 y rastreo. Ver el seguimiento al final y [registro de fase](07_PRIMERA_FASE_CORRECCIONES.md).

Fecha: 23/11/2026, America/Mexico_City. HEAD `ba824d6`; Node 24.11.0, npm 11.6.1, dependencias preexistentes y lock ya modificado. Se probaron servicios aislados, no operaciones financieras. **No se ejecutó checkout sandbox ni un E2E completo.**

## Comprobaciones ejecutadas

| Comando/acción | Resultado real | Límite |
|---|---|---|
| `git status --short`, rama y HEAD | main/ba824d6; lock modificado previamente | No hubo commit/push |
| `npm run build`, lint y audit desde PowerShell | Wrapper npm.ps1 bloqueado por ExecutionPolicy | Se usó npm.cmd sin cambiar política del sistema |
| `npm.cmd run build -- --outDir docs/auditoria-produccion/.build-temporal` | `tsc -b` pasa; Vite falla al empaquetar configuración: esbuild no puede leer `..` por permisos | Restricción local del sandbox, no error TS del proyecto |
| `npm.cmd run build -- --configLoader runner --outDir docs/auditoria-produccion/.build-temporal` | Pasa, 866 módulos transformados, Vite 7.3.8 | Workaround local; no acredita el build exacto de CI ni producción |
| Tamaños emitidos por build | JS 1,032.88 kB / 314.38 gzip; CSS 118.18 kB / 22.51 gzip; JPG importado 210.58 kB | No incluye el costo de todos los recursos public ni es una medición de red móvil |
| Advertencias Vite | Chunk >500 kB; import dinámico SweetAlert no separa módulo | No se optimizó código |
| `npm.cmd run lint` | Falla: 149 problemas, 141 errores, 8 warnings | Sin `--fix`; revisar contratos any, hooks, variables y async Promise executor |
| `npm.cmd audit --json` | Falla al contactar `registry.npmjs.org/-/npm/v1/security/advisories/bulk` | Sin resultado de CVEs; no equivale a cero vulnerabilidades |
| Inspección package.json | No existe script test | `npm run test` no se ejecutó porque no hay suite declarada |
| `npm ci` | No ejecutado | Registro inaccesible; reemplazar node_modules existente podría dejar entorno sin dependencias recuperables |
| Playwright CLI | No instalado; npx.cmd existe; intento `npx.cmd --offline --cache docs/auditoria-produccion/.cache-temporal --package @playwright/cli playwright-cli --help` falla ENOTCACHED | Sin navegador, capturas, medición visual ni E2E |
| GET HTTPS desde Node: `/`, `/payment`, `/perfil/pedidos/1`, `/admin` | Todos bloqueados con EACCES de red | No prueban 404 ni caída de Railway |
| Acceso público con herramienta web a raíz/payment | No accesible desde la herramienta | Sin status HTTP verificable |
| Lectura Railway | Servicio, nombres de variables, historial, dominio, diagnóstico histórico, estado y métricas | No se cambiaron recursos; conector oculta valores y no prueba autorización Django |
| Integridad de assets | Cuatro referencias a dos placeholders inexistentes; tamaños de imágenes medidos | No se verificaron imágenes remotas del catálogo |
| Artefactos build/cache | Temporales de diagnóstico retirados al terminar | Persisten solo seis documentos de auditoría |

No se ejecutó instalación limpia ni se alteró el lock. Para reproducibilidad de release, repetir en CI con el lock aprobado. No atribuir al código las restricciones EACCES de este entorno.

## Mocks realmente ejecutados

Se ejecutaron dos programas efímeros con `node` por stdin, sin guardar código de pruebas. Cargaron el texto real de los servicios con `fs`, eliminaron imports de una línea y lo transpilaron con TypeScript a CommonJS; `vm.runInNewContext` recibió Axios/API y storage falsos. Se sustituyó completamente la red. No montan React, no simulan PayPal SDK ni prueban Django.

| ID | Entrada/procedimiento | Resultado observado | Interpretación |
|---|---|---|---|
| M01 | `getRates(1,[{producto:{id:10},cantidad:4}])`; api.post rechaza offline | `[{id:'estandar_cva',price:150}]` | Fallback ficticio confirmado |
| M02 | `getTracking('1',{estado_envio:'EN_TRANSITO',creado_en:'2020-01-01T00:00:00Z'})`; GET rechaza offline | ENTREGADO, guía 782349102384, último hito COMPLETED | Entrega inventada por tiempo confirmado |
| M03 | Storage selectedShippingRate = `{` | `getSelectedRate()` lanza SyntaxError | Parseo sin recuperación |
| M04 | Storage selectedShippingRate = objeto JSON con price -150 | Devuelve price -150 | Acepta tarifa manipulada; no prueba aceptación backend |
| M05 | Dos callbacks response 401 en paralelo, refresh válido con access y refresh nuevos | Dos POST de refresh; refresh nuevo no guardado | Falta exclusión y manejo de rotación |
| M06 | Callback response 403 después de M05 | Cero POST adicionales de refresh | 403 se propaga sin renovación |
| M07 | Access anterior en localStorage, nuevo login rememberMe=false | Interceptor usa access anterior local | Cambio de almacén conserva identidad equivocada |
| M08 | `checkEmailTypo('ana@gmail.co')` | `¿Quisiste decir @gmail.com?` | Una dirección sintácticamente válida se trata como error; verificar política de UX |
| M09 | 401 con refresh; POST de renovación responde 401 | Access eliminado, redirect /login, un refresh | Manejo de expiración reproducido |
| M10 | 401 con refresh; POST de renovación falla por red | Access eliminado, redirect /login | Red temporal provoca mismo logout que expiración |
| M11 | 401, access presente y refresh ausente | Cero refresh, sin redirect, access conservado | Estado final no invalidado centralmente |
| M12 | 401 de petición con `_retry:true` | Cero refresh, sin redirect, access conservado | No hay limpieza ante 401 definitivo de reintento |

Los mocks son reproducción de defectos actuales, no aceptación de comportamiento deseado. No se llama a `actions.order.create`, verificar pago, generar factura ni transicionar devoluciones contra una API real.

### Reproducción mínima de los mocks de logística

Desde raíz, con Node y TypeScript ya instalados; ejecutar el siguiente JavaScript por stdin de `node` (en PowerShell, here-string). No crea archivos ni usa red:

```js
const fs = require('fs'), vm = require('vm'), ts = require('typescript');
const values = new Map();
const localStorage = {
  getItem: k => values.get(k) || null,
  setItem: (k, v) => values.set(k, String(v)),
  removeItem: k => values.delete(k)
};
const exportsMock = {};
const source = fs.readFileSync('src/services/Shipping.service.ts', 'utf8')
  .replace(/^import .*;\r?\n/gm, '');
const code = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022
}}).outputText;
vm.runInNewContext(code, {
  exports: exportsMock, localStorage, console, setTimeout,
  api: { post: async () => { throw Error('offline'); },
         get: async () => { throw Error('offline'); } }
});
(async () => {
  const shipping = exportsMock.shippingService;
  console.log(await shipping.getRates(1, []));
  console.log(await shipping.getTracking('1', {
    estado_envio: 'EN_TRANSITO', creado_en: '2020-01-01T00:00:00Z'
  }));
  localStorage.setItem('selectedShippingRate', JSON.stringify({ price: -150 }));
  console.log(shipping.getSelectedRate());
})();
```

Para M05–M12 la técnica equivale a capturar el callback pasado a `api.interceptors.response.use`, proporcionar stores Map y ejecutar errores `{response:{status:401},config:{headers:{}}}` mediante `Promise.allSettled`. Axios.post devuelve access/refresh sintéticos o rechaza según la tabla. No pasar tokens reales a estos contextos.

## Matriz de aceptación integral

Todos los casos siguientes están **diseñados, pendientes de ejecución integral**. Donde existe un mock parcial se indica; no se convierte en E2E aprobado. Usar usuarios sintéticos A/B/admin, catálogo determinista y reloj controlado; staging sin credenciales live. PayPal solo sandbox aislado; Envia/CVA/Facturapi/reembolsos simulados. Verificar logs backend con correlación sin datos privados.

| ID | Flujo y variantes | Resultado exigido | Evidencia parcial / dependencia |
|---|---|---|---|
| T01 | Registro válido, duplicado, código correcto/erróneo/vencido, reenvío, acceso directo a verificación | Cuenta solo activa tras código; errores seguros, límites backend y reingreso recuperable | Solo código; requiere correo de pruebas |
| T02 | Login correcto/incorrecto, Recordarme on/off, A→B, perfil 500 | Sesión e identidad coherentes; sin éxito si no hay perfil; credenciales no expuestas | M07 parcial |
| T03 | Recuperación, cuenta inexistente, código repetido/vencido, contraseña débil, reenvío rápido | Respuesta no enumerante, código de un uso, límites y contraseña actualizada | Solo código; M08 afecta sugerencias de correo |
| T04 | Home/lista/marca/detalle con mismo SKU y promoción | Precio normal/promoción/moneda/IVA consistentes en todas las vistas | Solo código; contrato API requerido |
| T05 | Stock 0/1/multialmacén, qty mayor al stock, imagen vacía/404, CVA incompleto | No vender stock insuficiente, fallback válido y errores recuperables | Assets faltantes confirmados estáticamente |
| T06 | Búsqueda/filtros/paginación, URLs, historial, respuestas lentas invertidas; cantidades rápidas | Prevalece última consulta; cantidad final determinista; sin error disfrazado de vacío | Solo código |
| T07 | Dirección principal/distinta/borrada, CP inválido, cotización vacía/401/500/timeout, tarifa vencida | Solo permitir pago con dirección propia y tarifa válida para carrito actual | M01/M03/M04 parciales |
| T08 | Manipular subtotal, descuento, envío negativo/cero, moneda, artículos/cantidades tras cotizar | Backend calcula/revalida y rechaza snapshot/importe inválidos; cero cobros indebidos | M04 parcial; requiere backend mock/sandbox |
| T09 | Pago aprobado, respuesta verificación 200 pendiente/inválida, monto/moneda/payer incorrectos | Éxito solo con captura completada y pedido autoritativo propio | No ejecutado; mocks PayPal y backend |
| T10 | Doble clic, dos onApprove, dos pestañas y repetición de POST | Un intento, una captura y un pedido; respuesta idempotente | No ejecutado; verificar índices/atomicidad backend |
| T11 | Timeout después de captura, caída de navegador, recarga durante verificación | Reconciliar operación original sin pedir otra compra ni perder pedido | No ejecutado |
| T12 | PayPal rechazado, cancelación, popup cerrado y cancelación tras selección | Estado claro; carrito conservado; reintento seguro; sin falso éxito | No ejecutado |
| T13 | Script PayPal lento/bloqueado, Client ID faltante, sandbox, MXN | Carga/error accesibles, pago no habilitado en configuración inválida | Solo código |
| T14 | Historial/detalle tras compra sintética y recarga; 401/404/500; ID de B con A | Pedido persiste y solo dueño/admin autorizado accede; fallo no parece vacío | Solo código |
| T15 | Envia/CVA offline, guía ausente, estado real en tránsito y reloj adelantado | Mostrar desconocido/estimado; jamás declarar entrega/firma ficticia | M02 parcial |
| T16 | Guardar fiscal RFC/CP/régimen/CFDI válidos/incorrectos; generar factura mock dos veces | Validación servidor, una factura por pedido, errores precisos, sin timbrado real | Solo código |
| T17 | PDF/XML y guías con A/B/anónimo, cambio de ID, URL vencida | Descarga autorizada y privada, negación a terceros, contenido correcto | Solo código; no se enumeraron IDs reales |
| T18 | Solicitar devolución, motivo Otro, fotos 0/5/6, tamaño/tipo falsos, doble submit y cierre/reapertura | Política de evidencias explícita, archivos seguros y una solicitud por pedido | Solo código |
| T19 | Ventana 15 días exactos ±1 segundo, cambio de reloj, pedido no entregado/fecha inválida | Elegibilidad desde backend según política acordada | Solo código |
| T20 | Pendiente→tránsito→inspección→rechazo; guía fallida y dos admins | Solo transiciones legales, atomicidad y reintento sin duplicación logística | Solo código; proveedores mock |
| T21 | Aprobar reembolso mock, proveedor rechaza/timeout, dos acciones simultáneas | No declarar reembolsado hasta confirmación financiera, una devolución monetaria | Solo código; nunca reembolso live |
| T22 | Admin anónimo, cliente, rol manipulado, recarga; dashboard/usuarios/pedidos/productos/marcas | Backend devuelve 401/403 según corresponda; rutas esperadas existentes y datos no expuestos | Guard/rutas inspeccionados; productos/marcas faltan |
| T23 | Anchos 320/375/768/1440, orientación, zoom 200%, checkout/modal largos | Sin scroll horizontal que bloquee tarea; controles y totales visibles | No ejecutado visualmente |
| T24 | Tab/Shift-Tab/Enter/Escape, lector, foco de errores, filtros y radios de envío | Compra y devolución posibles sin mouse; nombres y anuncios correctos | Defectos semánticos por código; falta navegador |
| T25 | HTML inofensivo con marcador en comentarios/nombre/errores/URLs, CSP y logs | Texto tratado como texto, sin handlers ni navegación arbitraria; sin JWT/PII en logs | Trayectos HTML confirmados; no se inyectó en API real |
| T26 | Access expirado, refresh válido/vencido/rotado, dos 401, 403 y 401 definitivo durante pago | Una renovación, recuperación de intención, 403 explícito y expiración consistente | M05/M06/M09–M12 parciales |
| T27 | Logout en otra pestaña, logout durante refresh, cambio de usuario/dirección | Sin sesión revivida ni datos/selección de cuenta anterior | M07 parcial |
| T28 | API offline/lenta al abrir perfil, carrito, filtros, pedidos y factura | Timeout controlado, reintento, distinguir error/vacío; no borrar sesión por red transitoria | M01/M10 parciales |
| T29 | Dominio HTTPS, headers, deep links, assets, healthcheck, reinicio y rollback | Artefacto correcto, fallback SPA solo para navegación, 404 real de assets, release operable | Railway leído; HTTP bloqueado aquí |
| T30 | Variables ausentes/erróneas, build staging vs live; comparar app PayPal y API | Fallo temprano y manifiesto de release sin secretos; ninguna llamada cruzada a producción | Nombres presentes; valores no visibles |
| T31 | Lock final, Node fijado, npm ci/build/lint/test/audit en CI | Instalación reproducible y comprobaciones aprobadas; vulnerabilidades valoradas | Build runner pasa; lint falla; audit bloqueado |
| T32 | Chrome/Firefox/WebKit, móvil, red lenta y catálogos extensos | Sin regresión; medir LCP/INP/CLS, tamaño inicial y memoria de fotos | Solo tamaños de build/assets; sin métricas de navegador |

## Registro necesario para futuras ejecuciones

Por caso guardar fecha, SHA, build, navegador, tipo de entorno (mock/sandbox), datos sintéticos, resultado observado, esperado y evidencia redactada. Para pagos registrar IDs sintéticos de operación/captura/pedido y conteos de cobros. Para privacidad demostrar denegación A/B/anónimo; evitar almacenar documentos fiscales reales, tokens o secretos en esta carpeta.

## Primera fase de correcciones — ejecución 24/11/2026

Rama `fix/seguridad-envios-preproduccion`, base `ba824d6`, cambios sin commit. Pruebas en `tests/shipping-security.test.mjs`, cargador `tests/register.mjs`; ejecutar `npm.cmd test` con Node 24 (usado 24.11.0). No se añadieron dependencias ni se modificó package-lock. El cargador transpila los archivos TypeScript/TSX reales y sustituye exclusivamente API/configuración/CSS; React y su renderer de servidor son reales. Los callbacks de API son mocks, no red.

| Verificación | Resultado final |
|---|---|
| `npm.cmd test` | 19 pruebas, 19 pasan, 0 fallos |
| `node_modules/.bin/tsc.cmd -b` | Pasa |
| `npm.cmd run build` | TypeScript pasa; esbuild bloqueado por permisos al leer directorio padre, como antes del cambio |
| `npm.cmd run build -- --configLoader runner` | Pasa, 873 módulos; JS 1,033.82 kB / 314.75 gzip; CSS 118.18 kB / 22.51 gzip |
| `npm.cmd run lint` | Falla con 126 errores y 7 warnings frente a 141/8 previos; no se desactivaron reglas |
| Comparación lint con ESLint API | Multiconjunto de diagnósticos por archivo/regla/mensaje: cero diagnósticos nuevos; las líneas se desplazan por cambios |
| `git diff --check` | Pasa; avisos de normalización LF/CRLF no son errores de whitespace |
| SHA256 package-lock antes/después | Igual: `BD64971F0DD3411A7E8A4E63592A2A1D894CDC73AC53F16C38AB6725A310B436` |

Cobertura de las nueve pruebas obligatorias: (1) offline rechaza getRates/getDefaultRate; (2) dirección ausente/inválida no llama API; (3) rechaza vacíos, duplicados, estructura e importes corruptos; (4) JSON inválido/storage inaccesible devuelve preferencia nula sin excepción y nunca suministra precio; (5) el componente real ShippingQuoteGate no renderiza al hijo PayPal simulado si la cotización falta/venció/cambió de contexto o ID; (6) EN_TRANSITO antiguo no cambia a ENTREGADO; (7) sin guía backend no hay guía ni transportista inventados; (8) HTML de usuario se escapa en el componente real del modal; (9) URLs peligrosas no producen imágenes/enlaces activos. Hay casos adicionales de revalidación de carrito/dirección/tarifa, normalización monetaria, payload de rastreo desconocido y prevención estática de sinks HTML.

Límites: no hay prueba E2E de la página Payment montada en un navegador, ni se cargó el SDK PayPal; el bloqueo del componente se verifica con renderizado React de servidor. No se ha ensayado el ciclo visual abrir/cerrar de SweetAlert, carreras en dos pestañas o proveedores reales. La lista de orígenes de medios debe cotejarse con respuestas reales antes de producción. Los casos integrales T07/T15/T25 permanecen pendientes de staging aunque estas regresiones locales pasan.
