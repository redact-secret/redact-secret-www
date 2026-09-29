// Reads the taxonomy counts out of the published provider-dossiers file
// (redact-secret-benchmarks: schemas/provider-dossiers-v1.json, published as
// results/provider-dossiers-v1.json) and applies them to
// data/evidence.json `facts.taxonomy`. Pure and offline: fetching lives in
// scripts/sync-taxonomy.mjs, and the tests feed it a fixture.
//
// Fail-closed: a payload that fails the vendored schema, or whose own counts
// disagree with its providers list, is never applied.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv from 'ajv';
import { root } from './contracts.mjs';

/** Where the published file is read from, in order. Production is published from benchmarks `main`; staging from `develop`. */
export const defaultUrls = [
  'https://benchmarks.redactsecret.dev/results/provider-dossiers-v1.json',
  'https://staging.benchmarks.redactsecret.dev/results/provider-dossiers-v1.json',
];

const schemaPath = join(root, 'scripts/fixtures/benchmarks/provider-dossiers-v1.schema.json');

/** Validates a parsed payload against the vendored benchmarks schema and its own arithmetic; returns problems. */
export function dossierProblems(payload) {
  const validate = new Ajv({ allErrors: true, strict: false }).compile(JSON.parse(readFileSync(schemaPath, 'utf8')));
  if (!validate(payload)) return validate.errors.map((e) => `${e.instancePath || '/'} ${e.message}`);
  const families = payload.providers.flatMap((p) => p.families);
  const problems = [];
  if (payload.providerCount !== payload.providers.length) problems.push(`providerCount ${payload.providerCount} but ${payload.providers.length} providers`);
  if (payload.familyCount !== families.length) problems.push(`familyCount ${payload.familyCount} but ${families.length} families`);
  return problems;
}

/** The counts the site cites, and the provenance of the file they came from. Throws on an invalid payload. */
export function taxonomyFromDossiers(payload, origin) {
  const problems = dossierProblems(payload);
  if (problems.length) throw new Error(`provider-dossiers payload from ${origin} is invalid: ${problems.join('; ')}`);
  const families = payload.providers.flatMap((p) => p.families);
  const { supportMatrix: m } = payload;
  return {
    value: {
      families: payload.familyCount,
      providers: payload.providerCount,
      withoutDetector: families.filter((f) => f.detectors.length === 0).length,
    },
    note: `Synced by npm run sync:taxonomy from ${origin}${m ? ` (generated ${m.generatedAt} at redact-secret-benchmarks ${m.revision})` : ''}. The counts come from that published file, not from the revision pinned in sources.benchmarks.`,
  };
}

/** Rewrites only the facts.taxonomy block of the evidence file's text, in its own layout, so the diff is that block alone. */
export function renderTaxonomy(text, fact) {
  const block = /^ {4}"taxonomy": \{\n[\s\S]*?\n {4}\},\n/m;
  if (!block.test(text)) throw new Error('data/evidence.json: facts.taxonomy block not found in the expected layout');
  const v = fact.value;
  const lines = [
    '    "taxonomy": {',
    `      "source": ${JSON.stringify(fact.source)},`,
    `      "paths": ${JSON.stringify(fact.paths).replace(/","/g, '", "')},`,
    `      "note": ${JSON.stringify(fact.note)},`,
    `      "value": { "families": ${v.families}, "providers": ${v.providers}, "withoutDetector": ${v.withoutDetector} }`,
    '    },',
    '',
  ];
  return text.replace(block, () => lines.join('\n'));
}

/** Returns a copy of the evidence document with facts.taxonomy set from the dossiers. Nothing else moves. */
export function applyTaxonomy(evidence, taxonomy) {
  const next = structuredClone(evidence);
  next.facts.taxonomy = { source: next.facts.taxonomy.source, paths: ['results/provider-dossiers-v1.json'], note: taxonomy.note, value: taxonomy.value };
  return next;
}
