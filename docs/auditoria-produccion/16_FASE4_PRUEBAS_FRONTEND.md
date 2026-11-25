# Fase 4 — evidencia frontend

2026-11-24. Node 24.11.0 y dependencias previamente instaladas.

| Comprobación | Resultado |
| --- | --- |
| node --test integration/checkout-http.test.mjs | **12 pasan, 0 fallan, 0 omitidas** |
| npm.cmd test, red real bloqueada | **74 pasan, 0 fallan** |
| TypeScript --noEmit | Exit 0 |
| ESLint de Checkout.service, CheckoutSession y Payment | Exit 0 |
| Build aislado TypeScript -b + Vite | Exit 0, .env deshabilitado; warning de chunk grande |
| Lint global | Deuda previa: 120 errores y 7 advertencias; exit 1 |

El guard de integración sólo admite HTTPS a 127.0.0.1:58080; no se conectó Railway.
Se confió un certificado local de un día exclusivamente en el proceso Node.
Backend real/PostgreSQL real; los proveedores se simulan detrás de Django.

## Doce casos HTTP ejecutados

1. Preflight CORS con Authorization, JSON e Idempotency-Key; origen ajeno rechazado.
2. Carrito/dirección, quote/tarifa, doble clic, PayPal simulado, captura única,
   Orden/outbox, consulta desde Order.service y descargas PDF/XML JWT sintéticas.
3. JWT anónimo 401, quote expirada 409, campos monetarios extra 400 y legacy 410.
4. Captura PENDING 202, cancelación ambigua 409, recarga y conciliación sin otro POST.
5. Error inyectado al persistir outbox: rollback real de la transacción PostgreSQL;
   GET posterior reconstruye una sola venta.
6. Aborto de fetch real tras enviar captura; se conserva referencia y recupera.
7. pg_terminate_backend sobre la conexión del worker sintético tras aceptar captura:
   marcador sobrevive; la recuperación crea una orden/outbox y no otro cobro.
8. Logout borra storage; otra cuenta no ve el intento; el dueño lo descubre y
   concilia con CHECKOUT_ENABLED=False.
9. Cambio de cuenta después de aceptación simulada y antes de respuesta: la cuenta
   nueva no recibe éxito ni acceso al intento; la original recupera su pedido.
10. CHECKOUT_DISABLED sigue bloqueando PayPal después de GET; cancelar sigue útil.
11. Fallo de localStorage antes de crear intento: cero intentos/órdenes en la DB.
12. Registro de transporte confirma respuestas reales 200/201/202/409/410/503.

No se acredita DOM ni popup PayPal de navegador. Las APIs browser de descarga y
storage se simulan, pero bytes, JWT y respuestas provienen de Django HTTPS real.
Los 74 tests anteriores no se borraron ni modificaron. Billing/InvoiceDownloads
conservan sus bytes; se corrigió negociación MIME en Django.

No cambian package.json ni package-lock.json. SHA256 lock antes/después:

```text
BD64971F0DD3411A7E8A4E63592A2A1D894CDC73AC53F16C38AB6725A310B436
```

Logs locales en Csti/venv/phase4-work ignorado; resultados PostgreSQL y diagnóstico
del deadlock en los reportes backend. No se guardan tokens/clave TLS/.env en los
entregables. Los diffs se comparan contra fotografías de inicio de fase 4 para
preservar los cambios locales anteriores.
