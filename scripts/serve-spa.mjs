import { createServer } from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { resolve, extname, relative, sep, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const inside = (root, target) => { const path = relative(root, target); return !isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`) && !path.startsWith(sep); };
export function createSpaServer(root) {
  root = resolve(root);
  return createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    response.setHeader('Cache-Control', 'no-store');
    const send = (code, body, type = 'text/plain; charset=utf-8') => {
      response.statusCode = code; response.setHeader('Content-Type', type);
      response.end(request.method === 'HEAD' ? undefined : body);
    };
    if (!['GET', 'HEAD'].includes(request.method)) { response.setHeader('Allow', 'GET, HEAD'); return send(405, 'Method not allowed'); }
    try {
      const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (path === '/health/live') return send(200, '{"status":"ok"}', 'application/json');
      if (path === '/health/ready') {
        try {
          const entry = await stat(resolve(root, 'index.html'));
          if (!entry.isFile() || !entry.size) throw Error('missing build');
          return send(200, '{"status":"ok"}', 'application/json');
        }
        catch { return send(503, '{"status":"unavailable"}', 'application/json'); }
      }
      if (path.includes('\\') || path.split('/').some(part => part.startsWith('.'))) return send(404, 'Not found');
      let target = resolve(root, `.${path}`);
      if (!inside(root, target)) return send(404, 'Not found');
      try {
        const info = await stat(target);
        if (!info.isFile()) throw Error('directory');
      } catch {
        if (extname(path) || path.startsWith('/assets/')) return send(404, 'Not found');
        target = resolve(root, 'index.html');
      }
      const actual = await realpath(target);
      if (!inside(root, actual)) return send(404, 'Not found');
      const type = types[extname(target)];
      if (!type) return send(404, 'Not found');
      const data = await readFile(actual);
      response.setHeader('Cache-Control', type.startsWith('text/html') ? 'no-store' : 'public, max-age=3600');
      send(200, data, type);
    } catch { send(404, 'Not found'); }
  });
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Valid PORT is required');
  createSpaServer(fileURLToPath(new URL('../dist/', import.meta.url))).listen(port, '0.0.0.0');
}
