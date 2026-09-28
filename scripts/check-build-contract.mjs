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

// 1. Static output, one directory, every locale route prerendered.
const architecture = ['', 'how-it-works/', 'detection/', 'support-claims/', 'evaluation-methods/', 'adapters/', 'vault/'];
const pages = [
  'index.html',
  'en/index.html',
  'ko/index.html',
  '404/index.html',
  ...['en', 'ko'].flatMap((l) => architecture.map((sub) => `${l}/architecture/${sub}index.html`)),
];
for (const page of pages) {
  if (!files.includes(page)) fail(`missing ${page}`);
}

// 3. Fingerprinted files live under assets/ and carry a content hash.
for (const file of files.filter((f) => f.startsWith('assets/'))) {
  if (!/-[A-Za-z0-9_-]{8}\.[a-z0-9.]+$/.test(file)) fail(`unhashed asset: ${file}`);
}

for (const file of files.filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(join(dist, file), 'utf8');

  // 7. Canonical URL for the page's own directory-routed path.
  const path = `/${file.replace(/index\.html$/, '')}`;
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (canonical !== `${origin}${path}`) fail(`${file}: canonical is ${canonical ?? 'missing'}, expected ${origin}${path}`);

  // The six architecture pages exist only in Korean; at an /en/ URL they are
  // a labelled copy and must stay out of search (ARCHITECTURE.md § Architecture section).
  if (/^en\/architecture\/[^/]+\/index\.html$/.test(file) && !html.includes('<meta name="robots" content="noindex">')) {
    fail(`${file}: Korean-only page at an /en/ URL is not noindex`);
  }

  // The proposed CSP (style-src 'self') blocks inline style attributes.
  if (/<[a-z][^>]*\sstyle="/i.test(html)) fail(`${file}: inline style attribute`);

  // 4. Root-relative (or absolute https) references only.
  for (const [, attr, url] of html.matchAll(/\s(src|href)="([^"]*)"/g)) {
    if (!/^(\/|https:\/\/|#|mailto:)/.test(url)) fail(`${file}: ${attr}="${url}" is not root-relative`);
  }
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
