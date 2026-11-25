import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Real TS/TSX + React server renderer; network/config/styles replaced offline.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (/Api\.service$/.test(specifier) && !globalThis.__realApiForTests) return { url: 'mock:api', shortCircuit: true };
    if (/appConfig$/.test(specifier)) return { url: 'mock:config', shortCircuit: true };
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const url = new URL(specifier, context.parentURL);
      for (const extension of ['', '.ts', '.tsx']) {
        if (existsSync(fileURLToPath(url) + extension)) return { url: url.href + extension, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'mock:api') return { format: 'module', source: 'export default globalThis.__shippingApi;', shortCircuit: true };
    if (url === 'mock:config') return { format: 'module', source: "export const appConfig = { apiBaseUrl: 'https://api.example.test' };", shortCircuit: true };
    if (url.endsWith('.css')) return { format: 'module', source: 'export default {};', shortCircuit: true };
    if (/\.tsx?$/.test(url)) {
      const source = ts.transpileModule(readFileSync(new URL(url), 'utf8'), { compilerOptions: {
        target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX,
      }, fileName: fileURLToPath(url) }).outputText;
      return { format: 'module', source, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
