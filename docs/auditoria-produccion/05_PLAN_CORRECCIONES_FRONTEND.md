# Plan de correcciones para lanzamiento

Fecha: 23/11/2026. **Este documento propone cambios; no se implementó ninguno.** Complejidad B=baja, M=media, A=alta, expresada como alcance técnico, sin prometer fechas. Frontend y backend deben revisar juntos los contratos financieros y de autorización. Los criterios remiten a la [matriz de pruebas](04_PRUEBAS_FRONTEND.md).

## Orden de ejecución

Primero cerrar integridad financiera, XSS y operación de hosting. Después estabilizar sesión, privacidad y devoluciones; finalmente consistencia comercial y calidad. Un build exitoso no habilita ventas mientras queden bloqueos P0 o pruebas de autorización/duplicación pendientes. No ejecutar un despliegue como parte de este plan sin autorización independiente.

| Orden | Hallazgos / prioridad | Complejidad | Responsable propuesto | Cambio concreto | Criterio de aceptación |
|---|---|---|---|---|---|
| 1 | F01/F02, P0 | A | Backend + frontend | Crear contrato de cotización por ID con TTL/snapshot; backend crea orden PayPal, calcula total/promoción/MXN y valida dirección/stock/envío | T07/T08: alteraciones del navegador no cambian el importe aceptado; proveedor offline bloquea pago; cotización válida coincide con total presentado |
| 2 | F05, P0 | A | Backend + frontend | Persistir intento; endpoint de estado; unicidad orderID/operación y captura/pedido atómicos; bloquear operación concurrente en UI | T10/T11: callbacks, POST y pestañas repetidos producen exactamente un cobro/pedido; timeout se reconcilia sin nueva compra |
| 3 | F03, P0 | M | Frontend + seguridad | Sustituir templates con datos de usuario por texto/JSX; validar URLs; sanitizador solo si hay HTML realmente requerido | T25: todas las entradas adversarias se representan como texto seguro; ninguna ejecución ni atributos activos |
| 4 | F04, P0 | M | Plataforma + frontend | Preparar configuración de static hosting, PORT, rutas SPA, healthcheck, comandos y release documentados; verificar causa de despliegues retirados | T29 diseñado y configuración revisable; tras autorización futura, dominio y rutas responden con artefacto correcto y rollback probado |
| 5 | F06/F19, P1 | M | Frontend + backend | Respuesta tipada de confirmación con estado/captura/pedido; estados creando/autorizando/verificando/pendiente/error; onCancel y error del SDK | T09/T12/T13: HTTP 200 pendiente no muestra éxito; cancelar conserva carrito; fallos recuperables sin recompra |
| 6 | F08/F09/F10/F11/F12, P1 | A | Frontend + backend auth | Gestor único de sesión, renovación compartida/rotada, invalidación por época, stores excluyentes, sincronización entre pestañas y guards con loading | T02/T26/T27: M05–M12 corregidos; logout no revive sesión; caída de red no borra credenciales válidas; ruta admin conserva destino |
| 7 | F13/F26, P1 | M | Backend + frontend | Descarga fiscal autenticada de blob o firma corta con propiedad; URLs de guías restringidas; logging redactado y headers en hosting | T17/T25: A accede a lo suyo; B/anónimo rechazados; enlaces caducan; no hay JWT/PII en logs |
| 8 | F14/F15/F16, P1 | A | Backend + frontend + operaciones | Unicidad de solicitud, transiciones atómicas, confirmación de reembolso del proveedor; elegibilidad desde backend; fotos con límites y limpieza blob; modal bloqueado durante envío | T18–T21: una solicitud/guía/reembolso; 15 días según política aprobada; archivos inválidos rechazados; timeout no produce falso éxito |
| 9 | F17/F18, P1 | M | Frontend + backend catálogo | DTO común de producto/precio/stock, validación de respuesta, control de consulta vigente y estados error/vacío separados | T04–T06/T14/T28: mismo SKU y promoción consistentes; no aparece carrito/historial vacío por 500; respuesta vieja no reemplaza nueva |
| 10 | F22, P1 | M | Frontend + UX | Radios/botones para envío/filtros, asociación labels, diálogo/foco/Escape, errores aria y estados de carga | T23/T24: comprar y solicitar devolución con teclado; móvil/zoom sin controles inaccesibles; contraste medido |
| 11 | F23, P1 | A si se implementa | Producto + frontend + backend | Definir si CRUD de productos/marcas pertenece al lanzamiento; construir contratos/pantallas o formalizar alternativa operativa | T22 y alcance aprobado por negocio; no afirmar módulos implementados sin rutas ni pruebas |
| 12 | F20/F25, P1 | M | Frontend + plataforma | Lock aprobado, Node compatible fijado, npm ci reproducible, lint limpio, suite de regresión crítica y CI sin despliegue automático por auditoría | T31: todas las comprobaciones pasan; auditoría de advisories accesible con decisiones sobre cada riesgo |
| 13 | F24, P2 | B | Frontend | Crear/reusar placeholders reales, validar JSON, namespace por cuenta/carrito/TTL y limpieza logística en logout | T05/T07/T27 y M03/M04: almacenamiento corrupto recuperable y sin datos de otra cuenta |
| 14 | F21, P2 | M | Frontend | Lazy routes cliente/admin, optimizar logos/fondos, caché coherente y carga diferida de imágenes fuera de pantalla | T32: medir presupuesto inicial, mejorar respecto a 314.38 kB gzip JS y 7.84 MB de logo; sin regresión funcional |

F24 tiene prioridad P2 por su parte de assets/robustez de storage; la validación autoritativa de tarifa y dirección asociada queda cubierta antes por F01/F02/F10, que no pueden diferirse. F26 requiere priorizar cabeceras/logs en el servidor real, sin asumir que la configuración Vite de desarrollo ya se aplica allí.

## Contrato objetivo de checkout

Los nombres siguientes son una propuesta de diseño, **no endpoints existentes verificados**:

1. Cotizar desde backend con carrito autenticado y dirección propia; devolver `quoteId`, `cartVersion`, desglose de importes/moneda, opciones logísticas y `expiresAt`.
2. Solicitar creación de intento con quoteId y opción elegida, usando una clave idempotente estable por intento. Backend revalida y crea PayPal order con el total del servidor; devuelve `attemptId` y `paypalOrderId`.
3. SDK usa ese orderID. Congelar selección mientras hay una operación activa; si cambia carrito/dirección, invalidar cotización/intento de forma explícita.
4. Backend captura/verifica PayPal con la app/entorno esperados, amount/currency/comercio correctos, propiedad y unicidad. No confiar en `shippingCost` ni `shippingCarrier` libres del cliente.
5. Backend devuelve estado y pedido propios; frontend muestra éxito solo en estado confirmado. Para pendiente/timeout, conservar attemptId y consultar el mismo intento; permitir recuperar tras recarga/login.
6. Conciliar respuestas tardías y eventos del proveedor, con deduplicación y registro backend. Definir la política cuando captura ocurre y creación de pedido falla, sin pedir pago adicional al usuario.

La creación y captura desde servidor coincide con la [guía PayPal](https://developer.paypal.com/platforms/checkout/standard/integrate). La integración actual necesita migrar su contrato; no basta deshabilitar un botón o ocultar el precio local.

## Política de sesión y privacidad que debe acordarse

Mantener un solo origen de credenciales activo y no usar un token local antiguo al iniciar sesión temporal. Si se adopta cookie HttpOnly/Secure para refresh, backend y frontend deben resolver conjuntamente CSRF, SameSite y CORS; no es un cambio aislado de React. Si se conserva temporalmente JWT en storage, el cierre de XSS es imprescindible y debe documentarse el riesgo residual.

Separar 401 terminal de fallo de red; 403 representa denegación y necesita un mensaje visible sin bucle de refresh. Renovación en vuelo debe pertenecer a una sesión identificada: logout o cambio de usuario la invalida. Preservar solo referencias de checkout sin datos privados entre login/recarga; nunca datos de tarjeta ni secretos. La UI puede ocultar rutas, pero el backend valida rol, propiedad, estado e importe en cada endpoint.

## Puertas de salida

| Puerta | Evidencia mínima | Estado al auditar |
|---|---|---|
| G1: integridad y seguridad | F01/F02/F03/F05 cerrados; pruebas de XSS, subpago y duplicación | No cumple |
| G2: operación y entorno | Build reproducible, variables comparadas en privado, hosting revisado y sandbox aislado | Parcial: solo build con runner y nombres de variables |
| G3: sesión y privacidad | Pruebas de expiración/multitab y matriz A/B/admin/anónimo | No cumple / pendiente |
| G4: compra y postventa | Casos T01–T22 sin bloqueos, factura/devolución simuladas y recuperación de pagos | Pendiente |
| G5: experiencia y calidad | Lint/tests/audit resueltos, teclado/móvil/navegadores y performance medidos | No cumple / pendiente |
| G6: release autorizado | Configuración revisable, rollback, checklist firmado y aprobación de publicación | No realizado; fuera de alcance de esta auditoría |

No usar el diagnóstico histórico de `faImage` para justificar una corrección actual: ya está resuelto en HEAD local. La disponibilidad requiere comprobar el release actual, no reparar de nuevo el commit antiguo.
