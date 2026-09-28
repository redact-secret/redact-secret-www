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
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(siteOrigin) });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(siteOrigin) });
      for (const { from, to } of legacyRedirects) {
        this.emitFile({ type: 'asset', fileName: `${from.slice(1)}index.html`, source: legacyRedirectDocument(siteOrigin, to) });
      }
    },
  };
}

// Static output: every route below is prerendered to its own directory
// (dist/index.html, dist/ko/index.html, dist/architecture/…), matching the
// `directory` routing mode in redact-secret-sites. Links found while
// rendering are crawled too: that is how the architecture sub-pages are
// found (every hub links all of them), and CI's build-contract check
// (scripts/check-build-contract.mjs) fails if one is missing.
export default defineConfig({
  // The playground engine runs in a module worker that dynamically loads wasm.
  worker: { format: 'es' },
  plugins: [
    preact({
      prerender: {
        enabled: true,
        renderTarget: '#app',
        additionalPrerenderRoutes: ['/ko', '/404', '/architecture', '/ko/architecture'],
      },
    }),
    siteFiles(),
  ],
});
