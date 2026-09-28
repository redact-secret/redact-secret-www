// Builds the site in three steps (the last step of `npm run build`):
//
//   1. the client (vite.config.ts): dist/assets/ — hashed JS, CSS, WASM and the
//      worker, none of which holds copy or data — and dist/index.html, the page
//      template that references them;
//   2. the renderer (src/render.tsx): one self-contained ES module,
//      build/renderer/renderer.mjs, plus the template it renders against,
//      build/renderer/template.html. This pair is the renderer artifact an
//      application release publishes and a content release renders with (#11);
//   3. every page of both route sets, rendered by that module file (not by the
//      source) from i18n/ and data/, into dist/<path>/index.html.
//
// Rendering dist/ through the artifact itself is what qualifies it: the HTML
// CI checks in three browsers is the HTML the artifact produces.
//
//   node scripts/build-site.mjs                build client, renderer, pages
//   node scripts/build-site.mjs --render-only  re-render dist/ pages from the working tree
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { root } from './data/contracts.mjs';

export const distDir = join(root, 'dist');
export const rendererDir = join(root, 'build', 'renderer');

const renderOnly = process.argv.includes('--render-only');

if (!renderOnly) {
  await build({ root, logLevel: 'warn' });
  mkdirSync(rendererDir, { recursive: true });
  await build({
    root,
    logLevel: 'warn',
    publicDir: false,
    build: {
      ssr: 'src/render.tsx',
      outDir: rendererDir,
      emptyOutDir: true,
      copyPublicDir: false,
      minify: false,
      rollupOptions: { output: { format: 'es', entryFileNames: 'renderer.mjs', codeSplitting: false } },
    },
    // Self-contained: preact and every other dependency bundled in, so the
    // artifact runs on any Node without this repository's node_modules.
    ssr: { noExternal: true, target: 'node' },
  });
  copyFileSync(join(distDir, 'index.html'), join(rendererDir, 'template.html'));
}

const renderer = await import(`${pathToFileURL(join(rendererDir, 'renderer.mjs')).href}?t=${Date.now()}`);
const template = readFileSync(join(rendererDir, 'template.html'), 'utf8');
const files = Object.fromEntries(renderer.inputFiles().map((p) => [p, JSON.parse(readFileSync(join(root, p), 'utf8'))]));
const pages = await renderer.renderSite(template, files);
for (const page of pages) {
  const out = join(distDir, page.file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, page.html);
}
console.log(`build-site: rendered ${pages.length} pages with build/renderer/renderer.mjs`);
