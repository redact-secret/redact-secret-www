// Refreshes data/release.json (release-v1) from the package registries, for
// every package data/integrations.json lists, and from the upstream feeds
// (scripts/data/feeds.mjs): redact-secret's site feed and
// redact-secret-adapters' release feed, each pinned to the full commit its
// `main` pointed at.
//
//   npm run slots:refresh                          refresh and write
//   node scripts/refresh-slots.mjs --dry-run       refresh in memory, report drift, write nothing
//        [--report <file>]                         also write the drift report (Markdown) there
//
// Run deliberately, review the diff, commit it. Never part of the build: a
// build uses only committed data (CONVENTIONS.md § Content slots). Reads
// package metadata and public repository files only.
//
// A source that cannot be read — or a feed that is rejected (unknown
// schemaVersion, schema-invalid, digest mismatch, inconsistent with the
// registries or older than the committed one) — keeps its previous record,
// marked `stale` with its ORIGINAL observedAt; the script says so and
// `npm run check:data` keeps reporting it until a refresh reads it again. A
// record with no previous value to fall back on fails the refresh and nothing
// is written.
//
// GITHUB_TOKEN, when set, is sent to api.github.com only (to resolve the
// commit behind `main` without the anonymous rate limit). It is never
// printed; error messages name the URL, never a header.
//
// Exit codes: 0 done (with --dry-run: no drift), 3 --dry-run found drift,
// 1 the refresh failed or its output is invalid.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { buildRelease, NotFound } from './data/refresh.mjs';
import { upstreamFeeds } from './data/feeds.mjs';
import { driftReport } from './data/drift.mjs';
import { createAjv, loadSchemas, validateDocument } from './data/contracts.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const reportArg = args.indexOf('--report');
const reportPath = reportArg >= 0 ? args[reportArg + 1] : undefined;

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

const token = process.env.GITHUB_TOKEN || undefined;

async function fetchText(url, attempts = 3) {
  const headers = { 'User-Agent': 'redact-secret-www slot refresh' };
  if (url.startsWith('https://api.github.com/')) {
    headers.Accept = 'application/vnd.github.sha';
    headers['X-GitHub-Api-Version'] = '2022-11-28';
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let res;
  try {
    res = await fetch(url, { headers });
  } catch (error) {
    if (attempts > 1) return fetchText(url, attempts - 1);
    throw new Error(`${url}: ${error.cause?.code ?? error.message}`);
  }
  if (res.status === 404) throw new NotFound(url);
  if (res.status >= 500 && attempts > 1) {
    await new Promise((r) => setTimeout(r, 1000));
    return fetchText(url, attempts - 1);
  }
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

let result;
try {
  result = await buildRelease({ integrations, previous, fetchText, feeds: upstreamFeeds });
} catch (error) {
  console.error(`slots:refresh: ${error.message}`);
  console.error('slots:refresh: nothing written');
  process.exit(1);
}
const { release, stale } = result;

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
for (const [name, rec] of Object.entries(release.feeds ?? {})) {
  const what = rec.mode === 'registry-fallback' ? `registry fallback: ${rec.fallbackReason}` : `${rec.source.repository}@${rec.source.revision.slice(0, 7)} ${rec.digest.slice(0, 19)}…`;
  console.log(`feeds/${name}`.padEnd(20), rec.freshness.padEnd(6), what);
}
for (const [label, reason] of stale) console.warn(`slots:refresh: STALE ${label}: ${reason} — kept the previous value and its original observedAt`);

const report = driftReport(previous, release, stale);
if (reportPath) writeFileSync(reportPath, report.markdown);
if (dryRun) {
  console.log(report.markdown);
  console.log(report.drift ? 'slots:refresh: drift found (dry run, nothing written)' : 'slots:refresh: no drift (dry run, nothing written)');
  process.exit(report.drift ? 3 : 0);
}

writeFileSync(releaseUrl, `${JSON.stringify(release, null, 2)}\n`);
console.log(`wrote ${releaseUrl.pathname}${report.drift ? ' — review the drift below before committing' : ''}`);
if (report.drift) console.log(report.markdown);
