# Regresiones de seguridad y logística

Ejecutar desde la raíz:

```powershell
npm.cmd test
```

Usar Node 24 (verificado con 24.11.0); el cargador utiliza `node:module.registerHooks`. No necesita instalar dependencias nuevas. Los tests ejecutan el servicio TypeScript real, la revalidación del checkout y componentes React reales mediante `react-dom/server`. API, configuración pública y CSS se reemplazan en el cargador; no se realizan conexiones, compras, facturas o reembolsos.

La suite cubre tarifas offline/vacías/corruptas, direcciones, storage, invalidación de contexto, bloqueo de PayPal, revalidación antes de pago, rastreo sin simulaciones y XSS/URLs del modal. La prueba AST impide reintroducir HTML dinámico en opciones y argumentos posicionales de SweetAlert.

No es una suite E2E de navegador: falta ensayar Payment/SweetAlert con DOM real y el contrato Django/Envia/PayPal en staging aislado. Ver `docs/auditoria-produccion/07_PRIMERA_FASE_CORRECCIONES.md`.

## Fase 2

`billing-download.test.mjs` utiliza Axios real, el adaptador fetch real y los interceptores JWT/refresh reales; reemplaza fetch y las APIs DOM/Object URL, sin red. Comprueba PDF/XML, 401/403/404/502/504, refresh válido/vencido, URLs rechazadas, archivos inválidos, deduplicación, cambio de sesión y liberación de recursos. Los permisos backend se simulan: estas pruebas no certifican CSTI-002.

`shipping-hook.test.mjs` ejecuta el hook real con `hook-harness.mjs`, un scheduler unitario que reproduce dependencias Object.is, actualizaciones y cleanup de efectos. Demuestra estabilidad ante arreglos nuevos equivalentes, invalidación de carrito/dirección y descarte de respuestas tardías. No es React DOM ni una prueba de StrictMode en navegador. La misma prueba de estabilidad reprodujo un bucle usando la copia anterior a la fase 2.

El cargador de fase 1 sigue mockeando Axios en sus tests; solo los tests fiscales optan explícitamente por el cliente real con transporte simulado. Más detalles y contratos pendientes en `docs/auditoria-produccion/09_FASE2_DESCARGA_FISCAL.md`.
