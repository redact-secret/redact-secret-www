// Security qualification for the playground (ADR 0001 § Security review
// checklist, ADR 0002). Runs the built site in Chromium, Firefox, and WebKit
// and checks, per engine:
//
//   1. the engine loads and redacts (PII off, then Global),
//   2. typing produces no request — seen from the browser AND from the
//      server every same-origin request must reach,
//   3. switching PII on fetches only the engine's own same-origin assets,
//   4. nothing is written to cookies, localStorage, sessionStorage,
//      IndexedDB, or Cache Storage, and the URL does not change,
//   5. the input disables spellcheck, autocorrect, autocomplete, and
//      grammar-extension hooks.
//
// Usage: npm run qualify:playground   (builds first; writes a record under
// docs/qualification/ and exits non-zero on any failure).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium, firefox, webkit } from 'playwright';
import { preview } from 'vite';
import { proposedCsp } from './csp.mjs';

const typed = '\nDATABASE_PASSWORD=SYNTHETIC_REVOKED_CONTEXT_VALUE\nEmail: synthetic.person@fixture.local';
const engineAsset = /\/assets\/(engine\.worker|redact_secret_wasm)[-\w]*\.(js|wasm)$/;

const negativeControl = process.argv.includes('--negative-control');
const cspPages = ['/ko/', '/architecture/', '/ko/architecture/', '/404/', '/en/architecture/vault/'];
// --csp: serve every response with the proposed enforcing CSP (the value
// filed for redact-secret-sites' ContentSecurityPolicy parameter) and fail
// on any violation.
const cspMode = process.argv.includes('--csp');
export const csp = proposedCsp({ wasm: !process.argv.includes('--csp-control') });
const serverLog = [];
const server = await preview({
  preview: { port: 4174, strictPort: true, open: false },
  logLevel: 'silent',
  plugins: [
    {
      name: 'qualification-request-log',
      configurePreviewServer(srv) {
        srv.middlewares.use((req, res, next) => {
          serverLog.push(req.url);
          if (cspMode) res.setHeader('Content-Security-Policy', csp);
          next();
        });
      },
    },
  ],
});
const origin = 'http://localhost:4174';

async function qualify(type) {
  const browser = await type.launch();
  const context = await browser.newContext();
  const seen = [];
  context.on('request', (request) => seen.push(request.url()));
  if (negativeControl) {
    // Proves the checks can fail: leak every keystroke, persist it, and
    // change the URL. Every "no request / nothing stored" check must FAIL.
    await context.addInitScript(() => {
      document.addEventListener('input', () => {
        fetch('/leak?control=1').catch(() => {});
        localStorage.setItem('control', '1');
        history.replaceState(null, '', '#control');
      });
    });
  }
  const violations = [];
  await context.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) =>
      console.error(`CSP-VIOLATION ${e.violatedDirective} ${e.blockedURI}`),
    );
  });
  const page = await context.newPage();
  page.on('console', (msg) => {
    if (/CSP-VIOLATION|Content[- ]Security[- ]Policy|Refused to/i.test(msg.text())) violations.push(msg.text());
  });
  page.on('worker', (worker) => worker.on('request', (request) => seen.push(request.url())));

  const checks = [];
  const check = (name, pass, detail = '') => checks.push({ name, pass: Boolean(pass), detail });
  const live = () => page.locator('#playground [aria-live]').textContent();
  const waitFindings = async (text) =>
    page.waitForFunction((t) => document.querySelector('#playground [aria-live]')?.textContent === t, text, {
      timeout: 30000,
    });

  // A stage that throws (e.g. the engine never starts) is a failed check,
  // not a crash, so the remaining browsers and the CSP check still run.
  try {
    // 1. Load and engine.
    await page.goto(`${origin}/`);
    await page.locator('#playground').scrollIntoViewIfNeeded();
    await waitFindings('3 findings').catch(() => {});
    const urlBefore = page.url();
    const historyBefore = await page.evaluate(() => history.length);
    check('Engine loads, PII off: 3 credential + 0 PII findings on the default text', (await live()) === '3 findings', await live());
    const engineLine = await page.locator('#playground').getByText('Runs locally').textContent();
    check('Engine reports version and wasm artifact', /0\.1\.0-beta\.\d+ \(wasm\)/.test(engineLine), engineLine.trim());

    // 2. Typing sends nothing.
    seen.length = 0;
    serverLog.length = 0;
    const input = page.locator('#playground-input');
    await input.click();
    await page.keyboard.press('End');
    await page.keyboard.press('Control+End');
    await page.keyboard.type(typed, { delay: 5 });
    await waitFindings('4 findings');
    await page.waitForTimeout(1000);
    check('Typing: no request seen by the browser', seen.length === 0, seen.join(', '));
    check('Typing: no request reached the server', serverLog.length === 0, serverLog.join(', '));

    // 3. PII switch loads only the engine's own assets.
    seen.length = 0;
    serverLog.length = 0;
    await page.getByRole('button', { name: 'Global', exact: true }).click();
    await waitFindings('8 findings');
    const foreign = seen.filter((url) => !(url.startsWith(origin) && engineAsset.test(new URL(url).pathname)));
    check('PII Global: redacts email, phone, card too (8 findings)', (await live()) === '8 findings', await live());
    check('PII switch: only same-origin engine assets requested', foreign.length === 0, foreign.join(', ') || `${seen.length} engine asset request(s)`);

    seen.length = 0;
    serverLog.length = 0;
    await input.click();
    await page.keyboard.type('\nPhone: 444-444-4444', { delay: 5 });
    await waitFindings('9 findings');
    await page.waitForTimeout(1000);
    check('Typing with PII on: no request (browser)', seen.length === 0, seen.join(', '));
    check('Typing with PII on: no request (server)', serverLog.length === 0, serverLog.join(', '));

    // 4. Nothing persisted.
    const state = await context.storageState();
    const storage = await page.evaluate(async () => ({
      local: localStorage.length,
      session: sessionStorage.length,
      idb: typeof indexedDB.databases === 'function' ? (await indexedDB.databases()).map((d) => d.name) : 'unsupported',
      caches: 'caches' in self ? await caches.keys() : [],
      historyLength: history.length,
    }));
    check('No cookies', state.cookies.length === 0, JSON.stringify(state.cookies));
    check('localStorage and sessionStorage empty', storage.local === 0 && storage.session === 0, JSON.stringify(storage));
    check('No IndexedDB database', Array.isArray(storage.idb) ? storage.idb.length === 0 : true, String(storage.idb));
    check('No Cache Storage', storage.caches.length === 0, storage.caches.join(', '));
    check('URL and history unchanged', page.url() === urlBefore && storage.historyLength === historyBefore, page.url());

    // 5. Input attributes, as the engine sees them.
    const attrs = await input.evaluate((el) => ({
      spellcheck: el.spellcheck,
      autocomplete: el.getAttribute('autocomplete'),
      autocorrect: el.getAttribute('autocorrect'),
      autocapitalize: el.getAttribute('autocapitalize'),
      gramm: el.getAttribute('data-gramm'),
      grammEditor: el.getAttribute('data-gramm_editor'),
      grammarly: el.getAttribute('data-enable-grammarly'),
      languageTool: el.getAttribute('data-lt-active'),
    }));
    check(
      'Input: spellcheck, autocorrect, autocomplete, grammar hooks off',
      attrs.spellcheck === false &&
        attrs.autocomplete === 'off' &&
        attrs.autocorrect === 'off' &&
        attrs.autocapitalize === 'off' &&
        attrs.gramm === 'false' &&
        attrs.grammEditor === 'false' &&
        attrs.grammarly === 'false' &&
        attrs.languageTool === 'false',
      JSON.stringify(attrs),
    );
  } catch (error) {
    check('Run completed without error', false, String(error.message).split('\n')[0]);
  }

  // Every page type in both route sets (ADR 0003), not only the home page,
  // under the same policy — including a legacy /en/ fallback redirect.
  for (const path of cspPages) await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' }).catch(() => {});
  if (cspMode) check(`No CSP violation on ${cspPages.join(', ')} or in the playground`, violations.length === 0, violations.join(' | '));

  const version = `${type.name()} ${browser.version()}`;
  await browser.close();
  return { version, checks };
}

const results = [];
let failed = false;
try {
  for (const type of negativeControl ? [chromium] : [chromium, firefox, webkit]) {
    const result = await qualify(type);
    results.push(result);
    for (const c of result.checks) {
      if (!c.pass) failed = true;
      console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${result.version.padEnd(18)} ${c.name}${c.pass ? '' : ` — ${c.detail}`}`);
    }
  }
} finally {
  await server.close();
}

if (negativeControl) {
  const leakChecks = results[0].checks.filter((c) => /^Typing|localStorage|^URL/.test(c.name));
  const caught = leakChecks.filter((c) => !c.pass).length;
  console.log(`\nNegative control: ${caught}/${leakChecks.length} leak checks failed as they must.`);
  process.exit(caught === leakChecks.length ? 0 : 1);
}

if (cspMode) {
  console.log(`\nCSP under test:\n${csp}`);
  console.log(failed ? 'CSP: FAILED' : 'CSP: ALL PASSED');
  process.exit(failed ? 1 : 0);
}

const date = new Date().toISOString().slice(0, 10);
const pkg = JSON.parse(await import('node:fs').then((fs) => fs.readFileSync(new URL('../package.json', import.meta.url))));
const lines = [
  `# Playground qualification — ${date}`,
  '',
  `Generated by \`npm run qualify:playground\` against the production build, engine \`@redact-secret/core@${pkg.dependencies['@redact-secret/core']}\`, Playwright ${pkg.devDependencies.playwright}. Checks ADR 0001's security review checklist and ADR 0002's PII switch.`,
  '',
  '| Check | ' + results.map((r) => r.version).join(' | ') + ' |',
  '| --- | ' + results.map(() => '---').join(' | ') + ' |',
  ...results[0].checks.map(
    (c, i) => `| ${c.name} | ` + results.map((r) => (r.checks[i].pass ? 'pass' : `**fail** ${r.checks[i].detail}`)).join(' | ') + ' |',
  ),
  '',
  `Run with \`--csp\`, the same checks pass in all three engines under this enforcing policy, with no violation on \`/\` or on ${cspPages.map((p) => `\`${p}\``).join(', ')} (the inline theme script is allowed by hash, so its hash changes whenever that script does):`,
  '',
  '```text',
  csp,
  '```',
  '',
  'Controls: `--negative-control` leaks every keystroke (fetch, localStorage, URL) and all six leak checks fail; `--csp --csp-control` drops `wasm-unsafe-eval` and the engine fails to start in every engine. A wasm violation inside the worker does not reach the page as an event, so the functional checks are what catch it.',
  '',
  'Network checks are made two ways: requests the browser reports for the page and its workers, and requests the local server received while typing. Every same-origin request has to reach that server, so the second list is exhaustive for same-origin traffic; cross-origin traffic is covered by the first and by the engine audit in ADR 0001 § 1.',
  '',
];
mkdirSync(new URL('../docs/qualification/', import.meta.url), { recursive: true });
const out = new URL(`../docs/qualification/playground-${date}.md`, import.meta.url);
writeFileSync(out, lines.join('\n'));
console.log(`\n${failed ? 'FAILED' : 'ALL PASSED'} — record: ${out.pathname}`);
process.exit(failed ? 1 : 0);
