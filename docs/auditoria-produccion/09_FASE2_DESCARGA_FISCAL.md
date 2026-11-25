# Fase 2 — descarga fiscal con JWT e integración pendiente

Fecha: 24/11/2026, America/Mexico_City. Rama `fix/seguridad-envios-preproduccion`, HEAD base `ba824d6`, cambios locales sin commit. Esta fase parte del estado de fase 1, no de main limpio. El [diff de fase 2](10_DIFF_FASE2_FRONTEND.md) compara contra copias tomadas antes de estos cambios y excluye el trabajo anterior.

**Estado: implementación y pruebas locales completadas; integración con el backend CSTI-002 pendiente.** La corrección backend fue informada en la solicitud; no se descargaron facturas reales para verificarla. No hubo emisión de CFDI, pagos, reembolsos, cambios backend/Railway, commit, push, merge ni despliegue.

## Descarga implementada

`billingService.downloadInvoice(source, 'pdf' | 'xml')` es el único método que obtiene bytes y dispara la descarga. Historial y detalle de pedido usan el mismo componente `InvoiceDownloads`, con bloqueo inmediato de clics concurrentes, botones deshabilitados, estado “Descargando”, errores accesibles y opción de iniciar sesión ante 401 terminal.

Flujo:

1. Usar `pdf_url`/`xml_url` devueltos por Django. Si la vista solo conoce `orden_id`, `id` o `facturapi_id`, consultar el historial autenticado y resolver la factura correspondiente. No se construye una URL pública de Facturapi ni se emite una factura para descargarla.
2. Validar URL HTTPS contra **el origen exacto de `appConfig.apiBaseUrl`**, incluyendo puerto. Se admiten rutas relativas resueltas contra ese backend, bajo `/api/facturacion/`. Se rechazan orígenes externos, HTTP, credenciales en URL, espacios/controles, query strings y fragmentos. No se agrega JWT a ningún enlace o nombre.
3. Hacer GET mediante la instancia Axios existente y sus interceptores JWT, con `responseType: 'blob'`, Accept PDF/XML y timeout de 30 segundos. Usar el adaptador fetch con `redirect: 'error'`: una redirección no se convierte en una petición autenticada al proveedor. La consulta de metadatos fiscales usa también HTTPS validado, timeout y rechazo de redirecciones.
4. Exigir HTTP 200, Blob no vacío y MIME compatible tanto en respuesta como en Blob: PDF `application/pdf`; XML `application/xml` o `text/xml`, con parámetros charset permitidos. Rechazar 204/206, JSON/HTML y contenido que no tenga cabecera `%PDF-` o raíz XML `Comprobante` en el prefijo inspeccionado. Esto no valida XSD, timbrado ni autenticidad fiscal.
5. Generar nombre fijo `factura-<identificador saneado>.pdf/xml`; ignorar nombres de Content-Disposition. Crear Object URL, insertar un enlace temporal de descarga, pulsarlo y quitarlo. Revocar el Object URL en el siguiente turno de eventos, también si falla el clic o el DOM. La promesa permanece activa hasta esa limpieza.
6. Deduplicar por sesión, identificador y formato. Historial/detalle de la misma orden comparten una operación PDF en vuelo; PDF y XML son documentos distintos. El namespace de sesión solo existe en memoria y nunca se registra ni se añade a URLs. Un cambio de cuenta/logout antes de guardar el archivo descarta la respuesta anterior.

Los mensajes distinguen 401 (iniciar sesión), 403 (sin permiso), 404 (no disponible o ajeno), 502 (proveedor no disponible), 504 (proveedor lento), archivo inválido y fallo de conexión. No se muestran cuerpos de error del proveedor ni objetos Axios que puedan contener Authorization.

## Compatibilidad y alcance de autenticación

- Historial conserva paginación/fechas/estado y muestra botones PDF/XML en lugar de enlaces de navegación. Un fallo de carga se distingue de historial vacío.
- Detalle conserva acceso al historial y añade los mismos controles de descarga cuando `order.facturada` es verdadero. Resuelve metadatos por orden; el flujo de generar factura no se modificó ni se ejecutó.
- Facturas históricas se descargan usando los enlaces protegidos actuales. Si solo se dispone de identificadores, se consultan los metadatos actuales. Una URL externa antigua no se considera pública ni se abre como fallback: se pide recargar el historial para recibir la URL protegida corregida. Si Django todavía devuelve la URL externa, la descarga falla de forma segura hasta corregir el contrato.
- Se añadió `redirectOnAuthFailure?: boolean` al cliente Axios. Las operaciones fiscales lo ponen en false para mostrar el 401 terminal después del intento normal de refresh. La limpieza de tokens existente sigue ocurriendo si falla refresh; una navegación normal a `/login` permite reinicializar la sesión. El valor predeterminado para los demás consumidores no cambia, comprobado con un test del interceptor real.
- No se reescribieron la cola/rotación de refresh ni AuthContext. Los riesgos generales de sesión F08/F09/F10 permanecen fuera de esta fase. No se cambió Payment, PayPal, el cálculo financiero ni la verificación/captura.

La inspección de `src` encontró consumidores fiscales en historial/detalle y los tipos del servicio. Tras el cambio no hay enlaces a `pdf_url`, `xml_url` o URLs construidas con `facturapi_id`, ni `window.open()` para facturas. Solo el enlace **blob temporal** navega a los bytes ya obtenidos con JWT.

## Revisión de useShippingQuote

Se confirmó el problema de referencia: el efecto dependía directamente de `items`. En un consumidor que recrea un arreglo equivalente durante cada render, la respuesta ejecuta setResult, vuelve a renderizar, cambia la referencia y vuelve a cotizar. La prueba con la copia original alcanzó el límite de 20 actualizaciones y falló por bucle. No se atribuye ese escenario a una sesión de navegador observada.

La corrección crea una representación canónica de los datos usados por cotización: ID de producto, cantidad y precio unitario, ordenada para que el orden del arreglo no importe. `useMemo` conserva el snapshot mientras esos datos no cambien. El efecto y la petición usan el mismo snapshot; su identidad también forma parte de la clave del resultado, además de dirección, huella del carrito, versión del domicilio y reintento.

Se conserva la invalidación inmediata y el cleanup con `active=false` de fase 1. Una respuesta anterior no puede reemplazar estado ni preferencia guardada de la solicitud nueva. No se cambió Shipping.service ni se reintrodujeron tarifas, guías o eventos ficticios.

## Archivos de esta fase

| Archivo | Cambio |
|---|---|
| `src/services/Billing.service.ts` | Descarga única, URLs, Blob/MIME/contenido, errores, deduplicación y limpieza |
| `src/services/Api.service.ts` | Opción optativa para no navegar automáticamente en error de refresh fiscal |
| `src/components/InvoiceDownloads/InvoiceDownloads.tsx` (nuevo) | Controles compartidos, carga, bloqueo y error |
| `src/pages/Profile/components/Invoices/InvoicesList.tsx` | Sustituir enlaces por controles autenticados y mostrar errores de carga |
| `src/pages/Profile/components/OrderDetail/OrderDetail.tsx` | Descargas por orden mediante el mismo componente; conservar resto de fase 1 |
| `src/hooks/useShippingQuote.ts` | Identidad estable basada en datos, no en referencias de items |
| `tests/register.mjs` | Optar por Api.service real en las pruebas fiscales; mocks originales conservados para fase 1 |
| `tests/billing-download.test.mjs` (nuevo) | 20 pruebas fiscales sin red |
| `tests/hook-harness.mjs` (nuevo) | Scheduler de ciclo de hooks para pruebas unitarias |
| `tests/shipping-hook.test.mjs` (nuevo) | Cinco regresiones de estabilidad, invalidación y carreras |
| `tests/README.md` | Instrucciones y límites de las pruebas nuevas |
| `docs/auditoria-produccion/09_FASE2_DESCARGA_FISCAL.md` y `10_DIFF_FASE2_FRONTEND.md` | Este informe y los diffs relativos a fase 1 |

No se añadieron dependencias ni se cambió package.json en esta fase. El script test agregado en fase 1 descubre los nuevos archivos. SHA256 de package-lock antes/después: `BD64971F0DD3411A7E8A4E63592A2A1D894CDC73AC53F16C38AB6725A310B436`. Sus cambios previos respecto a git se preservan íntegros; que aparezca como modificado en git status no es un cambio de esta fase.

## Pruebas ejecutadas y resultados

Entorno: Node 24.11.0, npm 11.6.1 y dependencias previamente instaladas.

| Comprobación | Resultado observado |
|---|---|
| `npm.cmd test` final | **44 pruebas, 44 pasan, 0 fallos**: 19 conservadas de fase 1 + 20 fiscales + 5 del hook |
| `node_modules/.bin/tsc.cmd -b` | Pasa |
| `npm.cmd run build` | Una ejecución pasó; otra posterior falló por esbuild/EACCES al leer el directorio padre y resolver vite.config.ts. Limitación ya observada en fase 1, no un error TypeScript |
| `npm.cmd run build -- --configLoader runner` final | Pasa; JS principal 1,038.79 kB / 316.89 kB gzip, CSS 118.18 kB / 22.51 kB gzip |
| `npm.cmd run lint` | Falla: 125 errores/7 advertencias frente a 126/7 al iniciar la fase |
| Comparación ESLint por archivo/regla/mensaje | Cero diagnósticos nuevos; se eliminó el any del catch fiscal modificado. No se desactivaron reglas |
| `git diff --check` | Pasa; avisos LF/CRLF de git no son errores de whitespace |
| Prueba de estabilidad con hook anterior | Fallo esperado: bucle superior a 20 actualizaciones. La misma prueba con el hook corregido pasa y realiza una sola cotización |

El build mantiene advertencias heredadas de chunk >500 kB e importación estática/dinámica de SweetAlert. No se intentó arreglar el resto del lint ni los otros hallazgos de auditoría.

### Evidencia fiscal y del hook

Las pruebas fiscales usan **Axios real, su adaptador fetch real y los interceptores request/refresh reales**; fetch se sustituye por respuestas sintéticas. No se accede a backend, Facturapi ni otros proveedores. DOM y APIs de Object URL se sustituyen por spies; React SSR verifica los controles. Cubren:

- Propietario sintético recibe PDF y XML con Bearer en header; no hay JWT en query ni nombre de archivo.
- Anónimo recibe 401; otro usuario recibe 404; 403/502/504 muestran mensajes específicos y no crean descargas.
- Access vencido renueva y repite con token nuevo; refresh vencido limpia tokens y permite mostrar error. El redirect por defecto de otras APIs permanece igual.
- Históricos por orden, ID o identificador de proveedor resuelven enlaces protegidos actuales. URLs externas y redirecciones no se usan como fallback.
- Peticiones concurrentes comparten la operación; descargas consecutivas y clic fallido revocan todos los Object URLs; cambio de sesión no guarda la respuesta vieja.
- MIME/cuerpo inválidos, contenido parcial, archivos vacíos y nombres maliciosos no se aceptan como descarga válida.
- Historial y detalle usan el mismo componente y este invoca el método único; no quedan enlaces directos a los documentos.

Las cinco pruebas del hook ejecutan su **código real** con un scheduler unitario que modela Object.is, actualizaciones batched y cleanup de efectos: arreglos equivalentes recreados diez veces no añaden peticiones; cambios de cantidad/precio/dirección sí invalidan; otro carrito no reutiliza tarifa aunque el caller conserve una huella vieja; una respuesta tardía no sustituye la nueva; reintento y reordenamiento se comportan correctamente. No es React DOM ni una prueba visual de StrictMode.

## Contratos pendientes y riesgos de integración

**No se declara cerrado F13/CSTI-002 de extremo a extremo.** Antes de producción, usar usuarios/documentos sintéticos ya existentes en staging con el backend corregido, sin emitir CFDI:

1. Confirmar que historial devuelve un arreglo con `id`, `orden_id`, `facturapi_id`, `uuid`, `pdf_url` y `xml_url`, y que **todas las facturas históricas** tienen URLs protegidas actuales dentro del origen HTTPS configurado y del namespace `/api/facturacion/`, sin query ni fragmento. El detalle resuelve por el mismo orden_id.
2. Confirmar GET directo **sin redirecciones** a proveedor/login: 200 con bytes PDF/XML, Content-Type correcto y XML UTF-8 con raíz Comprobante. Un endpoint que responda JSON con enlace, application/octet-stream o 302 falla deliberadamente. La inspección de contenido no certifica autenticidad fiscal.
3. Validar realmente permisos de propietario, usuario ajeno y administrador autorizado; anónimo/401, denegación 403/404 según backend y ausencia de bytes privados en esos errores. Los códigos de los mocks no demuestran autorización Django.
4. Comprobar CORS del origen frontend y aceptación del header Authorization en descargas. No se necesitan secretos ni tokens en URL. Content-Disposition no se usa, así que el nombre no depende de exponer ese header.
5. Ensayar descarga y revocación con navegador real (incluido móvil), estados de carga/error, clic repetido, sesión vencida/cambio de usuario y proveedor 502/504. Los spies de DOM no prueban que todos los navegadores guarden el archivo igual.
6. Confirmar el comportamiento conjunto con las limitaciones heredadas de refresh concurrente/rotación/multitab. El flag fiscal no arregla la gestión global de sesión, y los contratos financieros F01/F05 siguen fuera de esta fase.

Las correcciones de tarifas, rastreo y XSS de fase 1 permanecen; sus 19 pruebas siguen pasando. El trabajo queda únicamente como cambios locales revisables en la rama solicitada, sin integración ni publicación automática.
