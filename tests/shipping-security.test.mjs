import './register.mjs';
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, readdirSync } from 'node:fs';
import ts from 'typescript';

let posts, gets;
globalThis.__shippingApi = { post: (...args) => posts(...args), get: (...args) => gets(...args) };
const { shippingService, validateRates, cartQuoteKey, isQuoteCurrent } = await import('../src/services/Shipping.service.ts');
const { default: Gate } = await import('../src/components/ShippingQuoteGate.tsx');
const { default: Timeline } = await import('../src/pages/Profile/components/OrderDetail/TrackingTimeline.tsx');
const { default: Details } = await import('../src/pages/Admin/components/Returns/ReturnDetailsContent.tsx');
const { safeMediaUrl } = await import('../src/utils/safeMediaUrl.ts');
const { revalidateCheckoutShipping } = await import('../src/services/CheckoutShipping.service.ts');
const item = { id: 1, producto: { id: 99 }, cantidad: 1, precio_unitario: 100 };
const context = { addressId: 1, cartKey: cartQuoteKey([item], 100) };
const rawRate = { id: 'rate-1', title: 'Envío estándar', carrier: 'CVA', price: 25, estimated_days: '3-5 días' };
const rate = () => validateRates({ rates: [rawRate] })[0];
const quote = () => ({ ...context, rates: [rate()], expiresAt: Date.now() + 60000 });
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
beforeEach(() => {
  const storage = new Map();
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) };
  posts = async () => ({ data: { rates: [rawRate] } });
  gets = async () => { throw Error('offline'); };
});
test('1. Envia offline rejects rates and default without a fallback', async () => {
  posts = async () => { throw Error('offline'); };
  await assert.rejects(shippingService.getRates(1, [item]), /No fue posible cotizar/);
  await assert.rejects(shippingService.getDefaultRate(1, [item]), /No fue posible cotizar/);
});
test('2. Missing/invalid address cannot quote or call network', async () => {
  posts = () => { assert.fail('Network must not be called'); };
  for (const id of [0, -1, null, undefined, NaN, Infinity, 1.2, '1']) await assert.rejects(shippingService.getRates(id, [item]));
});
test('3. Empty, corrupt, duplicate and invalid tariffs reject entire response', () => {
  for (const data of [null, {}, { rates: {} }, { rates: [] }, { rates: [null] }, { rates: [rawRate, rawRate] }]) assert.throws(() => validateRates(data));
  for (const price of [-1, NaN, Infinity, '', ' ', '-1', 'NaN', null, true, {}, '1e2']) assert.throws(() => validateRates({ rates: [{ ...rawRate, price }] }));
  for (const change of [{ id: '' }, { id: null }, { title: 1 }, { carrier: '' }]) assert.throws(() => validateRates({ rates: [{ ...rawRate, ...change }] }));
});
test('Valid quotes normalize decimal strings, accept zero and send product ids', async () => {
  assert.equal(validateRates({ rates: [{ ...rawRate, price: '12.50' }] })[0].price, 12.5);
  assert.equal(validateRates({ rates: [{ ...rawRate, price: 0 }] })[0].price, 0);
  posts = async (url, body, options) => {
    assert.match(url, /cotizar/); assert.deepEqual(body, { direccionID: 1, productos: [99] });
    assert.equal(options.timeout, 15000); return { data: { rates: [rawRate] } };
  };
  assert.equal((await shippingService.getQuote(context, [item])).rates[0].price, 25);
});
test('4. Corrupt/legacy/manipulated localStorage never throws or supplies a price', () => {
  for (const value of ['{', 'null', '[]', JSON.stringify({ ...rawRate, price: -150 }), JSON.stringify({ ...rawRate, price: 1 })]) {
    localStorage.setItem('selectedShippingRate', value);
    assert.equal(shippingService.getSelectedRateId(context), null);
  }
  shippingService.saveSelectedRate(rate(), context);
  assert.deepEqual(JSON.parse(localStorage.getItem('selectedShippingRate')), { version: 1, rateId: 'rate-1', ...context });
  assert.equal(shippingService.getSelectedRateId(context), 'rate-1');
  assert.equal(shippingService.getSelectedRateId({ ...context, addressId: 2 }), null);
});
test('Storage access denied is recoverable', () => {
  globalThis.localStorage = { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); }, removeItem() { throw Error('denied'); } };
  assert.equal(shippingService.getSelectedRateId(context), null);
  assert.doesNotThrow(() => shippingService.saveSelectedRate(rate(), context));
  assert.doesNotThrow(() => shippingService.clearSelectedRate());
});
test('5. PayPal child never mounts without fresh current quote and selected rate', () => {
  let renders = 0;
  const FakePayPal = () => { renders++; return React.createElement('button', null, 'PAYPAL_MOCK'); };
  for (const candidate of [null, { ...quote(), expiresAt: 0 }, { ...quote(), addressId: 2 }, { ...quote(), cartKey: 'changed' }, { ...quote(), rates: [] }]) {
    const html = render(Gate, { quote: candidate, context, selectedRateId: 'rate-1', children: React.createElement(FakePayPal) });
    assert.doesNotMatch(html, /PAYPAL_MOCK/); assert.match(html, /bloqueado/);
  }
  assert.equal(renders, 0);
  assert.doesNotMatch(render(Gate, { quote: quote(), context, selectedRateId: 'tampered', children: React.createElement(FakePayPal) }), /PAYPAL_MOCK/);
  assert.match(render(Gate, { quote: quote(), context, selectedRateId: 'rate-1', children: React.createElement(FakePayPal) }), /PAYPAL_MOCK/);
  assert.equal(renders, 1);
});
test('Cart quantity, price, total and address changes invalidate previous quote', () => {
  for (const key of [cartQuoteKey([{ ...item, cantidad: 2 }], 100), cartQuoteKey([{ ...item, precio_unitario: 200 }], 100), cartQuoteKey([item], 200)]) assert.equal(isQuoteCurrent(quote(), { ...context, cartKey: key }), false);
  assert.equal(isQuoteCurrent(quote(), { ...context, addressId: 2 }), false);
});
const address = { id: 1, codigo_postal: '76120', calle: 'Calle de prueba' };
const checkoutGets = async url => ({ data: url.includes('mi-carrito') ? { items: [item], total: 100 } : [address] });
test('Checkout revalidates current cart, address and backend rate before proceeding', async () => {
  gets = checkoutGets;
  assert.equal((await revalidateCheckoutShipping(quote(), context, 'rate-1', address)).price, 25);
});
test('Checkout rejects changed/removed cart, address and rate or provider offline', async () => {
  gets = async url => ({ data: url.includes('mi-carrito') ? { items: [{ ...item, cantidad: 2 }], total: 200 } : [address] });
  await assert.rejects(revalidateCheckoutShipping(quote(), context, 'rate-1', address), /carrito o la dirección/);
  gets = checkoutGets;
  await assert.rejects(revalidateCheckoutShipping(quote(), context, 'rate-1', { ...address, codigo_postal: '00000' }));
  for (const rates of [[], [{ ...rawRate, price: 99 }], [{ ...rawRate, id: 'new' }]]) {
    posts = async () => ({ data: { rates } });
    await assert.rejects(revalidateCheckoutShipping(quote(), context, 'rate-1', address));
  }
  posts = async () => { throw Error('offline'); };
  await assert.rejects(revalidateCheckoutShipping(quote(), context, 'rate-1', address));
});
test('A valid-looking stored price cannot replace fresh backend rate', async () => {
  localStorage.setItem('selectedShippingRate', JSON.stringify({ version: 1, rateId: 'rate-1', ...context, price: 0 }));
  const preferred = shippingService.getSelectedRateId(context);
  const fresh = await shippingService.getQuote(context, [item]);
  assert.equal(fresh.rates.find(candidate => candidate.id === preferred).price, 25);
});
test('6/7. Ancient EN_TRANSITO stays in transit offline without invented guide/carrier/events', async () => {
  const data = await shippingService.getTracking('1', { estado_envio: 'EN_TRANSITO', creado_en: '2000-01-01', actualizado_en: '2000-01-02' });
  assert.equal(data.status, 'EN_TRANSITO'); assert.equal(data.tracking_number, null); assert.equal(data.carrier, null);
  assert.equal(data.delivered_date, null); assert.equal(data.estimated_delivery, null); assert.equal(data.events, undefined);
  assert.equal(data.source, 'order'); assert.match(data.message, /último estado confirmado/);
  const html = render(Timeline, { trackingData: data });
  assert.doesNotMatch(html, /782349102384|FedEx|Entregado|firma electrónica/);
  assert.match(html, /En camino/); assert.match(html, /Aún no asignada/);
});
test('Unavailable tracking does not manufacture an initial status', async () => {
  const data = await shippingService.getTracking('1');
  assert.equal(data.source, 'unavailable'); assert.equal(data.status, null);
  assert.match(render(Timeline, { trackingData: data }), /Rastreo temporalmente no disponible/);
});
test('Past backend estimate never confirms delivery', async () => {
  gets = async () => ({ data: { status: 'EN_TRANSITO', carrier: 'Real', tracking_number: 'CONFIRMED-1', estimated_delivery: '2000-01-01', delivered_date: '2000-01-02' } });
  const data = await shippingService.getTracking('1');
  assert.equal(data.status, 'EN_TRANSITO'); assert.equal(data.tracking_number, 'CONFIRMED-1'); assert.equal(data.delivered_date, null);
  assert.match(render(Timeline, { trackingData: data }), /No constituye confirmación de entrega/);
});
test('Unknown provider payload falls back to confirmed order', async () => {
  gets = async () => ({ data: { live_tracking: [{ date: '2000-01-01' }] } });
  const data = await shippingService.getTracking('1', { estado_envio: 'RECOLECTADO', numero_de_guia: 'REAL' });
  assert.equal(data.status, 'RECOLECTADO'); assert.equal(data.tracking_number, 'REAL'); assert.equal(data.source, 'order');
});
test('8. Modal treats user HTML as escaped text in all fields', () => {
  const payload = '<img src=x onerror="alert(1)"><script>injected()</script>';
  const html = render(Details, { details: { cliente_nombre: payload, cliente_email: payload, motivo: payload, comentarios: payload } });
  assert.doesNotMatch(html, /<script|<img|<iframe|<svg/);
  assert.ok(html.includes('&lt;img')); assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('Información del Cliente')); assert.ok(html.includes('Detalles Adicionales'));
});
test('9. Dangerous evidence URLs create no active images or links', () => {
  for (const url of ['javascript:alert(1)', 'data:image/svg+xml,<svg onload=alert(1)>', 'blob:https://api.example.test/a', 'http://api.example.test/a.png', 'https://evil.test/x.png', 'https://api.example.test.evil.test/x.png', 'https://u:p@api.example.test/x.png', 'https://api.example.test/x.svg', '//evil.test/x.png']) {
    assert.equal(safeMediaUrl(url), null);
    const html = render(Details, { details: { evidencias: [{ imagen: url }] } });
    assert.doesNotMatch(html, /<img|<a\b|<iframe|<script/); assert.match(html, /URL no está permitida/);
  }
});
test('Allowed evidence preserves images without injecting HTML attributes', () => {
  for (const url of ['https://api.example.test/media/evidence.png', '/media/evidence.png', 'https://res.cloudinary.com/account/image/upload/evidence.jpg']) {
    assert.ok(safeMediaUrl(url)); assert.match(render(Details, { details: { evidencias: [{ imagen: url }] } }), /<img/);
  }
  const html = render(Details, { details: { evidencias: [{ imagen: 'https://api.example.test/a.png"onerror="evil()' }] } });
  assert.doesNotMatch(html, /\sonerror=/);
});
test('SweetAlert user-controlled errors cannot regress to HTML sinks', () => {
  const walk = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
  const violations = [];
  for (const file of walk('src').filter(name => /\.tsx?$/.test(name))) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const visit = node => {
      if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'html' && file !== 'src/utils/reactAlert.tsx') violations.push(`${file}: dynamic html option`);
      if (ts.isCallExpression(node) && node.expression.getText(source) === 'Swal.fire' && node.arguments.length > 1 && !ts.isStringLiteralLike(node.arguments[1])) violations.push(`${file}: dynamic positional HTML argument`);
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  assert.deepEqual(violations, []);
});
