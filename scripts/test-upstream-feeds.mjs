// Offline tests for the upstream feeds (#12), run by `npm run test:data`.
// Every upstream is a stub: the GitHub API, raw file reads and the three
// registries are served from scripts/fixtures/upstream-feeds/ (copies of the
// real feeds and schemas at the commits that introduced them) and from the
// committed data. Each fail-closed case — unknown schemaVersion, schema-
// invalid payload, digest mismatch on re-fetch, inconsistent payload, network
// error — must leave the previous record stale, or fail with none to keep.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAjv, loadSchemas, root, validateDocument } from './data/contracts.mjs';
import { buildRelease, NotFound } from './data/refresh.mjs';
import { commitUrl, compareSemver, rawUrl, upstreamFeeds } from './data/feeds.mjs';
import { driftReport } from './data/drift.mjs';

const schemas = loadSchemas();
const ajv = createAjv(schemas);
const check = (doc) => validateDocument(ajv, schemas.documents, doc, { family: 'release', label: 'release' });
const read = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const fixture = (name) => readFileSync(join(root, 'scripts/fixtures/upstream-feeds', name), 'utf8');
const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

const integrations = read('data/integrations.json');
const committed = read('data/release.json');
const { product: P, adapters: A } = upstreamFeeds;

// Synthetic commits: the stubs serve rewritten bytes, which must never be
// compared with a digest the committed data recorded for a real commit.
const PRODUCT_SHA = 'a'.repeat(40);
const ADAPTERS_SHA = 'b'.repeat(40);
// A later commit, for a payload that changed: bytes at a commit never change.
const NEXT_PRODUCT = 'c'.repeat(40);
const NEXT_ADAPTERS = 'd'.repeat(40);
const T0 = '2026-10-01T00:00:00.000Z';
const T1 = '2026-10-08T00:00:00.000Z';
const T2 = '2026-10-15T00:00:00.000Z';

// A credential-shaped value, assembled at run time so this file never
// contains one. It is not a real token.
const tokenShaped = ['ghp', '_', 'A1b2C3d4'.repeat(4), 'zzzz'].join('');

// --- the product feed, with synthetic inputs its `sources` digests match ---

const inputText = (path) => `synthetic input for ${path}\n`;

function productFeed(mutate) {
  const feed = JSON.parse(fixture('product-feed.json'));
  for (const s of feed.sources) s.sha256 = sha256(inputText(s.path));
  mutate?.(feed);
  return `${JSON.stringify(feed, null, 2)}\n`;
}

function adaptersFeed(mutate) {
  const feed = JSON.parse(fixture('adapters-feed.json'));
  mutate?.(feed);
  return `${JSON.stringify(feed, null, 2)}\n`;
}

// --- the registries, built from the committed records ---

function baseRegistry() {
  const state = new Map();
  for (const [id, rec] of Object.entries(committed.packages)) {
    const entry = integrations.packages[id];
    state.set(`${entry.registry}:${entry.name}`, rec.value.unpublished ? null : { ...rec.value, revision: rec.source.revision });
    for (const [reg, m] of Object.entries(rec.mirrors ?? {})) state.set(`${reg}:${m.value.name}`, { registry: reg, ...m.value });
  }
  // The product fixture is 0.1.0-beta.10; the registries agree with it.
  const feed = JSON.parse(fixture('product-feed.json'));
  for (const p of feed.release.packages) {
    const key = `${p.ecosystem}:${p.name}`;
    if (state.get(key)) state.set(key, { ...state.get(key), version: p.version, ...(p.ecosystem === 'npm' && { latest: p.version }) });
  }
  return state;
}

/** The registries as they would be once the adapters fixture's versions are published. */
function adaptersPublished(state = baseRegistry()) {
  const feed = JSON.parse(fixture('adapters-feed.json'));
  for (const p of feed.packages) {
    const key = `${p.ecosystem}:${p.name}`;
    const cur = state.get(key);
    if (!cur) continue;
    state.set(key, { ...cur, version: p.version, ...(p.ecosystem === 'npm' && p.channel === 'latest' && { latest: p.version }) });
  }
  return state;
}

function registryDoc(key, v) {
  const [registry] = key.split(':');
  const time = `${v.published ?? '2026-09-28'}T00:00:00.000Z`;
  if (registry === 'npm') {
    const tags = { latest: v.latest ?? v.version };
    if (v.tag && v.tag !== 'latest') tags[v.tag] = v.version;
    const manifest = { peerDependencies: v.peers ?? {}, dependencies: v.dependencies ?? {}, ...(v.revision && { gitHead: v.revision }) };
    return { 'dist-tags': tags, versions: { [tags.latest]: manifest, [v.version]: manifest }, time: { [tags.latest]: time, [v.version]: time } };
  }
  if (registry === 'pypi') return { info: { version: v.version, requires_dist: v.requires ?? [] }, releases: { [v.version]: [{ upload_time: time.slice(0, 19) }] } };
  return { crate: { max_version: v.version }, versions: [{ num: v.version, created_at: time }] };
}

const registryUrls = {
  npm: (name) => `https://registry.npmjs.org/${name.replace('/', '%2f')}`,
  pypi: (name) => `https://pypi.org/pypi/${name}/json`,
  crates: (name) => `https://crates.io/api/v1/crates/${name}`,
};

/**
 * One consistent set of upstreams. Options:
 *   product / adapters: feed text, or null for "not at this commit" (404)
 *   productSchema / adaptersSchema: schema text
 *   registry: Map of `${registry}:${name}` → value (null = not published)
 *   down: predicate(url) → throw a network error for that URL
 *   serve: (url, text, count) → text, to change the bytes of a later read
 */
function world(options = {}) {
  const {
    product = productFeed(),
    adapters = adaptersFeed(),
    productSchema = fixture('product-feed.schema.json'),
    adaptersSchema = fixture('adapters-feed.schema.json'),
    productSha = PRODUCT_SHA,
    adaptersSha = ADAPTERS_SHA,
    registry = adaptersPublished(),
    down = () => false,
    serve = (_url, text) => text,
  } = options;
  const routes = new Map([
    [commitUrl(P.repository, P.ref), productSha],
    [commitUrl(A.repository, A.ref), adaptersSha],
    [rawUrl(P.repository, productSha, P.feedPath), product],
    [rawUrl(P.repository, productSha, P.schemaPath), productSchema],
    [rawUrl(A.repository, adaptersSha, A.feedPath), adapters],
    [rawUrl(A.repository, adaptersSha, A.schemaPath), adaptersSchema],
  ]);
  for (const s of JSON.parse(fixture('product-feed.json')).sources) routes.set(rawUrl(P.repository, productSha, s.path), inputText(s.path));
  for (const [key, v] of registry) {
    const [reg, ...rest] = key.split(':');
    routes.set(registryUrls[reg](rest.join(':')), v ? JSON.stringify(registryDoc(key, v)) : null);
  }
  const counts = new Map();
  const fetched = [];
  const fetchText = async (url) => {
    fetched.push(url);
    if (down(url)) throw new Error(`stub: ${url} unreachable`);
    const text = routes.get(url);
    if (text === undefined || text === null) throw new NotFound(url);
    const n = (counts.get(url) ?? 0) + 1;
    counts.set(url, n);
    return serve(url, text, n);
  };
  fetchText.fetched = fetched;
  return fetchText;
}

const run = (fetchText, previous, now = T1) => buildRelease({ integrations, previous, fetchText, now, feeds: upstreamFeeds });

/** A committed document where both feeds were read at T0. */
async function baseline() {
  const { release, stale } = await run(world(), committed, T0);
  assert.deepEqual(stale, []);
  return release;
}

/** The record kept exactly as it was, but marked stale since `now`. */
function assertKeptStale(record, before, now = T1) {
  assert.equal(record.freshness, 'stale');
  assert.equal(record.staleSince, now);
  assert.equal(record.observedAt, before.observedAt, 'keeps its ORIGINAL observedAt');
  const { freshness: _f, staleSince: _s, ...kept } = record;
  const { freshness: _bf, staleSince: _bs, ...was } = before;
  assert.deepEqual(kept, was, 'keeps the value, source and digest');
}

// --- both feeds read ---

test('feeds: both feeds are read at a full commit, validated, digested and cross-checked', async () => {
  const product = productFeed();
  const adapters = adaptersFeed();
  const { release, stale } = await run(world({ product, adapters }), committed, T0);
  assert.deepEqual(stale, []);
  assert.deepEqual(check(release), []);
  const p = release.feeds.product;
  assert.equal(p.freshness, 'fresh');
  assert.equal(p.source.revision, PRODUCT_SHA);
  assert.equal(p.digest, `sha256:${sha256(product)}`);
  assert.equal(p.schemaDigest, `sha256:${sha256(fixture('product-feed.schema.json'))}`);
  assert.equal(p.generatedAt, JSON.parse(product).generatedAt);
  assert.equal(p.observedAt, T0);
  assert.deepEqual(p.crossChecked, ['cli', 'core', 'core/crates', 'core/pypi', 'wasm']);
  const a = release.feeds.adapters;
  assert.equal(a.mode, 'feed');
  assert.equal(a.source.revision, ADAPTERS_SHA);
  assert.equal(a.digest, `sha256:${sha256(adapters)}`);
  assert.deepEqual(a.crossChecked, ['adapter', 'adapter-ai-context', 'adapter-mcp', 'adapter-otel', 'adapter-pino', 'adapters-py']);
});

test('feeds: the measured version is recorded next to the released one, never replaced by it', async () => {
  const { release } = await run(world(), committed, T0);
  const { release: rel, supportMatrix: m } = release.feeds.product.value;
  assert.equal(rel.version, '0.1.0-beta.10');
  assert.equal(m.measuredProductVersion, '0.1.0-beta.7');
  assert.equal(m.gatedLatestRelease, true);
  // Counts are recomputed from the families, and agree with the committed evidence.
  const evidence = read('data/evidence.json').facts.matrix.value;
  assert.deepEqual({ families: m.families, providers: m.providers, status: m.status, stableBasis: m.stableBasis, tiers: m.tiers }, {
    families: evidence.families,
    providers: evidence.providers,
    status: { stable: evidence.status.stable, provisional: evidence.status.provisional, pending: evidence.status.pending, unsupported: evidence.status.unsupported },
    stableBasis: evidence.stableBasis,
    tiers: { T0: evidence.tiers.T0, T1: evidence.tiers.T1, T2: evidence.tiers.T2, T3: evidence.tiers.T3 },
  });
});

test('feeds: the GitHub API resolves the commit; every file is read at that commit, never at a branch', async () => {
  const fetchText = world();
  await run(fetchText, committed, T0);
  const raw = fetchText.fetched.filter((u) => u.startsWith('https://raw.githubusercontent.com/'));
  assert.ok(raw.length > 0);
  for (const u of raw) assert.match(u, /\/[0-9a-f]{40}\//, u);
  assert.ok(fetchText.fetched.includes(commitUrl(P.repository, 'main')));
  assert.ok(fetchText.fetched.includes(commitUrl(A.repository, 'main')));
});

// --- adapters: registry fallback while the feed is not on main ---

test('adapters: no feed on main → registry fallback, recorded explicitly, registry records unchanged', async () => {
  const { release, stale } = await run(world({ adapters: null, registry: baseRegistry() }), committed, T0);
  assert.deepEqual(stale, []);
  assert.deepEqual(check(release), []);
  const a = release.feeds.adapters;
  assert.equal(a.mode, 'registry-fallback');
  assert.equal(a.freshness, 'fresh');
  assert.equal(a.source.revision, ADAPTERS_SHA);
  assert.deepEqual(a.source.paths, [A.feedPath]);
  assert.match(a.fallbackReason, /not on main at bbbbbbb/);
  assert.equal(a.value, undefined);
  assert.equal(a.digest, undefined);
  for (const id of ['adapter', 'adapter-pino', 'adapter-otel', 'adapters-py']) assert.equal(release.packages[id].value.version, committed.packages[id].value.version, id);
});

test('adapters: a feed that is on main is used and cross-checked against the registry', async () => {
  const { release } = await run(world({ registry: adaptersPublished() }), committed, T0);
  assert.equal(release.feeds.adapters.mode, 'feed');
  assert.equal(release.feeds.adapters.value.packages.find((p) => p.id === 'adapter').version, release.packages.adapter.value.version);
});

test('adapters: a feed that was read before and is no longer on main is stale, not a fallback', async () => {
  const before = await baseline();
  const { release, stale } = await run(world({ adapters: null }), before);
  assertKeptStale(release.feeds.adapters, before.feeds.adapters);
  assert.match(stale.find(([l]) => l === 'feeds/adapters')[1], /no longer on main/);
});

// --- fail closed: each case keeps the previous record, stale ---

const reasonFor = (stale, name) => stale.find(([label]) => label === `feeds/${name}`)?.[1];

test('unknown schemaVersion: the previous record is kept, stale', async () => {
  const before = await baseline();
  for (const [name, fetchText] of [
    ['product', world({ productSha: NEXT_PRODUCT, product: productFeed((f) => (f.schemaVersion = 'redact-secret.site-feed/v2')) })],
    ['adapters', world({ adaptersSha: NEXT_ADAPTERS, adapters: adaptersFeed((f) => (f.schemaVersion = 'redact-secret-adapters.release-feed/v2')) })],
  ]) {
    const { release, stale } = await run(fetchText, before);
    assert.deepEqual(check(release), []);
    assertKeptStale(release.feeds[name], before.feeds[name]);
    assert.match(reasonFor(stale, name), /unknown schemaVersion/);
  }
});

test('unknown schemaVersion: a token-shaped value is withheld from the diagnostic', async () => {
  const before = await baseline();
  const { stale } = await run(world({ productSha: NEXT_PRODUCT, product: productFeed((f) => (f.schemaVersion = `x ${tokenShaped}`)) }), before);
  const reason = reasonFor(stale, 'product');
  assert.match(reason, /unknown schemaVersion <withheld>/);
  assert.ok(!reason.includes(tokenShaped));
});

test('schema-invalid payload: an unknown field or a missing field is rejected, the previous record kept stale', async () => {
  const before = await baseline();
  for (const [name, fetchText] of [
    ['adapters', world({ adaptersSha: NEXT_ADAPTERS, adapters: adaptersFeed((f) => (f.packages[0].homepage = 'https://example.com')) })],
    ['product', world({ productSha: NEXT_PRODUCT, product: productFeed((f) => delete f.release.sourceRevision) })],
    ['product', world({ productSha: NEXT_PRODUCT, product: productFeed((f) => (f.supportMatrix.families[0].status = 'great')) })],
  ]) {
    const { release, stale } = await run(fetchText, before);
    assertKeptStale(release.feeds[name], before.feeds[name]);
    assert.match(reasonFor(stale, name), /does not satisfy its schema/);
  }
});

test('schema-invalid payload: the schema must come from the same commit and define the known schemaVersion', async () => {
  const before = await baseline();
  const other = JSON.parse(fixture('product-feed.schema.json'));
  other.properties.schemaVersion.const = 'something-else/v1';
  const { release, stale } = await run(world({ productSchema: JSON.stringify(other) }), before);
  assertKeptStale(release.feeds.product, before.feeds.product);
  assert.match(reasonFor(stale, 'product'), /does not define redact-secret\.site-feed\/v1/);
});

test('digest mismatch on re-fetch: the same commit served different bytes than the committed digest', async () => {
  const before = await baseline();
  // Same commit, different bytes (whitespace only: still valid, still consistent).
  const { release, stale } = await run(world({ product: productFeed().replace(/\n$/, '\n\n') }), before);
  assertKeptStale(release.feeds.product, before.feeds.product);
  assert.match(reasonFor(stale, 'product'), /digest mismatch on re-fetch/);
});

test('digest mismatch on re-fetch: the bytes changed between two reads in one refresh', async () => {
  const before = await baseline();
  const feedUrl = rawUrl(A.repository, ADAPTERS_SHA, A.feedPath);
  const serve = (url, text, n) => (url === feedUrl && n > 1 ? `${text} ` : text);
  const { release, stale } = await run(world({ serve }), before);
  assertKeptStale(release.feeds.adapters, before.feeds.adapters);
  assert.match(reasonFor(stale, 'adapters'), /digest mismatch on re-fetch/);
});

test('digest mismatch: an input that does not hash to the digest in the feed is rejected', async () => {
  const before = await baseline();
  const input = JSON.parse(fixture('product-feed.json')).sources[1].path;
  const serve = (url, text) => (url.endsWith(input) ? `${text}tampered` : text);
  const { release, stale } = await run(world({ serve }), before);
  assertKeptStale(release.feeds.product, before.feeds.product);
  assert.match(reasonFor(stale, 'product'), /does not match its sha256/);
});

test('inconsistent: the feed release is not what the registry has published', async () => {
  const before = await baseline();
  const registry = adaptersPublished();
  registry.set('npm:@redact-secret/core', { ...registry.get('npm:@redact-secret/core'), version: '0.1.0-beta.11', latest: '0.1.0-beta.11' });
  const { release, stale } = await run(world({ registry }), before);
  assertKeptStale(release.feeds.product, before.feeds.product);
  assert.match(reasonFor(stale, 'product'), /inconsistent: .*@redact-secret\/core 0\.1\.0-beta\.10, the registry has 0\.1\.0-beta\.11/);
  // The registry record itself is still read fresh: it is the published fact.
  assert.equal(release.packages.core.value.version, '0.1.0-beta.11');
  assert.equal(release.packages.core.freshness, 'fresh');
});

test('inconsistent: an adapters feed declaring versions the registry does not have (develop ahead of the registries)', async () => {
  const before = await baseline();
  const { release, stale } = await run(world({ registry: baseRegistry() }), before);
  assertKeptStale(release.feeds.adapters, before.feeds.adapters);
  assert.match(reasonFor(stale, 'adapters'), /inconsistent: @redact-secret\/adapter 0\.1\.3 is declared, the registry has 0\.1\.2/);
});

test('inconsistent: a channel other than the dist-tag the site installs from', async () => {
  const before = await baseline();
  const adapters = adaptersFeed((f) => (f.packages.find((p) => p.id === 'adapter-mcp').channel = 'latest'));
  const { release, stale } = await run(world({ adaptersSha: NEXT_ADAPTERS, adapters }), before);
  assertKeptStale(release.feeds.adapters, before.feeds.adapters);
  assert.match(reasonFor(stale, 'adapters'), /adapter-mcp channel latest, the site installs from alpha/);
});

test('inconsistent: a feed older than the committed one', async () => {
  const before = await baseline();
  const older = structuredClone(before);
  older.feeds.product.generatedAt = '2026-12-01T00:00:00Z';
  older.feeds.product.value.release.version = '0.1.0-beta.12';
  const { release, stale } = await run(world(), older);
  assertKeptStale(release.feeds.product, older.feeds.product);
  const reason = reasonFor(stale, 'product');
  assert.match(reason, /older than the committed 0\.1\.0-beta\.12/);
  assert.match(reason, /generatedAt .* is older than the committed 2026-12-01/);
});

test('inconsistent: counts that do not add up to the families listed', async () => {
  const before = await baseline();
  const { release, stale } = await run(world({ productSha: NEXT_PRODUCT, product: productFeed((f) => (f.supportMatrix.distribution.stable += 1)) }), before);
  assertKeptStale(release.feeds.product, before.feeds.product);
  assert.match(reasonFor(stale, 'product'), /distribution\.stable 84 but 83 families/);
});

test('network error: the GitHub API or a raw read failing keeps the previous record, stale', async () => {
  const before = await baseline();
  for (const [name, down] of [
    ['product', (u) => u === commitUrl(P.repository, 'main')],
    ['adapters', (u) => u.startsWith(`https://raw.githubusercontent.com/${A.repository}/`)],
  ]) {
    const { release, stale } = await run(world({ down }), before);
    assert.deepEqual(check(release), []);
    assertKeptStale(release.feeds[name], before.feeds[name]);
    assert.match(reasonFor(stale, name), /unreachable/);
  }
});

test('network error: an API answer that is not a full commit SHA is rejected', async () => {
  const before = await baseline();
  const { release, stale } = await run(world({ productSha: 'abc1234' }), before);
  assertKeptStale(release.feeds.product, before.feeds.product);
  assert.match(reasonFor(stale, 'product'), /did not return a full commit SHA/);
});

test('stale: a record that stays unreadable keeps its original observedAt and its FIRST staleSince', async () => {
  const before = await baseline();
  const down = (u) => u.startsWith('https://api.github.com/');
  const first = await run(world({ down }), before, T1);
  const second = await run(world({ down }), first.release, T2);
  for (const name of ['product', 'adapters']) {
    const rec = second.release.feeds[name];
    assert.equal(rec.freshness, 'stale');
    assert.equal(rec.observedAt, T0, `${name} keeps the observation from T0`);
    assert.equal(rec.staleSince, T1, `${name} keeps the first staleSince`);
  }
  assert.deepEqual(check(second.release), []);
});

test('stale: a readable, valid feed makes the record fresh again', async () => {
  const before = await baseline();
  const stale = await run(world({ down: (u) => u.startsWith('https://api.github.com/') }), before, T1);
  const again = await run(world(), stale.release, T2);
  assert.equal(again.release.feeds.product.freshness, 'fresh');
  assert.equal(again.release.feeds.product.staleSince, undefined);
  assert.equal(again.release.feeds.product.observedAt, T2);
});

test('no previous record: a rejected feed fails the refresh instead of being invented', async () => {
  const noFeeds = structuredClone(committed);
  delete noFeeds.feeds;
  await assert.rejects(run(world({ down: (u) => u.startsWith('https://api.github.com/') }), noFeeds), /feeds\/product: .*no previous record to keep/);
  await assert.rejects(run(world({ product: productFeed((f) => (f.schemaVersion = 'v9')) }), noFeeds), /no previous record to keep/);
});

// --- the drift report ---

test('drift: an unchanged world is no drift; only timestamps moved', async () => {
  const before = await baseline();
  const { release, stale } = await run(world(), before, T1);
  const report = driftReport(before, release, stale);
  assert.equal(report.drift, false, report.markdown);
  assert.match(report.markdown, /No drift/);
  assert.match(report.markdown, /measured on \*\*0\.1\.0-beta\.7\*\*/);
});

test('drift: a stale feed and a changed value are drift, and the report names them', async () => {
  const before = await baseline();
  const registry = adaptersPublished();
  registry.set('npm:@redact-secret/core', { ...registry.get('npm:@redact-secret/core'), version: '0.1.0-beta.11', latest: '0.1.0-beta.11' });
  const { release, stale } = await run(world({ registry }), before);
  const report = driftReport(before, release, stale);
  assert.equal(report.drift, true);
  assert.match(report.markdown, /feeds\/product/);
  assert.match(report.markdown, /`\/packages\/core\/value\/version` \| "0\.1\.0-beta\.10" \| "0\.1\.0-beta\.11"/);
});

test('drift: a digest-only change is listed but is not drift', () => {
  const next = structuredClone(committed);
  next.packages.core.digest = `sha256:${'0'.repeat(64)}`;
  const report = driftReport(committed, next, []);
  assert.equal(report.drift, false);
  assert.match(report.markdown, /Payload digest changed without a value change: `packages\/core`/);
});

test('semver precedence orders pre-releases numerically', () => {
  assert.equal(compareSemver('0.1.0-beta.10', '0.1.0-beta.9'), 1);
  assert.equal(compareSemver('0.1.0-beta.7', '0.1.0-beta.10'), -1);
  assert.equal(compareSemver('0.1.0', '0.1.0-beta.10'), 1);
  assert.equal(compareSemver('0.1.0-alpha.2', '0.1.0-beta.1'), -1);
  assert.equal(compareSemver('1.2.3', '1.2.3'), 0);
});

// --- check-data: the committed files must agree with the committed feeds ---

function runCheck(mutate) {
  const dir = mkdtempSync(join(tmpdir(), 'check-feeds-'));
  try {
    cpSync(join(root, 'data'), join(dir, 'data'), { recursive: true });
    mutate(dir);
    return spawnSync(process.execPath, [join(root, 'scripts/check-data.mjs'), '--root', dir], { encoding: 'utf8' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const edit = (dir, file, fn) => {
  const path = join(dir, 'data', file);
  const doc = JSON.parse(readFileSync(path, 'utf8'));
  fn(doc);
  writeFileSync(path, JSON.stringify(doc));
};

test('check-data: hand-kept matrix counts that disagree with the product feed fail', () => {
  const r = runCheck((dir) => edit(dir, 'evidence.json', (d) => (d.facts.matrix.value.stableBasis.documented += 1)));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /facts\/matrix: stableBasis\.documented is 58, the product feed .* says 57/);
});

test('check-data: a fresh feed release that differs from the fresh registry record fails', () => {
  const r = runCheck((dir) => edit(dir, 'release.json', (d) => (d.feeds.product.value.release.version = '0.1.0-beta.11')));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /feeds\/product: release 0\.1\.0-beta\.11, but packages\.core is/);
});

test('check-data: a stale feed is reported by name', () => {
  const r = runCheck((dir) =>
    edit(dir, 'release.json', (d) => {
      d.feeds.product.freshness = 'stale';
      d.feeds.product.staleSince = d.generatedAt;
    }),
  );
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /feeds\/product: STALE since/);
});

test('check-data: release.json without feed records fails', () => {
  const r = runCheck((dir) => edit(dir, 'release.json', (d) => delete d.feeds));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /no upstream feed records/);
});

test('schema: a fallback record may not carry a value or digest, and a feed record must', () => {
  const doc = structuredClone(committed);
  doc.feeds.adapters = { ...doc.feeds.adapters, mode: 'registry-fallback', fallbackReason: 'x', digest: `sha256:${'0'.repeat(64)}` };
  assert.ok(check(doc).length > 0);
  const feed = structuredClone(committed);
  feed.feeds.adapters = { ...feed.feeds.adapters, mode: 'feed' };
  delete feed.feeds.adapters.fallbackReason;
  assert.ok(check(feed).some((e) => /digest|value/.test(e)));
});
