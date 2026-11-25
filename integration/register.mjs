import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import { after } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

export const origin = 'https://127.0.0.1:58080';
export const wire = [];
let forbidden = 0;
const deny = () => { forbidden++; throw Error('Integration permits only loopback fixture HTTPS'); };
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const options = Array.isArray(args[0]) ? args[0][0] : args[0];
  const port = typeof options === 'object' ? options.port : options;
  const host = typeof options === 'object' ? options.host : args[1];
  if (String(port) !== '58080' || host !== '127.0.0.1') return deny();
  return connect.apply(this, args);
};
const fetchLocal = globalThis.fetch.bind(globalThis);
globalThis.fetch = async (input, options) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (url.origin !== origin) return deny();
  const response = await fetchLocal(input, options);
  wire.push({ method: options?.method ?? input.method ?? 'GET', path: url.pathname, status: response.status });
  return response;
};
after(() => assert.equal(forbidden, 0, 'No external network attempted'));
registerHooks({
  resolve(specifier, context, next) {
    if (/appConfig$/.test(specifier)) return { url: 'phase4:config', shortCircuit: true };
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const url = new URL(specifier, context.parentURL);
      for (const ext of ['', '.ts', '.tsx']) if (existsSync(fileURLToPath(url) + ext)) return { url: url.href + ext, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === 'phase4:config') return { format: 'module', source: `export const appConfig = { apiBaseUrl: '${origin}' };`, shortCircuit: true };
    if (url.endsWith('.css')) return { format: 'module', source: 'export default {};', shortCircuit: true };
    if (/\.tsx?$/.test(url)) return { format: 'module', shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
      fileName: fileURLToPath(url), compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
    }).outputText };
    return next(url, context);
  },
});
