import './register.mjs';
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { quoteFixture, selectedQuote, intentFixture, readyIntent, paidIntent, memoryStorage, quoteId, intentId, rateId, key } from './checkout-fixtures.mjs';

let handler, http;
globalThis.__shippingApi = {
  post: (...args) => { http.push(['post', ...args]); return handler('post', ...args); },
  get: (...args) => { http.push(['get', ...args]); return handler('get', ...args); },
};
const { checkoutService, CheckoutError, validateCheckoutQuote, validateCheckoutIntent, displayMoney } = await import('../src/services/Checkout.service.ts');
const { CheckoutSession } = await import('../src/services/CheckoutSession.ts');
const { checkoutCallbacks } = await import('../src/services/CheckoutCallbacks.ts');
const { recoveryStore, clearCheckoutRecovery, setCheckoutAccount } = await import('../src/services/CheckoutRecovery.ts');
const { default: CheckoutStatus } = await import('../src/components/CheckoutStatus.tsx');
const { authService } = await import('../src/services/Auth.service.ts');
const { shippingService } = await import('../src/services/Shipping.service.ts');
let current;
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const render = state => renderToStaticMarkup(React.createElement(CheckoutStatus, { state }));
function setup() {
  const calls = [];
  let server = intentFixture();
  const api = {
    quote: async () => quoteFixture(), selectRate: async () => selectedQuote(),
    createIntent: async (...args) => { calls.push(['intent', ...args]); return server; },
    createPayPal: async id => { calls.push(['paypal', id]); server = readyIntent(); return server; },
    get: async id => { calls.push(['get', id]); return server; },
    capture: async (...args) => { calls.push(['capture', ...args]); server = paidIntent(); return server; },
    reconcile: async id => { calls.push(['reconcile', id]); return server; },
    cancel: async id => { calls.push(['cancel', id]); server = intentFixture({ state: 'FAILED' }); return server; },
  };
  return { calls, api, session: new CheckoutSession(1, () => current === 1, api), setServer: value => { server = value; } };
}
beforeEach(() => {
  globalThis.localStorage = memoryStorage(); globalThis.sessionStorage = memoryStorage();
  localStorage.setItem('access_token', 'synthetic-user-1');
  current = 1; setCheckoutAccount(1); http = [];
  handler = async () => { throw Error('Unmocked endpoint'); };
});

test('strict Quote DTO accepts service without title; preserves server decimal totals and expiry', () => {
  const raw = selectedQuote(), q = validateCheckoutQuote(raw);
  assert.equal(q.rates[0].service, 'Standard'); assert.equal(q.total, '220.00');
  assert.equal(q.items_tax, '27.58'); assert.equal(q.shipping_tax, '2.76');
  assert.equal(q.expires_at, raw.expires_at);
  for (const change of [{ total: 220 }, { currency: 'USD' }, { quote_id: 'fake' }, { expires_at: 'never' }, { rates: [] }, { selected_rate_id: key }])
    assert.throws(() => validateCheckoutQuote({ ...selectedQuote(), ...change }));
});
test('shipping quote uses only direccionID and official expiry, never productos or client TTL', async () => {
  const data = quoteFixture();
  handler = async () => ({ status: 201, data });
  const q = await shippingService.getQuote({ addressId: 12, cartKey: 'cart' }, [{ cantidad: 100 }]);
  assert.equal(http[0][1], '/api/pagos/checkout/cotizaciones/'); assert.deepEqual(http[0][2], { direccionID: 12 });
  assert.equal(q.expiresAt, Date.parse(data.expires_at));
});
test('selects rate UUID via Django and displays server total with included taxes without summing again', async () => {
  handler = async () => ({ status: 200, data: selectedQuote() });
  const q = await checkoutService.selectRate(quoteId, rateId);
  assert.equal(http[0][1], `/api/pagos/checkout/cotizaciones/${quoteId}/tarifa/`);
  assert.deepEqual(http[0][2], { rate_id: rateId }); assert.equal(displayMoney(q.total), '$220.00 MXN');
  assert.equal(displayMoney('1234567.89'), '$1,234,567.89 MXN');
});
test('all eight exact endpoints send JSON/auth config and no client prices', async () => {
  handler = async (_method, url) => ({ status: url.endsWith('cotizaciones/') ? 201 : 200,
    data: url.includes('cotizaciones') ? selectedQuote() : readyIntent() });
  await checkoutService.quote(12); await checkoutService.selectRate(quoteId, rateId);
  await checkoutService.createIntent(quoteId, key); await checkoutService.createPayPal(intentId);
  await checkoutService.capture(intentId, 'PP-SYNTHETIC'); await checkoutService.get(intentId);
  await checkoutService.reconcile(intentId); await checkoutService.cancel(intentId);
  assert.equal(http.length, 8);
  assert.deepEqual(http[2][2], { quote_id: quoteId }); assert.equal(http[2][3].headers['Idempotency-Key'], key);
  assert.deepEqual(http[4][2], { paypal_order_id: 'PP-SYNTHETIC' });
  for (const [method, url, body, options] of http) {
    assert.ok(!url.includes('verificar')); const config = method === 'get' ? body : options;
    assert.equal(config.checkoutSessionToken, 'synthetic-user-1'); assert.equal(config.redirectOnAuthFailure, false);
    if (method === 'post') assert.doesNotMatch(JSON.stringify(body), /amount|purchase_units|currency_code|shippingCost|total|discount/);
  }
});
test('unexpected HTTP and malformed intent responses fail closed', async () => {
  handler = async () => ({ status: 204, data: readyIntent() });
  await assert.rejects(checkoutService.createPayPal(intentId), e => e.code === 'INVALID_RESPONSE');
  for (const change of [{ total: -1 }, { state: 'PAID' }, { currency: 'USD' }, { order_id: 0 }])
    assert.throws(() => validateCheckoutIntent({ ...readyIntent(), ...change }));
});
test('SDK createOrder returns only backend PayPal ID; SDK actions are never invoked', async () => {
  const { session, calls } = setup();
  const callbacks = checkoutCallbacks(session, async () => selectedQuote());
  const actions = { order: { create: () => assert.fail('SDK create forbidden'), capture: () => assert.fail('SDK capture forbidden') } };
  assert.equal(await callbacks.createOrder({}, actions), 'PP-SYNTHETIC');
  assert.equal(calls.filter(c => c[0] === 'intent').length, 1);
  await callbacks.onApprove({ orderID: 'PP-SYNTHETIC' }, actions);
  assert.deepEqual(calls.find(c => c[0] === 'capture'), ['capture', intentId, 'PP-SYNTHETIC']);
  assert.equal(session.snapshot().phase, 'paid');
});
test('double click shares one logical intent and one creation request', async () => {
  const { session, api, calls } = setup(); const pending = deferred();
  api.createIntent = async (...args) => { calls.push(['intent', ...args]); return pending.promise; };
  const one = session.start(selectedQuote()), two = session.start(selectedQuote());
  assert.equal(one, two); pending.resolve(intentFixture()); await one;
  assert.equal(calls.filter(c => c[0] === 'intent').length, 1);
});
test('intent creation timeout persists the same idempotency UUID across reload and explicit recovery', async () => {
  const { session, api, calls } = setup();
  api.createIntent = async (...args) => { calls.push(['intent', ...args]); throw Error('timeout'); };
  await assert.rejects(session.start(selectedQuote()));
  const ref = recoveryStore.read(1); assert.equal(ref.intentId, null);
  assert.deepEqual(Object.keys(ref).sort(), ['accountId', 'intentId', 'key', 'quoteId', 'version']);
  api.createIntent = async (...args) => { calls.push(['intent', ...args]); return intentFixture(); };
  const reloaded = new CheckoutSession(1, () => current === 1, api); await reloaded.restore();
  assert.equal(calls.length, 1); await reloaded.recover();
  assert.equal(calls[0][2], calls[1][2]); assert.equal(ref.key, calls[1][2]);
  assert.equal(reloaded.snapshot().reference.intentId, intentId);
});
test('PayPal creation timeout does not issue a second POST on recovery', async () => {
  const { session, api, calls, setServer } = setup();
  api.createPayPal = async id => { calls.push(['paypal', id]); setServer(intentFixture({ state: 'RECONCILIATION_REQUIRED' })); throw Error('timeout'); };
  await assert.rejects(session.start(selectedQuote())); await session.recover();
  assert.equal(calls.filter(c => c[0] === 'paypal').length, 1); assert.equal(session.snapshot().phase, 'pending');
  assert.match(render(session.snapshot()), /nuestro equipo/);
});
test('202 response is pending and never displays successful purchase', async () => {
  handler = async () => ({ status: 202, data: intentFixture({ state: 'CAPTURE_PENDING' }) });
  const data = await checkoutService.capture(intentId, 'PP-SYNTHETIC');
  const { session, api } = setup(); await session.start(selectedQuote()); api.capture = async () => data;
  await session.approve('PP-SYNTHETIC'); assert.equal(session.snapshot().phase, 'pending');
  assert.doesNotMatch(render(session.snapshot()), /Pago confirmado/); assert.match(render(session.snapshot()), /pendiente/);
});
test('200 with CREATED or CAPTURED without local order is not purchase confirmation', async () => {
  const { session, api } = setup(); await session.start(selectedQuote());
  api.capture = async () => intentFixture({ state: 'CAPTURED' }); await session.approve('PP-SYNTHETIC');
  assert.equal(session.snapshot().phase, 'attention'); assert.doesNotMatch(render(session.snapshot()), /Pago confirmado/);
  assert.doesNotMatch(render({ ...session.snapshot(), phase: 'awaiting_approval', intent: intentFixture() }), /Pago confirmado/);
});
test('only CAPTURED plus confirmed local order shows success; references remain until acknowledgement', async () => {
  const { session } = setup(); await session.start(selectedQuote()); await session.approve('PP-SYNTHETIC');
  assert.match(render(session.snapshot()), /Pago confirmado. Pedido #42/); assert.ok(recoveryStore.read(1));
  session.acknowledgePaid(); assert.equal(recoveryStore.read(1), null);
});
test('reload restores CAPTURED through GET even when cart is already empty', async () => {
  const { session, api } = setup(); await session.start(selectedQuote()); api.get = async () => paidIntent();
  const reloaded = new CheckoutSession(1, () => current === 1, api); await reloaded.restore();
  assert.equal(reloaded.snapshot().phase, 'paid'); assert.match(render(reloaded.snapshot()), /Pedido #42/);
});
test('CAPTURE_UNKNOWN and timeout cannot trigger another frontend capture', async () => {
  for (const throws of [false, true]) {
    localStorage.removeItem('csti.checkout.v1.1');
    const { session, api, calls } = setup(); await session.start(selectedQuote());
    api.capture = async (...args) => { calls.push(['capture', ...args]); if (throws) throw Error('timeout'); return intentFixture({ state: 'CAPTURE_UNKNOWN' }); };
    await session.approve('PP-SYNTHETIC'); await session.approve('PP-SYNTHETIC');
    assert.equal(calls.filter(c => c[0] === 'capture').length, 1); assert.equal(session.snapshot().phase, 'pending');
  }
});
test('reconciliation is explicit, bounded, frequency limited and never captures', async () => {
  const { session, api, calls, setServer } = setup(); await session.start(selectedQuote());
  setServer(intentFixture({ state: 'CAPTURE_UNKNOWN' })); await session.recover();
  await session.recover(); await session.recover();
  assert.equal(calls.filter(c => c[0] === 'reconcile').length, 1);
  assert.equal(calls.filter(c => c[0] === 'capture').length, 0);
  assert.match(session.snapshot().message, /Espera/);
  api.get = async () => paidIntent(); // A late confirm can be obtained by a later explicit reload/GET.
  await session.restore(); assert.equal(session.snapshot().phase, 'paid');
});
test('reconciliation stops at five explicit attempts even when time advances', async t => {
  let now = Date.now(); t.mock.method(Date, 'now', () => now);
  const { session, calls, setServer } = setup(); await session.start(selectedQuote());
  setServer(intentFixture({ state: 'CAPTURE_UNKNOWN' }));
  for (let index = 0; index < 8; index++) { await session.recover(); now += 10001; }
  assert.equal(calls.filter(c => c[0] === 'reconcile').length, 5);
  assert.equal(session.snapshot().phase, 'pending');
});
test('definitive quote expiry 409 before intent creation permits explicit recotization', async () => {
  const { session, api } = setup(); api.createIntent = async () => { throw new CheckoutError('QUOTE_EXPIRED', 409); };
  await assert.rejects(session.start(selectedQuote())); assert.equal(session.snapshot().phase, 'requote');
  assert.equal(recoveryStore.read(1), null); assert.match(render(session.snapshot()), /cotizar de nuevo/);
  session.retryQuote(); assert.equal(session.snapshot().phase, 'idle');
});
test('wrong PayPal identifier never reaches capture endpoint', async () => {
  const { session, calls } = setup(); await session.start(selectedQuote()); await session.approve('ALTERED');
  assert.equal(calls.filter(c => c[0] === 'capture').length, 0);
});
test('account change during intent response cannot save ID or call PayPal for the other account', async () => {
  const { session, api, calls } = setup(); const pending = deferred(); api.createIntent = async () => pending.promise;
  const flight = session.start(selectedQuote()); current = 2; setCheckoutAccount(2); pending.resolve(intentFixture());
  await assert.rejects(flight, e => e.code === 'SESSION_CHANGED');
  assert.equal(recoveryStore.read(1).intentId, null); assert.equal(recoveryStore.read(2), null);
  assert.equal(calls.filter(c => c[0] === 'paypal').length, 0);
});
test('logout clears both browser stores, invalidates in-flight callbacks and recovery code requires same account', async () => {
  const { session, api } = setup(); await session.start(selectedQuote());
  const code = JSON.stringify(session.snapshot().reference); const pending = deferred(); api.capture = async () => pending.promise;
  const flight = session.approve('PP-SYNTHETIC'); authService.logout(); current = null;
  pending.resolve(paidIntent()); await flight; assert.equal(localStorage.getItem('access_token'), null);
  assert.equal(localStorage.getItem('csti.checkout.v1.1'), null); assert.notEqual(session.snapshot().phase, 'paid');
  current = 2; setCheckoutAccount(2); const other = new CheckoutSession(2, () => true, api);
  assert.throws(() => other.importCode(code));
  current = 1; setCheckoutAccount(1); const original = new CheckoutSession(1, () => true, api);
  original.importCode(code); api.get = async () => paidIntent(); await original.restore(); assert.equal(original.snapshot().phase, 'paid');
});
test('cancel ambiguous 409 conserves references and does not declare terminal failure', async () => {
  const { session, api } = setup(); await session.start(selectedQuote());
  const ref = recoveryStore.read(1); api.cancel = async () => { throw new CheckoutError('CHECKOUT_CANNOT_CANCEL_AMBIGUOUS', 409); };
  await session.cancel(); assert.equal(session.snapshot().phase, 'pending'); assert.deepEqual(recoveryStore.read(1), ref);
});
test('pending capture cannot be cancelled by visual SDK dismissal', async () => {
  const { session, api, calls } = setup(); await session.start(selectedQuote());
  api.capture = async () => intentFixture({ state: 'CAPTURE_UNKNOWN' }); await session.approve('PP-SYNTHETIC'); await session.cancel();
  assert.equal(calls.filter(c => c[0] === 'cancel').length, 0); assert.ok(recoveryStore.read(1));
});
test('safe backend cancellation releases references only after FAILED', async () => {
  const { session } = setup(); await session.start(selectedQuote()); await session.cancel();
  assert.equal(session.snapshot().phase, 'cancelled'); assert.equal(recoveryStore.read(1), null);
});
test('lost cancellation response is recovered as FAILED through GET and releases browser reference', async () => {
  const { session, api } = setup(); await session.start(selectedQuote());
  api.get = async () => intentFixture({ state: 'FAILED' });
  const reloaded = new CheckoutSession(1, () => current === 1, api); await reloaded.restore();
  assert.equal(reloaded.snapshot().phase, 'cancelled'); assert.equal(recoveryStore.read(1), null);
});
test('CHECKOUT_DISABLED blocks purchase without a frontend bypass', async () => {
  handler = async () => { throw { response: { status: 503, data: { code: 'CHECKOUT_DISABLED' } } }; };
  await assert.rejects(checkoutService.quote(12), e => e.code === 'CHECKOUT_DISABLED');
  const { session, api, calls } = setup(); api.createIntent = async () => { throw new CheckoutError('CHECKOUT_DISABLED', 503); };
  await assert.rejects(session.start(selectedQuote())); assert.equal(session.snapshot().phase, 'unavailable');
  assert.equal(calls.filter(c => c[0] === 'paypal').length, 0);
});
test('storage disabled blocks creation before any payment operation', async () => {
  const { session, calls } = setup(); localStorage.setItem = () => { throw Error('denied'); };
  await assert.rejects(session.start(selectedQuote()), e => e.code === 'STORAGE_UNAVAILABLE'); assert.equal(calls.length, 0);
});
test('frontend source contains no legacy verifier or SDK financial creation/capture calls', () => {
  for (const path of ['src/pages/Payment/Payment.tsx', 'src/services/Payment.service.ts', 'src/services/CheckoutCallbacks.ts', 'src/components/CheckoutPayPal.tsx']) {
    const text = readFileSync(path, 'utf8'); assert.doesNotMatch(text, /actions\.order\.(create|capture)|\/api\/pagos\/verificar\/|purchase_units|currency_code/);
  }
});
