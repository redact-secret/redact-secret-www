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
