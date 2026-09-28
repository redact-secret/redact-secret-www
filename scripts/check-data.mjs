// Validates every committed data contract (CONVENTIONS.md § Data contracts).
// Runs first in `npm run build`, so CI and the publish workflow run it too.
//
//   node scripts/check-data.mjs              validate the committed files
//   node scripts/check-data.mjs --no-stale   also fail on a stale record
//   node scripts/check-data.mjs --root <dir> validate a copy (the negative tests)
//
// Checks, all fail-closed: every data/ file is registered; each file's
// schemaVersion is known and of the right family; the schema passes; the
// files agree with each other; every record has provenance; no benchmark
// score, rate or bound; no plaintext secret. A stale record is reported by
// name with its original observation date — never silently.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  benchmarkBoundaryViolations,
  createAjv,
  loadSchemas,
  registeredFiles,
  root as repoRoot,
  secretFindings,
  unregisteredFiles,
  validateDocument,
} from './data/contracts.mjs';

const args = process.argv.slice(2);
const failOnStale = args.includes('--no-stale');
const rootArg = args.indexOf('--root');
const root = rootArg >= 0 ? args[rootArg + 1] : repoRoot;

const errors = [];
const warnings = [];
const schemas = loadSchemas();
const ajv = createAjv(schemas);

// 1. Registration: data/ holds nothing the contracts do not govern.
if (root === repoRoot) for (const file of unregisteredFiles()) errors.push(`${file}: not registered in scripts/data/contracts.mjs targets`);

// 2. Schema, per file, fail-closed on schemaVersion.
const docs = {};
for (const { path, family } of registeredFiles()) {
  const full = join(root, path);
  if (!existsSync(full)) {
    errors.push(`${path}: missing`);
    continue;
  }
  let doc;
  try {
    doc = JSON.parse(readFileSync(full, 'utf8'));
  } catch (e) {
    errors.push(`${path}: not valid JSON (${e.message})`);
    continue;
  }
  const found = validateDocument(ajv, schemas.documents, doc, { family, label: path });
  errors.push(...found);
  errors.push(...benchmarkBoundaryViolations(doc, path));
  if (!found.length) docs[family] = { path, doc };
}

const day = (t) => t.slice(0, 10);

// 3. Cross-file consistency and provenance semantics (only on schema-valid files).
const integrations = docs.integrations?.doc;
const release = docs.release?.doc;
const evidence = docs.evidence?.doc;

function checkObservation(label, rec, generatedAt) {
  for (const key of ['observedAt', 'staleSince']) {
    if (rec[key] !== undefined && Number.isNaN(Date.parse(rec[key]))) errors.push(`${label}: ${key} ${rec[key]} is not a real date`);
  }
  if (generatedAt && rec.observedAt > generatedAt) errors.push(`${label}: observedAt ${rec.observedAt} is after the file's generatedAt ${generatedAt}`);
  if (rec.freshness === 'stale') {
    if (rec.staleSince && rec.staleSince < rec.observedAt) errors.push(`${label}: staleSince ${rec.staleSince} is before observedAt ${rec.observedAt}`);
    const msg = `${label}: STALE since ${rec.staleSince}; showing the value observed ${day(rec.observedAt)}`;
    (failOnStale ? errors : warnings).push(msg);
  }
}

if (integrations) {
  const ids = new Set();
  for (const group of integrations.groups) {
    const cards = group.cards ?? Object.values(group.runtimes).flat();
    for (const card of cards) {
      const key = `${group.id}/${card.id}`;
      if (ids.has(key)) errors.push(`data/integrations.json: duplicate card ${key}`);
      ids.add(key);
      if (!integrations.packages[card.slot]) errors.push(`data/integrations.json: card ${key} names unknown package "${card.slot}"`);
      if (card.facts.includes('install') !== Boolean(card.install)) errors.push(`data/integrations.json: card ${key} must have an install template exactly when it lists the install fact`);
    }
  }
  if (integrations.freshness === 'stale') checkObservation('data/integrations.json', { ...integrations, observedAt: integrations.generatedAt });
}

if (release) {
  const gen = release.generatedAt;
  for (const [id, rec] of Object.entries(release.packages)) {
    const label = `data/release.json/packages/${id}`;
    checkObservation(label, rec, gen);
    for (const [reg, mirror] of Object.entries(rec.mirrors ?? {})) checkObservation(`${label}/mirrors/${reg}`, mirror, gen);
    if (rec.source.registry !== rec.value.registry || rec.source.package !== rec.value.name) errors.push(`${label}: source and value name different packages`);
    if (rec.value.version && rec.source.version !== rec.value.version) errors.push(`${label}: source.version ${rec.source.version} is not value.version ${rec.value.version}`);
    if (!integrations) continue;
    const entry = integrations.packages[id];
    if (!entry) {
      errors.push(`${label}: not listed in data/integrations.json`);
      continue;
    }
    if (entry.registry !== rec.value.registry || entry.name !== rec.value.name) errors.push(`${label}: is ${rec.value.registry}:${rec.value.name}, integrations lists ${entry.registry}:${entry.name}`);
    if (rec.value.unpublished && entry.declared && rec.declared?.version !== entry.declared.version) errors.push(`${label}: declared version differs from data/integrations.json`);
    for (const also of entry.also ?? []) {
      const m = rec.mirrors?.[also.registry];
      if (m && m.value.name !== also.name) errors.push(`${label}/mirrors/${also.registry}: is ${m.value.name}, integrations lists ${also.name}`);
    }
  }
  if (integrations) for (const id of Object.keys(integrations.packages)) if (!release.packages[id]) errors.push(`data/release.json: no record for package "${id}" (run npm run slots:refresh)`);
}

if (evidence) {
  for (const [name, src] of Object.entries(evidence.sources)) checkObservation(`data/evidence.json/sources/${name}`, src);
  for (const [name, fact] of Object.entries(evidence.facts)) {
    const src = evidence.sources[fact.source];
    if (src.freshness === 'stale') warnings.push(`data/evidence.json/facts/${name}: rests on stale source "${fact.source}"`);
  }
}

// 4. No plaintext secret in any committed data (the synthetic fixture keeps its marker).
errors.push(...(await secretFindings(Object.values(docs).map(({ path, doc }) => ({ label: path, doc })))));

// In GitHub Actions a stale record is also an annotation on the run, so it
// cannot scroll past unseen.
const annotate = process.env.GITHUB_ACTIONS === 'true';
for (const w of warnings) console.warn(annotate ? `::warning title=check-data::${w}` : `check-data: warning: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`check-data: ${e}`);
  console.error(`check-data: ${errors.length} problem(s)`);
  process.exit(1);
}
console.log(`check-data: ${registeredFiles().length} files valid (${[...schemas.documents.keys()].join(', ')})${warnings.length ? `, ${warnings.length} warning(s)` : ''}`);
