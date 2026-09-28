// Versioned data contracts: the one place that knows which schemas exist and
// which committed files each one governs. Used by check-data.mjs (build/CI),
// gen-data-types.mjs (TypeScript types) and test-data-contracts.mjs.
//
// Adding a contract (CONVENTIONS.md § Data contracts):
//   1. schemas/<name>-v<N>.schema.json, draft 2020-12, with
//      `properties.schemaVersion.const` = "<name>-v<N>" and an https $id under
//      SCHEMA_BASE. Shared definitions are $ref'd from common-v1.schema.json.
//   2. Register the files it governs in `targets` below.
//   3. `npm run data:types` and commit src/contracts/<name>-v<N>.ts.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const schemaDir = join(root, 'schemas');
export const SCHEMA_BASE = 'https://www.redactsecret.com/schemas/';

/**
 * Committed files and the contract family each must declare. A file's
 * `schemaVersion` picks the exact schema; the family pins which schemas it
 * may pick, so data/release.json can never validate as evidence.
 * `dir` targets take every *.json below the directory (recursively); their
 * `family` may be a function of the file's repository-relative path.
 */
export const targets = [
  { path: 'data/integrations.json', family: 'integrations' },
  { path: 'data/release.json', family: 'release' },
  { path: 'data/evidence.json', family: 'evidence' },
  // Locale copy (CONVENTIONS.md § Bilingual content): i18n/<locale>/<name>.json
  // is family locale-<name>, e.g. i18n/ko/architecture/vault.json → locale-architecture-vault.
  { dir: 'i18n', family: (path) => `locale-${path.split('/').slice(2).join('-').replace(/\.json$/, '')}` },
];

/** Every directory whose *.json files must all be registered in `targets`. */
export const governedDirs = ['data', 'i18n'];

const familyOf = (schemaVersion) => schemaVersion.replace(/-v\d+$/, '');

/** schemaVersion → { file, schema } for every document schema; plus the shared ones. */
export function loadSchemas() {
  const documents = new Map();
  const shared = [];
  for (const file of readdirSync(schemaDir).filter((f) => f.endsWith('.schema.json')).sort()) {
    const schema = JSON.parse(readFileSync(join(schemaDir, file), 'utf8'));
    if (schema.$id !== `${SCHEMA_BASE}${file}`) {
      throw new Error(`schemas/${file}: $id must be ${SCHEMA_BASE}${file}`);
    }
    const version = schema.properties?.schemaVersion?.const;
    if (version === undefined) shared.push({ file, schema });
    else {
      if (`${version}.schema.json` !== file) throw new Error(`schemas/${file}: schemaVersion const "${version}" does not match the file name`);
      documents.set(version, { file, schema });
    }
  }
  return { documents, shared };
}

export function createAjv({ documents, shared } = loadSchemas()) {
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictTypes: false, strictRequired: false });
  addFormats(ajv);
  for (const { schema } of shared) ajv.addSchema(schema);
  for (const { schema } of documents.values()) ajv.addSchema(schema);
  return ajv;
}

function* walkJson(dir) {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walkJson(full);
    else if (name.endsWith('.json')) yield full;
  }
}

const rel = (file) => relative(root, file).split(sep).join('/');

/** [{ path, family }] for every registered file, expanded. */
export function registeredFiles() {
  const out = [];
  for (const target of targets) {
    if (target.path) out.push({ path: target.path, family: target.family });
    else
      for (const file of walkJson(join(root, target.dir))) {
        const path = rel(file);
        out.push({ path, family: typeof target.family === 'function' ? target.family(path) : target.family });
      }
  }
  return out;
}

/** Files under governedDirs that no target registers. */
export function unregisteredFiles() {
  const known = new Set(registeredFiles().map((f) => f.path));
  const out = [];
  for (const dir of governedDirs) {
    for (const file of walkJson(join(root, dir))) if (!known.has(rel(file))) out.push(rel(file));
  }
  return out;
}

/**
 * Validates one parsed document against the schema its schemaVersion names.
 * Fails closed: a missing or unknown schemaVersion, or one from another
 * family than `family`, is an error before any schema runs.
 */
export function validateDocument(ajv, documents, doc, { family, label = 'document' } = {}) {
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) return [`${label}: not a JSON object`];
  const version = doc.schemaVersion;
  if (typeof version !== 'string') return [`${label}: missing schemaVersion`];
  if (!documents.has(version)) {
    const known = [...documents.keys()].filter((v) => !family || familyOf(v) === family);
    return [`${label}: unknown schemaVersion "${version}" (known: ${known.join(', ') || 'none'})`];
  }
  if (family && familyOf(version) !== family) return [`${label}: schemaVersion "${version}" belongs to ${familyOf(version)}, not ${family}`];
  const validate = ajv.getSchema(`${SCHEMA_BASE}${documents.get(version).file}`);
  if (validate(doc)) return [];
  return validate.errors.map((e) => `${label}${e.instancePath || ''}: ${e.message}${e.params?.additionalProperty ? ` (${e.params.additionalProperty})` : ''}`);
}

/** Every string leaf with its JSON pointer. */
export function* stringLeaves(value, pointer = '') {
  if (typeof value === 'string') yield [pointer, value];
  else if (Array.isArray(value)) for (const [i, v] of value.entries()) yield* stringLeaves(v, `${pointer}/${i}`);
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) yield* stringLeaves(v, `${pointer}/${k.replace(/~/g, '~0').replace(/\//g, '~1')}`);
}

/** Every key and number with its JSON pointer. */
export function* keysAndNumbers(value, pointer = '') {
  if (typeof value === 'number') yield { pointer, number: value };
  else if (Array.isArray(value)) for (const [i, v] of value.entries()) yield* keysAndNumbers(v, `${pointer}/${i}`);
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) {
      yield { pointer: `${pointer}/${k}`, key: k };
      yield* keysAndNumbers(v, `${pointer}/${k}`);
    }
}

// Words that name a measured result. Benchmark scores, rates and bounds are
// owned by redact-secret-benchmarks; no key in this repository's data may
// carry one, and no value may be fractional (a rate, a ratio, a percentage).
const measuredWords = new Set([
  'score', 'scores', 'rate', 'rates', 'ratio', 'percent', 'percentage', 'precision', 'recall', 'f1',
  'accuracy', 'bound', 'bounds', 'lower', 'upper', 'ci', 'fpr', 'fnr', 'tpr', 'tnr', 'latency', 'throughput',
]);

export function benchmarkBoundaryViolations(doc, label) {
  const out = [];
  for (const item of keysAndNumbers(doc)) {
    if (item.key !== undefined) {
      const words = item.key.split(/(?=[A-Z])|[_\-\s]+/).map((w) => w.toLowerCase());
      if (words.some((w) => measuredWords.has(w))) out.push(`${label}${item.pointer}: key names a measured result; benchmark scores, rates and bounds are not copied here`);
    } else if (!Number.isInteger(item.number)) {
      out.push(`${label}${item.pointer}: fractional number; rates and ratios are not copied here`);
    }
  }
  return out;
}

/**
 * Scans every string leaf with the published core the page itself runs.
 * Only the committed synthetic fixture (its value carries the SYNTHETIC
 * marker) may be found, or a reviewed illustrative format listed in
 * `illustrative`. Reports the pointer and detector type, never the matched
 * text.
 */
export async function secretFindings(docs, { illustrative = [] } = {}) {
  const { initialize, scanAndRedact } = await import('@redact-secret/core');
  await initialize();
  const out = [];
  for (const { label, doc } of docs) {
    for (const [pointer, text] of stringLeaves(doc)) {
      // Blank out marked synthetic values first, then scan: anything still
      // found is unmarked. (Finding offsets are not used to slice the text,
      // so multi-byte locales cannot shift what counts as marked.)
      const unmarked = text.replace(/[A-Za-z0-9_]*SYNTHETIC_[A-Za-z0-9_]*/g, 'x');
      for (const f of scanAndRedact(unmarked).findings ?? []) {
        // A reviewed illustrative format in locale copy (scripts/data/illustrative.mjs):
        // exempt only when the whole string and the detector both match.
        if (illustrative.some((x) => x.text === text && x.detector === f.detector && label.startsWith(x.under))) continue;
        out.push(`${label}${pointer}: ${f.type} finding (${f.detector}); a synthetic example must carry the SYNTHETIC_ marker`);
      }
    }
  }
  return out;
}
