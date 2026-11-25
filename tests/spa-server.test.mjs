import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createSpaServer } from '../scripts/serve-spa.mjs';

async function fixture(t, built = true) {
  const directory = await mkdtemp(join(tmpdir(), 'csti-spa-release-'));
  assert.ok(resolve(directory).startsWith(resolve(tmpdir())));
  if (built) { await writeFile(join(directory, 'index.html'), '<html>synthetic-app</html>');
    await mkdir(join(directory, 'assets')); await writeFile(join(directory, 'assets', 'app.js'), 'console.log("synthetic")');
    await writeFile(join(directory, '.env'), 'never-serve-this'); }
  const server = createSpaServer(directory);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true }); });
  return `http://127.0.0.1:${server.address().port}`;
}
test('SPA root and deep-link navigation serve built index', async t => {
  const origin = await fixture(t);
  for (const path of ['/', '/perfil/pedidos', '/payment']) { const r = await fetch(origin + path); assert.equal(r.status, 200); assert.match(await r.text(), /synthetic-app/); }
});
test('static assets have correct MIME and missing assets never receive SPA HTML', async t => {
  const origin = await fixture(t), asset = await fetch(origin + '/assets/app.js');
  assert.match(asset.headers.get('content-type'), /javascript/); assert.equal(asset.headers.get('x-content-type-options'), 'nosniff');
  for (const path of ['/assets/missing.js', '/assets/missing', '/missing.css']) assert.equal((await fetch(origin + path)).status, 404);
});
test('dotfiles and encoded traversal do not expose private files', async t => {
  const origin = await fixture(t);
  for (const path of ['/.env', '/%2eenv', '/assets/%2e%2e%2f.env', '/%5c.env', '/%zz']) assert.equal((await fetch(origin + path)).status, 404);
});
test('readiness requires a build; liveness remains public', async t => {
  const origin = await fixture(t, false);
  assert.equal((await fetch(origin + '/health/live')).status, 200);
  assert.equal((await fetch(origin + '/health/ready')).status, 503);
});
test('built readiness and security headers support public hosting', async t => {
  const origin = await fixture(t), r = await fetch(origin + '/health/ready');
  assert.equal(r.status, 200); assert.equal(r.headers.get('cross-origin-opener-policy'), 'same-origin-allow-popups');
  assert.equal(r.headers.get('cache-control'), 'no-store');
});
test('HEAD omits body and non-read methods are rejected', async t => {
  const origin = await fixture(t);
  assert.equal(await (await fetch(origin + '/payment', { method: 'HEAD' })).text(), '');
  assert.equal((await fetch(origin + '/payment', { method: 'POST' })).status, 405);
});
