// Browser checks for the community page (ADR 0004). Serves the built site
// under the proposed enforcing CSP and drives /community/ and
// /ko/community/ in Chromium, Firefox, and WebKit, at a phone width (360px)
// and a desktop width (1280px), with the real @redact-secret/core:
//
//   1. the page loads with no page error, console error, failed request or
//      CSP violation; lang, one <h1>, the header marks Community current;
//   2. no horizontal page scroll;
//   3. Continue starts off, and says why (title, required fields, safety box);
//   4. a filled, clean form turns Continue on, and its address is exactly
//      the GitHub form with every field as a parameter (title prefixed);
//   5. the synthetic fixture in a field is found: Continue goes off, the
//      field is marked invalid, the address is hidden, and the value never
//      appears anywhere on the page outside the field itself;
//   6. an address over the limit keeps Continue off;
//   7. every kind is selectable; the hash follows; on a phone the form
//      scrolls into view; #question deep-links; discussions use a category;
//      the security kind has no fields, only the private advisory;
//   8. nothing typed leaves the page: no request and no storage carries it;
//   9. the language switch goes to the same page in the other locale.
//
// Usage: npm run check:community   (builds first). `--engine chromium` limits
// the run to one engine; `--shots <dir>` saves a screenshot per locale and
// width. `--negative-control` lets the fixture through the check (no engine):
// check 5 must then fail everywhere, or this check is broken.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { preview } from 'vite';
import { proposedCsp } from './csp.mjs';

const arg = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined);
const negativeControl = process.argv.includes('--negative-control');
const only = arg('--engine');
const shots = arg('--shots');
const engines = [chromium, firefox, webkit].filter((e) => !only || e.name() === only);
if (shots) mkdirSync(shots, { recursive: true });

// The one synthetic fixture (CONVENTIONS.md § Synthetic data).
const FIXTURE = 'API_KEY=SYNTHETIC_REVOKED_CONTEXT_VALUE';
const FIXTURE_VALUE = 'SYNTHETIC_REVOKED_CONTEXT_VALUE';
// A marker typed into the title: it must never reach a request or storage.
const MARKER = 'qa-marker-not-sent';
const repo = 'https://github.com/redact-secret/redact-secret';

const csp = proposedCsp();
const port = 4176;
const server = await preview({
  preview: { port, strictPort: true, open: false },
  logLevel: 'silent',
  plugins: [
    {
      name: 'community-check-csp',
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

const pages = { en: '/community/', ko: '/ko/community/' };
const widths = [
  { name: 'phone', viewport: { width: 360, height: 780 } },
  { name: 'desktop', viewport: { width: 1280, height: 900 } },
];
const kinds = ['bug', 'false-positive', 'missed-detection', 'website', 'detector', 'integration', 'question', 'idea', 'security'];

async function checkEngine(type) {
  const browser = await type.launch();
  const failures = [];

  for (const [locale, path] of Object.entries(pages)) {
    for (const { name: width, viewport } of widths) {
      const where = `${type.name()} ${path} @${width}`;
      const fail = (what) => failures.push(`${where}: ${what}`);
      const context = await browser.newContext({ viewport });
      await context.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (e) => console.error(`CSP-VIOLATION ${e.violatedDirective} ${e.blockedURI}`));
      });
      if (negativeControl) await context.route(/engine\.worker|\.wasm/, (r) => r.abort());
      const page = await context.newPage();
      const errors = [];
      const requests = [];
      page.on('pageerror', (e) => errors.push(`page error: ${e.message}`));
      page.on('console', (m) => m.type() === 'error' && !negativeControl && errors.push(`console: ${m.text()}`));
      page.on('requestfailed', (r) => !negativeControl && errors.push(`request failed: ${r.url()}`));
      page.on('request', (r) => requests.push(`${r.url()} ${r.postData() ?? ''}`));

      try {
        const res = await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
        if (res?.status() !== 200) fail(`status ${res?.status()}`);
        await page.waitForSelector('[data-live]');

        // 1. Basics.
        const basics = await page.evaluate(() => ({
          lang: document.documentElement.lang,
          h1: document.querySelectorAll('h1').length,
          // The header nav and the side nav (the phone menu) both list it.
          current: [...new Set([...document.querySelectorAll('header nav a[aria-current="page"]')].map((a) => a.getAttribute('href')))],
        }));
        if (basics.lang !== locale) fail(`<html lang="${basics.lang}">`);
        if (basics.h1 !== 1) fail(`${basics.h1} <h1>`);
        if (width === 'desktop' && JSON.stringify(basics.current) !== JSON.stringify([path])) fail(`header current is ${JSON.stringify(basics.current)}`);

        // 2. No sideways scroll.
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (overflow > 0) fail(`scrolls sideways by ${overflow}px`);

        if (shots) {
          // WebKit screenshots inject a <style> of Playwright's own, which the
          // CSP rightly refuses; that report is the tool's, not the page's.
          const before = errors.length;
          await page.screenshot({ path: join(shots, `${type.name()}-${locale}-${width}.png`), fullPage: true });
          await page.waitForTimeout(100);
          errors.splice(before);
        }

        const go = page.locator('[class*="_go_"]').first();
        const goState = () => go.evaluate((a) => ({ disabled: a.getAttribute('aria-disabled') === 'true', href: a.getAttribute('href') }));
        const verdict = () => page.locator('[role="status"]').first().innerText();

        // 3. Continue starts off, with reasons.
        let s = await goState();
        if (!s.disabled || s.href) fail(`Continue is on before anything is typed (${JSON.stringify(s)})`);
        const reasons = await page.locator('[class*="_todo_"] li').count();
        if (reasons < 2) fail(`only ${reasons} reason(s) listed for Continue being off`);

        // 4. A clean, filled bug report.
        await page.fill('#cf-title', `streaming write fails ${MARKER}`);
        await page.fill('#cf-package-version', '@redact-secret/core@0.1.0-beta.10');
        await page.fill('#cf-binding-runtime', 'Node 22 on Linux x64');
        await page.fill('#cf-what-happened', 'write("") throws; I expected a no-op.');
        await page.fill('#cf-repro', 'const s = createSanitizer({ stream: true });\ns.write("");');
        await page.check('fieldset input[type="checkbox"]');
        if (!negativeControl) {
          await page.waitForFunction(() => document.querySelector('[class*="_go_"]:not([aria-disabled])'), null, { timeout: 20000 }).catch(() => {});
          s = await goState();
          if (s.disabled || !s.href) fail(`Continue stays off for a clean, complete form (verdict: ${await verdict()})`);
          else {
            const url = new URL(s.href);
            const q = url.searchParams;
            if (`${url.origin}${url.pathname}` !== `${repo}/issues/new`) fail(`Continue opens ${url.origin}${url.pathname}`);
            if (q.get('template') !== 'bug-report.yml') fail(`template=${q.get('template')}`);
            if (q.get('title') !== `[bug] streaming write fails ${MARKER}`) fail(`title=${q.get('title')}`);
            if (q.get('repro') !== 'const s = createSanitizer({ stream: true });\ns.write("");') fail('repro did not round-trip');
            if (q.get('binding-runtime') !== 'Node 22 on Linux x64') fail('binding-runtime did not round-trip');
            if (q.has('safety-ack')) fail('the safety checkbox is prefilled');
            const target = await go.getAttribute('target');
            const rel = await go.getAttribute('rel');
            if (target !== '_blank' || !/noopener/.test(rel ?? '')) fail(`Continue opens with target=${target} rel=${rel}`);
          }
        }

        // 5. The fixture is found, and never shown.
        await page.fill('#cf-repro', `const s = createSanitizer();\n${FIXTURE}`);
        await page
          .waitForFunction(() => document.querySelector('#cf-repro')?.getAttribute('aria-invalid') === 'true', null, { timeout: 20000 })
          .catch(() => {});
        s = await goState();
        if (!s.disabled) fail('Continue is on with the synthetic fixture in a field');
        const invalid = await page.getAttribute('#cf-repro', 'aria-invalid');
        if (invalid !== 'true') fail('the field holding the fixture is not marked invalid');
        const shown = await page.evaluate((value) => {
          const clone = document.getElementById('app').cloneNode(true);
          clone.querySelectorAll('textarea, input').forEach((el) => el.remove());
          return clone.textContent.includes(value) || [...document.querySelectorAll('[aria-label]')].some((el) => el.getAttribute('aria-label').includes(value));
        }, FIXTURE_VALUE);
        if (shown) fail('the fixture value appears on the page outside its field');
        const hits = await page.locator('[role="status"] li').count();
        if (hits < 1 && !negativeControl) fail('no finding listed');
        const pos = await page.locator('[role="status"] li .mono').first().innerText().catch(() => '');
        if (!negativeControl && !/2/.test(pos)) fail(`finding position "${pos}" does not name line 2`);

        // Removing it turns Continue back on.
        await page.fill('#cf-repro', 'const s = createSanitizer();');
        if (!negativeControl) {
          await page.waitForFunction(() => document.querySelector('[class*="_go_"]:not([aria-disabled])'), null, { timeout: 20000 }).catch(() => {});
          if ((await goState()).disabled) fail('Continue stays off after the fixture is removed');
        }

        // 6. Over the address limit.
        await page.fill('#cf-what-happened', 'x '.repeat(4500));
        await page.waitForTimeout(400);
        if (!(await goState()).disabled) fail('Continue is on with an address over the limit');
        if (!(await page.locator('[class*="_over_"]').count())) fail('the length meter does not show the address is over');
        await page.fill('#cf-what-happened', 'short again');

        // 7. Every kind.
        for (const key of kinds) {
          await page.locator('[class*="_kinds_"] button').nth(kinds.indexOf(key)).click();
          const hash = await page.evaluate(() => location.hash);
          if (hash !== `#${key}`) fail(`selecting ${key} left the hash at ${hash}`);
          const heading = await page.locator('#feedback-form h2').first().innerText();
          const name = await page.locator('[class*="_kinds_"] button[aria-current="true"] [class*="_name_"]').innerText();
          if (heading.trim() !== name.trim()) fail(`${key}: panel shows "${heading}", list marks "${name}"`);
          if (width === 'phone') {
            const top = await page.locator('#feedback-form').evaluate((el) => el.getBoundingClientRect().top);
            if (top < 0 || top > viewport.height / 2) fail(`${key}: the form is not scrolled into view on a phone (top ${Math.round(top)})`);
          }
          const fields = await page.locator('#feedback-form input, #feedback-form textarea, #feedback-form select').count();
          if (key === 'security') {
            if (fields) fail(`security has ${fields} field(s); it must only route to the private advisory`);
            const advisory = await page.locator(`#feedback-form a[href="${repo}/security/advisories/new"]`).count();
            if (advisory !== 1) fail('security does not link the private advisory');
          } else if (!fields) fail(`${key}: no fields`);
          const sideways = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          if (sideways > 0) fail(`${key}: scrolls sideways by ${sideways}px`);
        }

        // A discussion: category, not template.
        await page.locator('[class*="_kinds_"] button').nth(kinds.indexOf('question')).click();
        await page.fill('#cf-title', 'Can scan() run in a Worker?');
        await page.fill('#cf-question', 'Is there a supported way to load it in a Cloudflare Worker?');
        await page.check('fieldset input[type="checkbox"]');
        if (!negativeControl) {
          await page.waitForFunction(() => document.querySelector('[class*="_go_"]:not([aria-disabled])'), null, { timeout: 20000 }).catch(() => {});
          const href = (await goState()).href ?? '';
          const url = href && new URL(href);
          if (!url || `${url.origin}${url.pathname}` !== `${repo}/discussions/new` || url.searchParams.get('category') !== 'q-a' || url.searchParams.get('title') !== '[Q&A] Can scan() run in a Worker?')
            fail(`question opens ${href || 'nothing'}`);
        }

        // Deep link.
        await page.goto(`${origin}${path}#idea`, { waitUntil: 'networkidle' });
        await page.waitForSelector('[data-live]');
        if ((await page.locator('#cf-idea').count()) !== 1) fail('#idea does not open the idea form');

        // 8. Nothing typed left the page.
        const leaked = requests.filter((r) => r.includes(MARKER) || r.includes(FIXTURE_VALUE));
        if (leaked.length) fail(`typed text left the page: ${leaked.length} request(s)`);
        const stored = await page.evaluate(
          ([m, v]) => [localStorage, sessionStorage].some((st) => Object.keys(st).some((k) => `${k}${st.getItem(k)}`.includes(m) || `${k}${st.getItem(k)}`.includes(v))),
          [MARKER, FIXTURE_VALUE],
        );
        if (stored) fail('typed text was written to storage');

        // 9. Language switch.
        const other = locale === 'en' ? 'ko' : 'en';
        const alt = await page.getAttribute(`link[rel="alternate"][hreflang="${other}"]`, 'href');
        if (!alt?.endsWith(pages[other])) fail(`hreflang ${other} is ${alt}`);
        const switcher = await page.locator(`a[hreflang="${other}"]`).first().getAttribute('href');
        if (switcher !== pages[other]) fail(`language switch goes to ${switcher}`);

        for (const e of errors) fail(e);
      } catch (e) {
        fail(`threw: ${e.message.split('\n')[0]}`);
      }
      await context.close();
    }
  }
  await browser.close();
  return failures;
}

const failures = [];
for (const engine of engines) failures.push(...(await checkEngine(engine)));
await server.close();

const checked = `${Object.keys(pages).length} locales × ${widths.length} widths × ${engines.length} engine(s)`;
if (negativeControl) {
  const expected = engines.flatMap((e) => Object.values(pages).flatMap((p) => widths.map((w) => `${e.name()} ${p} @${w.name}`)));
  const missed = expected.filter((w) => !failures.some((f) => f.startsWith(`${w}:`) && /fixture/.test(f)));
  if (missed.length) {
    console.error(`community negative control: the fixture check did not fail on\n- ${missed.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`community negative control: without the engine, the fixture check failed on all ${checked}`);
  process.exit(0);
}
if (failures.length) {
  console.error(`community: ${failures.length} failure(s) across ${checked}\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`community: ${checked} OK`);
