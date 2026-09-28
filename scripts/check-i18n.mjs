// Checks the locale copy in i18n/ beyond its schemas (CONVENTIONS.md §
// Bilingual content). Runs in `npm run build` after check-data.mjs, which has
// already validated every file against its locale-*-v1 schema and scanned it
// for plaintext secrets.
//
//   node scripts/check-i18n.mjs               check i18n/
//   node scripts/check-i18n.mjs --i18n <dir>  check a copy against this app (the negative tests)
//
// Fails closed on:
//   - missing files: every page in the route registry needs its copy in both
//     locales, and nothing else may sit in i18n/;
//   - en/ko parity: same keys, same list lengths, same vars, links and marks
//     in rich text (scripts/i18n/checks.mjs);
//   - links: internal targets must be registered route IDs and anchors,
//     external ones well-formed https URLs (no network);
//   - size: each page's copy (shell + page, + section for architecture pages)
//     within the budget, per locale;
//   - unused keys: every page is rendered, in both locales, from tracked copy;
//     a key no page reads is an error, and so is a render that throws (e.g. a
//     rich-text var the page does not supply).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createServer } from 'vite';
import { root } from './data/contracts.mjs';
import {
  definedKeys,
  linkErrors,
  locales,
  PAGE_BUDGET,
  parityErrors,
  shippedBytes,
  spelledCountErrors,
  tracked,
  unusedKeys,
} from './i18n/checks.mjs';

// Lookup maps a page indexes with data rather than by name: reading the map
// covers its keys (the schema fixes the key set).
const tables = {
  'home.json': [/^\/integrations\/(runtimes|terms|statusLabels|cards|groups)$/, /^\/playground\/(presets|piiModes|errors|columns)$/],
  'architecture/section.json': [/^\/(groups|pages)$/],
  'architecture/adapters.json': [/^\/statusLabels$/],
  'architecture/vault.json': [/^\/statusLabels$/],
};

// Copy only a browser reaches: the playground's states after its engine
// loads, fails or returns findings. Prerendering never gets there, so these
// keys count as read; the schema still requires them.
const clientOnly = {
  'home.json': [/^\/playground\/(loadFailed|retry|staleEngine|reload|engine|findingCount|findingsTitle|columns|noFindings|errors)(\/|$)/],
};

// Counts written as words in the copy, each tied to the list it counts
// (docs/content-inventory.md § Open discrepancies). Words cannot be slots
// without changing the sentences, so they are checked instead.
const integrations = JSON.parse(readFileSync(join(root, 'data/integrations.json'), 'utf8'));
const spelledCounts = [
  {
    what: 'adapter packages (data/integrations.json, the adapters page tiles)',
    count: (d) => {
      const listed = Object.keys(integrations.packages).filter((id) => /^adapters?(-|$)/.test(id)).length;
      return listed === d.en['architecture/adapters.json'].thePackages.tiles.length ? listed : NaN;
    },
    n: 6,
    words: { en: /\bsix\b/i, ko: '여섯' },
    at: [
      ['architecture/adapters.json', '/head/lede'],
      ['architecture/adapters.json', '/thePackages/title'],
    ],
  },
  {
    what: 'evaluation methods (architecture/evaluation-methods.json methods)',
    count: (d) => d.en['architecture/evaluation-methods.json'].theTenMethods.methods.length,
    n: 10,
    words: { en: /\bten\b/i, ko: '열' },
    at: [
      ['architecture/evaluation-methods.json', '/head/lede'],
      ['architecture/evaluation-methods.json', '/theTenMethods/eyebrow'],
      ['architecture/evaluation-methods.json', '/sources/body'],
      ['architecture/section.json', '/pages/evaluation-methods/description'],
      ['architecture/overview.json', '/cards/evaluation-methods/question'],
    ],
  },
  {
    what: 'repositories (architecture/overview.json repos rows)',
    count: (d) => d.en['architecture/overview.json'].repos.rows.length,
    n: 4,
    words: { en: /\bfour\b/i, ko: '네 ' },
    at: [['architecture/overview.json', '/repos/title']],
  },
  {
    what: 'GitHub token kinds (architecture/support-claims.json tokens)',
    count: (d) => d.en['architecture/support-claims.json'].theProblem.tokens.length,
    n: 6,
    words: { en: /\bsix\b/i, ko: '여섯' },
    at: [['architecture/support-claims.json', '/head/title']],
  },
];

const errors = [];
const i18nArg = process.argv.indexOf('--i18n');
const i18nDir = i18nArg >= 0 ? process.argv[i18nArg + 1] : join(root, 'i18n');
const walk = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
const rel = (file, base) => relative(base, file).split(sep).join('/');

const server = await createServer({
  root,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const routes = await server.ssrLoadModule('/src/routes.ts');
  const { architecturePages } = await server.ssrLoadModule('/src/content/architecture/pages.ts');

  // 1. The file set: what the loader imports, derived from the page registry.
  const expected = ['shell.json', 'home.json', 'architecture/section.json', ...architecturePages.map((p) => `architecture/${p.id}.json`)];
  const docs = {};
  for (const locale of locales) {
    docs[locale] = {};
    const dir = join(i18nDir, locale);
    const present = existsSync(dir) ? walk(dir).map((f) => rel(f, dir)) : [];
    for (const name of expected) {
      if (!present.includes(name)) errors.push(`i18n/${locale}/${name}: missing (every page needs its copy in every locale)`);
      else docs[locale][name] = JSON.parse(readFileSync(join(dir, name), 'utf8'));
    }
    for (const name of present) if (!expected.includes(name)) errors.push(`i18n/${locale}/${name}: no page reads this file`);
    for (const [name, doc] of Object.entries(docs[locale])) {
      if (doc.locale !== locale) errors.push(`i18n/${locale}/${name}: declares locale "${doc.locale}"`);
    }
  }
  for (const entry of readdirSync(i18nDir)) if (!locales.includes(entry)) errors.push(`i18n/${entry}: not a locale (${locales.join(', ')})`);

  // 2. Parity, 3. links, per file.
  for (const name of expected) {
    const en = docs.en[name];
    const ko = docs.ko[name];
    if (en && ko) errors.push(...parityErrors(en, ko, `i18n/{en,ko}/${name}`));
    for (const locale of locales) {
      const doc = docs[locale][name];
      if (doc) errors.push(...linkErrors(doc, `i18n/${locale}/${name}`, { routeIds: routes.routeIds, anchorIds: routes.anchorIds }));
    }
  }

  // 3b. Counts spelled out in words still match the lists they count.
  if (expected.every((name) => docs.en[name] && docs.ko[name])) errors.push(...spelledCountErrors(spelledCounts, docs));

  // 4. Size budget per page and locale.
  let largest = { bytes: 0 };
  for (const locale of locales) {
    for (const route of routes.pageRoutes) {
      const files = route.page.kind === 'home' ? ['shell.json', 'home.json'] : ['shell.json', 'architecture/section.json', `architecture/${route.page.id}.json`];
      const bytes = files.reduce((sum, f) => sum + (docs[locale][f] ? shippedBytes(docs[locale][f]) : 0), 0);
      const page = routes.localizedRoutes.find((r) => r.locale === locale && r.path === route.path).localized;
      if (bytes > largest.bytes) largest = { bytes, page };
      if (bytes > PAGE_BUDGET) errors.push(`${page}: its copy is ${bytes} bytes, over the ${PAGE_BUDGET}-byte page budget (${files.join(' + ')})`);
    }
  }

  // 5. Render every page from tracked copy: unused keys, and render errors.
  if (!errors.length) {
    const renderer = await server.ssrLoadModule('/src/render.tsx');
    const { siteDataFiles } = await server.ssrLoadModule('/src/site-data.ts');
    const data = Object.fromEntries(Object.entries(siteDataFiles).map(([k, p]) => [k, JSON.parse(readFileSync(join(root, p), 'utf8'))]));
    const reads = {};
    const content = {};
    for (const locale of locales) {
      reads[locale] = {};
      const track = (name) => tracked(docs[locale][name], (reads[locale][name] = new Set()));
      content[locale] = {
        shell: track('shell.json'),
        home: track('home.json'),
        architecture: {
          section: track('architecture/section.json'),
          pages: Object.fromEntries(architecturePages.map((p) => [p.id, track(`architecture/${p.id}.json`)])),
        },
      };
    }
    const paths = renderer.pagePaths;
    for (const path of paths) {
      try {
        await renderer.prerender({ url: path }, content, data);
      } catch (e) {
        errors.push(`${path}: render failed: ${e.message}`);
      }
    }
    for (const locale of locales) {
      for (const name of expected) {
        const seen = reads[locale][name];
        for (const p of definedKeys(docs[locale][name])) if ((clientOnly[name] ?? []).some((re) => re.test(p))) seen.add(p);
        for (const p of unusedKeys(docs[locale][name], seen, tables[name])) {
          errors.push(`i18n/${locale}/${name}${p}: no page reads this key`);
        }
      }
    }
    const keys = locales.reduce((n, l) => n + expected.reduce((m, f) => m + definedKeys(docs[l][f], tables[f]).length, 0), 0);
    if (!errors.length) {
      console.log(
        `check-i18n: ${expected.length * locales.length} files, ${keys} keys read by ${paths.length} rendered pages; en/ko parity and links hold; largest page copy ${largest.bytes} bytes (${largest.page}) of ${PAGE_BUDGET}`,
      );
    }
  }
} finally {
  await server.close();
}

if (errors.length) {
  for (const e of errors) console.error(`check-i18n: ${e}`);
  console.error(`check-i18n: ${errors.length} problem(s)`);
  process.exit(1);
}
