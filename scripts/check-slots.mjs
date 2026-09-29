// Fails the build when the playground engine and the quickstart disagree:
// the page must not demo one version while telling visitors to install
// another (ADR 0001 § 6).
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const release = JSON.parse(readFileSync(new URL('../data/release.json', import.meta.url)));

const engine = pkg.dependencies['@redact-secret/core'];
const shown = release.packages.core.value.version;

if (engine !== shown) {
  console.error(
    `check-slots: @redact-secret/core dependency is "${engine}" but data/release.json packages.core is "${shown}".`,
  );
  process.exit(1);
}
console.log(`check-slots: engine and quickstart both at ${shown}`);

// data/evidence.json is copied by hand from the support matrix, so check that its
// counts still describe one matrix: every family has exactly one status, every
// stable family one basis, and every family but the unsupported ones and some
// pending ones one tier (since 0.1.0-beta.11 the feed lists pending families
// with no evidence tier yet, so the untiered rest must fit within pending).
const matrix = JSON.parse(readFileSync(new URL('../data/evidence.json', import.meta.url))).facts.matrix.value;
const sum = (counts) => Object.values(counts).reduce((a, b) => a + b, 0);
const mismatches = [
  [sum(matrix.status), matrix.families, 'status counts', 'families'],
  [sum(matrix.stableBasis), matrix.status.stable, 'stable bases', 'stable families'],
].filter(([a, b]) => a !== b);
const untiered = matrix.families - sum(matrix.tiers) - matrix.status.unsupported;
if (untiered < 0 || untiered > matrix.status.pending) {
  mismatches.push([sum(matrix.tiers) + matrix.status.unsupported, matrix.families, 'evidence tiers + unsupported (+ at most the pending families)', 'families']);
}

if (mismatches.length) {
  for (const [a, b, what, of] of mismatches) {
    console.error(`check-slots: data/evidence.json ${what} add up to ${a}, but ${of} is ${b}.`);
  }
  process.exit(1);
}
console.log(`check-slots: evidence counts consistent (${matrix.families} families)`);
