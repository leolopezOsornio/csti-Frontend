import './register.mjs';
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { memoryStorage, quoteFixture } from './checkout-fixtures.mjs';
globalThis.__realApiForTests = true;
let calls, respond;
axios.defaults.adapter = 'fetch';
axios.defaults.env = { ...axios.defaults.env, fetch: async request => { calls.push(request); return respond(request); } };
const { checkoutService } = await import('../src/services/Checkout.service.ts');
beforeEach(() => {
  globalThis.localStorage = memoryStorage(); globalThis.sessionStorage = memoryStorage();
  localStorage.setItem('access_token', 'synthetic-A'); localStorage.setItem('refresh_token', 'synthetic-refresh-A');
  calls = [];
  respond = async () => new Response(JSON.stringify(quoteFixture()), { status: 201, headers: { 'Content-Type': 'application/json' } });
});
test('real authenticated Axios sends JWT and exact JSON for a quote, without financial input', async () => {
  await checkoutService.quote(12); assert.equal(calls.length, 1);
  assert.equal(calls[0].headers.get('authorization'), 'Bearer synthetic-A');
  assert.deepEqual(await calls[0].json(), { direccionID: 12 });
});
test('checkout 401 is terminal for this request: no automatic POST replay or refresh under another account', async () => {
  respond = async () => new Response('{}', { status: 401 });
  await assert.rejects(checkoutService.quote(12)); assert.equal(calls.length, 1);
  assert.ok(!calls[0].url.includes('refresh'));
});
test('account token changed before Axios dispatch rejects before fetch', async () => {
  const pending = checkoutService.quote(12);
  localStorage.setItem('access_token', 'synthetic-B');
  await assert.rejects(pending); assert.equal(calls.length, 0);
});
