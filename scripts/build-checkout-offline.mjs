// Same TypeScript project build and Vite pipeline, without loading any .env file.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { build } from 'vite';
const root = fileURLToPath(new URL('../', import.meta.url));
for (const name of Object.keys(process.env)) if (name.startsWith('VITE_')) delete process.env[name];
process.env.VITE_API_BASE_URL = 'http://127.0.0.1:8000';
process.env.VITE_PAYPAL_CLIENT_ID = 'synthetic-client-not-commercial';
execFileSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '-b'], { cwd: root, stdio: 'inherit' });
await build({ root, envDir: false, mode: 'checkout-offline', build: { outDir: process.argv.includes('--release-artifact') ? 'dist' : 'node_modules/.cache/checkout-offline-dist' } });
