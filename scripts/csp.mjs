// The proposed enforcing CSP (the value filed for redact-secret-sites'
// ContentSecurityPolicy parameter), shared by every browser check so they
// all test the same policy. Reads the built dist/, so run after a build.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

/** `wasm: false` drops 'wasm-unsafe-eval' so the playground engine must fail — a control. */
export function proposedCsp({ wasm = true } = {}) {
  const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const themeScriptHash = inline
    .map((body) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`)
    .join(' ');
  return [
    "default-src 'self'",
    `script-src 'self'${wasm ? " 'wasm-unsafe-eval'" : ''} ${themeScriptHash}`,
    "style-src 'self' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    "img-src 'self' data:",
    "connect-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; ');
}
