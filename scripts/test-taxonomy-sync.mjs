// Offline tests for the taxonomy sync (npm run test:data). The published
// provider-dossiers file is a trimmed copy of the real one in
// scripts/fixtures/benchmarks/; nothing here touches the network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAjv, loadSchemas, root, validateDocument } from './data/contracts.mjs';
import { applyTaxonomy, dossierProblems, renderTaxonomy, taxonomyFromDossiers } from './data/taxonomy.mjs';

const fixturePath = join(root, 'scripts/fixtures/benchmarks/provider-dossiers-v1.json');
const fixture = () => JSON.parse(readFileSync(fixturePath, 'utf8'));
const evidenceText = readFileSync(join(root, 'data/evidence.json'), 'utf8');
const schemas = loadSchemas();
const ajv = createAjv(schemas);

test('counts come from the dossiers: families, providers, families with no detector', () => {
  const { value, note } = taxonomyFromDossiers(fixture(), 'fixture');
  assert.deepEqual(value, { families: 2, providers: 2, withoutDetector: 1 });
  assert.match(note, /from fixture \(generated .* at redact-secret-benchmarks [0-9a-f]{40}\)/);
});

test('an invalid or self-inconsistent payload is never applied', () => {
  const wrongVersion = { ...fixture(), schemaVersion: 2 };
  assert.ok(dossierProblems(wrongVersion).length > 0);
  assert.throws(() => taxonomyFromDossiers(wrongVersion, 'x'), /invalid/);
  const miscount = { ...fixture(), familyCount: 99 };
  assert.throws(() => taxonomyFromDossiers(miscount, 'x'), /familyCount 99 but 2 families/);
  assert.throws(() => taxonomyFromDossiers({ ...fixture(), providerCount: 5 }, 'x'), /providerCount 5 but 2 providers/);
});

test('the rewritten evidence stays schema-valid and only the taxonomy block moves', () => {
  const taxonomy = taxonomyFromDossiers(fixture(), 'fixture');
  const before = JSON.parse(evidenceText);
  const text = renderTaxonomy(evidenceText, applyTaxonomy(before, taxonomy).facts.taxonomy);
  const after = JSON.parse(text);
  assert.deepEqual(validateDocument(ajv, schemas.documents, after, { family: 'evidence', label: 'evidence' }), []);
  assert.deepEqual(after.facts.taxonomy.value, taxonomy.value);
  assert.deepEqual({ ...after, facts: { ...after.facts, taxonomy: null } }, { ...before, facts: { ...before.facts, taxonomy: null } });
  assert.equal(renderTaxonomy(text, after.facts.taxonomy), text, 'a second render is a no-op');
});

function run(args, dir) {
  return spawnSync(process.execPath, [join(root, 'scripts/sync-taxonomy.mjs'), '--root', dir, ...args], { encoding: 'utf8' });
}

test('CLI: --check exits 3 on drift, sync rewrites, then --check passes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'taxonomy-'));
  try {
    cpSync(join(root, 'data'), join(dir, 'data'), { recursive: true });
    const src = ['--file', fixturePath];
    const drift = run(['--check', ...src], dir);
    assert.equal(drift.status, 3, drift.stderr);
    assert.match(drift.stderr, /drift/);
    const wrote = run(src, dir);
    assert.equal(wrote.status, 0, wrote.stderr);
    assert.equal(JSON.parse(readFileSync(join(dir, 'data/evidence.json'), 'utf8')).facts.taxonomy.value.families, 2);
    assert.equal(run(['--check', ...src], dir).status, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI: an unreachable URL or an invalid file fails with exit 1 and writes nothing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'taxonomy-'));
  try {
    cpSync(join(root, 'data'), join(dir, 'data'), { recursive: true });
    const bad = join(dir, 'bad.json');
    writeFileSync(bad, JSON.stringify({ ...fixture(), schemaVersion: 2 }));
    const invalid = run(['--file', bad], dir);
    assert.equal(invalid.status, 1);
    const down = run(['--url', 'http://127.0.0.1:9/none.json'], dir);
    assert.equal(down.status, 1);
    assert.match(down.stderr, /no published provider-dossiers file/);
    assert.equal(readFileSync(join(dir, 'data/evidence.json'), 'utf8'), evidenceText);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
