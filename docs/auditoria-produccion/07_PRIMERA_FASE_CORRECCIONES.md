# Primera fase — tarifas, rastreo y XSS

Fecha: 24/11/2026. Rama: `fix/seguridad-envios-preproduccion`; base main `ba824d6`, sin commit. La rama main no se modificó. Se preservaron los seis documentos de auditoría previos (dos actualizados por seguimiento) y el cambio local de package-lock. Sin backend, variables Railway, compras, reembolsos, push, merge o despliegue.

## Cambios

- Shipping.service elimina tarifas y rastreo simulados. getRates/getDefaultRate fallan explícitamente; rechazan respuestas vacías, IDs duplicados/ausentes, estructura incorrecta y precios no finitos/negativos. Aceptan precio numérico o decimal string estricto. Las consultas tienen timeout de 15 segundos y la UI ofrece reintento.
- El storage conserva solo versión, ID preferido, dirección y huella del carrito; nunca se recupera un precio. JSON inválido o storage deshabilitado no lanza a la UI. Un ID manipulado solo puede seleccionar una tarifa de una respuesta nueva y validada.
- useShippingQuote vincula cada resultado a dirección, datos de domicilio, productos, cantidades, precios y total; descarta respuestas tardías de solicitudes anteriores. La cotización tiene una vigencia local máxima de cinco minutos; no sustituye la vigencia del proveedor/backend. Cambios de contexto la invalidan inmediatamente en render. Payment vuelve a leer carrito/direcciones al recuperar foco o cambiar storage; omite esa recarga mientras procesa la ventana PayPal.
- Carrito bloquea Continuar sin tarifa; Payment no monta PayPal sin cotización vigente. Los totales muestran pendiente cuando no hay tarifa, no envío gratuito. Antes de crear la orden, CheckoutShipping vuelve a leer carrito/dirección y cotiza: si precio, proveedor, método, domicilio o carrito cambiaron, bloquea y requiere revisar la nueva cotización. Este paso todavía no crea una cotización firmada ni mueve el cálculo financiero al servidor.
- Rastreo solo muestra campos confirmados de la respuesta normalizada o los datos del pedido previamente recibido del backend. Si el proveedor no responde o el formato es desconocido, indica último estado confirmado o “Rastreo temporalmente no disponible”. No calcula entrega por antigüedad, no genera eventos, no usa guías/transportistas de ejemplo. Estado COMPLETADO no se transforma por sí solo en entrega logística. El detalle del pedido no se oculta porque falle la consulta de devolución.
- Modal admin renderiza ReturnDetailsContent con React dentro de un HTMLElement entregado a SweetAlert y desmonta su raíz al destruir el modal. No hay HTML dinámico imprescindible ni sanitización casera: React escapa los valores y conserva datos, fotos, distribución en columnas y desplazamiento. Rechazo cliente usa el mismo mecanismo seguro. Errores de registro/recuperación/perfil/pago/devoluciones usan text; títulos backend de wishlist/carrito y helpers usan titleText. Esto incluye corregir el segundo argumento posicional de Swal.fire, que se interpreta como HTML.

## Política de URLs

safeMediaUrl admite solo HTTPS sin credenciales ni caracteres de control/espacios. Lista explícita: origen exacto del frontend, origen exacto de appConfig.apiBaseUrl y `https://res.cloudinary.com` exclusivamente bajo `/<cuenta>/image/upload/`. No se admiten comodines, javascript/data/blob/http, otros orígenes ni SVG explícitos. URLs relativas se resuelven contra el backend y se aplica la misma política. Se usan propiedades React, no atributos construidos con cadenas HTML.

Una evidencia bloqueada se reemplaza por un aviso, nunca por un enlace activo. Las guías en vistas de devolución también se limitan a la política; proveedores que devuelvan un origen distinto necesitan una incorporación deliberada después de verificar el contrato real. **Pendiente:** confirmar hosts/cuenta Cloudinary usados realmente; la cuenta CDN no está fijada por falta de esa evidencia. La política no sustituye control de acceso a documentos en backend ni valida el contenido binario servido.

## Archivos funcionales y de pruebas

El [diff por archivo](08_DIFF_PRIMERA_FASE.md) contiene la lista completa y cada cambio. Grupos:

- Servicios: Shipping.service.ts y nuevo CheckoutShipping.service.ts.
- Cotización/UI: nuevo useShippingQuote.ts y ShippingQuoteGate.tsx; Payment.tsx y CartSummary.tsx.
- Rastreo/detalle: TrackingTimeline.tsx y OrderDetail.tsx.
- Modal: ReturnsList.tsx y nuevo ReturnDetailsContent.tsx; nuevos reactAlert.tsx, safeMediaUrl.ts y returnDisplay.ts.
- Otros sinks F03: Register.tsx, RecoverPassword.tsx, MyProfile.tsx, Wishlist.tsx, CartItem.tsx y utils/alerts.ts.
- Ejecución persistente: package.json (solo script test), tests/register.mjs, tests/shipping-security.test.mjs y tests/README.md.
- Documentación: seguimiento en 02_HALLAZGOS_FRONTEND.md y 04_PRUEBAS_FRONTEND.md; este registro y el diff.

No se modificó package-lock.json: SHA256 previo y final `BD64971F0DD3411A7E8A4E63592A2A1D894CDC73AC53F16C38AB6725A310B436`. La incorporación de un script npm no añade dependencias ni necesita regenerarlo.

## Verificación

19/19 pruebas persistentes sin red pasan. TypeScript pasa. Build con `npm.cmd run build -- --configLoader runner` pasa (873 módulos; JS 1,033.82 kB / 314.75 gzip). El build estándar sigue limitado por esbuild/EACCES al leer el directorio padre, como en la auditoría previa. Se utilizó npm.cmd por la ExecutionPolicy de PowerShell, sin cambiarla.

Lint global: 126 errores y 7 advertencias, frente a 141 y 8 al iniciar esta fase. Comparación por archivo/regla/mensaje: cero diagnósticos nuevos. Permanecen any, reglas de hooks y otros errores previos fuera de alcance; no se desactivaron reglas ni se corrigieron otros hallazgos para obtener un resultado verde. Persisten advertencias de bundle grande e import estático/dinámico de SweetAlert. `git diff --check` pasa.

Los tests usan los módulos reales TS/TSX y React SSR, con API/config/CSS mockeados. No montan Payment ni SweetAlert en navegador, no cargan el SDK PayPal y no son una prueba de integración Django. Requieren Node 24 como runtime verificado. El cargador no es parte del bundle de producción.

## Pendientes y riesgos backend

F02/F03/F07 quedan **mitigados localmente, pendientes de integración**, no cerrados para producción. Verificar:

1. Contrato real de tarifas: campos id/title/carrier/price y estimated_days. Respuestas distintas fallan de forma segura y podrían bloquear checkout hasta acordar el contrato.
2. Backend debe recalcular importes, validar stock/dirección/propiedad, ligar cotización vigente a carrito y orden PayPal, y deduplicar captura/pedido. F01/F05 siguen abiertos; JavaScript siempre puede alterarse.
3. Rastreo debe devolver estados y guías auténticos en campos normalizados; un proveedor/backend que devuelva simulaciones no puede distinguirse desde el cliente. Payload live desconocido no se interpreta ni se convierte en eventos.
4. Probar en staging el ciclo real de SweetAlert, URLs reales de evidencias/guías y layout móvil; la prueba SSR verifica escape y ausencia de elementos activos, no apariencia visual.
5. Ensayar checkout sandbox aislado: error/recuperación de cotización, cambio de domicilio/carrito en otra pestaña y durante una ventana PayPal larga (incluida caducidad local). No se acredita conciliación/idempotencia financiera en esta fase.

No se instalaron paquetes, no se ejecutaron APIs comerciales ni se aplicó ningún cambio remoto. El trabajo queda en la rama indicada para revisión local, sin integración automática.
