import { appConfig } from '../config/appConfig';

// Explicit policy: same frontend, configured backend, and Cloudinary image CDN.
// No wildcard subdomains, credentials, non-HTTPS, data/blob or arbitrary origins.
export function safeMediaUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim() || Array.from(value).some(character => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127)) return null;
  try {
    const backend = new URL(appConfig.apiBaseUrl);
    const url = new URL(value, backend);
    const frontendOrigin = typeof window !== 'undefined' ? window.location.origin : null;
    if (url.protocol !== 'https:' || url.username || url.password || /\.svg(?:$|[?#])/i.test(url.href)) return null;
    if (url.origin === backend.origin || url.origin === frontendOrigin) return url.href;
    if (url.origin === 'https://res.cloudinary.com' && /^\/[^/]+\/image\/upload\//.test(url.pathname)) return url.href;
  } catch { /* Malformed configuration or URL fails closed. */ }
  return null;
}
