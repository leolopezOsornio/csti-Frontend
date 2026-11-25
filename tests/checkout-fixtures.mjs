export const quoteId = '11111111-1111-4111-8111-111111111111';
export const intentId = '22222222-2222-4222-8222-222222222222';
export const rateId = '33333333-3333-4333-8333-333333333333';
export const key = '44444444-4444-4444-8444-444444444444';
export const quoteFixture = (patch = {}) => ({ quote_id: quoteId, currency: 'MXN', expires_at: new Date(Date.now() + 60000).toISOString(),
  items_total: '200.00', items_tax: '27.58', shipping_total: '0.00', shipping_tax: '0.00', total: null, selected_rate_id: null,
  rates: [{ id: rateId, carrier: 'Test', service: 'Standard', price: '20.00', tax: '2.76', currency: 'MXN' }],
  lines: [{ item_id: 1, product_id: 99, sku: 'TEST', description: 'Test product', sat_code: 'TEST', quantity: 2, list_price: '100.00',
    base_unit_price: '100.00', unit_price: '100.00', unit_tax: '13.79', discount: '0.00', weight: '1.00', length: '20.00', width: '15.00', height: '10.00' }], ...patch });
export const selectedQuote = () => quoteFixture({ selected_rate_id: rateId, total: '220.00', shipping_total: '20.00', shipping_tax: '2.76' });
export const intentFixture = (patch = {}) => ({ intent_id: intentId, quote_id: quoteId, state: 'CREATED', total: '220.00', currency: 'MXN',
  paypal_order_id: null, capture_id: null, order_id: null, last_error_code: '', fulfillment_state: null,
  created_at: '2026-11-24T18:00:00+00:00', updated_at: '2026-11-24T18:00:00+00:00', ...patch });
export const readyIntent = () => intentFixture({ state: 'PAYPAL_ORDER_CREATED', paypal_order_id: 'PP-SYNTHETIC' });
export const paidIntent = () => intentFixture({ ...readyIntent(), state: 'CAPTURED', order_id: 42, capture_id: 'CAP-SYNTHETIC', fulfillment_state: 'PENDING' });
export function memoryStorage() {
  const items = new Map();
  return { get length() { return items.size; }, key: index => [...items.keys()][index] ?? null,
    getItem: key => items.get(key) ?? null, setItem: (key, value) => items.set(key, String(value)), removeItem: key => items.delete(key) };
}
