// Browser checks for the architecture section (ARCHITECTURE.md § Architecture
// section). Serves the built site under the proposed enforcing CSP and loads
// every English (/architecture/…) and Korean (/ko/architecture/…) page in
// Chromium, Firefox, and WebKit:
//
//   1. the page loads (200) with no page error, console error, failed
//      request, or CSP violation — hydration included,
//   2. <html lang> is the URL's locale, and the body is that locale's prose,
//   3. exactly one <h1> and exactly one Claim (the green block),
//   4. the sidebar marks this page, and only it, as current,
//   5. the language switch and hreflang alternates name this page in the
//      other locale; prev/next and every same-origin link resolve (200),
//   6. no horizontal page scroll at 360px and 1280px; below 1040px the
//      collapsible contents open and list all seven pages.
//
// Then, in the same engines and under the same CSP:
//
//   7. both home pages (/ and /ko/) have the right lang, language switch,
//      and hreflang alternates (x-default → English),
//   8. every legacy /en/… path lands on its path-equivalent English page
//      (/en/architecture/vault/ → /architecture/vault/), never on / for all.
//
// Usage: npm run check:architecture   (builds first; exits non-zero on any
// failure). `--negative-control` injects a page error and a second <h1> on
// every page: checks 1 and 3 must then fail everywhere, or the check is
// broken. `--engine chromium` limits the run to one engine.
import { chromium, firefox, webkit } from 'playwright';
import { preview } from 'vite';
import { proposedCsp } from './csp.mjs';

const negativeControl = process.argv.includes('--negative-control');
const only = process.argv.includes('--engine') ? process.argv[process.argv.indexOf('--engine') + 1] : undefined;
const engines = [chromium, firefox, webkit].filter((e) => !only || e.name() === only);

// English is unprefixed, Korean under /ko/ (ADR 0003).
const prefixes = { en: '', ko: '/ko' };
const localeOf = (path) => (path === '/ko/' || path.startsWith('/ko/') ? 'ko' : 'en');
const counterpartOf = (path) => (localeOf(path) === 'ko' ? path.slice('/ko'.length) : `/ko${path}`);
const slugs = ['', 'how-it-works/', 'detection/', 'support-claims/', 'evaluation-methods/', 'adapters/', 'vault/'];
const pages = Object.values(prefixes).flatMap((prefix) => slugs.map((s) => `${prefix}/architecture/${s}`));
const homes = ['/', '/ko/'];
const legacy = ['/', ...slugs.map((s) => `/architecture/${s}`)].map((target) => ({ from: `/en${target}`, to: target }));
const hangul = /[가-힣]/g;

const csp = proposedCsp();
const server = await preview({
  preview: { port: 4175, strictPort: true, open: false },
  logLevel: 'silent',
  plugins: [
    {
      name: 'architecture-check-csp',
      configurePreviewServer(srv) {
        srv.middlewares.use((_req, res, next) => {
          res.setHeader('Content-Security-Policy', csp);
          next();
        });
      },
    },
  ],
});
const origin = 'http://localhost:4175';

const linkStatus = new Map();
async function status(href) {
  if (!linkStatus.has(href)) linkStatus.set(href, fetch(`${origin}${href}`).then((r) => r.status));
  return linkStatus.get(href);
}

async function checkEngine(type) {
  const browser = await type.launch();
  const failures = [];
  const fail = (path, what) => failures.push(`${type.name()} ${path}: ${what}`);

  for (const path of pages) {
    const locale = localeOf(path);
    const other = locale === 'en' ? 'ko' : 'en';
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) =>
        console.error(`CSP-VIOLATION ${e.violatedDirective} ${e.blockedURI}`),
      );
    });
    if (negativeControl) {
      await context.addInitScript(() => {
        window.addEventListener('DOMContentLoaded', () => {
          document.body.append(Object.assign(document.createElement('h1'), { textContent: 'control' }));
          setTimeout(() => {
            throw new Error('negative control');
          });
        });
      });
    }
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(`page error: ${e.message}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
    page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`));
    page.on('response', (r) => r.url().startsWith(origin) && r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));

    try {
      // 1. Loads cleanly, hydration included.
      const response = await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
      if (response?.status() !== 200) fail(path, `status ${response?.status()}`);
      await page.waitForTimeout(300);
      for (const e of errors) fail(path, e);

      // 2. Language.
      const facts = await page.evaluate(() => {
        const text = document.querySelector('main')?.innerText ?? '';
        const current = [...document.querySelectorAll('nav a[aria-current="page"]')].map((a) => a.getAttribute('href'));
        return {
          lang: document.documentElement.lang,
          text,
          h1: document.querySelectorAll('h1').length,
          claims: document.querySelectorAll('main [class*="_claim_"]').length,
          current,
          alternates: Object.fromEntries(
            [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => [l.hreflang, new URL(l.href).pathname]),
          ),
          links: [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href').split('#')[0]),
          pager: [...document.querySelectorAll('a[rel="prev"], a[rel="next"]')].map((a) => a.getAttribute('href')),
        };
      });
      if (facts.lang !== locale) fail(path, `<html lang="${facts.lang}">`);
      const hangulShare = (facts.text.match(hangul)?.length ?? 0) / Math.max(facts.text.replace(/\s/g, '').length, 1);
      if (locale === 'en' && hangulShare > 0.02) fail(path, `English page is ${Math.round(hangulShare * 100)}% Hangul`);
      if (locale === 'ko' && hangulShare < 0.3) fail(path, `Korean page is only ${Math.round(hangulShare * 100)}% Hangul`);
      if (/\bTODO\b/.test(facts.text)) fail(path, 'body contains TODO');

      // 3. One heading, one claim.
      if (facts.h1 !== 1) fail(path, `${facts.h1} <h1> elements`);
      if (facts.claims !== 1) fail(path, `${facts.claims} Claim blocks`);

      // 4. Sidebar (and its mobile twin) mark this page; the header marks the section.
      const hub = `${prefixes[locale]}/architecture/`;
      const sectionCurrent = facts.current.filter((h) => h !== hub);
      const expected = path === hub ? [] : [path, path];
      if (JSON.stringify(sectionCurrent) !== JSON.stringify(expected)) fail(path, `aria-current on ${facts.current.join(', ')}`);

      // 5. Other locale, pager, links.
      const counterpart = counterpartOf(path);
      await page.locator('header button[aria-haspopup="menu"]').first().click();
      const switchHref = await page.locator(`header [role="menu"] a[hreflang="${other}"]`).first().getAttribute('href');
      if (switchHref !== counterpart) fail(path, `language switch goes to ${switchHref}`);
      const english = locale === 'en' ? path : counterpart;
      if (facts.alternates[other] !== counterpart || facts.alternates[locale] !== path || facts.alternates['x-default'] !== english) {
        fail(path, `hreflang alternates ${JSON.stringify(facts.alternates)}`);
      }
      if (facts.pager.length !== 2 || facts.pager.some((h) => !pages.includes(h))) fail(path, `pager ${facts.pager.join(', ')}`);
      for (const href of new Set(facts.links)) {
        const s = await status(href);
        if (s !== 200) fail(path, `link ${href} → ${s}`);
      }

      // 6. Widths.
      for (const width of [360, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (overflow > 0) fail(path, `scrolls sideways by ${overflow}px at ${width}px`);
      }
      await page.setViewportSize({ width: 360, height: 900 });
      await page.locator('details > summary').first().click();
      const mobileLinks = await page.locator('details[open] nav a').count();
      if (mobileLinks !== slugs.length) fail(path, `collapsible contents list ${mobileLinks} pages`);
    } catch (e) {
      fail(path, `threw: ${e.message.split('\n')[0]}`);
    }
    await context.close();
  }

  // 7 and 8 are not part of the negative control, which targets 1 and 3.
  if (!negativeControl) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) =>
        console.error(`CSP-VIOLATION ${e.violatedDirective} ${e.blockedURI}`),
      );
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(`page error: ${e.message}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));

    // 7. Both homes: lang, language switch, alternates.
    for (const path of homes) {
      errors.length = 0;
      try {
        const response = await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
        if (response?.status() !== 200) fail(path, `status ${response?.status()}`);
        const facts = await page.evaluate(() => ({
          lang: document.documentElement.lang,
          alternates: Object.fromEntries(
            [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => [l.hreflang, new URL(l.href).pathname]),
          ),
        }));
        const locale = localeOf(path);
        if (facts.lang !== locale) fail(path, `<html lang="${facts.lang}">`);
        const other = locale === 'en' ? 'ko' : 'en';
        await page.locator('header button[aria-haspopup="menu"]').first().click();
        const switchHref = await page.locator(`header [role="menu"] a[hreflang="${other}"]`).first().getAttribute('href');
        if (switchHref !== counterpartOf(path)) fail(path, `language switch goes to ${switchHref}`);
        if (JSON.stringify(facts.alternates) !== JSON.stringify({ en: '/', ko: '/ko/', 'x-default': '/' })) {
          fail(path, `hreflang alternates ${JSON.stringify(facts.alternates)}`);
        }
        for (const e of errors) fail(path, e);
      } catch (e) {
        fail(path, `threw: ${e.message.split('\n')[0]}`);
      }
    }

    // 8. Legacy /en/… fallback documents land on the same English page.
    for (const { from, to } of legacy) {
      errors.length = 0;
      try {
        await page.goto(`${origin}${from}`);
        await page.waitForURL(`${origin}${to}`, { timeout: 10000 });
        await page.waitForLoadState('networkidle');
        if (new URL(page.url()).pathname !== to) fail(from, `landed on ${page.url()}`);
        for (const e of errors) fail(from, e);
      } catch (e) {
        fail(from, `did not reach ${to}: ${e.message.split('\n')[0]}`);
      }
    }
    await context.close();
  }
  await browser.close();
  return failures;
}

const failures = [];
for (const engine of engines) failures.push(...(await checkEngine(engine)));
await server.close();

const checked = `${pages.length} pages${negativeControl ? '' : ` + ${homes.length} homes + ${legacy.length} legacy redirects`} × ${engines.length} engine(s)`;
if (negativeControl) {
  // Every page must have failed on the injected error and the second <h1>.
  const missed = engines.flatMap((e) =>
    pages.filter(
      (p) =>
        !failures.some((f) => f.startsWith(`${e.name()} ${p}: page error`)) ||
        !failures.some((f) => f.startsWith(`${e.name()} ${p}: 2 <h1>`)),
    ).map((p) => `${e.name()} ${p}`),
  );
  if (missed.length) {
    console.error(`architecture negative control: checks did not fail on\n- ${missed.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`architecture negative control: injected faults caught on all ${checked}`);
  process.exit(0);
}
if (failures.length) {
  console.error(`architecture: ${failures.length} failure(s) across ${checked}\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`architecture: ${checked} OK`);
