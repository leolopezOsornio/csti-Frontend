import './register.mjs';
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import axios from 'axios';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Real Axios, its fetch adapter, and the application's JWT/refresh interceptors.
// Only fetch and browser download DOM/URL APIs are replaced. No network is used.
globalThis.__realApiForTests = true;
let handler, requests, clicks, liveUrls, created, revoked, failClick;
const fakeFetch = async request => {
  assert.ok(request instanceof Request);
  requests.push({ url: request.url, method: request.method,
    authorization: request.headers.get('authorization'), redirect: request.redirect });
  return handler(request);
};
axios.defaults.adapter = 'fetch';
axios.defaults.env = { ...axios.defaults.env, fetch: fakeFetch };
const { billingService, protectedInvoiceUrl, InvoiceDownloadError } = await import('../src/services/Billing.service.ts');
const { default: api } = await import('../src/services/Api.service.ts');
const { default: InvoiceDownloads } = await import('../src/components/InvoiceDownloads/InvoiceDownloads.tsx');
const backend = 'https://api.example.test';
const invoice = { id: 8, orden_id: 12, facturapi_id: 'provider-id-test', uuid: 'uuid-test',
  pdf_url: `${backend}/api/facturacion/descargar/invoice-test/pdf/`,
  xml_url: `${backend}/api/facturacion/descargar/invoice-test/xml/` };
const pdf = () => new Response('%PDF-1.7\nfixture', { headers: { 'Content-Type': 'application/pdf' } });
const xml = () => new Response('<?xml version="1.0"?><cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4"/>',
  { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
};
beforeEach(() => {
  requests = []; clicks = []; liveUrls = new Set(); created = 0; revoked = 0; failClick = false;
  globalThis.localStorage = storage(); globalThis.sessionStorage = storage();
  localStorage.setItem('access_token', 'owner-test-token');
  globalThis.window = { location: { href: '/perfil', origin: 'https://shop.example.test' } };
  globalThis.document = {
    body: { appendChild(anchor) { anchor.attached = true; } },
    createElement(tag) {
      assert.equal(tag, 'a');
      return { style: {}, remove() { this.attached = false; }, click() {
        assert.ok(this.attached);
        if (failClick) throw Error('click failed');
        clicks.push({ href: this.href, download: this.download });
      } };
    },
  };
  URL.createObjectURL = blob => { assert.ok(blob instanceof Blob); const url = `blob:fixture-${++created}`; liveUrls.add(url); return url; };
  URL.revokeObjectURL = url => { assert.ok(liveUrls.delete(url)); revoked++; };
  handler = request => request.url.endsWith('/xml/') ? xml() : pdf();
});

test('Owner downloads PDF/XML through real Axios JWT with safe names and URL cleanup', async () => {
  await billingService.downloadInvoice(invoice, 'pdf');
  await billingService.downloadInvoice(invoice, 'xml');
  assert.equal(requests.length, 2);
  assert.ok(requests.every(request => request.authorization === 'Bearer owner-test-token'));
  assert.ok(requests.every(request => request.redirect === 'error' && !new URL(request.url).search));
  assert.deepEqual(clicks.map(click => click.download), ['factura-uuid-test.pdf', 'factura-uuid-test.xml']);
  assert.equal(created, 2); assert.equal(revoked, 2); assert.equal(liveUrls.size, 0);
});
test('Anonymous 401 surfaces a session message and creates no download', async () => {
  localStorage.removeItem('access_token');
  handler = request => { assert.equal(request.headers.get('authorization'), null); return json({ detail: 'unauthorized' }, 401); };
  await assert.rejects(billingService.downloadInvoice(invoice, 'pdf'), error => error.status === 401 && /sesión/.test(error.message));
  assert.equal(created, 0); assert.equal(clicks.length, 0);
});
for (const [status, message] of [[403, /permiso/], [404, /no pertenece/], [502, /proveedor fiscal no está disponible/], [504, /tardó demasiado/]]) {
  test(`Fiscal HTTP ${status} produces clear error without an Object URL`, async () => {
    localStorage.setItem('access_token', 'other-test-token');
    handler = () => json({ detail: 'synthetic backend denial/provider error' }, status);
    await assert.rejects(billingService.downloadInvoice(invoice, 'pdf'), error => error instanceof InvoiceDownloadError && error.status === status && message.test(error.message));
    assert.equal(created, 0);
  });
}
test('Expired access refreshes with real interceptor and retries using new Bearer', async () => {
  localStorage.setItem('access_token', 'expired-test-token');
  localStorage.setItem('refresh_token', 'refresh-test-token');
  handler = request => {
    if (request.url.endsWith('/token/refresh/')) return json({ access: 'renewed-test-token' });
    return request.headers.get('authorization') === 'Bearer renewed-test-token' ? pdf() : json({}, 401);
  };
  await billingService.downloadInvoice(invoice, 'pdf');
  assert.equal(requests.length, 3);
  assert.equal(requests[2].authorization, 'Bearer renewed-test-token');
  assert.equal(clicks.length, 1); assert.equal(revoked, 1);
});
test('Expired refresh clears tokens and reports 401 without forced fiscal navigation', async () => {
  localStorage.setItem('refresh_token', 'expired-refresh-test-token');
  handler = () => json({}, 401);
  await assert.rejects(billingService.downloadInvoice(invoice, 'pdf'), error => error.status === 401 && /Inicia sesión/.test(error.message));
  assert.equal(localStorage.getItem('access_token'), null);
  assert.equal(localStorage.getItem('refresh_token'), null);
  assert.equal(window.location.href, '/perfil'); assert.equal(created, 0);
});
test('The default auth redirect for other API consumers remains unchanged', async () => {
  localStorage.setItem('refresh_token', 'expired-refresh-test-token');
  handler = () => json({}, 401);
  await assert.rejects(api.get('/accounts/api/perfil/'));
  assert.equal(window.location.href, '/login');
});
test('External, HTTP, credential, token-query and non-fiscal URLs are rejected before fetch', async () => {
  for (const url of ['https://facturapi.example.test/document.pdf', 'http://api.example.test/api/facturacion/a',
    'javascript:alert(1)', '//evil.example.test/pdf/', `${invoice.pdf_url}?token=DO_NOT_SEND`,
    `${invoice.pdf_url}#fragment`, 'https://u:p@api.example.test/api/facturacion/a',
    'https://api.example.test.evil.test/api/facturacion/a', `${backend}/accounts/api/perfil/`]) {
    assert.throws(() => protectedInvoiceUrl(url), InvoiceDownloadError);
    await assert.rejects(billingService.downloadInvoice({ ...invoice, pdf_url: url }, 'pdf'));
  }
  assert.equal(requests.length, 0); assert.equal(created, 0);
});
test('Historical/order identifiers obtain current URLs from authenticated metadata, without issuing CFDI', async () => {
  handler = request => {
    assert.equal(request.method, 'GET');
    return request.url.endsWith('/mis-facturas/') ? json([invoice]) : pdf();
  };
  await billingService.downloadInvoice({ orden_id: 12 }, 'pdf');
  assert.equal(requests.length, 2); assert.equal(clicks.length, 1);
  assert.ok(requests.every(request => request.authorization === 'Bearer owner-test-token'));
});
test('Missing historical invoice is a recoverable 404; legacy external URL never opens', async () => {
  handler = () => json([]);
  await assert.rejects(billingService.downloadInvoice({ orden_id: 99 }, 'xml'), error => error.status === 404);
  await assert.rejects(billingService.downloadInvoice({ ...invoice, pdf_url: 'https://old-provider.example.test/a.pdf' }, 'pdf'));
  assert.equal(created, 0);
});
test('Historical invoice/provider identifiers resolve protected PDF and XML from current metadata', async () => {
  handler = request => request.url.endsWith('/mis-facturas/') ? json([invoice]) : request.url.endsWith('/xml/') ? xml() : pdf();
  await billingService.downloadInvoice({ id: invoice.id }, 'pdf');
  await billingService.downloadInvoice({ facturapi_id: invoice.facturapi_id }, 'xml');
  assert.equal(requests.length, 4); assert.equal(clicks.length, 2); assert.equal(liveUrls.size, 0);
});
test('Concurrent history/detail downloads share the same in-flight document request', async () => {
  let release;
  const waiting = new Promise(resolve => { release = resolve; });
  handler = async () => { await waiting; return pdf(); };
  const first = billingService.downloadInvoice(invoice, 'pdf');
  const duplicate = billingService.downloadInvoice({ orden_id: invoice.orden_id }, 'pdf');
  assert.equal(first, duplicate);
  release(); await Promise.all([first, duplicate]);
  assert.equal(requests.length, 1); assert.equal(clicks.length, 1); assert.equal(liveUrls.size, 0);
});
test('Consecutive downloads and failed clicks release every temporary URL and allow retry', async () => {
  for (let i = 0; i < 4; i++) { await billingService.downloadInvoice(invoice, 'pdf'); assert.equal(liveUrls.size, 0); }
  failClick = true;
  await assert.rejects(billingService.downloadInvoice(invoice, 'pdf'));
  assert.equal(liveUrls.size, 0);
  failClick = false; await billingService.downloadInvoice(invoice, 'pdf');
  assert.equal(created, 6); assert.equal(revoked, 6);
});
test('A logout or account change while downloading cannot save the previous session document', async () => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  handler = async () => { await pending; return pdf(); };
  const download = billingService.downloadInvoice(invoice, 'pdf');
  await new Promise(setImmediate);
  localStorage.setItem('access_token', 'different-account-test-token');
  release();
  await assert.rejects(download, /sesión cambió/);
  assert.equal(created, 0);
});
test('Invalid MIME, JSON/HTML masquerading as invoice, empty and partial bodies cannot download', async () => {
  for (const response of [json({ error: 'upstream' }), new Response('<html>error</html>', { headers: { 'Content-Type': 'application/pdf' } }),
    new Response('', { headers: { 'Content-Type': 'application/pdf' } }),
    new Response('%PDF-partial', { status: 206, headers: { 'Content-Type': 'application/pdf' } })]) {
    handler = () => response;
    await assert.rejects(billingService.downloadInvoice(invoice, 'pdf'));
  }
  handler = () => new Response('<error/>', { headers: { 'Content-Type': 'text/xml' } });
  await assert.rejects(billingService.downloadInvoice(invoice, 'xml'));
  assert.equal(created, 0);
});
test('Untrusted names cannot affect extension, path, attributes or execute HTML', async () => {
  await billingService.downloadInvoice({ ...invoice, uuid: '../../<img onerror="attack()">\nfile.exe' }, 'pdf');
  assert.match(clicks[0].download, /^factura-[A-Za-z0-9_-]{1,64}\.pdf$/);
});
test('Redirect responses never become provider downloads', async () => {
  handler = request => { assert.equal(request.redirect, 'error'); return new Response(null, { status: 302, headers: { Location: 'https://external.example.test/a.pdf' } }); };
  await assert.rejects(billingService.downloadInvoice(invoice, 'pdf'));
  assert.equal(requests.length, 1); assert.equal(created, 0);
});
test('History and order detail use the same reusable authenticated download controls', () => {
  const paths = ['src/pages/Profile/components/Invoices/InvoicesList.tsx', 'src/pages/Profile/components/OrderDetail/OrderDetail.tsx'];
  for (const path of paths) {
    const source = readFileSync(path, 'utf8');
    assert.match(source, /<InvoiceDownloads\b/);
    assert.doesNotMatch(source, /window\.open|href=\{[^\n]*(pdf_url|xml_url|facturapi_id)/);
  }
  const html = renderToStaticMarkup(React.createElement(InvoiceDownloads, { invoice }));
  assert.match(html, /Descargar factura PDF/); assert.match(html, /Descargar factura XML/);
  assert.doesNotMatch(html, /<a\b|https:\/\/api/);
});
