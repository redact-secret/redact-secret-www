// Checks dist/ against redact-secret-sites' site build contract
// (https://github.com/redact-secret/redact-secret-sites/blob/main/ARCHITECTURE.md#site-build-contract)
// and this repository's own rules. Run after `npm run build`; CI and the
// publish workflow both run it, so a build that breaks the contract never
// reaches the bucket.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const origin = 'https://www.redactsecret.com';
const failures = [];
const fail = (message) => failures.push(message);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(dist).map((path) => relative(dist, path));

// 1. Static output, one directory, every route prerendered (ADR 0003):
// English at /, Korean at /ko/, the 404 page, and a fallback redirect
// document at every legacy /en/ path. Written out here rather than read
// from src/routes.ts, so the check is a second source, not an echo.
const architecture = ['', 'how-it-works/', 'detection/', 'support-claims/', 'evaluation-methods/', 'adapters/', 'vault/'];
const docs = [
  '',
  'quickstart/',
  'installation/',
  'core/javascript/',
  'core/python/',
  'integrations/pino/',
  'integrations/opentelemetry/',
  'integrations/python-logging/',
  'integrations/mcp/',
  'integrations/ai-context/',
  'gateway/',
  'vault/',
  'concepts/detection-policies/',
  'reference/supported-credentials/',
  'security/',
  'troubleshooting/',
];
const english = ['/', '/community/', ...architecture.map((sub) => `/architecture/${sub}`), ...docs.map((sub) => `/docs/${sub}`)];
const prefixes = { en: '', ko: '/ko' };
/** Indexable pages: served path → { locale, English path }. */
const indexable = new Map(
  Object.entries(prefixes).flatMap(([locale, prefix]) => english.map((path) => [`${prefix}${path}`, { locale, path }])),
);
/** Legacy path → the English path it must redirect to (never `/` for everything). */
const legacy = new Map(english.map((path) => [`/en${path}`, path]));
const notFound = '/404/';

const fileFor = (path) => `${path.slice(1)}index.html`;
const expected = [...indexable.keys(), ...legacy.keys(), notFound].map(fileFor);
for (const page of expected) {
  if (!files.includes(page)) fail(`missing ${page}`);
}
for (const file of files.filter((f) => f.endsWith('.html'))) {
  if (!expected.includes(file)) fail(`${file}: unexpected page (not in the route list, the 404 page, or a legacy redirect)`);
}

// 3. Fingerprinted files live under assets/ and carry a content hash.
for (const file of files.filter((f) => f.startsWith('assets/'))) {
  if (!/-[A-Za-z0-9_-]{8}\.[a-z0-9.]+$/.test(file)) fail(`unhashed asset: ${file}`);
}

const alternatesOf = (html) =>
  [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(([, lang, href]) => `${lang} ${href}`);
const expectedAlternates = (path) => [`en ${origin}${path}`, `ko ${origin}/ko${path}`, `x-default ${origin}${path}`];
const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

for (const file of files.filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(join(dist, file), 'utf8');
  const path = `/${file.replace(/index\.html$/, '')}`;
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const noindex = html.includes('<meta name="robots" content="noindex"');
  const lang = html.match(/<html lang="([^"]+)"/)?.[1];

  if (legacy.has(path)) {
    // Legacy /en/** fallback until the edge 301 (redact-secret-sites) is
    // live: canonical, noindex, an immediate refresh, and a visible link —
    // all to the path-equivalent English page. No script (CSP).
    const target = legacy.get(path);
    if (canonical !== `${origin}${target}`) fail(`${file}: legacy canonical is ${canonical ?? 'missing'}, expected ${origin}${target}`);
    if (!noindex) fail(`${file}: legacy redirect is not noindex`);
    const refresh = html.match(/<meta http-equiv="refresh" content="0; url=([^"]+)"/)?.[1];
    if (refresh !== target) fail(`${file}: refreshes to ${refresh ?? 'nothing'}, expected ${target}`);
    if (!html.includes(`<a href="${target}">`)) fail(`${file}: no visible link to ${target}`);
    if (/<script\b/i.test(html)) fail(`${file}: legacy redirect has a script`);
    if (!indexable.has(target)) fail(`${file}: redirects to ${target}, which is not a page`);
  } else if (path === notFound) {
    // Served for every miss in both route sets: kept out of search, and it
    // links both homes.
    if (canonical !== `${origin}${path}`) fail(`${file}: canonical is ${canonical ?? 'missing'}, expected ${origin}${path}`);
    if (!noindex) fail(`${file}: 404 page is not noindex`);
    for (const home of ['/', '/ko/']) if (!html.includes(`href="${home}"`)) fail(`${file}: no link to ${home}`);
  } else if (indexable.has(path)) {
    // 7. Canonical URL for the page's own directory-routed path, and
    // hreflang en/ko at the equivalent paths with x-default → English.
    const page = indexable.get(path);
    if (canonical !== `${origin}${path}`) fail(`${file}: canonical is ${canonical ?? 'missing'}, expected ${origin}${path}`);
    if (lang !== page.locale) fail(`${file}: <html lang="${lang}">, expected ${page.locale}`);
    const alternates = alternatesOf(html);
    if (!same(alternates, expectedAlternates(page.path))) fail(`${file}: hreflang alternates ${alternates.join(', ') || 'missing'}`);
    if (noindex) fail(`${file}: indexable page is noindex`);
    // Internal links use the current paths, never a legacy /en/ one.
    for (const [, href] of html.matchAll(/\shref="(\/en\/[^"]*)"/g)) fail(`${file}: links to legacy ${href}`);
  }

  // The proposed CSP (style-src 'self') blocks inline style attributes.
  if (/<[a-z][^>]*\sstyle="/i.test(html)) fail(`${file}: inline style attribute`);

  // 4. Root-relative (or absolute https) references only.
  for (const [, attr, url] of html.matchAll(/\s(src|href)="([^"]*)"/g)) {
    if (!/^(\/|https:\/\/|#|mailto:)/.test(url)) fail(`${file}: ${attr}="${url}" is not root-relative`);
  }
}

// Sitemap: every indexable page in both route sets, nothing else, each with
// the same hreflang alternates as its <head>. robots.txt points at it.
if (files.includes('sitemap.xml')) {
  const xml = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
  const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, body]) => ({
    loc: body.match(/<loc>([^<]+)<\/loc>/)?.[1],
    alternates: [...body.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\/>/g)].map(
      ([, lang, href]) => `${lang} ${href}`,
    ),
  }));
  const locs = entries.map((e) => e.loc);
  const wanted = [...indexable.keys()].map((path) => `${origin}${path}`);
  for (const loc of wanted) if (!locs.includes(loc)) fail(`sitemap.xml: missing ${loc}`);
  for (const loc of locs) if (!wanted.includes(loc)) fail(`sitemap.xml: lists ${loc}, which is not an indexable page`);
  if (new Set(locs).size !== locs.length) fail('sitemap.xml: duplicate <loc>');
  for (const { loc, alternates } of entries) {
    const page = indexable.get(loc?.slice(origin.length));
    if (page && !same(alternates, expectedAlternates(page.path))) fail(`sitemap.xml: ${loc} alternates ${alternates.join(', ')}`);
  }
} else {
  fail('missing sitemap.xml');
}
if (!files.includes('robots.txt')) fail('missing robots.txt');
else if (!readFileSync(join(dist, 'robots.txt'), 'utf8').includes(`Sitemap: ${origin}/sitemap.xml`)) {
  fail('robots.txt: does not reference the sitemap');
}


// README § Domain: the hub lives on .com. .dev is the benchmarks site's domain,
// so a link to www. or the apex of .dev is a leftover from before the move.
for (const file of files.filter((f) => /\.(html|js|css|json|svg)$/.test(f))) {
  const text = readFileSync(join(dist, file), 'utf8');
  if (/(www\.|\/\/)redactsecret\.dev\b/.test(text)) fail(`${file}: refers to www.redactsecret.dev or the .dev apex`);
}

if (failures.length) {
  console.error(`build contract: ${failures.length} failure(s)\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`build contract: ${files.length} files OK`);
