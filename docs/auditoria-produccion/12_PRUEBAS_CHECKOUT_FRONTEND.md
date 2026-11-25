# Fase 3 — pruebas y evidencia frontend

2026-11-24. Node 24.11.0, npm 11.6.1, dependencias ya instaladas.
Rama fix/seguridad-envios-preproduccion; HEAD ba824d62c93fc6eb5ec1538db63c2151c30f1ad6.

## Resultado auténtico

| Verificación | Antes de fase 3 | Tras implementación |
| --- | --- | --- |
| npm.cmd test | 44 pasan, 0 fallos | **74 pasan, 0 fallos, 0 omitidas** |
| TypeScript app, tsc -p tsconfig.app.json --noEmit | No se volvió a medir antes | Exit 0, sin errores |
| Build TypeScript -b + Vite aislado | No se volvió a medir antes | Exit 0; sin cargar .env, Client ID sintético y API local |
| npm.cmd run lint | 125 errores, 7 warnings | 120 errores, 7 warnings; exit 1 por deuda previa |
| Lint núcleo checkout (11 archivos) | No aplica | Exit 0, sin errores/advertencias |
| git diff --check | No se volvió a medir antes | Sin errores de whitespace; avisos LF/CRLF previos |

No se presenta el lint global como aprobado. Los cinco errores eliminados estaban
en Payment anterior. No se hizo una reparación general ajena al checkout ni se
desactivaron reglas para ocultar problemas.

Comandos reproducibles desde cstiFrontend:

```powershell
npm.cmd test
node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit
node scripts/build-checkout-offline.mjs
npm.cmd run lint
node node_modules/eslint/bin/eslint.js src/services/Checkout.service.ts src/services/CheckoutRecovery.ts src/services/CheckoutSession.ts src/services/CheckoutCallbacks.ts src/services/Shipping.service.ts src/services/CheckoutShipping.service.ts src/hooks/useShippingQuote.ts src/components/CheckoutPayPal.tsx src/components/CheckoutStatus.tsx src/pages/Payment/Payment.tsx src/pages/cart/components/CartSummary/CartSummary.tsx
git diff --check
```

El script de build ejecuta tsc -b y la misma configuración Vite con envDir:false,
limpia variables VITE heredadas y fija API localhost/Client ID sintético en su
proceso hijo. No ejecuta el SDK en un navegador ni contacta el backend. Artefactos
en node_modules/.cache/checkout-offline-dist, ignorados por Git. No se usó el build
normal que podría incorporar variables de .env. Se observó warning de chunk JS
mayor de 500kB (aproximadamente 1.05MB sin gzip), sin fallo de compilación.

## Aislamiento y regresiones

tests/register.mjs carga offline-guard.mjs: bloquea fetch real y socket connect,
y exige cero intentos incluso si una excepción se captura. Las peticiones se
resuelven con mocks o con Axios real y su adaptador fetch apuntando a un fetch
simulado. Backend, acciones SDK y almacenamiento se simulan con datos sintéticos.
El bloqueo de red pasó en todas las suites. No se leyó .env desde los tests.

Se conservaron los **44 casos anteriores**. Los 19 de seguridad/envío y 5 de hook
se adaptaron en sus fixtures/expectativas al contrato incompatible nuevo: strings
de dinero, service, UUID, selección persistida y cuerpo direccionID sin productos.
El objetivo de las regresiones sigue siendo bloqueo ante fallo/manipulación,
vigencia, invalidación, respuestas antiguas, ausencia de loops, rastreo veraz y XSS.
Los **20 tests fiscales y todos los archivos fiscales** conservan sus bytes; se
ejecutan con sus interceptores JWT/refresh reales, sin modificar permisos Django.

## Matriz de casos de esta fase

| Requisito | Evidencia persistente |
| --- | --- |
| DTO y selección UUID | Quote estricto, service sin title, strings, MXN, fechas, tarifas y POST rate_id |
| Autoridad financiera / IVA | Totales retornados por Django; displayMoney sólo formatea; requests sin total, productos, envío cliente o purchase_units |
| createOrder y onApprove | Callbacks reales con acciones SDK simuladas que fallarían si fueran invocadas; creación/captura sólo backend |
| Idempotencia / doble clic | Promesa compartida, una creación; timeout guarda misma UUID y recuperación usa esa misma clave tras recarga |
| Ambigüedad | Creación PayPal con timeout no repite POST; 202 y 200 no confirmados no muestran éxito |
| Confirmación | Sólo CAPTURED con order_id muestra pedido confirmado; referencia hasta reconocimiento |
| Recarga | GET recupera CAPTURED sin depender del carrito; clave sin ID no dispara operaciones automáticamente |
| Cotización 409 | Rechazo definitivo previo a intento permite recotizar explícitamente; evita reutilizar quote vencida |
| CAPTURE_UNKNOWN / timeout | Segundo onApprove no vuelve a llamar capture; recuperación no captura |
| Conciliación | Clic explícito; 10s entre consultas; máximo 5 aunque avance el reloj; respuestas repetidas no crean bucles |
| Cuenta / logout | Respuesta tardía no guarda ID ni crea PayPal en otra cuenta; logout borra stores y bloquea callback tardío; código sólo misma cuenta |
| Cancelación | 409 ambiguo conserva referencias, cierre visual pendiente no cancela; FAILED por GET recupera respuesta perdida |
| Legacy / disponibilidad | Ninguna llamada /api/pagos/verificar/ ni acciones SDK financieras; CHECKOUT_DISABLED bloquea creación |
| Axios real | JWT y JSON exactos; cambio de token antes de despacho no hace fetch; 401 checkout no reenvía POST ni refresca bajo otra cuenta |
| Almacenamiento | Fallo al guardar referencia bloquea antes de llamar al backend |

Treinta tests nuevos: 27 en checkout.test.mjs y 3 en checkout-auth.test.mjs.
Los mocks no acreditan SDK real, navegador DOM/StrictMode, Django real, PostgreSQL
ni proveedores. El harness del hook sigue siendo un scheduler unitario, no E2E.

## Integridad local

Se copiaron 154 archivos fuente/tests/docs/package como fotografía previa, sin
secretos ni node_modules. La aplicación de cambios comprueba hashes y rechaza
sobrescribir cualquier edición concurrente. Se compararon los archivos anteriores:
solamente cambian los 14 declarados en el inventario; los demás permanecen iguales.
Los documentos anteriores de fases 1/2 y las descargas fiscales no se reescribieron.
package.json no cambió en esta fase. SHA256 de package-lock.json antes/después:

```text
BD64971F0DD3411A7E8A4E63592A2A1D894CDC73AC53F16C38AB6725A310B436
```

Que package.json/package-lock sigan modificados frente a Git corresponde al trabajo
anterior. No se instalaron dependencias. El diff fase 3 compara contra la fotografía
anterior, no contra main, para no atribuirse cambios previos.

## Pendientes

Integración Django HTTP + pagos.0009 + PostgreSQL aislado + PayPal/Envia sandbox;
DOM real, popup/aprobación, recarga/logout en navegador, accesibilidad y UX en
dispositivo. Falta descubrimiento backend de intentos pendientes para recuperación
automática tras logout sin código. También rate limiting servidor, IVA/origen
aprobados, contrato CVA y cierre de deuda lint/bundle. No se declara producción lista.
