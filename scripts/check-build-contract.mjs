// Checks dist/ against redact-secret-sites' site build contract
// (https://github.com/redact-secret/redact-secret-sites/blob/main/ARCHITECTURE.md#site-build-contract)
// and this repository's own rules. Run after `npm run build`; CI and the
// publish workflow both run it, so a build that breaks the contract never
// reaches the bucket.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const origin = 'https://www.redactsecret.dev';
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
for (const page of ['index.html', 'en/index.html', 'ko/index.html', '404/index.html']) {
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

  // 4. Root-relative (or absolute https) references only.
  for (const [, attr, url] of html.matchAll(/\s(src|href)="([^"]*)"/g)) {
    if (!/^(\/|https:\/\/|#|mailto:)/.test(url)) fail(`${file}: ${attr}="${url}" is not root-relative`);
  }
}

// README § Domain: build and copy against .dev; .com is reserved elsewhere.
for (const file of files.filter((f) => /\.(html|js|css|json|svg)$/.test(f))) {
  if (readFileSync(join(dist, file), 'utf8').includes('redactsecret.com')) fail(`${file}: mentions redactsecret.com`);
}

if (failures.length) {
  console.error(`build contract: ${failures.length} failure(s)\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`build contract: ${files.length} files OK`);
