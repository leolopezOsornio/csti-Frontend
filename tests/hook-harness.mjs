import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Unit lifecycle scheduler using public hook semantics (Object.is dependencies,
// batched state updates, effect cleanup). It executes the real hook source; it
// is not a browser renderer or a substitute for React DOM/StrictMode E2E tests.
export function hookHarness(sourcePath, shippingService, isQuoteCurrent) {
  const slots = [], timers = new Map();
  let cursor = 0, dirty = false, pending = [], factory, value, timerId = 0;
  const same = (a, b) => !!a && a.length === b.length && a.every((item, index) => Object.is(item, b[index]));
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      const set = update => {
        const next = typeof update === 'function' ? update(slots[index].value) : update;
        if (!Object.is(next, slots[index].value)) { slots[index].value = next; dirty = true; }
      };
      return [slots[index].value, set];
    },
    useMemo(create, dependencies) {
      const index = cursor++;
      if (!same(slots[index]?.dependencies, dependencies)) slots[index] = { value: create(), dependencies };
      return slots[index].value;
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      if (!same(slots[index]?.dependencies, dependencies)) pending.push(() => {
        slots[index]?.cleanup?.();
        slots[index] = { dependencies, cleanup: effect() };
      });
    },
  };
  const exports = {};
  const source = ts.transpileModule(readFileSync(sourcePath, 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
  } }).outputText;
  vm.runInNewContext(source, { exports,
    require(name) {
      if (name === 'react') return hooks;
      if (name.endsWith('Shipping.service')) return { shippingService, isQuoteCurrent };
      throw Error(`Unexpected hook dependency: ${name}`);
    },
    setTimeout(callback) { const id = ++timerId; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  const render = (inputFactory = factory) => {
    factory = inputFactory; cursor = 0; dirty = false; pending = [];
    value = exports.useShippingQuote(...factory());
    for (const commit of pending) commit();
    return value;
  };
  return { render,
    get value() { return value; },
    get timerCount() { return timers.size; },
    async flush(limit = 20) {
      for (let turn = 0; turn < limit; turn++) {
        await new Promise(setImmediate);
        if (!dirty) return value;
        render();
      }
      throw Error('Quotation render loop exceeded 20 updates');
    },
    dispose() { for (const slot of slots) slot?.cleanup?.(); },
  };
}
