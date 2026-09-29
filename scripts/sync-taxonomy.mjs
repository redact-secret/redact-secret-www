// Feeds data/evidence.json `facts.taxonomy` (family and provider counts) from
// the published benchmarks file instead of hand-copied numbers (#473 follow-up).
//
//   node scripts/sync-taxonomy.mjs                 rewrite facts.taxonomy from the published file
//   node scripts/sync-taxonomy.mjs --check         exit 3 if facts.taxonomy differs from it (writes nothing)
//   node scripts/sync-taxonomy.mjs --url <url>     read this URL only (or set BENCHMARKS_DOSSIERS_URL)
//   node scripts/sync-taxonomy.mjs --file <path>   read a local copy (offline; used by the tests)
//   node scripts/sync-taxonomy.mjs --root <dir>    operate on another checkout's data/ (tests)
//
// Without --url/--file it tries production then staging (scripts/data/taxonomy.mjs
// `defaultUrls`) and uses the first that answers 200, naming it in the note.
// Any other failure exits 1 and leaves the file untouched.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root as repoRoot } from './data/contracts.mjs';
import { applyTaxonomy, defaultUrls, renderTaxonomy, taxonomyFromDossiers } from './data/taxonomy.mjs';

const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const check = args.includes('--check');
const root = opt('--root') ?? repoRoot;
const file = opt('--file');
const explicit = opt('--url') ?? process.env.BENCHMARKS_DOSSIERS_URL;

async function load() {
  if (file) return { origin: file.split('/').pop(), text: readFileSync(file, 'utf8') };
  const urls = explicit ? [explicit] : defaultUrls;
  const failures = [];
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (res.ok) return { origin: url, text: await res.text() };
      failures.push(`${url}: HTTP ${res.status}`);
    } catch (e) {
      failures.push(`${url}: ${e.message}`);
    }
  }
  throw new Error(`no published provider-dossiers file: ${failures.join('; ')}`);
}

try {
  const { origin, text } = await load();
  const path = join(root, 'data/evidence.json');
  const evidence = JSON.parse(readFileSync(path, 'utf8'));
  const next = applyTaxonomy(evidence, taxonomyFromDossiers(JSON.parse(text), origin));
  const before = JSON.stringify(evidence.facts.taxonomy.value);
  const after = JSON.stringify(next.facts.taxonomy.value);
  if (check) {
    // The note names the origin and run, so only the counts are drift.
    if (before === after) console.log(`sync-taxonomy: facts.taxonomy matches ${origin} ${after}`);
    else {
      console.error(`sync-taxonomy: drift: data/evidence.json has ${before}, ${origin} says ${after}. Run npm run sync:taxonomy and commit.`);
      process.exit(3);
    }
  } else {
    writeFileSync(path, renderTaxonomy(readFileSync(path, 'utf8'), next.facts.taxonomy));
    console.log(`sync-taxonomy: facts.taxonomy ${before} -> ${after} (from ${origin})`);
  }
} catch (e) {
  console.error(`sync-taxonomy: ${e.message}`);
  process.exit(1);
}
