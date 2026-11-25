# Fase 3 — integración local del checkout React con Django

**Adenda fase 4:** ahora se ejecutaron 12 pruebas Axios HTTPS con Django y
PostgreSQL reales; se implementó listado autenticado de intentos activos para
recuperar después de logout sin código. El bloqueo CHECKOUT_DISABLED se conserva
tras GET y permite recuperar operaciones existentes. Ver
[resultado fase 4](15_FASE4_INTEGRACION_FRONTEND.md). Las limitaciones y pruebas
de fase 3 siguientes son históricas; sandbox/SDK DOM continúan pendientes.

2026-11-24. Repositorio C:\Users\TI\cstiFrontend, rama
`fix/seguridad-envios-preproduccion`, HEAD
`ba824d62c93fc6eb5ec1538db63c2151c30f1ad6`. Cambios sin commit.

Implementación local terminada y comprobada con mocks. **Integración HTTP con
Django/PostgreSQL/PayPal sandbox pendiente; no está listo para producción.**
No se modificó el backend, main, Railway ni configuración comercial. No hubo
pagos, compras CVA, guías, reembolsos, CFDI, commit, push, merge o deploy.

## Fuente de verdad y compatibilidad

Se leyeron los documentos Django 10, 11, 12 y 13 en
`C:\Users\TI\Csti\docs\auditoria-produccion\` y se contrastó el contrato con
sus DTO/vistas locales. No se inició servidor Django ni se hizo HTTP a Railway.
El contrato obligatorio es
[11_CONTRATO_HTTP_CHECKOUT.md](../../../Csti/docs/auditoria-produccion/11_CONTRATO_HTTP_CHECKOUT.md).
El backend sigue deshabilitado por defecto y requiere pagos.0009; no se aplicó.

`Checkout.service.ts` implementa únicamente:

| Método | URL | Cuerpo |
| --- | --- | --- |
| POST | /api/pagos/checkout/cotizaciones/ | direccionID |
| POST | /api/pagos/checkout/cotizaciones/{quote_id}/tarifa/ | rate_id UUID |
| POST | /api/pagos/checkout/intentos/ | quote_id; header Idempotency-Key UUID |
| POST | /api/pagos/checkout/intentos/{intent_id}/paypal/ | objeto vacío |
| POST | /api/pagos/checkout/intentos/{intent_id}/capturar/ | paypal_order_id |
| GET | /api/pagos/checkout/intentos/{intent_id}/ | sin cuerpo |
| POST | /api/pagos/checkout/intentos/{intent_id}/reconciliar/ | objeto vacío |
| POST | /api/pagos/checkout/intentos/{intent_id}/cancelar/ | objeto vacío |

JWT por la instancia Axios existente, JSON, timeout 45s y fetch con redirect:error.
Se validan status esperados, UUID, estados, moneda MXN, strings decimales,
timestamps, líneas, IDs y tarifas únicas; el DTO proyecta sólo campos conocidos.
Se exige carrier/service, no title. No se mandan productos, importes, descuentos,
shippingCost, purchase_units o currency_code. No queda llamada al verificador
retirado ni actions.order.create/capture. Payment.service conserva sólo un
export de compatibilidad al servicio nuevo, sin verifyPayment.

Se fija el token de la sesión al despacho Axios y se rechaza si cambió antes de
enviar. Los requests de checkout no se refrescan/reenvían automáticamente ante
401: conservan referencia y exigen recuperar sesión explícitamente. Los demás
consumidores y el refresh fiscal anterior se conservan.

## Cotización y presentación financiera

Shipping.service adapta el DTO conservando quote_id y todos sus totales. Su
expiresAt procede exactamente de expires_at; no hay TTL cliente inventado.
useShippingQuote conserva identidad estable de ítems, cancelación de respuestas
viejas y limpieza de timers. La tarifa inicial se elige entre las devueltas y se
confirma por POST; la selección posterior también espera respuesta del servidor.
Mientras esa selección está pendiente se bloquea el pago. Una cotización vencida
devuelta por el servidor no provoca un bucle de solicitudes inmediatas.

Cambiar carrito, dirección o cuenta invalida la vista anterior. Antes de una
compra nueva se vuelven a comprobar carrito y dirección; no se recotiza buscando
un UUID viejo entre tarifas nuevas, ya que cada quote genera IDs diferentes.
Django vuelve a validar snapshot, vigencia y stock al crear/capturar.

CartSummary y Payment muestran items_total, shipping_total, items_tax,
shipping_tax y total del backend, sin sumarlos entre sí ni calcular IVA. El
formateador trabaja con strings. La comparación BigInt de tarifas sólo elige una
preferencia de envío; no determina el cobro. Las líneas muestran cantidad y precio
unitario sin reconstruir un total financiero con floats. La preferencia de envío
guardada contiene contexto e ID, nunca un precio autoritativo.

## Máquina de estados y SDK

CheckoutSession centraliza transiciones, referencias y exclusión de callbacks.
La interfaz combina estados de cotización con estados financieros:

| Estado visible | Entrada/acción |
| --- | --- |
| Cotizando / confirmando tarifa | Hook solicita y selecciona por backend |
| Tarifa seleccionada | Quote vigente, selected_rate_id y total no null |
| creating_intent | Guarda clave/referencia antes de POST |
| creating_paypal | Django persiste intento; frontend solicita orden PayPal |
| awaiting_approval | SDK recibe exclusivamente el PayPal Order ID del backend |
| capturing | onApprove manda ID aprobado al backend |
| pending | 202, estado ambiguo, timeout o resultado todavía no confirmado |
| reconciling | Consulta explícita y acotada; no captura |
| paid | state CAPTURED y order_id local confirmado |
| cancelled | Backend confirma FAILED |
| attention / requote / unavailable | Revisión, cotización inválida o CHECKOUT_DISABLED |

createOrder comparte una promesa entre clics concurrentes y usa una clave UUID
por compra lógica. onApprove no usa captura SDK. Un HTTP 200 sin CAPTURED+order_id
no muestra éxito; 202 no equivale a fallo terminal. Un error posterior del SDK
no revierte un pago confirmado. El carrito no se borra desde React: se refresca
tras confirmación; el backend decide qué unidades retirar.

Los callbacks siguen la integración servidor del
[SDK React PayPal v5](https://github.com/paypal/paypal-js/blob/main/packages/react-paypal-js/README-PAYPAL-JS-SDK-V5.md)
instalado, sin cambiar dependencias ni migrar a otro SDK. No se expone SECRET ni
token OAuth. Sólo el Client ID público corresponde al proveedor de scripts.

## Referencias, recarga, cuenta y cancelación

Se guarda en localStorage una referencia mínima versionada, asociada al ID de
cuenta: accountId, quoteId, key, intentId nullable. No contiene importe, éxito,
datos de tarjeta, JWT ni dirección. Lo guardado sólo localiza una operación; GET
y la autorización Django deciden su estado real. Cambiar de cuenta invalida las
respuestas antiguas antes de guardar/capturar. El componente también se remonta
por user.id; una cuenta diferente no puede importar el código anterior.

Tras timeout se conserva la misma clave. Si se perdió el ID del intento, la
recuperación explícita repite sólo crear intento con esa clave (Django devuelve
el existente), nunca una captura. Si ya hay ID, la recarga consulta GET. El flujo
no depende de tener ítems en el carrito: un pago confirmado puede haberlo vaciado.
La conciliación requiere clic explícito, mínimo 10s entre intentos y máximo 5 por
instancia de página; no hay polling ni bucles automáticos. Este límite cliente
no reemplaza rate limiting del servidor.

CAPTURE_UNKNOWN o timeout de captura no permiten otro onApprove/capture desde
React. Se consulta y reconcilia. Sólo CREATED/PAYPAL_ORDER_CREATED verificados
pueden reanudar aprobación. No se crea otra orden ante creación ambigua.

Cancelación visual no prueba cancelación financiera. Sólo se pide al backend en
estados previos al cobro; CHECKOUT_CANNOT_CANCEL_AMBIGUOUS mantiene referencia y
mensaje pendiente. FAILED confirmado, incluso por GET tras perder la respuesta,
permite liberar referencias. CAPTURED las conserva hasta reconocer el pedido.
Un 409 definitivo que rechaza crear el intento antes de PayPal permite recotizar
explícitamente; no se descarta una referencia de intento existente o ambiguo.

Logout borra referencias de ambos storages e invalida callbacks en vuelo. Antes
de salir se muestra un código copiable que contiene sólo los mismos IDs. Tras
autenticarse, la misma cuenta puede importarlo y consultar Django. **Sin ese
código no se puede descubrir automáticamente un intento ambiguo después de
logout/borrado del navegador con el contrato actual.** No se oculta esta limitación
guardando referencias de otra cuenta tras logout.

## Brechas de contrato para el agente Django (sin cambios backend)

| Endpoint/campo | Esperado | Observado en código/contrato local, sin HTTP real | Propuesta |
| --- | --- | --- | --- |
| GET /api/pagos/checkout/intentos/ | Recuperar pendientes de la cuenta tras logout sin código | Sólo hay POST de creación y GET por UUID; listado no implementado | Añadir listado autenticado de intentos activos/recientes del dueño, paginado y sin datos privados adicionales |
| GET por intento / líneas de quote | Mostrar desglose original al reanudar | Devuelve total/quote_id, sin líneas y sin GET de quote | Considerar lectura autorizada del snapshot/desglose; actualmente UI reanudada muestra sólo total del intento |
| Reconciliación | Protección operativa de repetición | Límite frontend, sin garantía distribuida | Agregar throttling, observabilidad redactada y reconciliador operativo auditado |

Las propuestas anteriores **no son endpoints implementados**. No se inventó una
API de descubrimiento ni se modificó Django para hacer pasar las pruebas.

## Bloqueos y siguiente integración sandbox

1. Preparar PostgreSQL descartable, revisar/aplicar pagos.0009 allí y probar
   concurrencia/caída DB. No usar Railway ni credenciales productivas.
2. Aprobar IVA/redondeo, origen y dimensiones logísticas. Habilitar CHECKOUT_ENABLED
   sólo en ese entorno de pruebas; nunca ignorarlo desde una variable frontend.
3. Configurar VITE_API_BASE_URL de pruebas, CORS para ese origen e Idempotency-Key,
   Client ID SDK y receptor PayPal sandbox coherentes. SECRET permanece en Django.
4. Probar SDK en navegador con HTTPS de pruebas, 202/503/409, popup, recarga,
   logout y cambio de cuenta contra los proveedores sandbox, sin operaciones live.
5. Mantener CVA sin compras comerciales; acreditar consulta/deduplicación y
   resolución de manuales. Resolver descubrimiento de pendientes tras logout.

Persisten lint global previo y advertencias de bundle grande. No se acredita
integración E2E/DOM real, concurrencia PostgreSQL ni preparación productiva.
