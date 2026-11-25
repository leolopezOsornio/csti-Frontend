# Diagnóstico de producción — CSTI/FasterClick

Fecha: 23 de noviembre de 2026, America/Mexico_City. Repositorio local: `leolopezOsornio/csti-Frontend`, rama `main`, HEAD `ba824d62c93fc6eb5ec1538db63c2151c30f1ad6`.

**Dictamen: no aprobar todavía la salida comercial.** Hay construcción local viable, pero faltan garantías de integridad del checkout, existen inserciones de HTML sin escape, se usan datos logísticos ficticios y no se acreditó un despliegue operativo. Ver [hallazgos](02_HALLAZGOS_FRONTEND.md), [pruebas](04_PRUEBAS_FRONTEND.md), [plan](05_PLAN_CORRECCIONES_FRONTEND.md) y [checklist](06_CHECKLIST_PRODUCCION_FRONTEND.md).

## Alcance y grado de certeza

Se inspeccionaron estructura, configuración y los flujos de catálogo, autenticación, carrito, pago, direcciones, pedidos, facturación, devoluciones y administración. Se ejecutaron build, lint y pruebas aisladas de servicios con mocks; se consultó Railway exclusivamente en lectura. No se hicieron compras, timbrados, devoluciones, reembolsos, cambios de variables, commits, push ni despliegues. Las únicas incorporaciones persistentes son estos seis documentos.

`package-lock.json` ya estaba modificado antes de comenzar: 408 inserciones y 367 eliminaciones. Sus versiones locales forman parte del contexto de esta auditoría; no se debe atribuir ese cambio a este trabajo. No se recibió el reporte técnico de 04/09/2026 ni el código Django. La presencia de un endpoint en TypeScript no prueba que exista en el servidor, que aplique permisos o que ejecute la operación correctamente.

Se distinguen: **confirmado por código**, **reproducido con mock**, **observado en Railway** y **pendiente de integración**. No hubo navegador automatizado disponible: Playwright CLI no está instalado y el intento offline terminó en `ENOTCACHED`. No se certifican responsive visual, contraste, lectores de pantalla ni compatibilidad real entre navegadores. El acceso HTTP desde Node al dominio terminó en `EACCES`; la herramienta web tampoco pudo abrirlo. Eso no constituye por sí solo evidencia de caída pública.

## Arquitectura real

SPA React 19, TypeScript estricto y Vite; React Router con `BrowserRouter`. Hay 76 archivos TS/TSX y 118 archivos TS/TSX/CSS en `src`. `main.tsx:10` monta `StrictMode`, `AuthProvider`, `CartProvider` y `WishlistProvider`; `App.tsx` delega al router. La separación por carpetas es comprensible, pero cada pantalla conserva su propio estado de solicitudes, errores, carga y objetos sin validar.

| Capa | Implementación | Evaluación |
|---|---|---|
| `router` | Guards públicos, privados, cliente y administrador | La estructura protege las vistas privadas; `AdminRoutes` no espera la inicialización de sesión |
| `pages` | Tienda, autenticación, perfil anidado y panel admin | Amplia cobertura de pantallas; falta evidencia integral de funcionamiento |
| `components` | Navbar, footer, tarjetas, carruseles, categorías y layout | Reutilización razonable; controles interactivos sin semántica completa y recursos faltantes |
| `services` | 13 archivos con llamadas Axios y contratos parciales | URL central, pero contratos mayormente `any`, sin timeout global ni validación de respuesta |
| `contexts` | Sesión, contador del carrito y wishlist | El carrito real viene de API; selección logística queda fuera, en almacenamiento global del navegador |
| `hooks` y `utils` | Una validación de contraseña, correo, alertas y nombre | La validación de contraseña guarda estado derivable; HTML en alertas evade el escape de React |
| Tipos | Interfaces locales para usuario, factura, fiscal y devolución | No hay un modelo compartido de producto, carrito, pedido, cotización y confirmación de pago |
| Estilos | CSS Modules y hoja global | Existen media queries; no equivalen a una prueba de usabilidad móvil |

La información del usuario se obtiene de `/accounts/api/perfil/`; el rol no se lee de una clave `role` de localStorage. Cambiar React DevTools o JavaScript puede alterar cualquier guard del cliente. La seguridad real necesita autorización y propiedad de objetos en Django.

## Estado por función

| Función | Qué está construido | Qué falta o falla |
|---|---|---|
| Registro/verificación | Formularios, contraseña, código y reenvío | HTML en errores, falta demostrar límites y verificación en backend; acceso directo a verificación sin `location.state.email` vuelve a registro |
| Login/recuperación | JWT, Recordarme, perfil, recuperación de tres pasos | Tokens antiguos pueden prevalecer; login anuncia éxito si la carga de perfil devolvió `null`; sugerencia de correo bloquea direcciones válidas |
| Catálogo | Home, marcas, detalle, búsqueda, filtros y paginación por URL | Precio de promoción no uniforme, falta validar stock real, carreras de respuestas y placeholders inexistentes |
| Carrito | GET persistente en API; altas, cantidades y eliminación por ID | Sin bloqueo de mutaciones, error puede parecer carrito vacío, stock solo orientativo en cliente |
| Dirección/cotización | CRUD, principal y cotización por backend | Se elige automáticamente principal/primera; no existe selector de todas las direcciones en checkout; fallback de $150 y selección global obsoleta |
| PayPal | Un provider en Payment, MXN, creación de orderID y verificación backend | Importe creado en cliente, sin idempotencia visible, sin `onCancel`, sin reconciliación tras fallo o recarga |
| Pedidos | Historial y detalle leídos de API al montar | Persistencia efectiva y propiedad sin comprobar; errores de historial parecen ausencia de compras |
| Rastreo | Endpoint y timeline | Genera guía/eventos/entrega ficticios; no refleja exclusivamente datos verificables |
| Facturación | Datos fiscales, RFC/CP, régimen/uso CFDI, generar y listar | Descarga por enlace sin Bearer; permisos y timbrado pendientes; no se probó IDOR |
| Devoluciones | Formulario multipart, cinco fotos, estados y panel de transición | Ventana desde creación del pedido; archivos sin límite de bytes; cierre durante envío; sin garantías de unicidad o reembolso |
| Admin | Login común, dashboard, pedidos, usuarios, intereses y devoluciones | No existen pantallas/rutas de administración de productos o marcas; permisos de endpoints no acreditados |

## Flujo financiero observado

1. `Cart.service.ts:10` envía producto y cantidad; no envía precio unitario. Eso es positivo, aunque no prueba el cálculo del servidor.
2. `CartSummary.tsx:27` obtiene direcciones y toma principal/primera; cotiza y persiste dirección/tarifa en localStorage.
3. `Payment.tsx:28` restaura esa tarifa; obtiene carrito y direcciones, pero vuelve a cotizar con `productos: []` y no sustituye ni valida automáticamente la tarifa restaurada.
4. `Payment.tsx:85` suma `Number(cartData.total)` y el precio del objeto local. `actions.order.create` crea la orden PayPal y devuelve el orderID con ese importe.
5. `onApprove` pasa `orderID`, `direccionID`, `shippingCost` y `shippingCarrier` a `/api/pagos/verificar/`. No hay captura directa `actions.order.capture` en este frontend; la captura real y su validación dependen del backend, que no se auditó.
6. Cualquier respuesta HTTP exitosa de verificación lleva a limpiar selección y anunciar pago exitoso; no se inspeccionan estado de captura ni ID de pedido. Un rechazo deja un mensaje sin una operación persistente para consultar/reconciliar.

No se puede afirmar que el backend acepta importes alterados, duplica capturas o pierde pedidos: se debe verificar. Sí se puede afirmar que el cliente permite construir una orden con importe alterado y carece de un contrato visible que vincule la cotización autoritativa con esa orden.

## Calidad, rendimiento y dependencias

`tsc -b` completó sin errores con las dependencias instaladas. El build estándar falla aquí por permisos de esbuild al leer el directorio padre; con `--configLoader runner` completó: 866 módulos, JS principal 1,032.88 kB (314.38 kB gzip), CSS 118.18 kB (22.51 kB gzip). No se generaron source maps. No hay carga diferida por rutas: el panel administrativo y sus gráficas forman parte del grafo inicial. Vite advierte que el import dinámico de SweetAlert no crea otro chunk porque también se importa estáticamente.

Lint: **149 problemas, 141 errores y 8 advertencias**; incluye `any`, variables sin uso, dependencias de hooks, estado en efectos, exports de contexto y `no-async-promise-executor`. No hay script `test`, configuración de E2E ni CI versionada visible. `npm audit` no pudo consultar el registro; **no se emite un dictamen de dependencias libres de vulnerabilidades**. No se ejecutó `npm ci`: el registro está inaccesible y habría reemplazado la instalación existente sin poder garantizar su recuperación.

Versiones resueltas del lock local: React 19.2.4, Vite 7.3.8, React Router DOM 7.18.6, Axios 1.21.1 y PayPal React SDK 9.1.1. Las versiones mínimas declaradas en package.json son distintas por sus rangos. Vite instalado requiere Node `^20.19.0 || >=22.12.0`; el README dice Node >=16, lo que es incorrecto para este árbol. Entorno de auditoría: Node 24.11.0, npm 11.6.1.

No se identificó una dependencia directa claramente prescindible: todas las familias del stack tienen importaciones o configuración. Sí hay código/recursos candidatos a retirar: `pages/Admin/AdminDashboard/AdminDashboard.tsx` no tiene consumidores; `react.svg`/`vite.svg` no tienen referencias; varios recursos se duplican entre `public/img` y `src/assets/img`. `script.py` es una transformación manual que escribe el formulario de recuperación, no es una tarea de producción ni se ejecutó. Los carruseles de autenticación y la consulta de perfil duplican lógica; muchas alertas evitan el helper común.

`public/img/descarga.png` pesa 7,837,993 bytes y es el logo del login; `Fondo2.png` 7,094,277 y `Fondo.png` 5,290,840. No hay `loading="lazy"` en las imágenes inspeccionadas. Las respuestas no se cancelan ni se cachean de forma centralizada; en desarrollo StrictMode puede repetir efectos. Consultas a direcciones/carrito/devoluciones se repiten desde varios consumidores.

## Railway: evidencia y límites

Proyecto `scintillating-respect`, entorno `production`, servicio `csti-Frontend`. Conector de Railway consultado el 23/11/2026; valores de variables ocultos por el proveedor.

| Aspecto | Observación |
|---|---|
| Fuente | `leolopezOsornio/csti-Frontend`, rama `main`, `checkSuites: false` |
| Build | Railpack, entorno V3; sin comando de build explícito; package.json proporciona `tsc -b && vite build` |
| Root/start/healthcheck | Sin override en descripción; diagnóstico histórico devuelve `rootDirectory: null`, `startCommand: null`, `healthcheckPath: null`; autodetección actual no verificada |
| Dominio | `https://csti-frontend-production.up.railway.app`; dominio generado, DNS/TLS administrados por Railway; no se acreditó respuesta HTTPS efectiva |
| Región/réplicas | us-west2, una réplica configurada; métricas de la última hora CPU y memoria en cero |
| Despliegues | Historial más reciente: `0b26e565…` (09/09, commit `ba824d6`) REMOVED; `1b086b6f…` (03/09, `3ad650f`) REMOVED; `c71a74aa…` (03/09, `5997d39`) FAILED |
| Inconsistencia de resumen | `describe_service` devuelve el FAILED como latest; `environment_status` informa cero incidencias. Ninguno acredita un despliegue activo; prevalece el historial para la secuencia |
| Error histórico | Diagnóstico de Railway atribuye el FAILED a import `faImage` sin uso. **Ya no está en el archivo local**, línea 4; build actual con runner pasa. No es un hallazgo actual de TypeScript |
| Logs | Consulta del despliegue histórico devolvió cero logs de ejecución; no se obtuvo log bruto de build. El diagnóstico es evidencia secundaria, no una repetición local del fallo |
| Pendientes previos | Hay un patch staged que afecta al servicio backend Csti. No fue creado ni aplicado por esta auditoría |
| Variables | Seis nombres frontend presentes; Csti tiene PAYPAL_MODE/CLIENT_ID/SECRET, ENVIA_MODE, CORS_ALLOWED_ORIGINS y credenciales de proveedores, con valores ocultos |
| SPA/CORS | No hay servidor estático/fallback versionado. Fallback de rutas profundas y cabeceras CORS efectivas pendientes de prueba |
| Política/recursos | No se acreditaron límites contratados, aprobación antes de desplegar, rollback ensayado ni alertas. Tracing desactivado |

No se puede confirmar correspondencia sandbox/live del Client ID embebido con PAYPAL_MODE y la app backend: los nombres de variables y el nombre `production` no lo demuestran. Cambiar una variable VITE exige un nuevo build para cambiar el bundle, según [Vite](https://vite.dev/guide/env-and-mode).

## Evidencia necesaria para cerrar la auditoría

Contratos/OpenAPI o código Django, usuarios sintéticos de dos clientes y un administrador, staging sin credenciales live, mocks de proveedores, sandbox PayPal confirmado, entorno de navegador y acceso al registro npm. Con ellos ejecutar la matriz del documento 04, demostrar permisos por objeto, unicidad financiera y recuperación, y verificar el artefacto desplegado. Ninguna de estas verificaciones se sustituye por que exista una pantalla.
