import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// Static output: every route below is prerendered to its own
// directory (dist/en/index.html, dist/ko/index.html), matching the
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
        additionalPrerenderRoutes: ['/en', '/ko', '/404', '/en/architecture', '/ko/architecture'],
      },
    }),
  ],
});
