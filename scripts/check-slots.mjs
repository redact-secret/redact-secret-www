// Fails the build when the playground engine and the quickstart disagree:
// the page must not demo one version while telling visitors to install
// another (ADR 0001 § 6).
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const slots = JSON.parse(readFileSync(new URL('../src/slots/release.json', import.meta.url)));

const engine = pkg.dependencies['@redact-secret/core'];
const shown = slots.core.npm;

if (engine !== shown) {
  console.error(
    `check-slots: @redact-secret/core dependency is "${engine}" but src/slots/release.json core.npm is "${shown}".`,
  );
  process.exit(1);
}
console.log(`check-slots: engine and quickstart both at ${shown}`);

// evidence.json is copied by hand from the support matrix, so check that its
// counts still describe one matrix: every family has exactly one status, every
// stable family one basis, and every family but the unsupported ones one tier.
const { matrix } = JSON.parse(readFileSync(new URL('../src/slots/evidence.json', import.meta.url)));
const sum = (counts) => Object.values(counts).reduce((a, b) => a + b, 0);
const mismatches = [
  [sum(matrix.status), matrix.families, 'status counts', 'families'],
  [sum(matrix.stableBasis), matrix.status.stable, 'stable bases', 'stable families'],
  [sum(matrix.tiers) + matrix.status.unsupported, matrix.families, 'evidence tiers + unsupported', 'families'],
].filter(([a, b]) => a !== b);

if (mismatches.length) {
  for (const [a, b, what, of] of mismatches) {
    console.error(`check-slots: src/slots/evidence.json ${what} add up to ${a}, but ${of} is ${b}.`);
  }
  process.exit(1);
}
console.log(`check-slots: evidence counts consistent (${matrix.families} families)`);
