// First paint without JavaScript or JSON (#11, ADR 0003 § First paint stays
// static). Serves the built site under the proposed enforcing CSP and loads
// every page the renderer writes — both locales and the 404 page — in
// Chromium, Firefox and WebKit, twice:
//
//   1. JavaScript disabled: the page has its complete content — an <h1>,
//      <html lang> of its locale, and a substantial body;
//   2. JavaScript enabled, every JSON request blocked (aborted on even
//      pages, answered 500 on odd ones): no page error, the body's text is
//      exactly the no-JavaScript text (hydration neither empties nor
//      replaces it), and the page is interactive — the language menu opens,
//      which only a hydrated page does.
//
// Usage: npm run check:first-paint   (builds first; exits non-zero on any
// failure). `--negative-control` strips the embedded page data from every
// page: check 1 must still pass (the page stays complete) and check 2's
// interactivity must fail everywhere, or the check is broken.
// `--engine chromium` limits the run to one engine.
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';
import { preview } from 'vite';
import { root } from './data/contracts.mjs';
import { proposedCsp } from './csp.mjs';

const negativeControl = process.argv.includes('--negative-control');
const only = process.argv.includes('--engine') ? process.argv[process.argv.indexOf('--engine') + 1] : undefined;
const engines = [chromium, firefox, webkit].filter((e) => !only || e.name() === only);

const renderer = await import(pathToFileURL(join(root, 'build', 'renderer', 'renderer.mjs')).href);
const pages = [...renderer.pagePaths];

const csp = proposedCsp();
const port = 4176;
const server = await preview({
  preview: { port, strictPort: true, open: false },
  logLevel: 'silent',
  plugins: [
    {
      name: 'first-paint-check-csp',
      configurePreviewServer(srv) {
        srv.middlewares.use((_req, res, next) => {
          res.setHeader('Content-Security-Policy', csp);
          next();
        });
      },
    },
  ],
});
const origin = `http://localhost:${port}`;

/** In the control, the page arrives without its embedded data. */
async function withoutPayload(context) {
  await context.route('**/*', async (route) => {
    const req = route.request();
    if (req.resourceType() !== 'document') return route.continue();
    const res = await route.fetch();
    const html = (await res.text()).replace(/<script type="application\/json" id="page-data">[\s\S]*?<\/script>/, '');
    return route.fulfill({ response: res, body: html });
  });
}

// The playground's output is live by design (the engine runs once hydrated),
// so its section is left out of the before/after text comparison; the
// playground has its own qualification (scripts/qualify-playground.mjs).
const facts = () => {
  const app = document.getElementById('app')?.cloneNode(true);
  app?.querySelector('#playground')?.remove();
  return {
    lang: document.documentElement.lang,
    h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()).filter(Boolean).length,
    text: (app?.textContent ?? '').replace(/\s+/g, ' ').trim(),
  };
};

async function checkEngine(type) {
  const browser = await type.launch();
  const failures = [];
  const fail = (path, what) => failures.push(`${type.name()} ${path}: ${what}`);
  let jsonRequests = 0;
  let interactive = 0;

  for (const [i, path] of pages.entries()) {
    const locale = renderer.localeOfPath(path) ?? 'en';
    const html = await (await fetch(`${origin}${path}`)).text();
    const payload = JSON.parse(/<script type="application\/json" id="page-data">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? 'null');
    if (!payload) {
      fail(path, 'no embedded page data');
      continue;
    }
    const shell = payload.view.shell ?? payload.view.shells.en;

    // 1. No JavaScript at all.
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    if (negativeControl) await withoutPayload(noJs);
    const p1 = await noJs.newPage();
    const r1 = await p1.goto(`${origin}${path}`, { waitUntil: 'load' });
    if (r1?.status() !== 200) fail(path, `status ${r1?.status()} without JavaScript`);
    const still = await p1.evaluate(facts);
    await noJs.close();
    if (still.lang !== locale) fail(path, `<html lang="${still.lang}"> without JavaScript`);
    if (still.h1 < 1) fail(path, 'no <h1> without JavaScript');
    if (still.text.length < 400) fail(path, `only ${still.text.length} characters of content without JavaScript`);

    // 2. JavaScript on, every JSON request failing.
    const js = await browser.newContext();
    await js.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) => console.error(`CSP-VIOLATION ${e.violatedDirective} ${e.blockedURI}`));
    });
    if (negativeControl) await withoutPayload(js);
    await js.route(/\.json(\?|$)/, (route) => {
      jsonRequests++;
      return i % 2 ? route.fulfill({ status: 500, body: 'blocked by check-first-paint' }) : route.abort('failed');
    });
    const p2 = await js.newPage();
    const errors = [];
    p2.on('pageerror', (e) => errors.push(`page error: ${e.message}`));
    p2.on('console', (m) => m.type() === 'error' && /CSP-VIOLATION/.test(m.text()) && errors.push(m.text()));
    const r2 = await p2.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
    if (r2?.status() !== 200) fail(path, `status ${r2?.status()} with JSON blocked`);
    await p2.waitForTimeout(200);
    for (const e of errors) fail(path, e);
    const hydrated = await p2.evaluate(facts);
    if (hydrated.text !== still.text) fail(path, 'hydration changed the page text (it must hydrate the prerendered content, not replace it)');
    const language = p2.getByRole('button', { name: shell.header.languageLabel, exact: true }).first();
    await language.click();
    if ((await language.getAttribute('aria-expanded')) === 'true') interactive++;
    else fail(path, 'not interactive with JSON blocked: the language menu did not open');
    await js.close();
  }
  await browser.close();
  return { failures, jsonRequests, interactive };
}

let failed = false;
try {
  for (const type of engines) {
    const { failures, jsonRequests, interactive } = await checkEngine(type);
    if (negativeControl) {
      // Content must survive; interactivity must not (nothing to hydrate from).
      const contentFailures = failures.filter((f) => !/not interactive/.test(f));
      if (contentFailures.length || interactive > 0) {
        failed = true;
        for (const f of contentFailures) console.error(`first paint control: ${f}`);
        if (interactive > 0) console.error(`first paint control: ${type.name()}: ${interactive} page(s) hydrated without their page data`);
      }
    } else if (failures.length) {
      failed = true;
      for (const f of failures) console.error(`first paint: ${f}`);
    } else {
      console.log(`first paint: ${type.name()}: ${pages.length} pages complete without JavaScript, and hydrated and interactive with every JSON request failing (${jsonRequests} blocked)`);
    }
  }
} finally {
  await server.close();
}
if (failed) process.exit(1);
if (negativeControl) console.log(`first paint negative control: without page data, all ${pages.length} pages stayed complete and none hydrated × ${engines.length} engine(s)`);
