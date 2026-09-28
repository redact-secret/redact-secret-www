// Refreshes data/release.json (release-v1) from the package registries, for
// every package data/integrations.json lists.
//
// Run deliberately (`npm run slots:refresh`), review the diff, commit it.
// Never part of the build: a build uses only committed data
// (CONVENTIONS.md § Content slots). Reads package metadata only.
//
// A registry that cannot be read keeps its previous record, marked `stale`
// with its ORIGINAL observedAt; the script says so and `npm run check:data`
// keeps reporting it until a refresh reads it again. A package with no
// previous record to fall back on fails the refresh and nothing is written.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { buildRelease, NotFound } from './data/refresh.mjs';
import { createAjv, loadSchemas, validateDocument } from './data/contracts.mjs';

const integrationsUrl = new URL('../data/integrations.json', import.meta.url);
const releaseUrl = new URL('../data/release.json', import.meta.url);
const integrations = JSON.parse(readFileSync(integrationsUrl, 'utf8'));
const previous = existsSync(releaseUrl) ? JSON.parse(readFileSync(releaseUrl, 'utf8')) : undefined;

const schemas = loadSchemas();
const ajv = createAjv(schemas);
const inputErrors = validateDocument(ajv, schemas.documents, integrations, { family: 'integrations', label: 'data/integrations.json' });
if (inputErrors.length) {
  for (const e of inputErrors) console.error(`slots:refresh: ${e}`);
  process.exit(1);
}

async function fetchText(url, attempts = 3) {
  const res = await fetch(url, { headers: { 'User-Agent': 'redact-secret-www slot refresh' } });
  if (res.status === 404) throw new NotFound(url);
  if (res.status >= 500 && attempts > 1) {
    await new Promise((r) => setTimeout(r, 1000));
    return fetchText(url, attempts - 1);
  }
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

const { release, stale } = await buildRelease({ integrations, previous, fetchText });

const outputErrors = validateDocument(ajv, schemas.documents, release, { family: 'release', label: 'data/release.json (new)' });
if (outputErrors.length) {
  for (const e of outputErrors) console.error(`slots:refresh: ${e}`);
  console.error('slots:refresh: refusing to write an invalid release-v1 document');
  process.exit(1);
}

for (const [id, rec] of Object.entries(release.packages)) {
  const v = rec.value;
  console.log(id.padEnd(20), rec.freshness.padEnd(6), v.unpublished ? 'unpublished' : `${v.version} (${v.published})`);
}
for (const [label, reason] of stale) console.warn(`slots:refresh: STALE ${label}: ${reason} — kept the previous value and its original observedAt`);

writeFileSync(releaseUrl, `${JSON.stringify(release, null, 2)}\n`);
console.log(`wrote ${releaseUrl.pathname}`);
