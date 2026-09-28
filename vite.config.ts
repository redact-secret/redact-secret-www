import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// Static output: every route below is prerendered to its own
// directory (dist/en/index.html, dist/ko/index.html), matching the
// `directory` routing mode in redact-secret-sites. Links found while
// rendering are crawled too.
export default defineConfig({
  // The playground engine runs in a module worker that dynamically loads wasm.
  worker: { format: 'es' },
  plugins: [
    preact({
      prerender: {
        enabled: true,
        renderTarget: '#app',
        additionalPrerenderRoutes: ['/en', '/ko', '/404'],
      },
    }),
  ],
});
