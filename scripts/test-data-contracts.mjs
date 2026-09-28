// Negative and positive tests for the data contracts (npm run test:data).
// Deterministic and offline: every case mutates a copy of the committed
// data in memory or in a temporary directory; the registry is a stub.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  benchmarkBoundaryViolations,
  createAjv,
  loadSchemas,
  root,
  secretFindings,
  validateDocument,
} from './data/contracts.mjs';
import { buildRelease, NotFound } from './data/refresh.mjs';

const schemas = loadSchemas();
const ajv = createAjv(schemas);
const read = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const committed = {
  integrations: read('data/integrations.json'),
  release: read('data/release.json'),
  evidence: read('data/evidence.json'),
};
const copy = (family) => structuredClone(committed[family]);
const check = (doc, family) => validateDocument(ajv, schemas.documents, doc, { family, label: family });
const fails = (doc, family, pattern) => {
  const errors = check(doc, family);
  assert.ok(errors.length > 0, `expected ${family} to fail validation`);
  if (pattern) assert.ok(errors.some((e) => pattern.test(e)), `no error matched ${pattern}:\n${errors.join('\n')}`);
};

// A credential-shaped value, assembled at run time so this file never
// contains one. It is not a real token.
const tokenShaped = ['ghp', '_', 'A1b2C3d4'.repeat(4), 'zzzz'].join('');

test('the committed data is valid', () => {
  for (const family of Object.keys(committed)) assert.deepEqual(check(committed[family], family), []);
});

test('unknown schemaVersion fails closed', () => {
  const doc = copy('release');
  doc.schemaVersion = 'release-v2';
  fails(doc, 'release', /unknown schemaVersion "release-v2"/);
});

test('missing schemaVersion fails', () => {
  const doc = copy('evidence');
  delete doc.schemaVersion;
  fails(doc, 'evidence', /missing schemaVersion/);
});

test('a file cannot validate as another family', () => {
  fails(copy('release'), 'evidence', /belongs to release, not evidence/);
});

test('a release record without a source fails', () => {
  const doc = copy('release');
  delete doc.packages.core.source;
  fails(doc, 'release', /source/);
});

test('a fetched release record without a digest fails', () => {
  const doc = copy('release');
  delete doc.packages.wasm.digest;
  fails(doc, 'release', /digest/);
});

test('a release record without observedAt fails', () => {
  const doc = copy('release');
  delete doc.packages.cli.observedAt;
  fails(doc, 'release', /observedAt/);
});

test('an evidence source with a short revision fails', () => {
  const doc = copy('evidence');
  doc.sources.core.source.revision = doc.sources.core.source.revision.slice(0, 7);
  fails(doc, 'evidence', /revision/);
});

test('an evidence source without a revision fails', () => {
  const doc = copy('evidence');
  delete doc.sources.benchmarks.source.revision;
  fails(doc, 'evidence', /revision/);
});

test('a registry evidence source must pin version, revision and repository', () => {
  const doc = copy('evidence');
  delete doc.sources.adapters.source.revision;
  fails(doc, 'evidence', /revision/);
});

test('a stale record must say since when; a fresh one must not', () => {
  const stale = copy('release');
  stale.packages.core.freshness = 'stale';
  fails(stale, 'release', /staleSince/);
  const fresh = copy('release');
  fresh.packages.core.staleSince = fresh.packages.core.observedAt;
  fails(fresh, 'release');
});

test('an unknown freshness state fails', () => {
  const doc = copy('integrations');
  doc.freshness = 'unknown';
  fails(doc, 'integrations', /freshness/);
});

test('a fractional number or a score-like key never validates as evidence', () => {
  const doc = copy('evidence');
  doc.facts.taxonomy.value.detectionRate = 0.97;
  fails(doc, 'evidence');
  const found = benchmarkBoundaryViolations({ facts: { taxonomy: { value: { recallBound: 1, share: 0.5 } } } }, 'x');
  assert.equal(found.length, 2, found.join('\n'));
});

test('the committed data contains no plaintext secret', async () => {
  const docs = Object.entries(committed).map(([label, doc]) => ({ label, doc }));
  assert.deepEqual(await secretFindings(docs), []);
});

test('a credential-shaped value is found; only the synthetic marker is exempt', async () => {
  const doc = copy('integrations');
  doc.groups[0].cards[0].display = `token ${tokenShaped}`;
  const found = await secretFindings([{ label: 'integrations', doc }]);
  assert.equal(found.length, 1);
  assert.ok(!found[0].includes(tokenShaped), 'a finding must never echo the value');
  const synthetic = await secretFindings([{ label: 's', doc: { s: 'API_KEY=SYNTHETIC_REVOKED_CONTEXT_VALUE' } }]);
  assert.deepEqual(synthetic, []);
});

// --- refresh: a failed source keeps its previous value, marked stale ---

const now = '2026-10-01T00:00:00.000Z';

test('refresh: an unreadable registry keeps the previous record, stale, with its original observedAt', async () => {
  const previous = copy('release');
  const { release, stale } = await buildRelease({
    integrations: committed.integrations,
    previous,
    now,
    fetchText: async (url) => {
      throw new Error(`stub: ${url} unreachable`);
    },
  });
  assert.deepEqual(check(release, 'release'), []);
  for (const [id, rec] of Object.entries(release.packages)) {
    const before = previous.packages[id];
    assert.equal(rec.freshness, 'stale', id);
    assert.equal(rec.observedAt, before.observedAt, `${id} keeps its original observedAt`);
    assert.equal(rec.staleSince, now, id);
    assert.deepEqual(rec.value, before.value, id);
    assert.equal(rec.digest, before.digest, id);
  }
  assert.ok(stale.length >= Object.keys(release.packages).length);
  assert.equal(release.generatedAt, now);
});

test('refresh: a record already stale keeps its first staleSince', async () => {
  const previous = copy('release');
  previous.packages.core.freshness = 'stale';
  previous.packages.core.staleSince = '2026-09-30T00:00:00.000Z';
  const { release } = await buildRelease({
    integrations: committed.integrations,
    previous,
    now,
    fetchText: async () => {
      throw new Error('stub: down');
    },
  });
  assert.equal(release.packages.core.staleSince, '2026-09-30T00:00:00.000Z');
});

test('refresh: with no previous record to keep, a failed source fails the refresh', async () => {
  await assert.rejects(
    buildRelease({ integrations: committed.integrations, previous: undefined, now, fetchText: async () => { throw new Error('stub: down'); } }),
    /no previous record/,
  );
});

test('refresh: a previous file of an unknown schemaVersion is not reused', async () => {
  const previous = copy('release');
  previous.schemaVersion = 'release-v0';
  await assert.rejects(
    buildRelease({ integrations: committed.integrations, previous, now, fetchText: async () => { throw new Error('stub: down'); } }),
    /no previous record/,
  );
});

test('refresh: a 404 is a fresh "not published" observation, with the declared version kept', async () => {
  const { release, stale } = await buildRelease({
    integrations: committed.integrations,
    previous: undefined,
    now,
    fetchText: async (url) => {
      throw new NotFound(url);
    },
  });
  assert.deepEqual(stale, []);
  assert.deepEqual(check(release, 'release'), []);
  const vaultPy = release.packages['vault-py'];
  assert.equal(vaultPy.freshness, 'fresh');
  assert.equal(vaultPy.value.unpublished, true);
  assert.equal(vaultPy.declared.version, committed.integrations.packages['vault-py'].declared.version);
});

test('refresh: a fetched payload is recorded with its sha256 digest and version', async () => {
  const body = JSON.stringify({ info: { version: '9.9.9', requires_dist: [] }, releases: { '9.9.9': [{ upload_time: '2026-10-01T00:00:00' }] } });
  const integrations = { ...copy('integrations'), packages: { only: { registry: 'pypi', name: 'example-package' } } };
  const { release } = await buildRelease({ integrations, previous: undefined, now, fetchText: async () => body });
  const rec = release.packages.only;
  assert.match(rec.digest, /^sha256:[0-9a-f]{64}$/);
  assert.equal(rec.source.version, '9.9.9');
  assert.equal(rec.freshness, 'fresh');
  assert.deepEqual(check(release, 'release'), []);
});

// --- content manifest ---

const manifest = () => ({
  schemaVersion: 'content-manifest-v1',
  releaseId: `sha256:${'0'.repeat(64)}`,
  locale: 'en',
  rendererRelease: 'a'.repeat(40),
  generatedAt: now,
  sources: [{ name: 'core', source: committed.evidence.sources.core.source, freshness: 'fresh' }],
  files: [{ path: 'data/evidence.json', schemaVersion: 'evidence-v1', digest: `sha256:${'1'.repeat(64)}`, bytes: 10 }],
});

test('content manifest: a well-formed manifest validates', () => {
  assert.deepEqual(check(manifest(), 'content-manifest'), []);
});

test('content manifest: wrong locale, climbing path or short renderer revision fails', () => {
  for (const mutate of [
    (m) => (m.locale = 'fr'),
    (m) => (m.files[0].path = '../secrets.json'),
    (m) => (m.rendererRelease = 'abc1234'),
    (m) => (m.schemaVersion = 'content-manifest-v2'),
  ]) {
    const m = manifest();
    mutate(m);
    fails(m, 'content-manifest');
  }
});

// --- the CLI, end to end on a copy of data/ ---

function runCheck(mutate, ...flags) {
  const dir = mkdtempSync(join(tmpdir(), 'check-data-'));
  try {
    cpSync(join(root, 'data'), join(dir, 'data'), { recursive: true });
    mutate?.(dir);
    return spawnSync(process.execPath, [join(root, 'scripts/check-data.mjs'), '--root', dir, ...flags], { encoding: 'utf8' });
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

test('check-data: passes on the committed data', () => {
  const r = runCheck();
  assert.equal(r.status, 0, r.stderr);
});

test('check-data: unknown schemaVersion exits non-zero', () => {
  const r = runCheck((dir) => edit(dir, 'release.json', (d) => (d.schemaVersion = 'release-v2')));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /unknown schemaVersion "release-v2"/);
});

test('check-data: a stale record is reported, and fails with --no-stale', () => {
  const stale = (dir) =>
    edit(dir, 'release.json', (d) => {
      d.packages.adapter.freshness = 'stale';
      d.packages.adapter.staleSince = d.generatedAt;
    });
  const warned = runCheck(stale);
  assert.equal(warned.status, 0, warned.stderr);
  assert.match(warned.stderr, /packages\/adapter: STALE since/);
  const strict = runCheck(stale, '--no-stale');
  assert.equal(strict.status, 1);
});

test('check-data: a card naming an unknown package fails', () => {
  const r = runCheck((dir) => edit(dir, 'integrations.json', (d) => (d.groups[0].cards[0].slot = 'nope')));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /unknown package "nope"/);
});

test('check-data: a package missing from release.json fails', () => {
  const r = runCheck((dir) => edit(dir, 'release.json', (d) => delete d.packages.wasm));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /no record for package "wasm"/);
});

test('check-data: a plaintext secret fails without echoing it', () => {
  const r = runCheck((dir) => edit(dir, 'integrations.json', (d) => (d.groups[0].cards[0].display = `token ${tokenShaped}`)));
  assert.equal(r.status, 1);
  assert.ok(!r.stderr.includes(tokenShaped) && !r.stdout.includes(tokenShaped));
});
