import api from './Api.service';

export type Money = string;
export interface CheckoutRate { id: string; carrier: string; service: string; price: Money; tax: Money; currency: 'MXN' }
export interface CheckoutLine {
  item_id: number; product_id: number; sku: string; description: string; sat_code: string; quantity: number;
  list_price: Money; base_unit_price: Money; unit_price: Money; unit_tax: Money; discount: Money;
  weight: string; length: string; width: string; height: string;
}
export interface CheckoutQuote {
  quote_id: string; expires_at: string; currency: 'MXN'; items_total: Money; items_tax: Money;
  shipping_total: Money; shipping_tax: Money; total: Money | null; selected_rate_id: string | null;
  rates: CheckoutRate[]; lines: CheckoutLine[];
}
export const financialStates = ['CREATED', 'PAYPAL_ORDER_PENDING', 'PAYPAL_ORDER_CREATED', 'CAPTURE_PENDING',
  'CAPTURE_UNKNOWN', 'CAPTURED', 'FAILED', 'RECONCILIATION_REQUIRED'] as const;
export type FinancialState = typeof financialStates[number];
export type FulfillmentState = 'PENDING' | 'DISPATCHING' | 'CONFIRMED' | 'REJECTED' | 'REQUIRES_MANUAL_RECONCILIATION';
export interface CheckoutIntent {
  intent_id: string; quote_id: string; state: FinancialState; total: Money; currency: 'MXN';
  paypal_order_id: string | null; capture_id: string | null; order_id: number | null;
  last_error_code: string; fulfillment_state: FulfillmentState | null; created_at: string; updated_at: string;
}
export class CheckoutError extends Error {
  code: string; status: number;
  constructor(code: string, status = 0) {
    super(code === 'CHECKOUT_DISABLED' ? 'Las compras están temporalmente no disponibles.' :
      ['QUOTE_EXPIRED', 'QUOTE_CHANGED', 'QUOTE_ALREADY_USED'].includes(code) ? 'La cotización cambió o venció. Solicita una nueva cotización.' :
      code === 'SESSION_CHANGED' ? 'La sesión cambió. Inicia sesión con la cuenta de esta compra para recuperarla.' :
      code === 'RECOVERY_LIMIT' ? 'Espera antes de volver a consultar. Si continúa pendiente, contacta a soporte con tu referencia.' :
      code === 'STORAGE_UNAVAILABLE' ? 'No se pudo guardar la referencia de recuperación. Habilita el almacenamiento antes de pagar.' :
      'No se pudo confirmar la operación. Conserva tu referencia y consulta su estado; evita iniciar otra compra.');
    this.name = 'CheckoutError'; this.code = code; this.status = status;
  }
}
export const isUUID = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const object = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new CheckoutError('INVALID_RESPONSE');
  return v as Record<string, unknown>;
};
const invalid = (): never => { throw new CheckoutError('INVALID_RESPONSE'); };
const text = (v: unknown) => typeof v === 'string' ? v : invalid();
const positive = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v > 0 ? v : invalid();
export const decimalMoney = (v: unknown): Money => typeof v === 'string' && /^\d{1,10}\.\d{2}$/.test(v) ? v : invalid();
const date = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v)) ? v : invalid();
const id = (v: unknown) => isUUID(v) ? v : invalid();
const nullableText = (v: unknown) => v === null ? null : text(v) || invalid();
export function validateCheckoutRates(v: unknown): CheckoutRate[] {
  if (!Array.isArray(v) || !v.length) return invalid();
  const ids = new Set<string>();
  return v.map(raw => {
    const r = object(raw), rateId = id(r.id);
    if (ids.has(rateId) || r.currency !== 'MXN' || !text(r.carrier).trim() || !text(r.service).trim()) return invalid();
    ids.add(rateId);
    return { id: rateId, carrier: text(r.carrier), service: text(r.service), price: decimalMoney(r.price), tax: decimalMoney(r.tax), currency: 'MXN' };
  });
}
export function validateCheckoutQuote(v: unknown): CheckoutQuote {
  const q = object(v), rates = validateCheckoutRates(q.rates);
  if (q.currency !== 'MXN' || !Array.isArray(q.lines) || !q.lines.length) return invalid();
  const selected = q.selected_rate_id === null ? null : id(q.selected_rate_id);
  if ((selected === null) !== (q.total === null) || selected && !rates.some(r => r.id === selected)) return invalid();
  return { quote_id: id(q.quote_id), expires_at: date(q.expires_at), currency: 'MXN',
    items_total: decimalMoney(q.items_total), items_tax: decimalMoney(q.items_tax),
    shipping_total: decimalMoney(q.shipping_total), shipping_tax: decimalMoney(q.shipping_tax),
    total: q.total === null ? null : decimalMoney(q.total), selected_rate_id: selected, rates,
    lines: q.lines.map(raw => {
      const r = object(raw);
      return { item_id: positive(r.item_id), product_id: positive(r.product_id), sku: text(r.sku), description: text(r.description),
        sat_code: text(r.sat_code), quantity: positive(r.quantity), list_price: decimalMoney(r.list_price),
        base_unit_price: decimalMoney(r.base_unit_price), unit_price: decimalMoney(r.unit_price), unit_tax: decimalMoney(r.unit_tax),
        discount: decimalMoney(r.discount), weight: text(r.weight), length: text(r.length), width: text(r.width), height: text(r.height) };
    }) };
}
export function validateCheckoutIntent(v: unknown): CheckoutIntent {
  const r = object(v);
  if (r.currency !== 'MXN' || !financialStates.includes(r.state as FinancialState) ||
      ![null, 'PENDING', 'DISPATCHING', 'CONFIRMED', 'REJECTED', 'REQUIRES_MANUAL_RECONCILIATION'].includes(r.fulfillment_state as string | null)) return invalid();
  return { intent_id: id(r.intent_id), quote_id: id(r.quote_id), state: r.state as FinancialState,
    total: decimalMoney(r.total), currency: 'MXN', paypal_order_id: nullableText(r.paypal_order_id), capture_id: nullableText(r.capture_id),
    order_id: r.order_id === null ? null : positive(r.order_id), last_error_code: text(r.last_error_code),
    fulfillment_state: r.fulfillment_state as FulfillmentState | null, created_at: date(r.created_at), updated_at: date(r.updated_at) };
}
export function checkoutError(error: unknown): CheckoutError {
  if (error instanceof CheckoutError) return error;
  const r = error && typeof error === 'object' ? error as { response?: { status?: number; data?: { code?: unknown } } } : {};
  return new CheckoutError(typeof r.response?.data?.code === 'string' ? r.response.data.code : 'RESULT_UNKNOWN', r.response?.status ?? 0);
}
// String formatting only: no conversion to floating-point or financial calculation.
export const displayMoney = (value: Money | null | undefined) => {
  if (value == null) return 'Pendiente';
  const [whole, cents] = value.split('.');
  return `$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${cents} MXN`;
};
const token = () => localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
const base = '/api/pagos/checkout/';
async function request<T>(method: 'get' | 'post', path: string, body: object | undefined,
  validate: (data: unknown) => T, statuses: number[], key?: string): Promise<T> {
  try {
    const config = { timeout: 45000, redirectOnAuthFailure: false, checkoutSessionToken: token(),
      adapter: 'fetch', fetchOptions: { redirect: 'error' },
      headers: { 'Content-Type': 'application/json', ...(key ? { 'Idempotency-Key': key } : {}) } };
    const result = method === 'get' ? await api.get(base + path, config) : await api.post(base + path, body, config);
    if (!statuses.includes(result.status)) throw new CheckoutError('INVALID_RESPONSE');
    return validate(result.data);
  } catch (error) { throw checkoutError(error); }
}
const intentPath = (value: string) => { if (!isUUID(value)) throw new CheckoutError('INVALID_REFERENCE'); return `intentos/${value}/`; };
export const checkoutService = {
  quote: (addressId: number) => {
    if (!Number.isSafeInteger(addressId) || addressId <= 0) return Promise.reject(new CheckoutError('INVALID_ADDRESS'));
    return request('post', 'cotizaciones/', { direccionID: addressId }, validateCheckoutQuote, [201]);
  },
  selectRate: (quoteId: string, rateId: string) => {
    if (!isUUID(quoteId) || !isUUID(rateId)) return Promise.reject(new CheckoutError('INVALID_REFERENCE'));
    return request('post', `cotizaciones/${quoteId}/tarifa/`, { rate_id: rateId }, validateCheckoutQuote, [200]);
  },
  createIntent: (quoteId: string, key: string) => {
    if (!isUUID(quoteId) || !isUUID(key)) return Promise.reject(new CheckoutError('INVALID_REFERENCE'));
    return request('post', 'intentos/', { quote_id: quoteId }, validateCheckoutIntent, [200], key);
  },
  createPayPal: (intentId: string) => request('post', intentPath(intentId) + 'paypal/', {}, validateCheckoutIntent, [200, 202]),
  capture: (intentId: string, orderId: string) => request('post', intentPath(intentId) + 'capturar/', { paypal_order_id: orderId }, validateCheckoutIntent, [200, 202]),
  get: (intentId: string) => request('get', intentPath(intentId), undefined, validateCheckoutIntent, [200]),
  reconcile: (intentId: string) => request('post', intentPath(intentId) + 'reconciliar/', {}, validateCheckoutIntent, [200, 202]),
  cancel: (intentId: string) => request('post', intentPath(intentId) + 'cancelar/', {}, validateCheckoutIntent, [200]),
};
export type CheckoutAPI = typeof checkoutService;
