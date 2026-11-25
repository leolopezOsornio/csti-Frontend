# Diff de fase 2 — frontend

Fecha: 24/11/2026. Rama `fix/seguridad-envios-preproduccion`. Comparación contra el estado local al inicio de fase 2, que ya contenía fase 1 sin commit; no es un diff completo contra main. Las copias anteriores se tomaron antes de editar. No se incluye package-lock, cuyo contenido permanece intacto, ni se repiten cambios de fase 1. El propio archivo de diff se excluye para evitar autorreferencia.

## Archivos

- `src/services/Billing.service.ts`
- `src/services/Api.service.ts`
- `src/pages/Profile/components/Invoices/InvoicesList.tsx`
- `src/pages/Profile/components/OrderDetail/OrderDetail.tsx`
- `src/hooks/useShippingQuote.ts`
- `tests/register.mjs`
- `tests/README.md`
- `src/components/InvoiceDownloads/InvoiceDownloads.tsx`
- `tests/billing-download.test.mjs`
- `tests/hook-harness.mjs`
- `tests/shipping-hook.test.mjs`
- `docs/auditoria-produccion/09_FASE2_DESCARGA_FISCAL.md`

## src/services/Billing.service.ts

```diff
diff --git a/src/services/Billing.service.ts b/src/services/Billing.service.ts
index cb207f6..5e8c534 100644
--- a/src/services/Billing.service.ts
+++ b/src/services/Billing.service.ts
@@ -1,4 +1,5 @@
 import api from './Api.service';
+import { appConfig } from '../config/appConfig';
 
 export interface FiscalData {
   rfc: string;
@@ -19,13 +20,155 @@ export interface Invoice {
   creado_en: string;
 }
 
+export type InvoiceFormat = 'pdf' | 'xml';
+export interface InvoiceDownloadSource {
+  id?: number;
+  orden_id?: number | string;
+  facturapi_id?: string;
+  uuid?: string;
+  pdf_url?: string | null;
+  xml_url?: string | null;
+}
+
+export class InvoiceDownloadError extends Error {
+  readonly status?: number;
+  constructor(message: string, status?: number) {
+    super(message);
+    this.name = 'InvoiceDownloadError';
+    this.status = status;
+  }
+}
+
+const record = (value: unknown): Record<string, unknown> =>
+  value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
+const statusOf = (error: unknown): number | undefined => {
+  const status = record(record(error).response).status;
+  return typeof status === 'number' ? status : undefined;
+};
+
+export function invoiceDownloadMessage(error: unknown): string {
+  if (error instanceof InvoiceDownloadError) return error.message;
+  switch (statusOf(error)) {
+    case 401: return 'Tu sesión venció o no has iniciado sesión. Inicia sesión de nuevo para descargar la factura.';
+    case 403: return 'No tienes permiso para descargar esta factura.';
+    case 404: return 'La factura no está disponible o no pertenece a tu cuenta.';
+    case 502: return 'El proveedor fiscal no está disponible. Intenta descargar la factura más tarde.';
+    case 504: return 'El proveedor fiscal tardó demasiado en responder. Intenta de nuevo más tarde.';
+    default: return 'No se pudo descargar la factura. Revisa tu conexión e intenta de nuevo.';
+  }
+}
+
+export function protectedInvoiceUrl(value: unknown): string {
+  try {
+    if (typeof value !== 'string' || !value || Array.from(value).some(character => character.charCodeAt(0) <= 32)) throw new Error();
+    const backend = new URL(appConfig.apiBaseUrl);
+    const url = new URL(value, backend);
+    if (backend.protocol !== 'https:' || url.protocol !== 'https:' || url.origin !== backend.origin ||
+        url.username || url.password || url.search || url.hash || !url.pathname.startsWith('/api/facturacion/')) throw new Error();
+    return url.href;
+  } catch {
+    throw new InvoiceDownloadError('La factura no tiene un enlace protegido válido del backend. Recarga el historial; no se abrirán enlaces externos.');
+  }
+}
+
+const inFlight = new Map<string, Promise<void>>();
+const mimeTypes: Record<InvoiceFormat, string[]> = { pdf: ['application/pdf'], xml: ['application/xml', 'text/xml'] };
+// Private memory-only namespace: never place this value in URLs, logs or names.
+// Refresh identity remains stable when the access interceptor renews the token.
+const downloadSession = () => localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token') ||
+  localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || 'anonymous';
+
+async function resolveInvoice(source: InvoiceDownloadSource, format: InvoiceFormat): Promise<InvoiceDownloadSource> {
+  if (source[`${format}_url`]) return source;
+  // Historical/order views may only have an order or invoice identifier. Read
+  // current protected URLs from Django; never reuse an old public provider URL.
+  const invoices = await billingService.getInvoices();
+  const invoice = invoices.find(candidate => source.orden_id !== undefined
+    ? String(candidate.orden_id) === String(source.orden_id)
+    : source.id !== undefined ? candidate.id === source.id
+      : !!source.facturapi_id && candidate.facturapi_id === source.facturapi_id);
+  if (!invoice) throw new InvoiceDownloadError('La factura no está disponible o no pertenece a tu cuenta.', 404);
+  return invoice;
+}
+
+async function saveInvoiceBlob(blob: Blob, filename: string): Promise<void> {
+  const url = URL.createObjectURL(blob);
+  let anchor: HTMLAnchorElement | undefined;
+  try {
+    anchor = document.createElement('a');
+    anchor.href = url;
+    anchor.download = filename;
+    anchor.rel = 'noopener';
+    anchor.style.display = 'none';
+    document.body.appendChild(anchor);
+    anchor.click();
+  } finally {
+    try { anchor?.remove(); } finally {
+      // Allow the click to consume the blob before releasing it. The operation
+      // remains in flight until cleanup, including failed DOM/click operations.
+      await new Promise<void>(resolve => setTimeout(() => { URL.revokeObjectURL(url); resolve(); }, 0));
+    }
+  }
+}
+
+function downloadInvoice(source: InvoiceDownloadSource, format: InvoiceFormat): Promise<void> {
+  if (format !== 'pdf' && format !== 'xml') return Promise.reject(new InvoiceDownloadError('Formato de factura no válido.'));
+  let providedUrl: string | undefined;
+  let session: string;
+  try {
+    session = downloadSession();
+    const value = source[`${format}_url`];
+    if (value) providedUrl = protectedInvoiceUrl(value);
+  } catch (error) { return Promise.reject(error); }
+  const identity = source.orden_id !== undefined ? `order:${source.orden_id}` : source.id !== undefined ? `invoice:${source.id}` :
+    source.facturapi_id ? `provider:${source.facturapi_id}` : providedUrl;
+  if (identity === undefined) return Promise.reject(new InvoiceDownloadError('No se pudo identificar la factura. Recarga el historial.'));
+  const key = JSON.stringify([session, identity, format]);
+  const active = inFlight.get(key);
+  if (active) return active;
+  const operation = (async () => {
+    try {
+      const invoice = await resolveInvoice(source, format);
+      const url = protectedInvoiceUrl(invoice[`${format}_url`]);
+      const response = await api.get<Blob>(url, {
+        responseType: 'blob', timeout: 30000, redirectOnAuthFailure: false,
+        headers: { Accept: mimeTypes[format].join(', ') },
+        // XHR follows redirects automatically. The fetch adapter rejects them
+        // instead of following a fiscal/provider URL with an authenticated call.
+        adapter: 'fetch', fetchOptions: { redirect: 'error' },
+      });
+      if (response.status !== 200) throw new InvoiceDownloadError(invoiceDownloadMessage({ response }), response.status);
+      if (downloadSession() !== session) throw new InvoiceDownloadError('La sesión cambió durante la descarga. Vuelve a solicitar la factura.');
+      const mime = String(response.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
+      const blob = response.data;
+      if (!(blob instanceof Blob) || !blob.size || !mimeTypes[format].includes(mime) ||
+          (blob.type && !mimeTypes[format].includes(blob.type.split(';')[0].toLowerCase()))) {
+        throw new InvoiceDownloadError('El servidor no devolvió un archivo fiscal válido. Intenta de nuevo más tarde.');
+      }
+      const prefix = await blob.slice(0, 4096).text();
+      const validContent = format === 'pdf' ? prefix.startsWith('%PDF-') :
+        /^\uFEFF?\s*(?:<\?xml[\s\S]*?\?>\s*)?(?:<!--[\s\S]*?-->\s*)*<(?:[A-Za-z_][\w.-]*:)?Comprobante(?:\s|\/?>)/.test(prefix);
+      if (!validContent) throw new InvoiceDownloadError('El archivo recibido no corresponde a una factura PDF/XML válida.');
+      if (downloadSession() !== session) throw new InvoiceDownloadError('La sesión cambió durante la descarga. Vuelve a solicitar la factura.');
+      // Do not trust Content-Disposition filenames or put credentials in URLs.
+      const name = String(invoice.uuid || invoice.orden_id || invoice.id || 'documento').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64);
+      await saveInvoiceBlob(blob, `factura-${name}.${format}`);
+    } catch (error) {
+      if (error instanceof InvoiceDownloadError) throw error;
+      throw new InvoiceDownloadError(invoiceDownloadMessage(error), statusOf(error));
+    }
+  })().finally(() => inFlight.delete(key));
+  inFlight.set(key, operation);
+  return operation;
+}
+
 export const billingService = {
   getFiscalData: async (): Promise<FiscalData | null> => {
     try {
       const response = await api.get('/api/facturacion/perfil/');
       return response.data;
-    } catch (error: any) {
-      if (error.response && error.response.status === 404) {
+    } catch (error: unknown) {
+      if (statusOf(error) === 404) {
         return null; // El usuario aún no tiene datos fiscales
       }
       throw error;
@@ -38,10 +181,15 @@ export const billingService = {
   },
 
   getInvoices: async (): Promise<Invoice[]> => {
-    const response = await api.get('/api/facturacion/mis-facturas/');
+    const response = await api.get(protectedInvoiceUrl('/api/facturacion/mis-facturas/'), {
+      timeout: 30000, redirectOnAuthFailure: false,
+      adapter: 'fetch', fetchOptions: { redirect: 'error' },
+    });
     return response.data;
   },
 
+  downloadInvoice,
+
   generateInvoice: async (ordenId: number | string): Promise<Invoice> => {
     const response = await api.post(`/api/facturacion/generar/${ordenId}/`);
     return response.data;
```

## src/services/Api.service.ts

```diff
diff --git a/src/services/Api.service.ts b/src/services/Api.service.ts
index dff0d0d..12d16da 100644
--- a/src/services/Api.service.ts
+++ b/src/services/Api.service.ts
@@ -1,6 +1,13 @@
 import axios from 'axios';
 import { appConfig } from '../config/appConfig';
 
+declare module 'axios' {
+  interface AxiosRequestConfig {
+    /** Fiscal downloads surface terminal 401 in the UI instead of navigating. */
+    redirectOnAuthFailure?: boolean;
+  }
+}
+
 const api = axios.create({
   baseURL: appConfig.apiBaseUrl,
   headers: {
@@ -55,7 +62,7 @@ api.interceptors.response.use(
         localStorage.removeItem('refresh_token');
         sessionStorage.removeItem('access_token');
         sessionStorage.removeItem('refresh_token');
-        window.location.href = '/login';
+        if (originalRequest.redirectOnAuthFailure !== false) window.location.href = '/login';
       }
     }
     return Promise.reject(error);
```

## src/pages/Profile/components/Invoices/InvoicesList.tsx

```diff
diff --git a/src/pages/Profile/components/Invoices/InvoicesList.tsx b/src/pages/Profile/components/Invoices/InvoicesList.tsx
index adf4615..54a49b0 100644
--- a/src/pages/Profile/components/Invoices/InvoicesList.tsx
+++ b/src/pages/Profile/components/Invoices/InvoicesList.tsx
@@ -1,14 +1,13 @@
 import { useState, useEffect } from 'react';
-import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
-import { faFilePdf, faFileCode } from '@fortawesome/free-solid-svg-icons';
-import { billingService } from '../../../../services/Billing.service';
+import { billingService, invoiceDownloadMessage } from '../../../../services/Billing.service';
 import type { Invoice } from '../../../../services/Billing.service';
-import { appConfig } from '../../../../config/appConfig';
+import InvoiceDownloads from '../../../../components/InvoiceDownloads/InvoiceDownloads';
 import styles from './InvoicesList.module.css';
 
 const InvoicesList = () => {
   const [invoices, setInvoices] = useState<Invoice[]>([]);
   const [loading, setLoading] = useState(true);
+  const [loadError, setLoadError] = useState<string | null>(null);
   
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 5;
@@ -19,7 +18,7 @@ const InvoicesList = () => {
         const data = await billingService.getInvoices();
         setInvoices(data);
       } catch (error) {
-        console.error("Error al obtener historial de facturas", error);
+        setLoadError(invoiceDownloadMessage(error));
       } finally {
         setLoading(false);
       }
@@ -56,7 +55,7 @@ const InvoicesList = () => {
     <div className={styles.invoicesContainer}>
       <h2>Mis Facturas</h2>
 
-      {invoices.length === 0 ? (
+      {loadError ? <p role="alert">{loadError}</p> : invoices.length === 0 ? (
         <div className={styles.emptyState}>
           <p>Aún no ha generado ninguna factura.</p>
         </div>
@@ -85,16 +84,7 @@ const InvoicesList = () => {
                   </td>
                   <td>
                     <div className={styles.actions}>
-                      {invoice.facturapi_id && (
-                        <a href={`${appConfig.apiBaseUrl}/api/facturacion/descargar/${invoice.facturapi_id}/pdf/`} target="_blank" rel="noopener noreferrer" className={styles.downloadBtn} title="Descargar PDF">
-                          <FontAwesomeIcon icon={faFilePdf} /> PDF
-                        </a>
-                      )}
-                      {invoice.facturapi_id && (
-                        <a href={`${appConfig.apiBaseUrl}/api/facturacion/descargar/${invoice.facturapi_id}/xml/`} target="_blank" rel="noopener noreferrer" className={styles.downloadBtn} title="Descargar XML">
-                          <FontAwesomeIcon icon={faFileCode} /> XML
-                        </a>
-                      )}
+                      <InvoiceDownloads invoice={invoice} className={styles.downloadBtn} />
                     </div>
                   </td>
                 </tr>
```

## src/pages/Profile/components/OrderDetail/OrderDetail.tsx

```diff
diff --git a/src/pages/Profile/components/OrderDetail/OrderDetail.tsx b/src/pages/Profile/components/OrderDetail/OrderDetail.tsx
index 03c0f75..27d049c 100644
--- a/src/pages/Profile/components/OrderDetail/OrderDetail.tsx
+++ b/src/pages/Profile/components/OrderDetail/OrderDetail.tsx
@@ -4,6 +4,7 @@ import { orderService } from '../../../../services/Order.service';
 import type { TrackingData } from '../../../../services/Shipping.service';
 import { shippingService } from '../../../../services/Shipping.service';
 import { billingService } from '../../../../services/Billing.service';
+import InvoiceDownloads from '../../../../components/InvoiceDownloads/InvoiceDownloads';
 import { returnsService } from '../../../../services/Returns.service';
 import type { ReturnRequest } from '../../../../services/Returns.service';
 import ReturnModal from '../Returns/ReturnModal';
@@ -266,9 +267,10 @@ const OrderDetail = () => {
               {renderReturnButton()}
 
               {order.facturada ? (
-                <Link to="/perfil/facturacion/historial" className={styles.btnSuccess}>
-                  ✓ Pedido facturado (Descargar)
-                </Link>
+                <div>
+                  <Link to="/perfil/facturacion/historial" className={styles.btnSuccess}>✓ Pedido facturado (Historial)</Link>
+                  <InvoiceDownloads key={order.id} invoice={{ orden_id: order.id }} className={styles.btnPrimary} />
+                </div>
               ) : (
                 <button
                   onClick={handleGenerateInvoice}
```

## src/hooks/useShippingQuote.ts

```diff
diff --git a/src/hooks/useShippingQuote.ts b/src/hooks/useShippingQuote.ts
index a91e379..923efab 100644
--- a/src/hooks/useShippingQuote.ts
+++ b/src/hooks/useShippingQuote.ts
@@ -1,10 +1,18 @@
-import { useEffect, useState } from 'react';
+import { useEffect, useMemo, useState } from 'react';
 import { isQuoteCurrent, shippingService } from '../services/Shipping.service';
 import type { QuoteContext, ShippingCartItem, ShippingQuote } from '../services/Shipping.service';
 
 export function useShippingQuote(context: QuoteContext, items: ShippingCartItem[], addressVersion: string) {
+  // Depend on quote-relevant values, not a parent's newly allocated array.
+  // Freeze the same snapshot used in the request and its effect identity.
+  const snapshot = JSON.stringify(items.map(item => ({
+    id: item.product?.id ?? item.producto?.id ?? item.id,
+    cantidad: item.cantidad,
+    precio_unitario: String(item.precio_unitario ?? ''),
+  })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
+  const quoteItems = useMemo(() => JSON.parse(snapshot) as ShippingCartItem[], [snapshot]);
   const [attempt, setAttempt] = useState(0);
-  const key = JSON.stringify([context.addressId, context.cartKey, addressVersion, attempt]);
+  const key = JSON.stringify([context.addressId, context.cartKey, addressVersion, snapshot, attempt]);
   const [result, setResult] = useState<{
     key: string; quote: ShippingQuote | null; selectedId: string | null; error: string | null;
   }>({ key: '', quote: null, selectedId: null, error: null });
@@ -14,7 +22,7 @@ export function useShippingQuote(context: QuoteContext, items: ShippingCartItem[
     let expiry: ReturnType<typeof setTimeout>;
     const quoteContext = { addressId: context.addressId, cartKey: context.cartKey };
     const preferredId = shippingService.getSelectedRateId(quoteContext);
-    shippingService.getQuote(quoteContext, items).then(quote => {
+    shippingService.getQuote(quoteContext, quoteItems).then(quote => {
       if (!active) return;
       const preferred = quote.rates.find(rate => rate.id === preferredId);
       const selected = preferred ?? quote.rates.reduce((a, b) => a.price <= b.price ? a : b);
@@ -28,7 +36,7 @@ export function useShippingQuote(context: QuoteContext, items: ShippingCartItem[
         error: context.addressId > 0 ? 'No fue posible obtener una cotización válida. Intenta de nuevo.' : 'Agrega una dirección válida para cotizar el envío.' });
     });
     return () => { active = false; clearTimeout(expiry); };
-  }, [context.addressId, context.cartKey, items, addressVersion, key]);
+  }, [context.addressId, context.cartKey, quoteItems, addressVersion, key]);
 
   const matches = result.key === key;
   const quote = matches && isQuoteCurrent(result.quote, context) ? result.quote : null;
```

## tests/register.mjs

```diff
diff --git a/tests/register.mjs b/tests/register.mjs
index adbf768..b56833c 100644
--- a/tests/register.mjs
+++ b/tests/register.mjs
@@ -6,7 +6,7 @@ import ts from 'typescript';
 // Real TS/TSX + React server renderer; network/config/styles replaced offline.
 registerHooks({
   resolve(specifier, context, nextResolve) {
-    if (/Api\.service$/.test(specifier)) return { url: 'mock:api', shortCircuit: true };
+    if (/Api\.service$/.test(specifier) && !globalThis.__realApiForTests) return { url: 'mock:api', shortCircuit: true };
     if (/appConfig$/.test(specifier)) return { url: 'mock:config', shortCircuit: true };
     if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
       const url = new URL(specifier, context.parentURL);
```

## tests/README.md

```diff
diff --git a/tests/README.md b/tests/README.md
index 3a40721..0c4f782 100644
--- a/tests/README.md
+++ b/tests/README.md
@@ -11,3 +11,11 @@ Usar Node 24 (verificado con 24.11.0); el cargador utiliza `node:module.register
 La suite cubre tarifas offline/vacías/corruptas, direcciones, storage, invalidación de contexto, bloqueo de PayPal, revalidación antes de pago, rastreo sin simulaciones y XSS/URLs del modal. La prueba AST impide reintroducir HTML dinámico en opciones y argumentos posicionales de SweetAlert.
 
 No es una suite E2E de navegador: falta ensayar Payment/SweetAlert con DOM real y el contrato Django/Envia/PayPal en staging aislado. Ver `docs/auditoria-produccion/07_PRIMERA_FASE_CORRECCIONES.md`.
+
+## Fase 2
+
+`billing-download.test.mjs` utiliza Axios real, el adaptador fetch real y los interceptores JWT/refresh reales; reemplaza fetch y las APIs DOM/Object URL, sin red. Comprueba PDF/XML, 401/403/404/502/504, refresh válido/vencido, URLs rechazadas, archivos inválidos, deduplicación, cambio de sesión y liberación de recursos. Los permisos backend se simulan: estas pruebas no certifican CSTI-002.
+
+`shipping-hook.test.mjs` ejecuta el hook real con `hook-harness.mjs`, un scheduler unitario que reproduce dependencias Object.is, actualizaciones y cleanup de efectos. Demuestra estabilidad ante arreglos nuevos equivalentes, invalidación de carrito/dirección y descarte de respuestas tardías. No es React DOM ni una prueba de StrictMode en navegador. La misma prueba de estabilidad reprodujo un bucle usando la copia anterior a la fase 2.
+
+El cargador de fase 1 sigue mockeando Axios en sus tests; solo los tests fiscales optan explícitamente por el cliente real con transporte simulado. Más detalles y contratos pendientes en `docs/auditoria-produccion/09_FASE2_DESCARGA_FISCAL.md`.
```

## src/components/InvoiceDownloads/InvoiceDownloads.tsx

```diff
diff --git a/src/components/InvoiceDownloads/InvoiceDownloads.tsx b/src/components/InvoiceDownloads/InvoiceDownloads.tsx
new file mode 100644
index 0000000..0f1610a
--- /dev/null
+++ b/src/components/InvoiceDownloads/InvoiceDownloads.tsx
@@ -0,0 +1,52 @@
+import { useEffect, useRef, useState } from 'react';
+import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
+import { faFilePdf, faFileCode } from '@fortawesome/free-solid-svg-icons';
+import { billingService, invoiceDownloadMessage, InvoiceDownloadError } from '../../services/Billing.service';
+import type { InvoiceDownloadSource, InvoiceFormat } from '../../services/Billing.service';
+
+export default function InvoiceDownloads({ invoice, className }: {
+  invoice: InvoiceDownloadSource;
+  className?: string;
+}) {
+  const [downloading, setDownloading] = useState<InvoiceFormat | null>(null);
+  const [error, setError] = useState<string | null>(null);
+  const [needsLogin, setNeedsLogin] = useState(false);
+  const active = useRef(false);
+  const mounted = useRef(true);
+  useEffect(() => {
+    mounted.current = true;
+    return () => { mounted.current = false; };
+  }, []);
+
+  const download = async (format: InvoiceFormat) => {
+    if (active.current) return;
+    active.current = true;
+    setError(null);
+    setNeedsLogin(false);
+    setDownloading(format);
+    try { await billingService.downloadInvoice(invoice, format); }
+    catch (failure) {
+      if (mounted.current) {
+        setError(invoiceDownloadMessage(failure));
+        setNeedsLogin(failure instanceof InvoiceDownloadError && failure.status === 401);
+      }
+    }
+    finally {
+      active.current = false;
+      if (mounted.current) setDownloading(null);
+    }
+  };
+
+  return <div aria-busy={downloading !== null}>
+    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
+      {(['pdf', 'xml'] as const).map(format => <button key={format} type="button" className={className}
+        disabled={downloading !== null} onClick={() => { void download(format); }}
+        aria-label={`Descargar factura ${format.toUpperCase()}`}>
+        <FontAwesomeIcon icon={format === 'pdf' ? faFilePdf : faFileCode} /> {format.toUpperCase()}
+      </button>)}
+    </div>
+    {downloading && <p role="status">Descargando {downloading.toUpperCase()}...</p>}
+    {error && <p role="alert">{error}</p>}
+    {needsLogin && <a href="/login">Iniciar sesión de nuevo</a>}
+  </div>;
+}
```

## tests/billing-download.test.mjs

```diff
diff --git a/tests/billing-download.test.mjs b/tests/billing-download.test.mjs
new file mode 100644
index 0000000..67764d9
--- /dev/null
+++ b/tests/billing-download.test.mjs
@@ -0,0 +1,196 @@
+import './register.mjs';
+import test, { beforeEach } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFileSync } from 'node:fs';
+import axios from 'axios';
+import React from 'react';
+import { renderToStaticMarkup } from 'react-dom/server';
+
+// Real Axios, its fetch adapter, and the application's JWT/refresh interceptors.
+// Only fetch and browser download DOM/URL APIs are replaced. No network is used.
+globalThis.__realApiForTests = true;
+let handler, requests, clicks, liveUrls, created, revoked, failClick;
+const fakeFetch = async request => {
+  assert.ok(request instanceof Request);
+  requests.push({ url: request.url, method: request.method,
+    authorization: request.headers.get('authorization'), redirect: request.redirect });
+  return handler(request);
+};
+axios.defaults.adapter = 'fetch';
+axios.defaults.env = { ...axios.defaults.env, fetch: fakeFetch };
+const { billingService, protectedInvoiceUrl, InvoiceDownloadError } = await import('../src/services/Billing.service.ts');
+const { default: api } = await import('../src/services/Api.service.ts');
+const { default: InvoiceDownloads } = await import('../src/components/InvoiceDownloads/InvoiceDownloads.tsx');
+const backend = 'https://api.example.test';
+const invoice = { id: 8, orden_id: 12, facturapi_id: 'provider-id-test', uuid: 'uuid-test',
+  pdf_url: `${backend}/api/facturacion/descargar/invoice-test/pdf/`,
+  xml_url: `${backend}/api/facturacion/descargar/invoice-test/xml/` };
+const pdf = () => new Response('%PDF-1.7\nfixture', { headers: { 'Content-Type': 'application/pdf' } });
+const xml = () => new Response('<?xml version="1.0"?><cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4"/>',
+  { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
+const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
+const storage = () => {
+  const values = new Map();
+  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
+};
+beforeEach(() => {
+  requests = []; clicks = []; liveUrls = new Set(); created = 0; revoked = 0; failClick = false;
+  globalThis.localStorage = storage(); globalThis.sessionStorage = storage();
+  localStorage.setItem('access_token', 'owner-test-token');
+  globalThis.window = { location: { href: '/perfil', origin: 'https://shop.example.test' } };
+  globalThis.document = {
+    body: { appendChild(anchor) { anchor.attached = true; } },
+    createElement(tag) {
+      assert.equal(tag, 'a');
+      return { style: {}, remove() { this.attached = false; }, click() {
+        assert.ok(this.attached);
+        if (failClick) throw Error('click failed');
+        clicks.push({ href: this.href, download: this.download });
+      } };
+    },
+  };
+  URL.createObjectURL = blob => { assert.ok(blob instanceof Blob); const url = `blob:fixture-${++created}`; liveUrls.add(url); return url; };
+  URL.revokeObjectURL = url => { assert.ok(liveUrls.delete(url)); revoked++; };
+  handler = request => request.url.endsWith('/xml/') ? xml() : pdf();
+});
+
+test('Owner downloads PDF/XML through real Axios JWT with safe names and URL cleanup', async () => {
+  await billingService.downloadInvoice(invoice, 'pdf');
+  await billingService.downloadInvoice(invoice, 'xml');
+  assert.equal(requests.length, 2);
+  assert.ok(requests.every(request => request.authorization === 'Bearer owner-test-token'));
+  assert.ok(requests.every(request => request.redirect === 'error' && !new URL(request.url).search));
+  assert.deepEqual(clicks.map(click => click.download), ['factura-uuid-test.pdf', 'factura-uuid-test.xml']);
+  assert.equal(created, 2); assert.equal(revoked, 2); assert.equal(liveUrls.size, 0);
+});
+test('Anonymous 401 surfaces a session message and creates no download', async () => {
+  localStorage.removeItem('access_token');
+  handler = request => { assert.equal(request.headers.get('authorization'), null); return json({ detail: 'unauthorized' }, 401); };
+  await assert.rejects(billingService.downloadInvoice(invoice, 'pdf'), error => error.status === 401 && /sesión/.test(error.message));
+  assert.equal(created, 0); assert.equal(clicks.length, 0);
+});
+for (const [status, message] of [[403, /permiso/], [404, /no pertenece/], [502, /proveedor fiscal no está disponible/], [504, /tardó demasiado/]]) {
+  test(`Fiscal HTTP ${status} produces clear error without an Object URL`, async () => {
+    localStorage.setItem('access_token', 'other-test-token');
+    handler = () => json({ detail: 'synthetic backend denial/provider error' }, status);
+    await assert.rejects(billingService.downloadInvoice(invoice, 'pdf'), error => error instanceof InvoiceDownloadError && error.status === status && message.test(error.message));
+    assert.equal(created, 0);
+  });
+}
+test('Expired access refreshes with real interceptor and retries using new Bearer', async () => {
+  localStorage.setItem('access_token', 'expired-test-token');
+  localStorage.setItem('refresh_token', 'refresh-test-token');
+  handler = request => {
+    if (request.url.endsWith('/token/refresh/')) return json({ access: 'renewed-test-token' });
+    return request.headers.get('authorization') === 'Bearer renewed-test-token' ? pdf() : json({}, 401);
+  };
+  await billingService.downloadInvoice(invoice, 'pdf');
+  assert.equal(requests.length, 3);
+  assert.equal(requests[2].authorization, 'Bearer renewed-test-token');
+  assert.equal(clicks.length, 1); assert.equal(revoked, 1);
+});
+test('Expired refresh clears tokens and reports 401 without forced fiscal navigation', async () => {
+  localStorage.setItem('refresh_token', 'expired-refresh-test-token');
+  handler = () => json({}, 401);
+  await assert.rejects(billingService.downloadInvoice(invoice, 'pdf'), error => error.status === 401 && /Inicia sesión/.test(error.message));
+  assert.equal(localStorage.getItem('access_token'), null);
+  assert.equal(localStorage.getItem('refresh_token'), null);
+  assert.equal(window.location.href, '/perfil'); assert.equal(created, 0);
+});
+test('The default auth redirect for other API consumers remains unchanged', async () => {
+  localStorage.setItem('refresh_token', 'expired-refresh-test-token');
+  handler = () => json({}, 401);
+  await assert.rejects(api.get('/accounts/api/perfil/'));
+  assert.equal(window.location.href, '/login');
+});
+test('External, HTTP, credential, token-query and non-fiscal URLs are rejected before fetch', async () => {
+  for (const url of ['https://facturapi.example.test/document.pdf', 'http://api.example.test/api/facturacion/a',
+    'javascript:alert(1)', '//evil.example.test/pdf/', `${invoice.pdf_url}?token=DO_NOT_SEND`,
+    `${invoice.pdf_url}#fragment`, 'https://u:p@api.example.test/api/facturacion/a',
+    'https://api.example.test.evil.test/api/facturacion/a', `${backend}/accounts/api/perfil/`]) {
+    assert.throws(() => protectedInvoiceUrl(url), InvoiceDownloadError);
+    await assert.rejects(billingService.downloadInvoice({ ...invoice, pdf_url: url }, 'pdf'));
+  }
+  assert.equal(requests.length, 0); assert.equal(created, 0);
+});
+test('Historical/order identifiers obtain current URLs from authenticated metadata, without issuing CFDI', async () => {
+  handler = request => {
+    assert.equal(request.method, 'GET');
+    return request.url.endsWith('/mis-facturas/') ? json([invoice]) : pdf();
+  };
+  await billingService.downloadInvoice({ orden_id: 12 }, 'pdf');
+  assert.equal(requests.length, 2); assert.equal(clicks.length, 1);
+  assert.ok(requests.every(request => request.authorization === 'Bearer owner-test-token'));
+});
+test('Missing historical invoice is a recoverable 404; legacy external URL never opens', async () => {
+  handler = () => json([]);
+  await assert.rejects(billingService.downloadInvoice({ orden_id: 99 }, 'xml'), error => error.status === 404);
+  await assert.rejects(billingService.downloadInvoice({ ...invoice, pdf_url: 'https://old-provider.example.test/a.pdf' }, 'pdf'));
+  assert.equal(created, 0);
+});
+test('Historical invoice/provider identifiers resolve protected PDF and XML from current metadata', async () => {
+  handler = request => request.url.endsWith('/mis-facturas/') ? json([invoice]) : request.url.endsWith('/xml/') ? xml() : pdf();
+  await billingService.downloadInvoice({ id: invoice.id }, 'pdf');
+  await billingService.downloadInvoice({ facturapi_id: invoice.facturapi_id }, 'xml');
+  assert.equal(requests.length, 4); assert.equal(clicks.length, 2); assert.equal(liveUrls.size, 0);
+});
+test('Concurrent history/detail downloads share the same in-flight document request', async () => {
+  let release;
+  const waiting = new Promise(resolve => { release = resolve; });
+  handler = async () => { await waiting; return pdf(); };
+  const first = billingService.downloadInvoice(invoice, 'pdf');
+  const duplicate = billingService.downloadInvoice({ orden_id: invoice.orden_id }, 'pdf');
+  assert.equal(first, duplicate);
+  release(); await Promise.all([first, duplicate]);
+  assert.equal(requests.length, 1); assert.equal(clicks.length, 1); assert.equal(liveUrls.size, 0);
+});
+test('Consecutive downloads and failed clicks release every temporary URL and allow retry', async () => {
+  for (let i = 0; i < 4; i++) { await billingService.downloadInvoice(invoice, 'pdf'); assert.equal(liveUrls.size, 0); }
+  failClick = true;
+  await assert.rejects(billingService.downloadInvoice(invoice, 'pdf'));
+  assert.equal(liveUrls.size, 0);
+  failClick = false; await billingService.downloadInvoice(invoice, 'pdf');
+  assert.equal(created, 6); assert.equal(revoked, 6);
+});
+test('A logout or account change while downloading cannot save the previous session document', async () => {
+  let release;
+  const pending = new Promise(resolve => { release = resolve; });
+  handler = async () => { await pending; return pdf(); };
+  const download = billingService.downloadInvoice(invoice, 'pdf');
+  await new Promise(setImmediate);
+  localStorage.setItem('access_token', 'different-account-test-token');
+  release();
+  await assert.rejects(download, /sesión cambió/);
+  assert.equal(created, 0);
+});
+test('Invalid MIME, JSON/HTML masquerading as invoice, empty and partial bodies cannot download', async () => {
+  for (const response of [json({ error: 'upstream' }), new Response('<html>error</html>', { headers: { 'Content-Type': 'application/pdf' } }),
+    new Response('', { headers: { 'Content-Type': 'application/pdf' } }),
+    new Response('%PDF-partial', { status: 206, headers: { 'Content-Type': 'application/pdf' } })]) {
+    handler = () => response;
+    await assert.rejects(billingService.downloadInvoice(invoice, 'pdf'));
+  }
+  handler = () => new Response('<error/>', { headers: { 'Content-Type': 'text/xml' } });
+  await assert.rejects(billingService.downloadInvoice(invoice, 'xml'));
+  assert.equal(created, 0);
+});
+test('Untrusted names cannot affect extension, path, attributes or execute HTML', async () => {
+  await billingService.downloadInvoice({ ...invoice, uuid: '../../<img onerror="attack()">\nfile.exe' }, 'pdf');
+  assert.match(clicks[0].download, /^factura-[A-Za-z0-9_-]{1,64}\.pdf$/);
+});
+test('Redirect responses never become provider downloads', async () => {
+  handler = request => { assert.equal(request.redirect, 'error'); return new Response(null, { status: 302, headers: { Location: 'https://external.example.test/a.pdf' } }); };
+  await assert.rejects(billingService.downloadInvoice(invoice, 'pdf'));
+  assert.equal(requests.length, 1); assert.equal(created, 0);
+});
+test('History and order detail use the same reusable authenticated download controls', () => {
+  const paths = ['src/pages/Profile/components/Invoices/InvoicesList.tsx', 'src/pages/Profile/components/OrderDetail/OrderDetail.tsx'];
+  for (const path of paths) {
+    const source = readFileSync(path, 'utf8');
+    assert.match(source, /<InvoiceDownloads\b/);
+    assert.doesNotMatch(source, /window\.open|href=\{[^\n]*(pdf_url|xml_url|facturapi_id)/);
+  }
+  const html = renderToStaticMarkup(React.createElement(InvoiceDownloads, { invoice }));
+  assert.match(html, /Descargar factura PDF/); assert.match(html, /Descargar factura XML/);
+  assert.doesNotMatch(html, /<a\b|https:\/\/api/);
+});
```

## tests/hook-harness.mjs

```diff
diff --git a/tests/hook-harness.mjs b/tests/hook-harness.mjs
new file mode 100644
index 0000000..a50031b
--- /dev/null
+++ b/tests/hook-harness.mjs
@@ -0,0 +1,67 @@
+import { readFileSync } from 'node:fs';
+import vm from 'node:vm';
+import ts from 'typescript';
+
+// Unit lifecycle scheduler using public hook semantics (Object.is dependencies,
+// batched state updates, effect cleanup). It executes the real hook source; it
+// is not a browser renderer or a substitute for React DOM/StrictMode E2E tests.
+export function hookHarness(sourcePath, shippingService, isQuoteCurrent) {
+  const slots = [], timers = new Map();
+  let cursor = 0, dirty = false, pending = [], factory, value, timerId = 0;
+  const same = (a, b) => !!a && a.length === b.length && a.every((item, index) => Object.is(item, b[index]));
+  const hooks = {
+    useState(initial) {
+      const index = cursor++;
+      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
+      const set = update => {
+        const next = typeof update === 'function' ? update(slots[index].value) : update;
+        if (!Object.is(next, slots[index].value)) { slots[index].value = next; dirty = true; }
+      };
+      return [slots[index].value, set];
+    },
+    useMemo(create, dependencies) {
+      const index = cursor++;
+      if (!same(slots[index]?.dependencies, dependencies)) slots[index] = { value: create(), dependencies };
+      return slots[index].value;
+    },
+    useEffect(effect, dependencies) {
+      const index = cursor++;
+      if (!same(slots[index]?.dependencies, dependencies)) pending.push(() => {
+        slots[index]?.cleanup?.();
+        slots[index] = { dependencies, cleanup: effect() };
+      });
+    },
+  };
+  const exports = {};
+  const source = ts.transpileModule(readFileSync(sourcePath, 'utf8'), { compilerOptions: {
+    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
+  } }).outputText;
+  vm.runInNewContext(source, { exports,
+    require(name) {
+      if (name === 'react') return hooks;
+      if (name.endsWith('Shipping.service')) return { shippingService, isQuoteCurrent };
+      throw Error(`Unexpected hook dependency: ${name}`);
+    },
+    setTimeout(callback) { const id = ++timerId; timers.set(id, callback); return id; },
+    clearTimeout(id) { timers.delete(id); },
+  });
+  const render = (inputFactory = factory) => {
+    factory = inputFactory; cursor = 0; dirty = false; pending = [];
+    value = exports.useShippingQuote(...factory());
+    for (const commit of pending) commit();
+    return value;
+  };
+  return { render,
+    get value() { return value; },
+    get timerCount() { return timers.size; },
+    async flush(limit = 20) {
+      for (let turn = 0; turn < limit; turn++) {
+        await new Promise(setImmediate);
+        if (!dirty) return value;
+        render();
+      }
+      throw Error('Quotation render loop exceeded 20 updates');
+    },
+    dispose() { for (const slot of slots) slot?.cleanup?.(); },
+  };
+}
```

## tests/shipping-hook.test.mjs

```diff
diff --git a/tests/shipping-hook.test.mjs b/tests/shipping-hook.test.mjs
new file mode 100644
index 0000000..fce2f1b
--- /dev/null
+++ b/tests/shipping-hook.test.mjs
@@ -0,0 +1,93 @@
+import './register.mjs';
+import test from 'node:test';
+import assert from 'node:assert/strict';
+import { hookHarness } from './hook-harness.mjs';
+
+globalThis.__shippingApi = {};
+const { cartQuoteKey, isQuoteCurrent } = await import('../src/services/Shipping.service.ts');
+const hookPath = process.env.CSTI_HOOK_SOURCE || 'src/hooks/useShippingQuote.ts';
+const item = { producto: { id: 7 }, cantidad: 1, precio_unitario: 100 };
+const input = (items = [structuredClone(item)], addressId = 1) => [
+  { addressId, cartKey: cartQuoteKey(items, items.reduce((sum, value) => sum + value.cantidad * value.precio_unitario, 0)) },
+  items, `address-${addressId}`,
+];
+const quoted = (context, id = 'backend-rate') => ({ ...context, expiresAt: Date.now() + 60000,
+  rates: [{ id, title: 'Test', internalProvider: 'Test carrier', price: 10, description: '', days: null, type: 'standard' }] });
+function setup(handler = async context => quoted(context)) {
+  const requests = [], saved = [];
+  const service = {
+    getQuote(context, items) { requests.push({ context, items }); return handler(context, items); },
+    getSelectedRateId() { return null; }, clearSelectedRate() {},
+    saveSelectedRate(rate, context) { saved.push({ rate, context }); },
+  };
+  return { harness: hookHarness(hookPath, service, isQuoteCurrent), requests, saved };
+}
+
+test('stable equivalent items recreated each render never cause a quotation loop', async () => {
+  const { harness, requests } = setup();
+  try {
+    harness.render(() => input());
+    await harness.flush();
+    assert.equal(requests.length, 1);
+    for (let count = 0; count < 10; count++) { harness.render(); await harness.flush(); }
+    assert.equal(requests.length, 1);
+    assert.equal(harness.value.selectedRate.id, 'backend-rate');
+    assert.equal(harness.timerCount, 1);
+  } finally { harness.dispose(); }
+  assert.equal(harness.timerCount, 0);
+});
+test('real cart quantity/price/address changes invalidate immediately and obtain new quotes', async () => {
+  const { harness, requests } = setup();
+  let items = [structuredClone(item)], address = 1;
+  try {
+    harness.render(() => input(structuredClone(items), address)); await harness.flush();
+    items[0].cantidad = 2;
+    harness.render(); assert.equal(harness.value.quote, null); await harness.flush();
+    items[0].precio_unitario = 200;
+    harness.render(); assert.equal(harness.value.quote, null); await harness.flush();
+    address = 2;
+    harness.render(); assert.equal(harness.value.quote, null); await harness.flush();
+    assert.equal(requests.length, 4);
+    assert.equal(requests[1].items[0].cantidad, 2);
+    assert.equal(harness.value.quote.addressId, 2);
+  } finally { harness.dispose(); }
+});
+test('a different cart cannot reuse the previous quote even when caller cartKey is stale', async () => {
+  const { harness, requests } = setup();
+  const context = input()[0]; let items = [structuredClone(item)];
+  try {
+    harness.render(() => [context, structuredClone(items), 'address-1']); await harness.flush();
+    items = [{ ...item, producto: { id: 8 } }];
+    harness.render(); assert.equal(harness.value.quote, null); await harness.flush();
+    assert.equal(requests.length, 2); assert.equal(requests[1].items[0].id, 8);
+  } finally { harness.dispose(); }
+});
+test('late old response cannot overwrite a newer quote or its stored selection', async () => {
+  const pending = [];
+  const { harness, requests, saved } = setup(context => new Promise(resolve => pending.push(() => resolve(quoted(context, `rate-${context.addressId}`)))));
+  let address = 1;
+  try {
+    harness.render(() => input(undefined, address)); await harness.flush();
+    address = 2; harness.render(); await harness.flush();
+    assert.equal(requests.length, 2);
+    pending[1](); await harness.flush();
+    assert.equal(harness.value.selectedRate.id, 'rate-2');
+    pending[0](); await harness.flush();
+    assert.equal(harness.value.selectedRate.id, 'rate-2');
+    assert.equal(saved.length, 1); assert.equal(saved[0].context.addressId, 2);
+  } finally { harness.dispose(); }
+});
+test('error retry performs one new request and reordered equivalent cart stays stable', async () => {
+  let first = true;
+  const { harness, requests } = setup(async context => {
+    if (first) { first = false; throw Error('offline'); }
+    return quoted(context);
+  });
+  const second = { ...item, producto: { id: 8 } }; let reversed = false;
+  try {
+    harness.render(() => input(reversed ? [structuredClone(second), structuredClone(item)] : [structuredClone(item), structuredClone(second)]));
+    await harness.flush(); assert.equal(harness.value.quote, null); assert.ok(harness.value.error);
+    harness.value.retry(); await harness.flush(); assert.ok(harness.value.quote);
+    reversed = true; harness.render(); await harness.flush(); assert.equal(requests.length, 2);
+  } finally { harness.dispose(); }
+});
```

## docs/auditoria-produccion/09_FASE2_DESCARGA_FISCAL.md

```diff
diff --git a/docs/auditoria-produccion/09_FASE2_DESCARGA_FISCAL.md b/docs/auditoria-produccion/09_FASE2_DESCARGA_FISCAL.md
new file mode 100644
index 0000000..f14c24b
--- /dev/null
+++ b/docs/auditoria-produccion/09_FASE2_DESCARGA_FISCAL.md
@@ -0,0 +1,101 @@
+# Fase 2 — descarga fiscal con JWT e integración pendiente
+
+Fecha: 24/11/2026, America/Mexico_City. Rama `fix/seguridad-envios-preproduccion`, HEAD base `ba824d6`, cambios locales sin commit. Esta fase parte del estado de fase 1, no de main limpio. El [diff de fase 2](10_DIFF_FASE2_FRONTEND.md) compara contra copias tomadas antes de estos cambios y excluye el trabajo anterior.
+
+**Estado: implementación y pruebas locales completadas; integración con el backend CSTI-002 pendiente.** La corrección backend fue informada en la solicitud; no se descargaron facturas reales para verificarla. No hubo emisión de CFDI, pagos, reembolsos, cambios backend/Railway, commit, push, merge ni despliegue.
+
+## Descarga implementada
+
+`billingService.downloadInvoice(source, 'pdf' | 'xml')` es el único método que obtiene bytes y dispara la descarga. Historial y detalle de pedido usan el mismo componente `InvoiceDownloads`, con bloqueo inmediato de clics concurrentes, botones deshabilitados, estado “Descargando”, errores accesibles y opción de iniciar sesión ante 401 terminal.
+
+Flujo:
+
+1. Usar `pdf_url`/`xml_url` devueltos por Django. Si la vista solo conoce `orden_id`, `id` o `facturapi_id`, consultar el historial autenticado y resolver la factura correspondiente. No se construye una URL pública de Facturapi ni se emite una factura para descargarla.
+2. Validar URL HTTPS contra **el origen exacto de `appConfig.apiBaseUrl`**, incluyendo puerto. Se admiten rutas relativas resueltas contra ese backend, bajo `/api/facturacion/`. Se rechazan orígenes externos, HTTP, credenciales en URL, espacios/controles, query strings y fragmentos. No se agrega JWT a ningún enlace o nombre.
+3. Hacer GET mediante la instancia Axios existente y sus interceptores JWT, con `responseType: 'blob'`, Accept PDF/XML y timeout de 30 segundos. Usar el adaptador fetch con `redirect: 'error'`: una redirección no se convierte en una petición autenticada al proveedor. La consulta de metadatos fiscales usa también HTTPS validado, timeout y rechazo de redirecciones.
+4. Exigir HTTP 200, Blob no vacío y MIME compatible tanto en respuesta como en Blob: PDF `application/pdf`; XML `application/xml` o `text/xml`, con parámetros charset permitidos. Rechazar 204/206, JSON/HTML y contenido que no tenga cabecera `%PDF-` o raíz XML `Comprobante` en el prefijo inspeccionado. Esto no valida XSD, timbrado ni autenticidad fiscal.
+5. Generar nombre fijo `factura-<identificador saneado>.pdf/xml`; ignorar nombres de Content-Disposition. Crear Object URL, insertar un enlace temporal de descarga, pulsarlo y quitarlo. Revocar el Object URL en el siguiente turno de eventos, también si falla el clic o el DOM. La promesa permanece activa hasta esa limpieza.
+6. Deduplicar por sesión, identificador y formato. Historial/detalle de la misma orden comparten una operación PDF en vuelo; PDF y XML son documentos distintos. El namespace de sesión solo existe en memoria y nunca se registra ni se añade a URLs. Un cambio de cuenta/logout antes de guardar el archivo descarta la respuesta anterior.
+
+Los mensajes distinguen 401 (iniciar sesión), 403 (sin permiso), 404 (no disponible o ajeno), 502 (proveedor no disponible), 504 (proveedor lento), archivo inválido y fallo de conexión. No se muestran cuerpos de error del proveedor ni objetos Axios que puedan contener Authorization.
+
+## Compatibilidad y alcance de autenticación
+
+- Historial conserva paginación/fechas/estado y muestra botones PDF/XML en lugar de enlaces de navegación. Un fallo de carga se distingue de historial vacío.
+- Detalle conserva acceso al historial y añade los mismos controles de descarga cuando `order.facturada` es verdadero. Resuelve metadatos por orden; el flujo de generar factura no se modificó ni se ejecutó.
+- Facturas históricas se descargan usando los enlaces protegidos actuales. Si solo se dispone de identificadores, se consultan los metadatos actuales. Una URL externa antigua no se considera pública ni se abre como fallback: se pide recargar el historial para recibir la URL protegida corregida. Si Django todavía devuelve la URL externa, la descarga falla de forma segura hasta corregir el contrato.
+- Se añadió `redirectOnAuthFailure?: boolean` al cliente Axios. Las operaciones fiscales lo ponen en false para mostrar el 401 terminal después del intento normal de refresh. La limpieza de tokens existente sigue ocurriendo si falla refresh; una navegación normal a `/login` permite reinicializar la sesión. El valor predeterminado para los demás consumidores no cambia, comprobado con un test del interceptor real.
+- No se reescribieron la cola/rotación de refresh ni AuthContext. Los riesgos generales de sesión F08/F09/F10 permanecen fuera de esta fase. No se cambió Payment, PayPal, el cálculo financiero ni la verificación/captura.
+
+La inspección de `src` encontró consumidores fiscales en historial/detalle y los tipos del servicio. Tras el cambio no hay enlaces a `pdf_url`, `xml_url` o URLs construidas con `facturapi_id`, ni `window.open()` para facturas. Solo el enlace **blob temporal** navega a los bytes ya obtenidos con JWT.
+
+## Revisión de useShippingQuote
+
+Se confirmó el problema de referencia: el efecto dependía directamente de `items`. En un consumidor que recrea un arreglo equivalente durante cada render, la respuesta ejecuta setResult, vuelve a renderizar, cambia la referencia y vuelve a cotizar. La prueba con la copia original alcanzó el límite de 20 actualizaciones y falló por bucle. No se atribuye ese escenario a una sesión de navegador observada.
+
+La corrección crea una representación canónica de los datos usados por cotización: ID de producto, cantidad y precio unitario, ordenada para que el orden del arreglo no importe. `useMemo` conserva el snapshot mientras esos datos no cambien. El efecto y la petición usan el mismo snapshot; su identidad también forma parte de la clave del resultado, además de dirección, huella del carrito, versión del domicilio y reintento.
+
+Se conserva la invalidación inmediata y el cleanup con `active=false` de fase 1. Una respuesta anterior no puede reemplazar estado ni preferencia guardada de la solicitud nueva. No se cambió Shipping.service ni se reintrodujeron tarifas, guías o eventos ficticios.
+
+## Archivos de esta fase
+
+| Archivo | Cambio |
+|---|---|
+| `src/services/Billing.service.ts` | Descarga única, URLs, Blob/MIME/contenido, errores, deduplicación y limpieza |
+| `src/services/Api.service.ts` | Opción optativa para no navegar automáticamente en error de refresh fiscal |
+| `src/components/InvoiceDownloads/InvoiceDownloads.tsx` (nuevo) | Controles compartidos, carga, bloqueo y error |
+| `src/pages/Profile/components/Invoices/InvoicesList.tsx` | Sustituir enlaces por controles autenticados y mostrar errores de carga |
+| `src/pages/Profile/components/OrderDetail/OrderDetail.tsx` | Descargas por orden mediante el mismo componente; conservar resto de fase 1 |
+| `src/hooks/useShippingQuote.ts` | Identidad estable basada en datos, no en referencias de items |
+| `tests/register.mjs` | Optar por Api.service real en las pruebas fiscales; mocks originales conservados para fase 1 |
+| `tests/billing-download.test.mjs` (nuevo) | 20 pruebas fiscales sin red |
+| `tests/hook-harness.mjs` (nuevo) | Scheduler de ciclo de hooks para pruebas unitarias |
+| `tests/shipping-hook.test.mjs` (nuevo) | Cinco regresiones de estabilidad, invalidación y carreras |
+| `tests/README.md` | Instrucciones y límites de las pruebas nuevas |
+| `docs/auditoria-produccion/09_FASE2_DESCARGA_FISCAL.md` y `10_DIFF_FASE2_FRONTEND.md` | Este informe y los diffs relativos a fase 1 |
+
+No se añadieron dependencias ni se cambió package.json en esta fase. El script test agregado en fase 1 descubre los nuevos archivos. SHA256 de package-lock antes/después: `BD64971F0DD3411A7E8A4E63592A2A1D894CDC73AC53F16C38AB6725A310B436`. Sus cambios previos respecto a git se preservan íntegros; que aparezca como modificado en git status no es un cambio de esta fase.
+
+## Pruebas ejecutadas y resultados
+
+Entorno: Node 24.11.0, npm 11.6.1 y dependencias previamente instaladas.
+
+| Comprobación | Resultado observado |
+|---|---|
+| `npm.cmd test` final | **44 pruebas, 44 pasan, 0 fallos**: 19 conservadas de fase 1 + 20 fiscales + 5 del hook |
+| `node_modules/.bin/tsc.cmd -b` | Pasa |
+| `npm.cmd run build` | Una ejecución pasó; otra posterior falló por esbuild/EACCES al leer el directorio padre y resolver vite.config.ts. Limitación ya observada en fase 1, no un error TypeScript |
+| `npm.cmd run build -- --configLoader runner` final | Pasa; JS principal 1,038.79 kB / 316.89 kB gzip, CSS 118.18 kB / 22.51 kB gzip |
+| `npm.cmd run lint` | Falla: 125 errores/7 advertencias frente a 126/7 al iniciar la fase |
+| Comparación ESLint por archivo/regla/mensaje | Cero diagnósticos nuevos; se eliminó el any del catch fiscal modificado. No se desactivaron reglas |
+| `git diff --check` | Pasa; avisos LF/CRLF de git no son errores de whitespace |
+| Prueba de estabilidad con hook anterior | Fallo esperado: bucle superior a 20 actualizaciones. La misma prueba con el hook corregido pasa y realiza una sola cotización |
+
+El build mantiene advertencias heredadas de chunk >500 kB e importación estática/dinámica de SweetAlert. No se intentó arreglar el resto del lint ni los otros hallazgos de auditoría.
+
+### Evidencia fiscal y del hook
+
+Las pruebas fiscales usan **Axios real, su adaptador fetch real y los interceptores request/refresh reales**; fetch se sustituye por respuestas sintéticas. No se accede a backend, Facturapi ni otros proveedores. DOM y APIs de Object URL se sustituyen por spies; React SSR verifica los controles. Cubren:
+
+- Propietario sintético recibe PDF y XML con Bearer en header; no hay JWT en query ni nombre de archivo.
+- Anónimo recibe 401; otro usuario recibe 404; 403/502/504 muestran mensajes específicos y no crean descargas.
+- Access vencido renueva y repite con token nuevo; refresh vencido limpia tokens y permite mostrar error. El redirect por defecto de otras APIs permanece igual.
+- Históricos por orden, ID o identificador de proveedor resuelven enlaces protegidos actuales. URLs externas y redirecciones no se usan como fallback.
+- Peticiones concurrentes comparten la operación; descargas consecutivas y clic fallido revocan todos los Object URLs; cambio de sesión no guarda la respuesta vieja.
+- MIME/cuerpo inválidos, contenido parcial, archivos vacíos y nombres maliciosos no se aceptan como descarga válida.
+- Historial y detalle usan el mismo componente y este invoca el método único; no quedan enlaces directos a los documentos.
+
+Las cinco pruebas del hook ejecutan su **código real** con un scheduler unitario que modela Object.is, actualizaciones batched y cleanup de efectos: arreglos equivalentes recreados diez veces no añaden peticiones; cambios de cantidad/precio/dirección sí invalidan; otro carrito no reutiliza tarifa aunque el caller conserve una huella vieja; una respuesta tardía no sustituye la nueva; reintento y reordenamiento se comportan correctamente. No es React DOM ni una prueba visual de StrictMode.
+
+## Contratos pendientes y riesgos de integración
+
+**No se declara cerrado F13/CSTI-002 de extremo a extremo.** Antes de producción, usar usuarios/documentos sintéticos ya existentes en staging con el backend corregido, sin emitir CFDI:
+
+1. Confirmar que historial devuelve un arreglo con `id`, `orden_id`, `facturapi_id`, `uuid`, `pdf_url` y `xml_url`, y que **todas las facturas históricas** tienen URLs protegidas actuales dentro del origen HTTPS configurado y del namespace `/api/facturacion/`, sin query ni fragmento. El detalle resuelve por el mismo orden_id.
+2. Confirmar GET directo **sin redirecciones** a proveedor/login: 200 con bytes PDF/XML, Content-Type correcto y XML UTF-8 con raíz Comprobante. Un endpoint que responda JSON con enlace, application/octet-stream o 302 falla deliberadamente. La inspección de contenido no certifica autenticidad fiscal.
+3. Validar realmente permisos de propietario, usuario ajeno y administrador autorizado; anónimo/401, denegación 403/404 según backend y ausencia de bytes privados en esos errores. Los códigos de los mocks no demuestran autorización Django.
+4. Comprobar CORS del origen frontend y aceptación del header Authorization en descargas. No se necesitan secretos ni tokens en URL. Content-Disposition no se usa, así que el nombre no depende de exponer ese header.
+5. Ensayar descarga y revocación con navegador real (incluido móvil), estados de carga/error, clic repetido, sesión vencida/cambio de usuario y proveedor 502/504. Los spies de DOM no prueban que todos los navegadores guarden el archivo igual.
+6. Confirmar el comportamiento conjunto con las limitaciones heredadas de refresh concurrente/rotación/multitab. El flag fiscal no arregla la gestión global de sesión, y los contratos financieros F01/F05 siguen fuera de esta fase.
+
+Las correcciones de tarifas, rastreo y XSS de fase 1 permanecen; sus 19 pruebas siguen pasando. El trabajo queda únicamente como cambios locales revisables en la rama solicitada, sin integración ni publicación automática.
```

