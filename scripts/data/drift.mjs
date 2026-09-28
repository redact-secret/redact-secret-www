// Compares a freshly built release-v1 document with the committed one and
// says what a reviewer would have to look at: changed values, records that
// went stale, and the feed facts the pages state. Used by
// scripts/refresh-slots.mjs (and its --dry-run in the scheduled freshness
// workflow). Pure; tested in scripts/test-upstream-feeds.mjs.
//
// Timestamps that move on every run (the file's generatedAt, each record's
// observedAt and staleSince) are not drift. A changed payload digest whose
// values did not change is listed, but is not drift on its own: registries
// rewrite their documents for reasons the page never shows.

const ignored = (pointer) => pointer === '/generatedAt' || pointer === '/$schema' || /\/(observedAt|staleSince)$/.test(pointer);
const payloadOnly = (pointer) => /\/(digest|schemaDigest)$/.test(pointer);

function flatten(value, pointer = '', out = new Map()) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value)) flatten(v, `${pointer}/${k}`, out);
  } else if (Array.isArray(value)) {
    // Arrays of scalars compare as one value; arrays of objects by index.
    if (value.every((v) => v === null || typeof v !== 'object')) out.set(pointer, JSON.stringify(value));
    else value.forEach((v, i) => flatten(v, `${pointer}/${i}`, out));
  } else out.set(pointer, JSON.stringify(value));
  return out;
}

const recordOf = (pointer) => pointer.split('/').slice(1, 3).join('/');
const cell = (text) => String(text ?? '—').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const short = (sha) => (sha ? sha.slice(0, 7) : '—');

/**
 * Returns { drift, changes: [{ record, pointer, before, after, payloadOnly }], stale, markdown }.
 */
export function driftReport(previous, next, stale = []) {
  const before = flatten(previous ?? {});
  const after = flatten(next);
  const changes = [];
  for (const pointer of new Set([...before.keys(), ...after.keys()])) {
    if (ignored(pointer)) continue;
    const a = before.get(pointer);
    const b = after.get(pointer);
    if (a === b) continue;
    changes.push({ record: recordOf(pointer), pointer, before: a, after: b, payloadOnly: payloadOnly(pointer) });
  }
  changes.sort((x, y) => x.pointer.localeCompare(y.pointer));
  const drift = stale.length > 0 || changes.some((c) => !c.payloadOnly);

  const lines = ['## Upstream data drift', ''];
  lines.push(drift ? 'The live sources differ from the committed `data/release.json`. Nothing was committed or published; a maintainer runs `npm run slots:refresh`, reviews the diff and opens a PR.' : 'No drift: the live sources match the committed `data/release.json`.');
  lines.push('');
  const product = next.feeds?.product;
  if (product?.value) {
    const m = product.value.supportMatrix;
    lines.push('### Product feed');
    lines.push('');
    lines.push(`- \`${product.source.repository}\` @ \`${short(product.source.revision)}\` (${product.freshness}${product.staleSince ? ` since ${product.staleSince}` : ''}), feed generatedAt ${product.generatedAt}`);
    lines.push(`- Release **${product.value.release.version}** (tag \`${product.value.release.tag}\`, source \`${short(product.value.release.sourceRevision)}\`)`);
    lines.push(`- Support matrix measured on **${m.measuredProductVersion ?? 'an unrecorded version'}** (benchmarks @ \`${short(m.benchmarksRevision)}\`); drift gate against the latest release: ${m.gatedLatestRelease ? 'ran' : '**did not run**'}`);
    lines.push('');
  }
  const adapters = next.feeds?.adapters;
  if (adapters) {
    lines.push('### Adapters feed');
    lines.push('');
    lines.push(
      adapters.mode === 'registry-fallback'
        ? `- Registry fallback: ${adapters.fallbackReason} (${adapters.freshness})`
        : `- \`${adapters.source.repository}\` @ \`${short(adapters.source.revision)}\` (${adapters.freshness}), cross-checked: ${adapters.crossChecked?.join(', ') || 'none'}`,
    );
    lines.push('');
  }
  if (stale.length) {
    lines.push('### Stale (previous value kept, never shown as fresh)');
    lines.push('');
    lines.push('| Record | Why |', '| --- | --- |');
    for (const [label, reason] of stale) lines.push(`| \`${cell(label)}\` | ${cell(reason)} |`);
    lines.push('');
  }
  // A record the committed file does not have at all is one row, not one per field.
  const recordsBefore = new Set([...before.keys()].map(recordOf));
  const added = [...new Set(changes.filter((c) => !recordsBefore.has(c.record)).map((c) => c.record))];
  if (added.length) {
    lines.push(`New records: ${added.map((r) => `\`${r}\``).join(', ')}.`);
    lines.push('');
  }
  const shown = changes.filter((c) => !c.payloadOnly && recordsBefore.has(c.record));
  if (shown.length) {
    lines.push('### Changed values');
    lines.push('');
    lines.push('| Field | Committed | Live |', '| --- | --- | --- |');
    for (const c of shown.slice(0, 200)) lines.push(`| \`${cell(c.pointer)}\` | ${cell(c.before)} | ${cell(c.after)} |`);
    if (shown.length > 200) lines.push(`| … | ${shown.length - 200} more | |`);
    lines.push('');
  }
  const payload = changes.filter((c) => c.payloadOnly && recordsBefore.has(c.record));
  if (payload.length) {
    lines.push(`Payload digest changed without a value change: ${[...new Set(payload.map((c) => `\`${c.record}\``))].join(', ')}.`);
    lines.push('');
  }
  return { drift, changes, stale, markdown: `${lines.join('\n')}\n` };
}
