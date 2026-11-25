# Fase 4 — inventario y diff frontend

Fecha 2026-11-24. Cambios locales, sin commit/push/merge/deploy.
[Diff completo de código, tests, contratos y reportes](18_FASE4_FRONTEND.diff).
Base de comparación: fotografía local al inicio de fase 4, con todo el trabajo
anterior sin commit incluido. No se atribuyen correcciones de otras fases.

El patch excluye sólo este índice y el propio .diff para evitar autorreferencia;
los reportes principales y adendas de contratos sí están incluidos. No contiene
venv, TLS, Docker data, node_modules, .env, claves ni JWT.

| Archivo | Cambio |
| --- | --- |
| `docs/auditoria-produccion/11_FASE3_CHECKOUT_FRONTEND.md` | Modificado |
| `docs/auditoria-produccion/15_FASE4_INTEGRACION_FRONTEND.md` | Nuevo |
| `docs/auditoria-produccion/16_FASE4_PRUEBAS_FRONTEND.md` | Nuevo |
| `integration/checkout-http.test.mjs` | Nuevo |
| `integration/register.mjs` | Nuevo |
| `src/pages/Payment/Payment.tsx` | Modificado |
| `src/services/Checkout.service.ts` | Modificado |
| `src/services/CheckoutSession.ts` | Modificado |

## Preservación y validación

Sin cambios de modelos/migraciones ni nuevas dependencias. Los archivos previos
no enumerados se compararon por hash y permanecen. Se conservaron branches y HEAD;
main, Railway y datos comerciales no se modificaron. El lock frontend mantiene
SHA256 BD64971F0DD3411A7E8A4E63592A2A1D894CDC73AC53F16C38AB6725A310B436.

105 tests PostgreSQL pasan sin omisiones; 12 HTTPS reales y 74 regresiones frontend
pasan. TypeScript, build aislado y lint del código frontend tocado pasan. El lint
global continúa en 120 errores/7 advertencias previos; no se presenta aprobado.
Los 22 tests fiscales originales pasan. Se modificó su vista únicamente para
negociación MIME, manteniendo JWT/owner/admin/404 privado.

Pendientes: sandbox autorizado, campos Envia, IVA/origen, CVA, navegador/SDK real,
operación distribuida y upgrade/restauración de una copia poblada. No se declara
producción lista. La infraestructura descartable se apaga después de validar.
