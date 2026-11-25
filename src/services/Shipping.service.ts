import api from './Api.service';

export interface ShippingRate {
  id: string;
  type: 'standard' | 'express';
  title: string;
  description: string;
  days: number | null;
  price: number;
  internalProvider: string;
}
export interface ShippingCartItem {
  id?: number;
  producto?: { id: number };
  product?: { id: number };
  cantidad: number;
  precio_unitario?: number | string;
}
export interface QuoteContext { addressId: number; cartKey: string }
export interface ShippingQuote extends QuoteContext { rates: ShippingRate[]; expiresAt: number }
export interface TrackingData {
  carrier: string | null;
  tracking_number: string | null;
  status: string | null;
  estimated_delivery: string | null;
  delivered_date: string | null;
  source: 'tracking' | 'order' | 'unavailable';
  message: string | null;
}
export class ShippingError extends Error {
  constructor(message: string) { super(message); this.name = 'ShippingError'; }
}
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value.trim() : null;
const money = (value: unknown): number | null => {
  if (typeof value !== 'number' && !(typeof value === 'string' && /^\d+(\.\d{1,2})?$/.test(value))) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};
export function cartQuoteKey(items: ShippingCartItem[], total: number | string): string {
  return JSON.stringify([String(total), items.map(item => [item.producto?.id ?? item.product?.id ?? item.id,
    item.cantidad, String(item.precio_unitario ?? '')]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))]);
}
export function validateRates(data: unknown): ShippingRate[] {
  const rates = record(data).rates;
  if (!Array.isArray(rates)) throw new ShippingError('La respuesta de cotización no es válida. Intenta de nuevo.');
  if (!rates.length) throw new ShippingError('No hay envíos disponibles para esta dirección y carrito.');
  const ids = new Set<string>();
  return rates.map(value => {
    const rate = record(value);
    const id = text(rate.id) ?? (typeof rate.id === 'number' && Number.isSafeInteger(rate.id) && rate.id > 0 ? String(rate.id) : null);
    const title = text(rate.title), carrier = text(rate.carrier), price = money(rate.price);
    if (!id || !title || !carrier || price === null || ids.has(id)) throw new ShippingError('La cotización contiene tarifas inválidas. Intenta de nuevo.');
    ids.add(id);
    const days = typeof rate.estimated_days === 'number' && Number.isFinite(rate.estimated_days) && rate.estimated_days >= 0 ? rate.estimated_days : null;
    const estimate = text(rate.estimated_days) ?? (days !== null ? String(days) : null);
    return { id, title, price, internalProvider: carrier,
      type: title.toLowerCase().includes('express') ? 'express' : 'standard',
      description: estimate ? `Entrega estimada: ${estimate}` : 'Plazo no informado por la paquetería.', days };
  });
}
export function isQuoteCurrent(quote: ShippingQuote | null, context: QuoteContext): quote is ShippingQuote {
  return !!quote && quote.addressId === context.addressId && quote.cartKey === context.cartKey &&
    quote.expiresAt > Date.now() && quote.rates.length > 0;
}
// Storage is a method preference only. Prices are never restored from it.
const readPreference = (context: QuoteContext): string | null => {
  try {
    const value = record(JSON.parse(localStorage.getItem('selectedShippingRate') || 'null'));
    if (value.version === 1 && value.addressId === context.addressId && value.cartKey === context.cartKey && text(value.rateId)) return value.rateId as string;
    localStorage.removeItem('selectedShippingRate');
  } catch { /* Storage disabled or corrupt: fresh quotes still work. */ }
  return null;
};
const dateText = (value: unknown): string | null => {
  const candidate = text(value);
  return candidate && Number.isFinite(Date.parse(candidate)) ? candidate : null;
};
export const shippingService = {
  getRates: async (addressId: number, cartItems: ShippingCartItem[] = []): Promise<ShippingRate[]> => {
    if (!Number.isSafeInteger(addressId) || addressId <= 0) throw new ShippingError('Selecciona una dirección válida para cotizar.');
    try {
      const productIds = cartItems.map(item => item.product?.id ?? item.producto?.id ?? item.id).filter(id => Number.isSafeInteger(id) && Number(id) > 0);
      const response = await api.post('/api/pagos/envios/cotizar/', { direccionID: addressId, productos: productIds }, { timeout: 15000 });
      return validateRates(response.data);
    } catch (error) {
      if (error instanceof ShippingError) throw error;
      throw new ShippingError('No fue posible cotizar el envío. Revisa tu conexión e intenta de nuevo.');
    }
  },
  getQuote: async (context: QuoteContext, items: ShippingCartItem[]): Promise<ShippingQuote> => ({
    ...context, rates: await shippingService.getRates(context.addressId, items),
    // Client freshness limit; backend must still validate its own quote expiry.
    expiresAt: Date.now() + 5 * 60 * 1000,
  }),
  getDefaultRate: async (addressId: number, items: ShippingCartItem[] = []): Promise<ShippingRate> => {
    const rates = await shippingService.getRates(addressId, items);
    return rates.reduce((prev, curr) => prev.price <= curr.price ? prev : curr);
  },
  saveSelectedRate: (rate: ShippingRate, context: QuoteContext) => {
    try { localStorage.setItem('selectedShippingRate', JSON.stringify({ version: 1, rateId: rate.id, ...context })); }
    catch { /* Persistence is optional. */ }
  },
  getSelectedRateId: readPreference,
  clearSelectedRate: () => {
    try { localStorage.removeItem('selectedShippingRate'); } catch { /* Optional storage. */ }
  },
  getTracking: async (orderId: string, orderData: unknown = {}): Promise<TrackingData> => {
    const order = record(orderData);
    const fallback: TrackingData = {
      carrier: text(order.paqueteria), tracking_number: text(order.numero_de_guia), status: text(order.estado_envio),
      estimated_delivery: null, delivered_date: null, source: 'order',
      message: 'Rastreo temporalmente no disponible. Se muestra el último estado confirmado por el backend.',
    };
    try {
      if (!orderId || orderId === 'undefined') throw new Error('Missing order');
      const response = await api.get(`/api/pagos/envios/rastrear/${encodeURIComponent(orderId)}/`, { timeout: 15000 });
      const data = record(response.data);
      // Unknown provider payloads must not be interpreted as proof of delivery.
      const status = text(data.status), tracking = text(data.tracking_number);
      if (!status && !tracking) throw new Error('No confirmed tracking fields');
      return { carrier: text(data.carrier) ?? fallback.carrier, tracking_number: tracking ?? fallback.tracking_number,
        status: status ?? fallback.status, estimated_delivery: dateText(data.estimated_delivery),
        delivered_date: status === 'ENTREGADO' ? dateText(data.delivered_date) : null, source: 'tracking', message: null };
    } catch {
      return fallback.status || fallback.tracking_number ? fallback : {
        ...fallback, source: 'unavailable', message: 'Rastreo temporalmente no disponible',
      };
    }
  },
};
