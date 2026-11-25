# Fase 4 — frontend integrado por HTTPS con Django/PostgreSQL aislado

2026-11-24. Rama fix/seguridad-envios-preproduccion, HEAD
ba824d62c93fc6eb5ec1538db63c2151c30f1ad6. Sin commit, push, merge ni despliegue.

**12 pruebas HTTPS auténticas pasan** usando Checkout.service, Api.service,
CheckoutSession, carrito, direcciones, pedidos y descarga fiscal del frontend.
Django y PostgreSQL son reales; PayPal/Envia/Facturapi son simulados en Django.
No se reemplazó Axios ni las respuestas HTTP por mocks. Storage y descarga de
navegador se simulan: no se declara navegador/SDK E2E ni sandbox validado.

## Cambios frontend

- Checkout.service añade GET /api/pagos/checkout/intentos/?page=N y DTO validado
  count/next/previous/results, máximo 10 resultados; cada Intent incluye su
  idempotency_key original. Sólo acepta estados activos, UUID y campos válidos.
- CheckoutSession adopta un intento descubierto con la clave original y conserva
  las comprobaciones de sesión. No crea otra compra para recuperarlo.
- Payment permite buscar pendientes de la cuenta, paginar y recuperar sin código
  después de logout. No sigue URLs externas next/previous: incrementa page.
- El bloqueo de nuevas compras CHECKOUT_DISABLED se conserva tras leer estado.
  Los botones PayPal permanecen ocultos; consultas, recuperación y cancelación
  siguen disponibles. Un pago ya verificado puede mostrarse confirmado.
- integration/register.mjs transpila TS real y fija únicamente appConfig a
  https://127.0.0.1:58080. Rechaza red fuera de loopback. integration/checkout-http
  prueba backend real con JWT, preflight CORS e Idempotency-Key.

Logout sigue eliminando las referencias locales; el listado autenticado recupera
operaciones aún activas. CAPTURED/FAILED no se listan: los pagos confirmados están
en Mis pedidos. El código manual anterior sigue siendo una alternativa. Nunca
se expone la información de otra cuenta en el listado o GET por ID.

## Incompatibilidades encontradas

1. La fixture inicialmente asumió que agregar dirección devolvía la dirección
   directamente. El contrato existente es {mensaje, direccion}; se corrigió la
   prueba sin modificar Address.service ni Django para ese caso.
2. Billing requiere HTTPS y Accept PDF/XML. Se sirvió TLS local con certificado
   de prueba; no se relajó protectedInvoiceUrl. Django devolvía 406 por negociación
   de renderer antes de la descarga. Se corrigió allí conservando permisos JWT y
   ownership. PDF/XML sintéticos recorren ahora el cliente fiscal sin cambios.
3. El backend tenía un orden de locks cruzado que produjo 40P01; se corrigió y
   verificó con conexiones PostgreSQL reales.
4. La representación PayPal no siempre incluye metadatos completos de orden; el
   backend hace un GET verificable cuando faltan, sin repetir captura. Fixtures
   HTTP ejercitan esa representación y los fallos de lectura/persistencia.

## Configuración y comandos

Se usa el servidor de fixtures del backend con csti.settings_test_phase4 y
PostgreSQL 16 en 127.0.0.1:55432/csti_phase4, tmpfs sin datos comerciales.
Pasos completos de infraestructura:
[reproducción backend](../../../Csti/docs/auditoria-produccion/16_FASE4_PRUEBAS_Y_REPRODUCCION.md).

```powershell
$env:NODE_EXTRA_CA_CERTS = 'C:\Users\TI\Csti\venv\phase4-work\local-cert.pem'
node --test integration/checkout-http.test.mjs
npm.cmd test
node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit
node scripts/build-checkout-offline.mjs
```

No se usa NODE_TLS_REJECT_UNAUTHORIZED=0. Certificado y clave permanecen en venv
ignorado, no en el repo frontend. El build aislado no lee .env, usa ID PayPal
sintético y API localhost. No se instalaron dependencias ni cambió package-lock.

## Alcance y pendientes

Se ejecutaron 105 pruebas Django/PostgreSQL sin omisiones, 12 HTTPS y las 74
regresiones frontend. Checkout simulado completo, una captura/orden/outbox,
recargas, pérdida de transporte, caída de la sesión DB, cuentas distintas,
logout, almacenamiento y CHECKOUT_DISABLED quedaron comprobados.

Faltan SDK/DOM reales, PayPal/Envia sandbox autorizados, campos de paquetes Envia,
IVA/origen aprobados, CVA y operación. Véase
[preparación sandbox](../../../Csti/docs/auditoria-produccion/17_FASE4_CONTRATOS_Y_SANDBOX.md).
El lint global conserva deuda previa y Vite advierte un chunk grande. No se
declara checkout listo para producción. Main y Railway permanecen intactos.
