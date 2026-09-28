// Negative and positive tests for the locale copy in i18n/ (npm run test:data).
// Offline: schema and check functions run on in-memory copies; the two CLI
// cases run check-i18n.mjs against a temporary copy of i18n/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAjv, loadSchemas, registeredFiles, root, secretFindings, validateDocument } from './data/contracts.mjs';
import { illustrative } from './data/illustrative.mjs';
import { linkErrors, parityErrors, richSignature, shippedBytes, spelledCountErrors, tracked, unusedKeys } from './i18n/checks.mjs';

const schemas = loadSchemas();
const ajv = createAjv(schemas);
const read = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const localeFiles = registeredFiles().filter((f) => f.path.startsWith('i18n/'));
const check = (doc, family) => validateDocument(ajv, schemas.documents, doc, { family, label: family });
const home = (locale = 'en') => read(`i18n/${locale}/home.json`);
const routes = { routeIds: ['home', 'architecture', 'architecture/vault'], anchorIds: ['playground', 'community'] };

// A credential-shaped value, assembled at run time so this file never contains one.
const tokenShaped = ['ghp', '_', 'A1b2C3d4'.repeat(4), 'zzzz'].join('');

test('every committed locale file validates against its locale-*-v1 schema', () => {
  assert.ok(localeFiles.length >= 20, 'both locales register every page');
  for (const { path, family } of localeFiles) assert.deepEqual(check(read(path), family), [], path);
});

test('the family is the file name: home copy cannot validate as the shell', () => {
  const doc = home();
  const errors = check(doc, 'locale-shell');
  assert.ok(errors.some((e) => /belongs to locale-home, not locale-shell/.test(e)), errors.join('\n'));
  doc.schemaVersion = 'locale-home-v2';
  assert.ok(check(doc, 'locale-home').some((e) => /unknown schemaVersion "locale-home-v2"/.test(e)));
});

test('a missing key fails the schema', () => {
  const doc = home('ko');
  delete doc.hero.lede;
  assert.ok(check(doc, 'locale-home').some((e) => /lede/.test(e)));
});

test('rich text has no raw HTML: an unknown node, a two-tag node, or an HTML attribute fails', () => {
  for (const node of [{ html: '<b>x</b>' }, { b: 'x', em: 'y' }, { a: 'x', href: 'https://example.com', onclick: 'x' }]) {
    const doc = home();
    doc.hero.lede = ['text ', node];
    assert.ok(check(doc, 'locale-home').length > 0, JSON.stringify(node));
  }
});

test('links: a locale path, an http URL and a URL with credentials fail the schema', () => {
  for (const link of [{ label: 'x', to: '/ko/architecture/' }, { label: 'x', href: 'http://example.com' }, { label: 'x', href: 'https://user:pw@example.com' }]) {
    const doc = read('i18n/en/shell.json');
    doc.header.nav[0] = link;
    assert.ok(check(doc, 'locale-shell').length > 0, JSON.stringify(link));
  }
});

test('links: an unknown route or anchor, or a non-public host, is reported', () => {
  const doc = { a: [{ a: 'x', to: 'architecture/nope' }, { a: 'x', to: 'home#nowhere' }, { a: 'x', href: 'https://localhost/x' }] };
  const errors = linkErrors(doc, 'doc', routes);
  assert.equal(errors.length, 3, errors.join('\n'));
  assert.deepEqual(linkErrors({ l: { label: 'x', to: 'home#playground' }, m: { a: 'x', to: '#community' } }, 'doc', routes), []);
});

test('parity: a key missing in one locale, a different list length or a different var fails', () => {
  const en = home('en');
  const ko = home('ko');
  assert.deepEqual(parityErrors(en, ko, 'home'), []);

  const missing = structuredClone(ko);
  delete missing.hero.proof;
  assert.ok(parityErrors(en, missing, 'home').some((e) => /hero\/proof: missing in ko/.test(e)));

  const shorter = structuredClone(ko);
  shorter.problem.destinations.pop();
  assert.ok(parityErrors(en, shorter, 'home').some((e) => /5 items in en, 4 in ko/.test(e)));

  const renamed = structuredClone(ko);
  renamed.integrations.observed = ['관측일 ', { b: [{ var: 'day' }] }];
  assert.ok(parityErrors(en, renamed, 'home').some((e) => /integrations\/observed: en and ko differ/.test(e)));
});

test('parity: links and marks must match; emphasis may move with the language', () => {
  assert.deepEqual(richSignature(['a ', { a: 'x', to: 'architecture/vault' }, { var: 'n' }]), ['link architecture/vault', 'var n']);
  const en = { schemaVersion: 's', locale: 'en', x: ['see ', { a: 'the vault', to: 'architecture/vault' }] };
  const ko = { schemaVersion: 's', locale: 'ko', x: [{ b: '강조' }, { a: '볼트', to: 'architecture' }] };
  assert.ok(parityErrors(en, ko, 'doc').some((e) => /differ in vars, links or marks/.test(e)));
  ko.x[1].to = 'architecture/vault';
  assert.deepEqual(parityErrors(en, ko, 'doc'), [], 'a <b> only in one locale is allowed');
  assert.deepEqual(parityErrors({ ...en, y: 'text' }, { ...ko, y: null }, 'doc'), [], 'null is an authored omission');
});

test('unused keys: a key no page reads is reported; a lookup table is covered by reading it', () => {
  const doc = { schemaVersion: 's', locale: 'en', head: { title: 'T', lede: ['a ', { b: 'b' }] }, extra: 'never read', labels: { a: 'A', b: 'B' } };
  const reads = new Set();
  const copy = tracked(doc, reads);
  void copy.head.title;
  void copy.head.lede.map((n) => n);
  void copy.labels.a;
  assert.deepEqual(unusedKeys(doc, reads), ['/extra', '/labels/b']);
  assert.deepEqual(unusedKeys(doc, reads, [/^\/labels$/]), ['/extra']);
  assert.equal(copy.head, copy.head, 'tracking keeps object identity');
});

test('spelled counts: a list that changes length, or a sentence that loses its word, fails', () => {
  const docs = { en: { 'o.json': { title: 'Four repositories', rows: [1, 2, 3, 4] } }, ko: { 'o.json': { title: '네 저장소', rows: [1, 2, 3, 4] } } };
  const entry = { what: 'repos', count: (d) => d.en['o.json'].rows.length, n: 4, words: { en: /\bfour\b/i, ko: '네 ' }, at: [['o.json', '/title']] };
  assert.deepEqual(spelledCountErrors([entry], docs), []);
  docs.en['o.json'].rows.push(5);
  assert.ok(spelledCountErrors([entry], docs).some((e) => /says 4 but there are 5/.test(e)));
  docs.en['o.json'].rows.pop();
  docs.ko['o.json'].title = '다섯 저장소';
  assert.ok(spelledCountErrors([entry], docs).some((e) => /i18n\/ko\/o.json\/title: expected the count/.test(e)));
});

test('size: the budget counts UTF-8 bytes of minified JSON', () => {
  assert.equal(shippedBytes({ a: '한' }), '{"a":"한"}'.length + 2);
});

test('secret safety: a credential in locale copy is found and never echoed', async () => {
  const doc = home();
  doc.hero.lede = ['Paste ', { code: tokenShaped }];
  const found = await secretFindings([{ label: 'i18n/en/home.json', doc }], { illustrative });
  assert.equal(found.length, 1);
  assert.ok(!found[0].includes(tokenShaped));
});

test('secret safety: an illustrative format is exempt only as the exact reviewed string', async () => {
  const detection = read('i18n/en/architecture/detection.json');
  assert.deepEqual(await secretFindings([{ label: 'i18n/en/architecture/detection.json', doc: detection }], { illustrative }), []);
  const edited = { s: ['x ', { code: `${illustrative[1].text}9` }] };
  assert.equal((await secretFindings([{ label: 'i18n/en/x.json', doc: edited }], { illustrative })).length, 1);
  assert.equal((await secretFindings([{ label: 'data/x.json', doc: { s: illustrative[1].text } }], { illustrative })).length, 1, 'not outside i18n/');
});

// --- check-i18n end to end, against a copy of i18n/ ---

function runCheckI18n(mutate) {
  const dir = mkdtempSync(join(tmpdir(), 'check-i18n-'));
  try {
    cpSync(join(root, 'i18n'), dir, { recursive: true });
    mutate?.(dir);
    return spawnSync(process.execPath, [join(root, 'scripts/check-i18n.mjs'), '--i18n', dir], { encoding: 'utf8' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const editCopy = (dir, file, fn) => {
  const path = join(dir, file);
  const doc = JSON.parse(readFileSync(path, 'utf8'));
  fn(doc);
  writeFileSync(path, JSON.stringify(doc));
};

test('check-i18n: passes on the committed copy', () => {
  const r = runCheckI18n();
  assert.equal(r.status, 0, r.stderr);
});

test('check-i18n: an unread key, a broken parity and a missing file each fail', () => {
  const unread = runCheckI18n((dir) => editCopy(dir, 'en/home.json', (d) => (d.hero.tagline = 'nobody renders this')));
  assert.equal(unread.status, 1);
  assert.match(unread.stderr, /hero\/tagline: missing in ko/);

  const both = runCheckI18n((dir) => {
    for (const l of ['en', 'ko']) editCopy(dir, `${l}/home.json`, (d) => (d.hero.tagline = 'nobody renders this'));
  });
  assert.equal(both.status, 1);
  assert.match(both.stderr, /i18n\/en\/home.json\/hero\/tagline: no page reads this key/);

  const gone = runCheckI18n((dir) => rmSync(join(dir, 'ko/architecture/vault.json')));
  assert.equal(gone.status, 1);
  assert.match(gone.stderr, /i18n\/ko\/architecture\/vault.json: missing/);
});

test('check-i18n: a var the page does not supply fails the render', () => {
  const r = runCheckI18n((dir) => {
    for (const l of ['en', 'ko']) editCopy(dir, `${l}/home.json`, (d) => (d.hero.proof = ['x ', { var: 'nope' }]));
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /render failed: rich text: no value for var "nope"/);
});
