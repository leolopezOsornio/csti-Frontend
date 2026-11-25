import api from './Api.service';
import { appConfig } from '../config/appConfig';

export interface FiscalData {
  rfc: string;
  razon_social: string;
  codigo_postal: string;
  regimen_fiscal: string;
  uso_cfdi: string;
}

export interface Invoice {
  id: number;
  orden_id: number;
  facturapi_id: string;
  uuid: string;
  pdf_url: string;
  xml_url: string;
  status: string;
  creado_en: string;
}

export type InvoiceFormat = 'pdf' | 'xml';
export interface InvoiceDownloadSource {
  id?: number;
  orden_id?: number | string;
  facturapi_id?: string;
  uuid?: string;
  pdf_url?: string | null;
  xml_url?: string | null;
}

export class InvoiceDownloadError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'InvoiceDownloadError';
    this.status = status;
  }
}

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
const statusOf = (error: unknown): number | undefined => {
  const status = record(record(error).response).status;
  return typeof status === 'number' ? status : undefined;
};

export function invoiceDownloadMessage(error: unknown): string {
  if (error instanceof InvoiceDownloadError) return error.message;
  switch (statusOf(error)) {
    case 401: return 'Tu sesión venció o no has iniciado sesión. Inicia sesión de nuevo para descargar la factura.';
    case 403: return 'No tienes permiso para descargar esta factura.';
    case 404: return 'La factura no está disponible o no pertenece a tu cuenta.';
    case 502: return 'El proveedor fiscal no está disponible. Intenta descargar la factura más tarde.';
    case 504: return 'El proveedor fiscal tardó demasiado en responder. Intenta de nuevo más tarde.';
    default: return 'No se pudo descargar la factura. Revisa tu conexión e intenta de nuevo.';
  }
}

export function protectedInvoiceUrl(value: unknown): string {
  try {
    if (typeof value !== 'string' || !value || Array.from(value).some(character => character.charCodeAt(0) <= 32)) throw new Error();
    const backend = new URL(appConfig.apiBaseUrl);
    const url = new URL(value, backend);
    if (backend.protocol !== 'https:' || url.protocol !== 'https:' || url.origin !== backend.origin ||
        url.username || url.password || url.search || url.hash || !url.pathname.startsWith('/api/facturacion/')) throw new Error();
    return url.href;
  } catch {
    throw new InvoiceDownloadError('La factura no tiene un enlace protegido válido del backend. Recarga el historial; no se abrirán enlaces externos.');
  }
}

const inFlight = new Map<string, Promise<void>>();
const mimeTypes: Record<InvoiceFormat, string[]> = { pdf: ['application/pdf'], xml: ['application/xml', 'text/xml'] };
// Private memory-only namespace: never place this value in URLs, logs or names.
// Refresh identity remains stable when the access interceptor renews the token.
const downloadSession = () => localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token') ||
  localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || 'anonymous';

async function resolveInvoice(source: InvoiceDownloadSource, format: InvoiceFormat): Promise<InvoiceDownloadSource> {
  if (source[`${format}_url`]) return source;
  // Historical/order views may only have an order or invoice identifier. Read
  // current protected URLs from Django; never reuse an old public provider URL.
  const invoices = await billingService.getInvoices();
  const invoice = invoices.find(candidate => source.orden_id !== undefined
    ? String(candidate.orden_id) === String(source.orden_id)
    : source.id !== undefined ? candidate.id === source.id
      : !!source.facturapi_id && candidate.facturapi_id === source.facturapi_id);
  if (!invoice) throw new InvoiceDownloadError('La factura no está disponible o no pertenece a tu cuenta.', 404);
  return invoice;
}

async function saveInvoiceBlob(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  let anchor: HTMLAnchorElement | undefined;
  try {
    anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    try { anchor?.remove(); } finally {
      // Allow the click to consume the blob before releasing it. The operation
      // remains in flight until cleanup, including failed DOM/click operations.
      await new Promise<void>(resolve => setTimeout(() => { URL.revokeObjectURL(url); resolve(); }, 0));
    }
  }
}

function downloadInvoice(source: InvoiceDownloadSource, format: InvoiceFormat): Promise<void> {
  if (format !== 'pdf' && format !== 'xml') return Promise.reject(new InvoiceDownloadError('Formato de factura no válido.'));
  let providedUrl: string | undefined;
  let session: string;
  try {
    session = downloadSession();
    const value = source[`${format}_url`];
    if (value) providedUrl = protectedInvoiceUrl(value);
  } catch (error) { return Promise.reject(error); }
  const identity = source.orden_id !== undefined ? `order:${source.orden_id}` : source.id !== undefined ? `invoice:${source.id}` :
    source.facturapi_id ? `provider:${source.facturapi_id}` : providedUrl;
  if (identity === undefined) return Promise.reject(new InvoiceDownloadError('No se pudo identificar la factura. Recarga el historial.'));
  const key = JSON.stringify([session, identity, format]);
  const active = inFlight.get(key);
  if (active) return active;
  const operation = (async () => {
    try {
      const invoice = await resolveInvoice(source, format);
      const url = protectedInvoiceUrl(invoice[`${format}_url`]);
      const response = await api.get<Blob>(url, {
        responseType: 'blob', timeout: 30000, redirectOnAuthFailure: false,
        headers: { Accept: mimeTypes[format].join(', ') },
        // XHR follows redirects automatically. The fetch adapter rejects them
        // instead of following a fiscal/provider URL with an authenticated call.
        adapter: 'fetch', fetchOptions: { redirect: 'error' },
      });
      if (response.status !== 200) throw new InvoiceDownloadError(invoiceDownloadMessage({ response }), response.status);
      if (downloadSession() !== session) throw new InvoiceDownloadError('La sesión cambió durante la descarga. Vuelve a solicitar la factura.');
      const mime = String(response.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
      const blob = response.data;
      if (!(blob instanceof Blob) || !blob.size || !mimeTypes[format].includes(mime) ||
          (blob.type && !mimeTypes[format].includes(blob.type.split(';')[0].toLowerCase()))) {
        throw new InvoiceDownloadError('El servidor no devolvió un archivo fiscal válido. Intenta de nuevo más tarde.');
      }
      const prefix = await blob.slice(0, 4096).text();
      const validContent = format === 'pdf' ? prefix.startsWith('%PDF-') :
        /^\uFEFF?\s*(?:<\?xml[\s\S]*?\?>\s*)?(?:<!--[\s\S]*?-->\s*)*<(?:[A-Za-z_][\w.-]*:)?Comprobante(?:\s|\/?>)/.test(prefix);
      if (!validContent) throw new InvoiceDownloadError('El archivo recibido no corresponde a una factura PDF/XML válida.');
      if (downloadSession() !== session) throw new InvoiceDownloadError('La sesión cambió durante la descarga. Vuelve a solicitar la factura.');
      // Do not trust Content-Disposition filenames or put credentials in URLs.
      const name = String(invoice.uuid || invoice.orden_id || invoice.id || 'documento').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64);
      await saveInvoiceBlob(blob, `factura-${name}.${format}`);
    } catch (error) {
      if (error instanceof InvoiceDownloadError) throw error;
      throw new InvoiceDownloadError(invoiceDownloadMessage(error), statusOf(error));
    }
  })().finally(() => inFlight.delete(key));
  inFlight.set(key, operation);
  return operation;
}

export const billingService = {
  getFiscalData: async (): Promise<FiscalData | null> => {
    try {
      const response = await api.get('/api/facturacion/perfil/');
      return response.data;
    } catch (error: unknown) {
      if (statusOf(error) === 404) {
        return null; // El usuario aún no tiene datos fiscales
      }
      throw error;
    }
  },

  saveFiscalData: async (data: FiscalData): Promise<FiscalData> => {
    const response = await api.post('/api/facturacion/perfil/', data);
    return response.data;
  },

  getInvoices: async (): Promise<Invoice[]> => {
    const response = await api.get(protectedInvoiceUrl('/api/facturacion/mis-facturas/'), {
      timeout: 30000, redirectOnAuthFailure: false,
      adapter: 'fetch', fetchOptions: { redirect: 'error' },
    });
    return response.data;
  },

  downloadInvoice,

  generateInvoice: async (ordenId: number | string): Promise<Invoice> => {
    const response = await api.post(`/api/facturacion/generar/${ordenId}/`);
    return response.data;
  }
};
