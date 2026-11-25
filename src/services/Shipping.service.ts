import api from './Api.service';

import { checkoutService, validateCheckoutRates, CheckoutError } from './Checkout.service';
import type { CheckoutQuote, CheckoutRate } from './Checkout.service';

export type ShippingRate = CheckoutRate;
export interface ShippingCartItem {
  id?: number;
  producto?: { id: number };
  product?: { id: number };
  cantidad: number;
  precio_unitario?: number | string;
}
export interface QuoteContext { addressId: number; cartKey: string }
export interface ShippingQuote extends QuoteContext, CheckoutQuote { expiresAt: number }
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
export function cartQuoteKey(items: ShippingCartItem[], total: number | string): string {
  return JSON.stringify([String(total), items.map(item => [item.producto?.id ?? item.product?.id ?? item.id,
    item.cantidad, String(item.precio_unitario ?? '')]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))]);
}
export function validateRates(data: unknown): ShippingRate[] {
  return validateCheckoutRates(record(data).rates);
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
  getRates: async (addressId: number, _cartItems: ShippingCartItem[] = []): Promise<ShippingRate[]> => {
    void _cartItems; // Cart products are read exclusively by Django.
    return (await checkoutService.quote(addressId)).rates;
  },
  getQuote: async (context: QuoteContext, _items: ShippingCartItem[]): Promise<ShippingQuote> => {
    void _items; // Used by callers only to invalidate their local view.
    const quote = await checkoutService.quote(context.addressId);
    return { ...quote, ...context, expiresAt: Date.parse(quote.expires_at) };
  },
  selectQuoteRate: async (quote: ShippingQuote, rateId: string): Promise<ShippingQuote> => {
    const selected = await checkoutService.selectRate(quote.quote_id, rateId);
    if (selected.quote_id !== quote.quote_id || selected.selected_rate_id !== rateId) throw new CheckoutError('INVALID_RESPONSE');
    return { ...selected, addressId: quote.addressId, cartKey: quote.cartKey, expiresAt: Date.parse(selected.expires_at) };
  },
  getDefaultRate: async (addressId: number, items: ShippingCartItem[] = []): Promise<ShippingRate> => {
    const rates = await shippingService.getRates(addressId, items);
    return rates.reduce((a, b) => BigInt(a.price.replace('.', '')) <= BigInt(b.price.replace('.', '')) ? a : b);
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
