# Fase 3 — inventario y diff frontend

Rama `fix/seguridad-envios-preproduccion`, HEAD
`ba824d62c93fc6eb5ec1538db63c2151c30f1ad6`. Sin commit.

[Diff completo de fase 3](14_FASE3_FRONTEND.diff), comparado contra la fotografía
local anterior a esta fase, incluyendo sus cambios sin commit. No se compara
contra main para evitar atribuirse las correcciones de fases 1/2.

## Código, pruebas y build

25 archivos: 14 previos adaptados y 11 nuevos. Sin dependencias nuevas.

| Archivo | Cambio |
| --- | --- |
| `scripts/build-checkout-offline.mjs` | Nuevo |
| `src/components/CheckoutPayPal.tsx` | Nuevo |
| `src/components/CheckoutStatus.tsx` | Nuevo |
| `src/components/ShippingQuoteGate.tsx` | Modificado |
| `src/contexts/AuthContext.tsx` | Modificado |
| `src/hooks/useShippingQuote.ts` | Modificado |
| `src/pages/cart/components/CartSummary/CartSummary.tsx` | Modificado |
| `src/pages/Payment/Payment.tsx` | Modificado |
| `src/services/Api.service.ts` | Modificado |
| `src/services/Auth.service.ts` | Modificado |
| `src/services/Checkout.service.ts` | Nuevo |
| `src/services/CheckoutCallbacks.ts` | Nuevo |
| `src/services/CheckoutRecovery.ts` | Nuevo |
| `src/services/CheckoutSession.ts` | Nuevo |
| `src/services/CheckoutShipping.service.ts` | Modificado |
| `src/services/Payment.service.ts` | Modificado |
| `src/services/Shipping.service.ts` | Modificado |
| `tests/checkout-auth.test.mjs` | Nuevo |
| `tests/checkout-fixtures.mjs` | Nuevo |
| `tests/checkout.test.mjs` | Nuevo |
| `tests/hook-harness.mjs` | Modificado |
| `tests/offline-guard.mjs` | Nuevo |
| `tests/register.mjs` | Modificado |
| `tests/shipping-hook.test.mjs` | Modificado |
| `tests/shipping-security.test.mjs` | Modificado |

## Función de los cambios

- Checkout.service: ocho endpoints, DTO/validadores y mensajes públicos.
- CheckoutSession/Recovery/Callbacks: estado, referencias mínimas, misma clave,
  recuperación, cancelación segura, separación de cuenta y callbacks SDK.
- Payment/CheckoutPayPal/CheckoutStatus: creación y captura backend, aprobación
  SDK, confirmación sólo CAPTURED+order_id, atención y recuperación accesibles.
- Shipping/hook/Gate/CartSummary: quote durable, tarifa confirmada, caducidad
  oficial, dinero en strings y bloqueo ante errores/cambios de contexto.
- AuthContext/Auth/Api: invalida operaciones al cambiar cuenta/logout; fija token
  de checkout al despacho y evita replay automático de POST tras 401.
- Tests: conserva 44 regresiones y añade 30 financieras; guardas de red y mocks.
- Build offline: TypeScript -b y Vite sin .env ni credenciales comerciales.

## Documentación nueva

- 11_FASE3_CHECKOUT_FRONTEND.md: arquitectura, contrato, estados, recuperación,
  brechas propuestas al backend y pasos sandbox.
- 12_PRUEBAS_CHECKOUT_FRONTEND.md: comandos, resultados y limitaciones reales.
- 13_DIFF_FASE3_FRONTEND.md: este inventario.
- 14_FASE3_FRONTEND.diff: diff de los 25 archivos anteriores, sin duplicar docs.

## Preservación

package.json/package-lock no cambian en esta fase. El lock conserva SHA256
BD64971F0DD3411A7E8A4E63592A2A1D894CDC73AC53F16C38AB6725A310B436.
Los archivos fiscales, sus 20 tests, XSS, rastreo confirmado, documentos anteriores
y otras ediciones locales ajenas al checkout se preservan. Los tests de cotización
se adaptaron al contrato nuevo sin eliminar casos de regresión.

No se modificó Django. No se cambia main, historial Git, Railway, datos ni claves
comerciales. No hubo instalación de dependencias, commit, push, merge o deploy.
Artefactos de build quedan en node_modules/.cache ignorado. Las fotografías/logs
de trabajo están en el venv ignorado del workspace backend y no se entregan como
código ni incluyen .env.

74 pruebas pasan; TypeScript/build y lint del núcleo pasan. El lint global sigue
fallando: 120 errores previos y 7 warnings (antes 125/7). No se acredita integración
con Django, PostgreSQL ni SDK/proveedores reales. Recuperación tras logout sin
código requiere un listado de intentos backend aún no implementado.
