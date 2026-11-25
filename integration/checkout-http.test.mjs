import { origin, wire } from './register.mjs';
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { memoryStorage } from '../tests/checkout-fixtures.mjs';
const { checkoutService: api } = await import('../src/services/Checkout.service.ts');
const { CheckoutSession } = await import('../src/services/CheckoutSession.ts');
const { setCheckoutAccount, checkoutAccount } = await import('../src/services/CheckoutRecovery.ts');
const { authService } = await import('../src/services/Auth.service.ts');
const { cartService } = await import('../src/services/Cart.service.ts');
const { addressService } = await import('../src/services/Address.service.ts');
const { orderService } = await import('../src/services/Order.service.ts');
const { billingService } = await import('../src/services/Billing.service.ts');
const { default: realApi } = await import('../src/services/Api.service.ts');
axios.defaults.adapter = 'fetch'; realApi.defaults.adapter = 'fetch';
const realFetch = globalThis.fetch;
const run = Date.now().toString(36);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let downloads, blobs;
beforeEach(() => {
  globalThis.localStorage = memoryStorage(); globalThis.sessionStorage = memoryStorage();
  axios.defaults.env = { ...axios.defaults.env, fetch: realFetch };
  realApi.defaults.env = { ...realApi.defaults.env, fetch: realFetch };
  downloads = []; blobs = new Map();
  URL.createObjectURL = blob => { const url = `blob:synthetic-${blobs.size}`; blobs.set(url, blob); return url; };
  URL.revokeObjectURL = url => blobs.delete(url);
  globalThis.document = { body: { appendChild() {} }, createElement: () => ({ style: {}, remove() {},
    click() { downloads.push({ name: this.download, blob: blobs.get(this.href) }); } }) };
  globalThis.window = { location: { href: '' } };
});
async function control(action, intentId, extra = {}) {
  const result = await realFetch(`${origin}/__phase4__/control/`, { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, intent_id: intentId, ...extra }) });
  assert.equal(result.status, 200, `control ${action}`); return result.json();
}
function login(user) { localStorage.setItem('access_token', user.token); setCheckoutAccount(user.id); }
async function fixture(name) {
  const response = await realFetch(`${origin}/__phase4__/fixture/?case=${run}-${name}`); assert.equal(response.status, 200);
  const f = await response.json(); login(f.a); return f;
}
async function prepare(f) {
  await cartService.addToCart(f.product_id, 2);
  const { direccion: address } = await addressService.addAddress({ alias: 'Synthetic', destinatario: 'Synthetic User', telefono_contacto: '5555555555',
    calle: 'Test', numero_exterior: '1', numero_interior: '', colonia: 'Test', codigo_postal: '01000', ciudad_municipio: 'Test', estado: 'DF', referencias: '', es_principal: true });
  const quote = await api.quote(address.id); return api.selectRate(quote.quote_id, quote.rates[0].id);
}
const sessionFor = user => new CheckoutSession(user.id, () => checkoutAccount() === user.id);

test('real HTTPS CORS preflight allows JWT, JSON and Idempotency-Key only for configured origin', async () => {
  const response = await realFetch(`${origin}/api/pagos/checkout/intentos/`, { method: 'OPTIONS', headers: {
    Origin: 'http://127.0.0.1:5173', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type,idempotency-key' } });
  assert.equal(response.status, 200); assert.equal(response.headers.get('access-control-allow-origin'), 'http://127.0.0.1:5173');
  assert.match(response.headers.get('access-control-allow-headers'), /idempotency-key/);
  const denied = await realFetch(`${origin}/api/pagos/checkout/intentos/`, { method: 'OPTIONS', headers: { Origin: 'https://untrusted.invalid', 'Access-Control-Request-Method': 'POST' } });
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
});
test('complete actual Axios -> Django -> PostgreSQL checkout, double click, orders and JWT PDF/XML', async () => {
  const f = await fixture('complete'), quote = await prepare(f), session = sessionFor(f.a);
  assert.equal(quote.total, '220.00'); assert.equal(quote.items_tax, '27.58');
  const first = session.start(quote), second = session.start(quote); assert.equal(first, second);
  const orderId = await first, intentId = session.snapshot().reference.intentId;
  await control('approve', intentId); await session.approve(orderId);
  assert.equal(session.snapshot().phase, 'paid');
  const stats = await control('stats', intentId); assert.equal(stats.creates, 1); assert.equal(stats.captures, 1);
  assert.equal(stats.orders, 1); assert.equal(stats.fulfillments, 1);
  const orders = await orderService.getOrders(); assert.equal(orders.length, 1); assert.equal(orders[0].monto_total, '220.00');
  assert.equal((await orderService.getOrderById(String(stats.order_id))).id, stats.order_id);
  const reloaded = sessionFor(f.a); await reloaded.restore(); assert.equal(reloaded.snapshot().phase, 'paid');
  assert.equal((await cartService.getCart()).items.length, 0);
  await control('invoice', intentId); const invoices = await billingService.getInvoices(); assert.equal(invoices.length, 1);
  assert.ok(invoices[0].pdf_url.startsWith(origin));
  await billingService.downloadInvoice(invoices[0], 'pdf'); await billingService.downloadInvoice(invoices[0], 'xml');
  assert.equal(downloads.length, 2); assert.match(await downloads[0].blob.text(), /^%PDF-/); assert.match(await downloads[1].blob.text(), /Comprobante synthetic/);
  assert.equal(blobs.size, 0);
  login(f.b); await assert.rejects(billingService.downloadInvoice(invoices[0], 'pdf'), e => e.status === 404);
  await assert.rejects(api.get(intentId), e => e.status === 404);
  localStorage.removeItem('access_token'); await assert.rejects(billingService.downloadInvoice(invoices[0], 'xml'), e => e.status === 401);
});
test('actual JWT 401, expired quote conflict 409, bad client fields 400 and retired verifier 410', async () => {
  const f = await fixture('errors'); localStorage.removeItem('access_token');
  const anonymous = await realFetch(`${origin}/api/pagos/checkout/cotizaciones/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"direccionID":1}' });
  assert.equal(anonymous.status, 401); login(f.a);
  const expired = await prepare(f); await control('expire', undefined, { quote_id: expired.quote_id });
  await assert.rejects(api.createIntent(expired.quote_id, crypto.randomUUID()), e => e.status === 409 && e.code === 'QUOTE_EXPIRED');
  const fresh = await api.quote((await addressService.getAddresses())[0].id);
  const quote = await api.selectRate(fresh.quote_id, fresh.rates[0].id);
  const intent = await api.createIntent(quote.quote_id, crypto.randomUUID());
  await assert.rejects(api.selectRate(quote.quote_id, quote.rates[0].id), e => e.status === 409);
  const malformed = await realFetch(`${origin}/api/pagos/checkout/cotizaciones/`, { method: 'POST',
    headers: { Authorization: `Bearer ${f.a.token}`, 'Content-Type': 'application/json' }, body: '{"direccionID":1,"total":"0.01"}' });
  assert.equal(malformed.status, 400);
  await assert.rejects(realApi.post('/api/pagos/verificar/', {}), e => e.response.status === 410);
  await api.cancel(intent.intent_id);
});
test('202 pending, reload and later reconciliation never perform a second capture', async () => {
  const f = await fixture('pending'), session = sessionFor(f.a), quote = await prepare(f);
  const paypal = await session.start(quote), id = session.snapshot().reference.intentId;
  await control('approve', id); await control('mode', id, { mode: 'pending' });
  await session.approve(paypal); assert.equal(session.snapshot().phase, 'pending'); await session.approve(paypal);
  await assert.rejects(api.cancel(id), e => e.status === 409 && e.code === 'CHECKOUT_CANNOT_CANCEL_AMBIGUOUS');
  const reloaded = sessionFor(f.a); await reloaded.restore(); assert.equal(reloaded.snapshot().phase, 'pending');
  await control('complete', id); await reloaded.recover(); assert.equal(reloaded.snapshot().phase, 'paid');
  const stats = await control('stats', id); assert.equal(stats.captures, 1); assert.equal(stats.orders, 1); assert.equal(stats.fulfillments, 1);
});
test('actual persistence rollback after simulated capture is recovered from provider GET once', async () => {
  const f = await fixture('dbfail'), session = sessionFor(f.a), quote = await prepare(f);
  const paypal = await session.start(quote), id = session.snapshot().reference.intentId;
  await control('approve', id); await control('mode', id, { mode: 'dbfail' });
  await session.approve(paypal); assert.equal(session.snapshot().phase, 'pending');
  let stats = await control('stats', id); assert.equal(stats.captures, 1); assert.equal(stats.orders, 0); assert.equal(stats.fulfillments, 0);
  await session.recover(); assert.equal(session.snapshot().phase, 'paid');
  stats = await control('stats', id); assert.equal(stats.captures, 1); assert.equal(stats.orders, 1); assert.equal(stats.fulfillments, 1);
});
test('real wire abort after sending capture retains recovery reference and does not recapture', async () => {
  const f = await fixture('network'), session = sessionFor(f.a), quote = await prepare(f);
  const paypal = await session.start(quote), id = session.snapshot().reference.intentId;
  await control('approve', id); await control('mode', id, { mode: 'slow' });
  realApi.defaults.env = { ...realApi.defaults.env, fetch: async (input, options) => {
    if (!input.url.endsWith('/capturar/')) return realFetch(input, options);
    const abort = new AbortController(), timer = setTimeout(() => abort.abort(), 100);
    try { return await realFetch(input, { ...options, signal: abort.signal }); } finally { clearTimeout(timer); }
  } };
  await session.approve(paypal); assert.equal(session.snapshot().phase, 'pending'); assert.ok(session.snapshot().reference);
  realApi.defaults.env = { ...realApi.defaults.env, fetch: realFetch };
  await delay(650); await session.recover(); assert.equal(session.snapshot().phase, 'paid');
  const stats = await control('stats', id); assert.equal(stats.captures, 1); assert.equal(stats.orders, 1);
});
test('real PostgreSQL connection loss after fake capture preserves marker and recovers without new charge', async () => {
  const f = await fixture('connection'), session = sessionFor(f.a), quote = await prepare(f);
  const paypal = await session.start(quote), id = session.snapshot().reference.intentId;
  await control('approve', id); await control('mode', id, { mode: 'connectionloss' });
  await session.approve(paypal); assert.equal(session.snapshot().phase, 'pending');
  let stats = await control('stats', id); assert.equal(stats.captures, 1); assert.equal(stats.orders, 0);
  await session.recover(); assert.equal(session.snapshot().phase, 'paid');
  stats = await control('stats', id); assert.equal(stats.orders, 1); assert.equal(stats.fulfillments, 1); assert.equal(stats.captures, 1);
});
test('logout of pending intent, owner discovery and reconciliation work with checkout disabled', async () => {
  const f = await fixture('logout'), session = sessionFor(f.a), quote = await prepare(f);
  const paypal = await session.start(quote), id = session.snapshot().reference.intentId;
  await control('approve', id); await control('mode', id, { mode: 'pending' }); await session.approve(paypal);
  authService.logout(); assert.equal(localStorage.getItem(`csti.checkout.v1.${f.a.id}`), null);
  login(f.b); assert.equal((await api.listActive()).count, 0); await assert.rejects(api.get(id), e => e.status === 404);
  login(f.a); await control('disable', id);
  try {
    await assert.rejects(api.quote(1), e => e.code === 'CHECKOUT_DISABLED');
    const page = await api.listActive(); assert.equal(page.count, 1); assert.equal(page.results[0].intent_id, id);
    const reloaded = sessionFor(f.a); reloaded.adoptDiscovered(page.results[0]);
    assert.equal(reloaded.snapshot().reference.key, page.results[0].idempotency_key);
    await control('complete', id); await reloaded.recover(); assert.equal(reloaded.snapshot().phase, 'paid');
    assert.equal((await control('stats', id)).captures, 1);
  } finally { await control('enable', id); }
});
test('account change while capture is in flight cannot show the prior account purchase as paid', async () => {
  const f = await fixture('account'), session = sessionFor(f.a), quote = await prepare(f);
  const paypal = await session.start(quote), id = session.snapshot().reference.intentId;
  await control('approve', id); await control('mode', id, { mode: 'slow' });
  const flight = session.approve(paypal);
  let accepted = false;
  for (let index = 0; index < 30; index++) {
    if ((await control('stats', id)).captures === 1) { accepted = true; break; }
    await delay(10);
  }
  assert.ok(accepted); login(f.b); await flight;
  assert.notEqual(session.snapshot().phase, 'paid'); await assert.rejects(api.get(id), e => e.status === 404);
  login(f.a); const reloaded = sessionFor(f.a); await reloaded.restore(); assert.equal(reloaded.snapshot().phase, 'paid');
});
test('CHECKOUT_DISABLED remains a purchase block after GET while recovery and cancellation remain usable', async () => {
  const f = await fixture('disabled'), session = sessionFor(f.a), quote = await prepare(f);
  const paypal = await session.start(quote), id = session.snapshot().reference.intentId;
  await control('approve', id); await control('disable', id);
  try {
    await session.approve(paypal); assert.equal(session.snapshot().phase, 'unavailable');
    await session.recover();
    await assert.rejects(session.resumeOrder(), e => e.code === 'CHECKOUT_DISABLED');
    await session.approve(paypal); assert.equal((await control('stats', id)).captures, 0);
    await session.cancel(); assert.equal(session.snapshot().phase, 'cancelled');
  } finally { await control('enable', id); }
});
test('browser storage failure blocks intent before any PostgreSQL operation', async () => {
  const f = await fixture('storage'), quote = await prepare(f), session = sessionFor(f.a);
  localStorage.setItem = () => { throw Error('synthetic storage unavailable'); };
  await assert.rejects(session.start(quote), e => e.code === 'STORAGE_UNAVAILABLE');
  const counts = await control('counts', undefined, { user_id: f.a.id }); assert.equal(counts.intents, 0); assert.equal(counts.orders, 0);
});
test('wire evidence includes real 200/201/202/409/410/503 responses', () => {
  for (const status of [200, 201, 202, 409, 410, 503]) assert.ok(wire.some(call => call.status === status), `Missing real HTTP status ${status}`);
});
