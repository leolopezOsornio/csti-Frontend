# Checklist para autorizar producción

Fecha: 23/11/2026. **Estado: NO APROBADO.** Casilla sin marcar significa incumplido o sin evidencia suficiente; el texto especifica cuál. No se desplegó ni se autoriza despliegue por completar esta lista. Referencias: [diagnóstico](01_DIAGNOSTICO_FRONTEND.md), [hallazgos](02_HALLAZGOS_FRONTEND.md), [variables](03_VARIABLES_FRONTEND.md), [pruebas](04_PRUEBAS_FRONTEND.md), [plan](05_PLAN_CORRECCIONES_FRONTEND.md).

## Evidencia disponible

- [x] Repositorio y rama identificados: leolopezOsornio/csti-Frontend, main, SHA ba824d6.
- [x] Cambio previo de package-lock identificado y preservado.
- [x] TypeScript y empaquetado completan localmente con configLoader runner; build estándar limitado por permisos locales.
- [x] Lint ejecutado y resultado documentado: 141 errores, 8 advertencias.
- [x] Doce escenarios de mocks ejecutados sin red ni efectos financieros.
- [x] Las seis variables VITE usadas por el código están inventariadas; sus nombres existen en Railway.
- [x] Rutas privadas y admin tienen guards en el árbol del router; no se identificó una ruta admin declarada fuera del guard.
- [x] PayPalScriptProvider está localizado y orden/SDK declaran MXN.
- [x] No se encontró PAYPAL_SECRET en el frontend inspeccionado; valores reales omitidos de la documentación.
- [x] Railway consultado en lectura; no se modificaron variables ni se aplicaron patches staged.
- [x] No hubo pagos, CFDI, reembolsos, compras, commits, push ni despliegues.

Estas casillas acreditan acciones de auditoría, no que el producto haya superado las pruebas funcionales.

## Bloqueos P0

- [ ] F01: importe final, stock, promoción, MXN, dirección y envío determinados/revalidados por backend; manipulación de navegador ensayada.
- [ ] F02: eliminar tarifa mock del camino real; cotización vacía/fallida bloquea checkout de forma recuperable.
- [ ] F03: retirar interpolación no segura de HTML en admin/cliente/errores; entradas adversarias probadas en entorno aislado.
- [ ] F04: acreditar servicio activo y artefacto de release servido; historial actual contiene despliegues retirados/fallido y HTTP no se pudo comprobar.
- [ ] F05: unicidad e idempotencia de orden/captura/pedido verificadas; timeout y recarga reconcilian el mismo intento.

## Autenticación y autorización

- [ ] Un solo almacén activo al cambiar Recordarme; ningún token de otra cuenta tiene precedencia.
- [ ] Una renovación compartida por sesión; refresh rotado conservado y 401 definitivo invalida sesión.
- [ ] Offline/timeout de perfil o refresh no se confunde con credenciales vencidas.
- [ ] Login solo anuncia éxito si perfil y sesión quedan establecidos.
- [ ] Logout entre pestañas y logout durante refresh no reviven sesión ni conservan datos anteriores.
- [ ] Rutas admin esperan isLoading y preservan destino tras login.
- [ ] Backend probado con anónimo/cliente/admin y rol manipulado en navegador; controles React no sustituyen autorización.
- [ ] Propiedad por objeto comprobada al cambiar IDs de pedido, dirección, factura, devolución y usuario.
- [ ] Recuperación/verificación usan códigos de un uso, límites de reenvío e intentos y caducidad en backend.
- [ ] Política de remembered_email y persistencia revisada para dispositivos compartidos.

## Catálogo, carrito y checkout

- [ ] Misma fuente de precio normal/promoción/moneda en home, listado, detalle, carrito y pago.
- [ ] Inventario multialmacén y cantidad máxima definidos y revalidados por servidor; agotados no comprables.
- [ ] Catálogo soporta CVA parcial/error; imágenes reales verificadas y placeholders locales existentes.
- [ ] Mutaciones de carrito bloqueadas mientras están en vuelo y resultado final no depende del orden de respuestas.
- [ ] API offline/500 se distingue de carrito/historial/lista vacíos con acción de reintento.
- [ ] Cambio de dirección invalida cotización; el usuario ve y confirma domicilio/tarifa vigentes.
- [ ] Storage corrupto/obsoleto se recupera; selección ligada a cuenta y versión de carrito, con caducidad.
- [ ] PayPal SDK tiene estados de carga/fallo y onCancel; no presenta éxito ante pendiente/rechazo/respuesta inválida.
- [ ] Importe visible coincide exactamente con quote y orden backend; no se hace contabilidad con float del cliente.
- [ ] Checkout recuperable tras expiración de sesión, popup cerrado, callback duplicado y recarga.
- [ ] Historial obtiene el pedido persistido de la API después de cada recarga.

## Configuración PayPal y proveedores

- [ ] Responsable compara privadamente Client ID de build, app/comercio backend y PAYPAL_MODE; correspondencia no confirmada por el conector.
- [ ] Sandbox PayPal aislado ensayado con cuentas sintéticas; ninguna prueba utiliza credenciales live.
- [ ] Captura, importe, moneda y destinatario de pago validados por backend; no basta un orderID recibido del cliente.
- [ ] Entornos CVA/Envia/Facturapi identificados; guías/timbrados/reembolsos de prueba se simulan.
- [ ] No existe ninguna clave secreta en variables VITE, bundle, logs o documentos.

## Pedidos, fiscal y devoluciones

- [ ] Rastreo refleja exclusivamente eventos backend y distingue estimación; sin guía/firma/entrega inventadas.
- [ ] RFC/CP/régimen/uso CFDI y elegibilidad para facturar validados también en servidor.
- [ ] Unicidad por pedido en factura simulada; errores fiscales no se confunden indiscriminadamente con 404 de datos faltantes.
- [ ] PDF/XML descargan por mecanismo autenticado o firma corta; B/anónimo y URLs vencidas rechazados.
- [ ] Guías y evidencias privadas protegidas; URLs permiten solo protocolos/orígenes aprobados.
- [ ] Política de 15 días define fecha inicial, zona horaria y límites; backend entrega elegibilidad autoritativa.
- [ ] Fotos tienen límites de bytes/tipo/contenido; cinco archivos no implica aceptar cualquier tamaño o MIME.
- [ ] Modal no se puede reabrir/enviar en paralelo; direcciones y solicitudes no se duplican.
- [ ] Transiciones admin validan rol/estado y son atómicas, incluso con dos administradores.
- [ ] Reembolso se declara completado solo con confirmación financiera; fallos/timeout concilian sin duplicar.
- [ ] Alcance administrativo de productos/marcas definido: esas pantallas actualmente no existen.

## Experiencia y calidad

- [ ] Compra y devolución completadas solo con teclado; envío/filtros usan controles semánticos.
- [ ] Modales con role/aria, foco inicial/restauración, Escape y bloqueo de fondo adecuados.
- [ ] Labels y errores asociados; loading y cambios de pago anunciados a lectores.
- [ ] Contraste medido, zoom 200%, móvil 320/375/768 y desktop 1440 sin bloqueos.
- [ ] Chrome, Firefox y WebKit ensayados; PayPal popup funciona con políticas reales del hosting.
- [ ] Sin errores globales no capturados; logging redactado y manejo de fallos de render.
- [ ] JS inicial dividido y presupuesto acordado; optimizados logo de 7.84 MB y fondos grandes.
- [ ] Node compatible fijado y README corregido; lock definitivo instalado con npm ci en CI.
- [ ] Build estándar del release, lint y suite de regresión críticos aprobados; no conformarse con build local alternativo.
- [ ] npm audit ejecutado con acceso al registro y vulnerabilidades evaluadas; aquí quedó bloqueado.

## Railway y liberación futura

- [ ] Root directory efectivo, build command y start command efectivos registrados; ausencia de override no demuestra su autodetección correcta.
- [ ] Servidor estático sirve dist por PORT; fallback devuelve index para rutas React y no oculta assets inexistentes.
- [ ] Dominio HTTPS responde y certificado se valida; administración TLS de Railway no equivale a prueba HTTP exitosa.
- [ ] VITE_API_BASE_URL correcta incorporada en build y backend accesible por HTTPS; CORS permite solo orígenes previstos.
- [ ] Headers de producción comprobados en red: CSP compatible PayPal/CDN, nosniff, política de referrer y protección de framing; revisar HSTS según dominio.
- [ ] Healthcheck y reinicio comprobados; métricas, logs, alertas y capacidad definidos para tráfico esperado.
- [ ] Se revisó por qué despliegues recientes están REMOVED; no reutilizar diagnóstico histórico como estado actual.
- [ ] Checks previos de CI obligatorios y política de publicación acordada; Railway reporta checkSuites false.
- [ ] Patch staged previo del backend revisado por su responsable; auditoría no lo aplica.
- [ ] Rollback documentado y ensayado; versión frontend/backend compatible y trazable.
- [ ] Cierre de hallazgos P0/P1 respaldado por pruebas y aprobación explícita de release fuera de esta auditoría.

## Registro de autorización futura

Completar después de corregir y probar: SHA de frontend/backend, lock aprobado, identificador de artefacto/build, entorno PayPal comprobado (sin credenciales), resultados T01–T32, excepciones aceptadas con responsable y fecha, rollback y persona que autoriza. La auditoría actual no constituye esa autorización.
