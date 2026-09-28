// Offline proofs for the application and content release planes (#11,
// ARCHITECTURE.md § Publish flow), against a directory standing in for the
// bucket (scripts/publish/store.mjs fsStore) and a CDN that records
// invalidations. Needs a build first (dist/ and build/renderer/):
//
//   npm run build && npm run test:publish
//
// No network, no AWS, no credentials. The one secret-shaped value below is
// derived at run time from a hash, so no such string sits in this file.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { root } from './data/contracts.mjs';
import { decide } from './publish/plan.mjs';
import {
  contentPrefix,
  CURRENT,
  IMMUTABLE,
  publishApp,
  publishContent,
  PublishError,
  REVALIDATE,
  rollbackContent,
} from './publish/release.mjs';
import { fakeCdn, fsStore } from './publish/store.mjs';

const distDir = join(root, 'dist');
const rendererDir = join(root, 'build', 'renderer');
if (!existsSync(join(rendererDir, 'renderer.mjs')) || !existsSync(join(distDir, 'index.html'))) {
  throw new Error('test-publish: no build (run npm run build first)');
}

const APP_A = 'a'.repeat(40);
const APP_B = 'b'.repeat(40);
const COPY_1 = 'c'.repeat(40);
const COPY_2 = 'd'.repeat(40);
const scratch = mkdtempSync(join(tmpdir(), 'test-publish-'));
after(() => rmSync(scratch, { recursive: true, force: true }));
let n = 0;
const temp = (name) => join(scratch, `${name}-${++n}`);
const clock = (() => {
  let t = Date.parse('2026-09-28T00:00:00Z');
  return () => new Date((t += 60_000));
})();

/** A source tree: this repository's i18n/ and data/, optionally edited. */
function source(edit) {
  const dir = temp('source');
  cpSync(join(root, 'i18n'), join(dir, 'i18n'), { recursive: true });
  cpSync(join(root, 'data'), join(dir, 'data'), { recursive: true });
  edit?.(dir);
  return dir;
}
const editJson = (dir, path, change) => {
  const file = join(dir, path);
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  change(doc);
  writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
};
const oneWord = (dir) => editJson(dir, 'i18n/en/home.json', (d) => (d.hero.primaryCta = 'Get going'));

/** A bucket after application release A (with the committed copy). */
async function deployedA() {
  const store = fsStore(temp('bucket'));
  const cdn = fakeCdn();
  const app = await publishApp({ store, cdn, distDir, rendererDir, sourceDir: source(), commit: APP_A, workDir: temp('work'), now: clock() });
  return { store, cdn, app };
}
const content = (store, cdn, sourceDir, commit = COPY_1, extra = {}) =>
  publishContent({ store, cdn, sourceDir, commit, workDir: temp('work'), now: clock(), ...extra });

/** key → bytes for every object whose key passes `filter`. */
async function snapshot(store, filter = () => true) {
  const out = new Map();
  for (const { key } of await store.list('')) if (filter(key)) out.set(key, await store.get(key));
  return out;
}
const isMutable = (key) => key === CURRENT || (!key.startsWith('assets/') && !key.startsWith('content/') && !key.startsWith('releases/'));
function assertSame(before, after, what) {
  assert.deepEqual([...after.keys()].sort(), [...before.keys()].sort(), `${what}: the same objects`);
  for (const [k, v] of before) assert.ok(after.get(k).equals(v), `${what}: ${k} byte-identical`);
}
const putsSince = (store, mark) => store.ops.slice(mark).filter((o) => o.op === 'put').map((o) => o.key);
const current = async (store) => JSON.parse((await store.get(CURRENT)).toString('utf8'));

// --- a copy-only change ------------------------------------------------------

test('copy-only change: HTML and content objects change; every asset byte-identical and none re-uploaded', async () => {
  const { store, cdn, app } = await deployedA();
  const assetsBefore = await snapshot(store, (k) => k.startsWith('assets/'));
  const appBefore = await snapshot(store, (k) => k.startsWith('releases/'));
  assert.ok(assetsBefore.size >= 4, 'the application release uploaded its assets');
  const mark = store.ops.length;

  const r = await content(store, cdn, source(oneWord));

  const puts = putsSince(store, mark);
  assert.equal(puts.filter((k) => k.startsWith('assets/')).length, 0, 'no asset was re-uploaded');
  assert.equal(puts.filter((k) => k.startsWith('releases/')).length, 0, 'no renderer was re-uploaded');
  assertSame(assetsBefore, await snapshot(store, (k) => k.startsWith('assets/')), 'assets/');
  assertSame(appBefore, await snapshot(store, (k) => k.startsWith('releases/')), 'releases/');

  // Only the page whose copy changed, then the pointer, last.
  assert.deepEqual(r.changed, ['index.html', CURRENT]);
  const stable = puts.filter((k) => !k.startsWith('content/'));
  assert.deepEqual(stable, ['index.html', CURRENT], 'stable page first, current.json last');
  assert.ok(puts.every((k) => k.startsWith(contentPrefix(r.releaseId)) || stable.includes(k)), 'content objects only under the new release');
  assert.ok(puts.indexOf(`${contentPrefix(r.releaseId)}manifest.json`) < puts.indexOf('index.html'), 'immutable objects before stable HTML');
  assert.deepEqual(cdn.invalidations.at(-1).paths, ['/', '/current.json', '/index.html'], 'only changed mutable paths invalidated');

  assert.notEqual(r.releaseId, app.releaseId);
  const cur = await current(store);
  assert.equal(cur.releaseId, r.releaseId);
  assert.equal(cur.rendererRelease, APP_A);
  assert.match((await store.get('index.html')).toString('utf8'), /Get going/);
  assert.doesNotMatch((await store.get('ko/index.html')).toString('utf8'), /Get going/);

  // Cache headers: immutable objects for a year, mutable ones revalidate.
  assert.equal(store.metadata(`${contentPrefix(r.releaseId)}manifest.json`).cacheControl, IMMUTABLE);
  assert.equal(store.metadata([...assetsBefore.keys()][0]).cacheControl, IMMUTABLE);
  assert.equal(store.metadata('index.html').cacheControl, REVALIDATE);
  assert.equal(store.metadata(CURRENT).cacheControl, REVALIDATE);

  // Publishing the same content again changes nothing and invalidates nothing.
  const again = await content(store, cdn, source(oneWord));
  assert.equal(again.releaseId, r.releaseId);
  assert.deepEqual(again.changed, []);
  assert.equal(again.invalidation.id, null);
});

test('rollback: restores the previous release byte for byte, with no build, render or upload', async () => {
  const { store, cdn, app } = await deployedA();
  const live = await snapshot(store, isMutable);
  const assetsBefore = await snapshot(store, (k) => k.startsWith('assets/'));
  await content(store, cdn, source(oneWord));
  const mark = store.ops.length;

  const r = await rollbackContent({ store, cdn, releaseId: app.releaseId, workDir: temp('work') });

  assertSame(live, await snapshot(store, isMutable), 'stable HTML and current.json');
  assertSame(assetsBefore, await snapshot(store, (k) => k.startsWith('assets/')), 'assets/');
  const puts = putsSince(store, mark);
  assert.deepEqual(puts, ['index.html', CURRENT], 'only the re-pointed page and the pointer are written');
  assert.deepEqual(r.changed, ['index.html', CURRENT]);
  assert.deepEqual(cdn.invalidations.at(-1).paths, ['/', '/current.json', '/index.html']);
  assert.equal((await current(store)).releaseId, app.releaseId);
});

// --- an invalid or partial release never moves current.json or stable HTML ---

async function deployedAB() {
  const d = await deployedA();
  const b = await content(d.store, d.cdn, source(oneWord));
  return { ...d, b };
}

async function mustFail(store, run, pattern) {
  const live = await snapshot(store, isMutable);
  await assert.rejects(run, (e) => e instanceof PublishError && pattern.test(e.message));
  assertSame(live, await snapshot(store, isMutable), 'stable HTML and current.json untouched');
}

const rewrite = async (store, key, change) => {
  const doc = JSON.parse((await store.get(key)).toString('utf8'));
  change(doc);
  await store.put(key, Buffer.from(JSON.stringify(doc)), { contentType: 'application/json', cacheControl: IMMUTABLE });
};
const rollbackTo = (store, cdn, releaseId) => () => rollbackContent({ store, cdn, releaseId, workDir: temp('work') });

test('invalid rollback: corrupted digest, dropped file, wrong locale, unknown schemaVersion, renderer mismatch', async () => {
  const cases = [
    ['a corrupted page', /digest mismatch/, async (s, id) => s.put(`${contentPrefix(id)}html/index.html`, Buffer.from('<!doctype html>tampered'), { contentType: 'text/html', cacheControl: IMMUTABLE })],
    ['a dropped file', /missing/, async (s, id) => s.delete([`${contentPrefix(id)}html/ko/index.html`])],
    ['a dropped manifest', /no manifest/, async (s, id) => s.delete([`${contentPrefix(id)}manifest.json`])],
    ['a wrong locale', /locale/, (s, id) => rewrite(s, `${contentPrefix(id)}manifest.json`, (m) => (m.files.find((f) => f.path === 'html/ko/index.html').locale = 'en'))],
    ['a missing locale', /locales/, (s, id) => rewrite(s, `${contentPrefix(id)}manifest.json`, (m) => (m.locales = ['en']))],
    ['an unknown schemaVersion', /unknown schemaVersion/, (s, id) => rewrite(s, `${contentPrefix(id)}manifest.json`, (m) => (m.schemaVersion = 'content-manifest-v9'))],
    ['a manifest file dropped', /missing html\/ko\/index.html|releaseId/, (s, id) => rewrite(s, `${contentPrefix(id)}manifest.json`, (m) => (m.files = m.files.filter((f) => f.path !== 'html/ko/index.html')))],
    ['a digest edited in the manifest', /releaseId does not match/, (s, id) => rewrite(s, `${contentPrefix(id)}manifest.json`, (m) => (m.files[0].digest = `sha256:${'0'.repeat(64)}`))],
  ];
  for (const [what, pattern, fault] of cases) {
    const { store, cdn, app } = await deployedAB();
    await fault(store, app.releaseId);
    await mustFail(store, rollbackTo(store, cdn, app.releaseId), pattern).catch((e) => {
      throw new Error(`${what}: ${e.message}`);
    });
  }

  // Renderer mismatch: release A's content was rendered by application release
  // A; once B is deployed (its assets replace A's), A's HTML may not return.
  const { store, cdn, app } = await deployedAB();
  await publishApp({ store, cdn, distDir, rendererDir, sourceDir: source(), commit: APP_B, workDir: temp('work'), now: clock() });
  await mustFail(store, rollbackTo(store, cdn, app.releaseId), /inconsistent release/);

  // A release ID that was never published.
  await mustFail(store, rollbackTo(store, cdn, `sha256:${'e'.repeat(64)}`), /no manifest/);
});

/** A store whose content puts are damaged: bytes flipped, or one object never written. */
function faulty(store, mode) {
  let done = false;
  return {
    ...store,
    async put(key, body, meta) {
      if (!done && key.startsWith('content/') && key.endsWith('/html/ko/index.html')) {
        done = true;
        if (mode === 'drop') return;
        return store.put(key, Buffer.concat([body, Buffer.from('<!-- partial -->')]), meta);
      }
      return store.put(key, body, meta);
    },
  };
}

test('invalid publish: partial upload, wrong locale, unknown schemaVersion, renderer or asset tampering', async () => {
  const cases = [
    ['an object corrupted in transit', /digest mismatch/, (d) => ({ store: faulty(d.store, 'corrupt') })],
    ['an object never written', /missing/, (d) => ({ store: faulty(d.store, 'drop') })],
    ['copy in the wrong locale', /declares locale "en"/, () => ({ source: (dir) => editJson(dir, 'i18n/ko/home.json', (x) => (x.locale = 'en')) })],
    ['an unknown schemaVersion', /unknown schemaVersion/, () => ({ source: (dir) => editJson(dir, 'data/evidence.json', (x) => (x.schemaVersion = 'evidence-v9')) })],
    ['a missing copy file', /missing/, () => ({ source: (dir) => rmSync(join(dir, 'i18n/ko/architecture/vault.json')) })],
    ['a tampered renderer', /digest mismatch \(renderer artifact\)/, async (d) => {
      await d.store.put(`releases/app/${APP_A}/renderer/renderer.mjs`, Buffer.from('export const rendererApi = 1;'), { contentType: 'text/javascript', cacheControl: IMMUTABLE });
    }],
    ['a tampered application record', /digest mismatch against current.json/, (d) => rewrite(d.store, `releases/app/${APP_A}/release.json`, (r) => (r.rendererApi = 1))],
    ['a missing asset', /missing from the bucket/, async (d) => d.store.delete([(await d.store.list('assets/'))[0].key])],
    ['current.json naming another renderer', /app path does not match|missing/, (d) => rewrite(d.store, CURRENT, (c) => (c.rendererRelease = APP_B))],
  ];
  for (const [what, pattern, setup] of cases) {
    const d = await deployedA();
    const { store: override, source: edit } = (await setup(d)) ?? {};
    const sourceDir = source((dir) => {
      oneWord(dir);
      edit?.(dir);
    });
    await mustFail(d.store, () => content(override ?? d.store, d.cdn, sourceDir), pattern).catch((e) => {
      throw new Error(`${what}: ${e.message}`);
    });
  }
});

test('a copy change that edits application files is refused by the guard before anything renders', async () => {
  const { store, cdn } = await deployedA();
  const mark = store.ops.length;
  await mustFail(
    store,
    () =>
      content(store, cdn, source(oneWord), COPY_1, {
        guard: () => {
          throw new PublishError('changes application files relative to the deployed release');
        },
      }),
    /application files/,
  );
  assert.equal(putsSince(store, mark).length, 0);
});

// --- secrets -------------------------------------------------------------------

test('secret scan: a secret-shaped value in a content bundle fails before any upload and is never echoed', async () => {
  const { store, cdn } = await deployedA();
  // Derived, not a credential: a GitHub-token shape over a hash of a fixed word.
  const value = `ghp_${createHash('sha256').update('publish-fixture').digest('base64url').replace(/[-_]/g, 'q').slice(0, 36)}`;
  const mark = store.ops.length;
  const logs = [];
  let message = '';
  await mustFail(
    store,
    async () => {
      try {
        await content(store, cdn, source((dir) => editJson(dir, 'i18n/en/home.json', (d) => (d.hero.proof = `Paste ${value} here.`))), COPY_1, { log: (l) => logs.push(l) });
      } catch (e) {
        message = e.message;
        throw e;
      }
    },
    /secret scan: \d+ finding/,
  );
  assert.equal(putsSince(store, mark).length, 0, 'nothing was uploaded');
  assert.match(message, /github/i, 'the finding names the detector');
  for (const text of [message, ...logs]) assert.ok(!text.includes(value) && !text.includes(value.slice(4, 20)), 'the value never appears');
});

// --- application releases ------------------------------------------------------

test('application release: idempotent, never rewrites a published record, keeps content/ and releases/', async () => {
  const { store, cdn } = await deployedA();
  const all = await snapshot(store);
  const mark = store.ops.length;
  const r = await publishApp({ store, cdn, distDir, rendererDir, sourceDir: source(), commit: APP_A, workDir: temp('work'), now: clock() });
  assert.deepEqual(putsSince(store, mark), [], 'the same build uploads nothing');
  assert.deepEqual(r.changed, []);
  assert.equal(r.invalidation.id, null);
  assertSame(all, await snapshot(store), 'the whole bucket');

  await rewrite(store, `releases/app/${APP_A}/release.json`, (x) => (x.assets = x.assets.slice(1)));
  await assert.rejects(
    publishApp({ store, cdn, distDir, rendererDir, sourceDir: source(), commit: APP_A, workDir: temp('work'), now: clock() }),
    /never rewritten/,
  );
});

test('application release: a stale object from an earlier build is removed; retained releases are not', async () => {
  const { store, cdn } = await deployedA();
  await store.put('old-page/index.html', Buffer.from('<!doctype html>old'), { contentType: 'text/html', cacheControl: REVALIDATE });
  await store.put('assets/old-deadbeef.js', Buffer.from('old'), { contentType: 'text/javascript', cacheControl: IMMUTABLE });
  const retained = await snapshot(store, (k) => k.startsWith('content/') || k.startsWith('releases/'));
  const r = await publishApp({ store, cdn, distDir, rendererDir, sourceDir: source(), commit: APP_B, workDir: temp('work'), now: clock() });
  assert.equal(await store.get('old-page/index.html'), null);
  assert.equal(await store.get('assets/old-deadbeef.js'), null);
  assert.deepEqual(r.prunedAssets, ['assets/old-deadbeef.js']);
  for (const [k] of retained) assert.ok(await store.get(k), `${k} retained`);
  assert.ok(r.invalidation.paths.includes('/old-page/'));
  assert.ok(!r.invalidation.paths.some((p) => p.startsWith('/assets/') || p === '/*'), 'never assets, never /*');
});

test('retention: keeps the live release and the last N, and the renderers they name', async () => {
  const { store, cdn } = await deployedA();
  const ids = [];
  for (const word of ['one', 'two', 'three', 'four']) {
    const r = await content(store, cdn, source((dir) => editJson(dir, 'i18n/en/home.json', (d) => (d.hero.primaryCta = `Get ${word}`))), COPY_2, { keep: 2 });
    ids.push(r.releaseId);
  }
  const stored = new Set((await store.list('content/')).map((o) => `sha256:${o.key.split('/')[1]}`));
  assert.deepEqual([...stored].sort(), ids.slice(-3).sort(), 'live + 2 previous');
  assert.ok(await store.get(`releases/app/${APP_A}/release.json`), 'the live renderer is kept');
});

// --- routing between the two workflows ---------------------------------------

test('plan: content only when the application tree is the deployed one', () => {
  const git = (same) => ({ hasCommit: () => true, sameAppTree: () => same });
  const cur = JSON.stringify({ schemaVersion: 'content-current-v1', rendererRelease: APP_A });
  assert.equal(decide({ currentText: cur, target: COPY_1, git: git(true) }).decision, 'content');
  assert.equal(decide({ currentText: cur, target: COPY_1, git: git(false) }).decision, 'app');
  assert.equal(decide({ currentText: '', target: COPY_1, git: git(true) }).decision, 'app');
  assert.equal(decide({ currentText: '<html>', target: COPY_1, git: git(true) }).decision, 'app');
  assert.equal(decide({ currentText: cur, target: COPY_1, git: { hasCommit: () => false, sameAppTree: () => true } }).decision, 'app');
  assert.throws(() => decide({ currentText: cur, target: 'main', git: git(true) }));
});
