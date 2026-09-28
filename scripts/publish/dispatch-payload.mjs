// Validates an `upstream-feed-published` repository_dispatch payload
// (publish-content.yml). The payload comes from outside this repository and
// is untrusted: it must be exactly {feed, revision}, with feed one of the
// feeds data/release.json records and revision a full commit SHA. Anything
// else fails, and the payload is never echoed.
//
//   PAYLOAD='<json>' node scripts/publish/dispatch-payload.mjs   appends feed=, feed_revision= to $GITHUB_OUTPUT
//
// Builtins only: runs before npm ci.
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function validateFeedPayload(text) {
  let p;
  try {
    p = JSON.parse(text);
  } catch {
    return null;
  }
  const ok =
    p !== null &&
    typeof p === 'object' &&
    !Array.isArray(p) &&
    Object.keys(p).sort().join() === 'feed,revision' &&
    typeof p.feed === 'string' &&
    /^(product|adapters)$/.test(p.feed) &&
    typeof p.revision === 'string' &&
    /^[0-9a-f]{40}$/.test(p.revision);
  return ok ? { feed: p.feed, revision: p.revision } : null;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const payload = validateFeedPayload(process.env.PAYLOAD ?? '');
  if (!payload) {
    console.log('::error::client_payload must be exactly {"feed": "product"|"adapters", "revision": "<40-hex commit>"}');
    process.exit(1);
  }
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `feed=${payload.feed}\nfeed_revision=${payload.revision}\n`);
  console.log(`dispatch: feed ${payload.feed} at ${payload.revision}`);
}
