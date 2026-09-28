import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { siteOrigin } from './src/content/shared';
import { legacyRedirectDocument, legacyRedirects, robotsTxt, sitemapXml } from './src/routes';

/**
 * Files that are not rendered pages but must agree with the route registry
 * (src/routes.ts): sitemap.xml, robots.txt, and a fallback redirect document
 * at every legacy /en/** path (ADR 0003).
 */
function siteFiles(): Plugin {
  return {
    name: 'site-files',
    // The client build only: the renderer build (scripts/build-site.mjs) writes no site files.
    apply: (_config, { command, isSsrBuild }) => command === 'build' && !isSsrBuild,
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(siteOrigin) });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(siteOrigin) });
      for (const { from, to } of legacyRedirects) {
        this.emitFile({ type: 'asset', fileName: `${from.slice(1)}index.html`, source: legacyRedirectDocument(siteOrigin, to) });
      }
    },
  };
}

// The client build: dist/assets/ (hashed, copy-independent) and dist/index.html
// as the page template. It holds no copy and no data. scripts/build-site.mjs
// runs it, then builds the renderer (src/render.tsx) and renders every page of
// both route sets into its own directory (dist/index.html, dist/ko/index.html,
// dist/architecture/…), matching the `directory` routing mode in
// redact-secret-sites; CI's build-contract check
// (scripts/check-build-contract.mjs) fails if one is missing.
export default defineConfig({
  // The playground engine runs in a module worker that dynamically loads wasm.
  worker: { format: 'es' },
  plugins: [preact(), siteFiles()],
});
