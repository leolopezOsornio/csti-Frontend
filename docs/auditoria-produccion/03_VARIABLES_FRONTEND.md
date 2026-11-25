# Inventario de variables y configuración pública

Fecha: 23/11/2026. Se buscaron `import.meta.env`, acceso a storage, URLs, localhost, sandbox, IDs, contacto y configuración de Vite en `src`, archivos de configuración y plantilla de entorno. Se leyeron solo nombres/presencia de `.env`; no se reproducen sus valores. Railway permite ver nombres, pero devuelve `valuesRedacted: true`.

## Variables que consume el frontend

Son **seis** variables VITE. No hay otras lecturas `import.meta.env` en el código inspeccionado ni un tipo `ImportMetaEnv` propio que las haga obligatorias. Todo valor VITE queda público en el bundle y se sustituye al construir, según [documentación de Vite](https://vite.dev/guide/env-and-mode). Las variables del servicio runtime no modifican un bundle ya creado.

| Nombre | Archivo/línea | Uso | Obligatoria | Valor de ejemplo | Railway | Riesgo |
|---|---|---|---|---|---|---|
| `VITE_API_BASE_URL` | `src/config/appConfig.ts:5`; `.env.Example:5` | baseURL de Axios y enlaces fiscales | Operativamente sí; código acepta ausencia | `https://api.staging.example.invalid` | Nombre presente en csti-Frontend; valor no visible | Al faltar usa silenciosamente la API productiva; revisar HTTPS, origen y ausencia de slash final |
| `VITE_PAYPAL_CLIENT_ID` | `src/pages/Payment/Payment.tsx:252`; `.env.Example:2` | Carga SDK PayPal | Sí para pago; no se valida al build | `<CLIENT_ID_PUBLICO_DE_SANDBOX>` | Nombre presente; entorno/valor no visibles | ID público; no indica por su formato si corresponde a sandbox/live; ausencia rompe checkout |
| `VITE_CONTACT_PHONE` | `src/config/appConfig.ts:6`; `.env.Example:8` | Teléfono mostrado en navegación/footer | No técnicamente; validar comercialmente | `55 0000 0000` | Nombre presente; valor no visible | Fallback hardcodeado puede quedar desactualizado |
| `VITE_CONTACT_PHONE_HREF` | `src/config/appConfig.ts:7`; `.env.Example:9` | Enlace tel | No técnicamente | `+525500000000` | Nombre presente; valor no visible | Puede diferir del teléfono mostrado; falta validación de formato |
| `VITE_CONTACT_EMAIL` | `src/config/appConfig.ts:8`; `.env.Example:10` | Email público y mailto | No técnicamente | `ventas@example.invalid` | Nombre presente; valor no visible | El soporte de devolución rechazado todavía usa literal independiente |
| `VITE_CONTACT_ADDRESS` | `src/config/appConfig.ts:10`; `.env.Example:11` | Dirección pública del negocio | No técnicamente | `Domicilio comercial de ejemplo, CP 00000` | Nombre presente; valor no visible | No debe contener direcciones privadas de clientes; fallback puede ser incorrecto |

La `.env` local tiene las cinco variables de PayPal/contacto con valor no vacío y **no declara VITE_API_BASE_URL**; el código usa el fallback. La plantilla declara las seis. No se compararon valores secretos ni se publicaron IDs reales. `.env` está ignorado por git y no versionado; `.env.Example` sí está versionado.

## Parámetros que no existen en el cliente

No se consumen `VITE_PAYPAL_MODE`, `VITE_ENVIA_MODE`, `VITE_API_URL`, `PAYPAL_SECRET`, claves Facturapi, contraseñas CVA ni credenciales de base de datos. No se encontró PAYPAL_SECRET en el código frontend inspeccionado; esto no es una revisión de todo el historial git. No agregar secretos con prefijo VITE.

Vite usa el parámetro `mode` en `vite.config.ts:13`: solo `mode === 'https'` activa basic SSL. No es un modo de pagos sandbox y `npm run build` no implica por sí mismo credenciales PayPal live. `PORT` no se lee en la app; Railway/servidor estático debe gestionar el puerto. No hay script `start` en package.json.

## Railway y correspondencia con backend

| Servicio | Nombres observados relevantes | Qué se puede confirmar | Pendiente |
|---|---|---|---|
| csti-Frontend / production | Las seis VITE de la tabla | Presencia de nombres al consultar conector | Valores efectivos durante build, URL embebida y procedencia del Client ID |
| Csti / production | `PAYPAL_CLIENT_ID`, `PAYPAL_MODE`, `PAYPAL_SECRET` | Están definidos como nombres backend | Mismo entorno y app que Client ID del frontend; captura y comercio correctos |
| Csti / production | `ENVIA_MODE`, `ENVIA_API_KEY`, `ENVIA_CP_ORIGEN`, `CVA_MOCK_ORDER`, `CVA_API_BASE` y credenciales CVA | Hay configuración de proveedores | Que las pruebas no usen proveedores live y que las cotizaciones sean autoritativas |
| Csti / production | `FACTURAPI_TEST_KEY`, `FACTURAPI_LIVE_KEY` | Ambos nombres existen | Qué clave usa cada operación; nunca ensayar timbrado live |
| Csti / production | `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `ALLOWED_HOSTS`, `DEBUG` | Los nombres existen | Orígenes/valores reales y headers efectivos; no se infieren por su presencia |

La herramienta oculta valores; no hay una confirmación posible del entorno PayPal desde esta evidencia. No se modificó Railway. Verificación posterior: responsable de configuración compara de forma privada app/entorno de ambas credenciales, registra un resultado booleano y el identificador del release; prueba sandbox con cuentas de prueba. No copiar secretos ni tokens a documentación o logs. Mantener separadas claves live/test y artefactos staging/producción.

## Literales y fuentes externas

| Archivo/línea | Literal o recurso | Evaluación |
|---|---|---|
| `src/config/appConfig.ts:1` | `https://csti-production.up.railway.app` | Backend por defecto; riesgo de llamar producción desde pruebas |
| `src/config/appConfig.ts:2` | `http://127.0.0.1:8000` comentado | No activo; ejemplo local, sin proxy Vite |
| `src/services/Api.service.ts:40` | Misma API Railway como fallback de refresh | Duplica configuración; evitar que refresh y API apunten a entornos diferentes |
| `src/config/appConfig.ts:6` | `442 251 05 21` | Teléfono público por defecto |
| `src/config/appConfig.ts:7` | `+524422510521` | Tel del enlace por defecto |
| `src/config/appConfig.ts:8` | `ventas@csti.com.mx` | Email comercial por defecto |
| `src/config/appConfig.ts:11` | Pirineos no. 515 int. 41-J, Parque Industrial Micro Santiago, CP 76120, Santiago de Queretaro, Qro. | Dirección comercial hardcodeada; validar con negocio |
| `src/components/Footer/Footer.tsx:42` | `https://www.facebook.com/csti.qro` | Red social fija |
| `src/components/Footer/Footer.tsx:45` | `https://wa.me/524423793144` | Número diferente al tel de appConfig; confirmar canal correcto |
| `src/pages/Profile/components/OrderDetail/OrderDetail.tsx:222` | `mailto:ventas@csti.com.mx` | No sigue VITE_CONTACT_EMAIL |
| `src/pages/Profile/components/OrderDetail/TrackingTimeline.tsx:36` | DHL, FedEx, Estafeta y búsqueda Google | Enlaces externos con guía/paquetería interpoladas; codificar parámetros y validar origen |
| `index.html:8` | cdnjs animate.css 4.1.1 | Hoja externa sin integrity; dependencia de red y CSP |
| `index.html:9` | cdn-uicons.flaticon.com CSS | Hoja externa sin integrity; revisar privacidad/disponibilidad |
| `src/services/Shipping.service.ts:20`, `:81` | $150, CVA, FedEx Express y guía ficticia | No son variables de entorno; mocks activos en producción si el proveedor falla |
| `src/pages/auth/Login/Login.tsx:18`, `:30` | `/img/descarga.png`, Fondo.png/Fondo2.png/Fondo3.jpeg | Recursos locales grandes, duplicados en otras pantallas de auth |
| `src/components/BrandCard/BrandCard.tsx:28`; `src/components/CategoryGrid/CategoryGrid.tsx:67` | `/img/brand-placeholder.png`, `/img/category-placeholder.png` | No existen en public; también falla el primero en pedidos/detalle |

Las imágenes de productos/marcas/categorías se reciben de API (`imagen`, `imagenes_hd`, `logo_url`, `image_url`); no se obtuvo una muestra real para comprobar dominios, HTTPS o disponibilidad. Facturas navegan hacia backend; guías/evidencias de devolución admiten URLs de la respuesta sin política de orígenes visible. No se deben interpretar todos los enlaces externos como públicos por diseño: firmar/autorizar los documentos privados.

## Almacenamiento de navegador

| Clave | Lugar / evidencia | Alcance y riesgo |
|---|---|---|
| `access_token` | Ambos stores; `Auth.service.ts:10`, `AuthContext.tsx:63`, `Api.service.ts:13` | Accesible a JS, local tiene precedencia; no tratar como secreto protegido contra XSS |
| `refresh_token` | Ambos stores; `Auth.service.ts:11`, `Api.service.ts:34` | Persistencia elegida por Recordarme; sin manejo de rotación retornada |
| `remembered_email` | localStorage; `Auth.service.ts:14`, `Login.tsx:21` | PII conservada tras logout; preferencia debe ser explícita en dispositivo compartido |
| `selectedShippingRate` | localStorage; `Shipping.service.ts:66` | JSON arbitrario sin schema, TTL ni usuario; parseo puede lanzar excepción |
| `selectedAddressId` | localStorage; `CartSummary.tsx:36`, `Payment.tsx:29` | Sin namespace de cuenta ni validación contra dirección vigente; logout no lo elimina |

Ni JWT ni localStorage son fuente de verdad de roles, precios, stock, elegibilidad o permisos. Los objetos del navegador siempre pueden modificarse.
