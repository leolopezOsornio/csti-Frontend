import './register.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { hookHarness } from './hook-harness.mjs';

globalThis.__shippingApi = {};
const { cartQuoteKey, isQuoteCurrent } = await import('../src/services/Shipping.service.ts');
const hookPath = process.env.CSTI_HOOK_SOURCE || 'src/hooks/useShippingQuote.ts';
const item = { producto: { id: 7 }, cantidad: 1, precio_unitario: 100 };
const input = (items = [structuredClone(item)], addressId = 1) => [
  { addressId, cartKey: cartQuoteKey(items, items.reduce((sum, value) => sum + value.cantidad * value.precio_unitario, 0)) },
  items, `address-${addressId}`,
];
const quoted = (context, id = 'backend-rate') => ({ ...context, expiresAt: Date.now() + 60000,
  rates: [{ id, title: 'Test', internalProvider: 'Test carrier', price: '10.00', description: '', days: null, type: 'standard' }] });
function setup(handler = async context => quoted(context)) {
  const requests = [], saved = [];
  const service = {
    getQuote(context, items) { requests.push({ context, items }); return handler(context, items); },
    async selectQuoteRate(quote, rateId) { return { ...quote, selected_rate_id: rateId, total: '110.00' }; },
    getSelectedRateId() { return null; }, clearSelectedRate() {},
    saveSelectedRate(rate, context) { saved.push({ rate, context }); },
  };
  return { harness: hookHarness(hookPath, service, isQuoteCurrent), requests, saved };
}

test('stable equivalent items recreated each render never cause a quotation loop', async () => {
  const { harness, requests } = setup();
  try {
    harness.render(() => input());
    await harness.flush();
    assert.equal(requests.length, 1);
    for (let count = 0; count < 10; count++) { harness.render(); await harness.flush(); }
    assert.equal(requests.length, 1);
    assert.equal(harness.value.selectedRate.id, 'backend-rate');
    assert.equal(harness.timerCount, 1);
  } finally { harness.dispose(); }
  assert.equal(harness.timerCount, 0);
});
test('real cart quantity/price/address changes invalidate immediately and obtain new quotes', async () => {
  const { harness, requests } = setup();
  let items = [structuredClone(item)], address = 1;
  try {
    harness.render(() => input(structuredClone(items), address)); await harness.flush();
    items[0].cantidad = 2;
    harness.render(); assert.equal(harness.value.quote, null); await harness.flush();
    items[0].precio_unitario = 200;
    harness.render(); assert.equal(harness.value.quote, null); await harness.flush();
    address = 2;
    harness.render(); assert.equal(harness.value.quote, null); await harness.flush();
    assert.equal(requests.length, 4);
    assert.equal(requests[1].items[0].cantidad, 2);
    assert.equal(harness.value.quote.addressId, 2);
  } finally { harness.dispose(); }
});
test('a different cart cannot reuse the previous quote even when caller cartKey is stale', async () => {
  const { harness, requests } = setup();
  const context = input()[0]; let items = [structuredClone(item)];
  try {
    harness.render(() => [context, structuredClone(items), 'address-1']); await harness.flush();
    items = [{ ...item, producto: { id: 8 } }];
    harness.render(); assert.equal(harness.value.quote, null); await harness.flush();
    assert.equal(requests.length, 2); assert.equal(requests[1].items[0].id, 8);
  } finally { harness.dispose(); }
});
test('late old response cannot overwrite a newer quote or its stored selection', async () => {
  const pending = [];
  const { harness, requests, saved } = setup(context => new Promise(resolve => pending.push(() => resolve(quoted(context, `rate-${context.addressId}`)))));
  let address = 1;
  try {
    harness.render(() => input(undefined, address)); await harness.flush();
    address = 2; harness.render(); await harness.flush();
    assert.equal(requests.length, 2);
    pending[1](); await harness.flush();
    assert.equal(harness.value.selectedRate.id, 'rate-2');
    pending[0](); await harness.flush();
    assert.equal(harness.value.selectedRate.id, 'rate-2');
    assert.equal(saved.length, 1); assert.equal(saved[0].context.addressId, 2);
  } finally { harness.dispose(); }
});
test('error retry performs one new request and reordered equivalent cart stays stable', async () => {
  let first = true;
  const { harness, requests } = setup(async context => {
    if (first) { first = false; throw Error('offline'); }
    return quoted(context);
  });
  const second = { ...item, producto: { id: 8 } }; let reversed = false;
  try {
    harness.render(() => input(reversed ? [structuredClone(second), structuredClone(item)] : [structuredClone(item), structuredClone(second)]));
    await harness.flush(); assert.equal(harness.value.quote, null); assert.ok(harness.value.error);
    harness.value.retry(); await harness.flush(); assert.ok(harness.value.quote);
    reversed = true; harness.render(); await harness.flush(); assert.equal(requests.length, 2);
  } finally { harness.dispose(); }
});
