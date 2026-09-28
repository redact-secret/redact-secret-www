// The upstream feeds data/release.json records next to the registry records
// (#12): redact-secret's site feed and redact-secret-adapters' release feed.
// Called by buildRelease (refresh.mjs) after the registries are read, so a
// feed is always cross-checked against what the registries say. Pure apart
// from the injected `fetchText`; scripts/test-upstream-feeds.mjs drives every
// path offline.
//
// Each feed is fetched at one full commit: `ref` is resolved to a SHA through
// the GitHub API, and the feed and its schema are read from that commit. The
// record keeps the SHA, a sha256 of the bytes computed here, the feed's own
// generatedAt, and when it was read.
//
// Fail closed. An unknown schemaVersion, a schema-invalid payload, a digest
// mismatch on re-fetch, an inconsistent payload, or a network error never
// produces a fresh record: the previous record is kept, marked stale with its
// original observedAt (and its first staleSince), or, with no previous record,
// the refresh fails.
import { createHash } from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export class NotFound extends Error {}

const sha256hex = (text) => createHash('sha256').update(text, 'utf8').digest('hex');
const digestOf = (text) => `sha256:${sha256hex(text)}`;

export const upstreamFeeds = {
  product: {
    repository: 'redact-secret/redact-secret',
    ref: 'main',
    feedPath: 'docs/contracts/site-feed/v1/feed.json',
    schemaPath: 'docs/contracts/site-feed/v1/feed.schema.json',
    schemaVersion: 'redact-secret.site-feed/v1',
  },
  adapters: {
    // main, not develop: on develop a declared version can be ahead of the
    // registries. Until the feed reaches main, the registry records are the
    // source and the record says so (mode: registry-fallback).
    repository: 'redact-secret/redact-secret-adapters',
    ref: 'main',
    feedPath: 'site-feed/v1/adapters.json',
    schemaPath: 'site-feed/v1/adapters.schema.json',
    schemaVersion: 'redact-secret-adapters.release-feed/v1',
    fallback: 'registry',
  },
};

export const commitUrl = (repository, ref) => `https://api.github.com/repos/${repository}/commits/${ref}`;
export const rawUrl = (repository, sha, path) => `https://raw.githubusercontent.com/${repository}/${sha}/${path}`;

/** A rejected feed. The message names what failed, never a token. */
class Rejected extends Error {}

// Upstream strings reach logs, job summaries and the drift issue only when
// they look like an identifier or a version; anything else is withheld, so a
// diagnostic can never carry a value copied out of a bad payload.
const safe = (v) => (typeof v === 'string' && /^[A-Za-z0-9@/._:+-]{1,64}$/.test(v) ? v : '<withheld>');

async function resolveSha(spec, fetchText) {
  const text = (await fetchText(commitUrl(spec.repository, spec.ref))).trim();
  let sha = text;
  if (!/^[0-9a-f]{40}$/.test(sha)) {
    try {
      sha = JSON.parse(text).sha;
    } catch {
      sha = undefined;
    }
  }
  if (typeof sha !== 'string' || !/^[0-9a-f]{40}$/.test(sha)) throw new Rejected(`${spec.repository}@${spec.ref}: the GitHub API did not return a full commit SHA`);
  return sha;
}

function parseJson(text, what) {
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Rejected(`${what}: not JSON (${e.message})`);
  }
}

/** Validates `doc` against the schema fetched at the same commit. */
function validateAgainst(schema, doc, spec, what) {
  if (schema?.properties?.schemaVersion?.const !== spec.schemaVersion) {
    throw new Rejected(`${what}: the schema at this commit does not define ${spec.schemaVersion}`);
  }
  // A fresh Ajv per schema: upstream $ids never collide with ours.
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  let validate;
  try {
    validate = ajv.compile(schema);
  } catch (e) {
    throw new Rejected(`${what}: the schema does not compile (${e.message})`);
  }
  if (!validate(doc)) {
    const first = validate.errors.slice(0, 5).map((e) => `${e.instancePath || '/'} ${e.message}${e.params?.additionalProperty ? ` (${safe(e.params.additionalProperty)})` : ''}`);
    throw new Rejected(`${what}: does not satisfy its schema: ${first.join('; ')}`);
  }
}

/** SemVer 2 precedence, enough for x.y.z[-pre]. */
export function compareSemver(a, b) {
  const parse = (v) => {
    const [core, pre] = v.split(/-(.*)/s);
    return { nums: core.split('.').map(Number), pre: pre ? pre.split('.') : [] };
  };
  const x = parse(a);
  const y = parse(b);
  for (let i = 0; i < 3; i++) if (x.nums[i] !== y.nums[i]) return x.nums[i] < y.nums[i] ? -1 : 1;
  if (!x.pre.length || !y.pre.length) return x.pre.length === y.pre.length ? 0 : x.pre.length ? -1 : 1;
  for (let i = 0; i < Math.max(x.pre.length, y.pre.length); i++) {
    const p = x.pre[i];
    const q = y.pre[i];
    if (p === undefined) return -1;
    if (q === undefined) return 1;
    if (p === q) continue;
    const pn = /^\d+$/.test(p);
    const qn = /^\d+$/.test(q);
    if (pn && qn) return Number(p) < Number(q) ? -1 : 1;
    if (pn !== qn) return pn ? -1 : 1;
    return p < q ? -1 : 1;
  }
  return 0;
}

/**
 * Where each (ecosystem, name) lives in the release document's registry
 * records: a package id, or a mirror of one.
 */
function registryIndex(integrations, packages) {
  const index = new Map();
  for (const [id, entry] of Object.entries(integrations.packages)) {
    index.set(`${entry.registry}:${entry.name}`, { id, entry, rec: packages[id] });
    for (const also of entry.also ?? []) {
      index.set(`${also.registry}:${also.name}`, { id: `${id}/${also.registry}`, entry: { ...also, tag: undefined }, rec: packages[id]?.mirrors?.[also.registry] });
    }
  }
  return index;
}

// --- product: redact-secret's site feed ----------------------------------

function summariseMatrix(m) {
  const status = { stable: 0, provisional: 0, pending: 0, unsupported: 0 };
  const stableBasis = { documented: 0, empirical: 0 };
  const tiers = { T0: 0, T1: 0, T2: 0, T3: 0 };
  const providers = new Set();
  for (const f of m.families) {
    status[f.status] += 1;
    if (f.provider) providers.add(f.provider);
    if (f.status === 'stable' && f.qualificationProfile) stableBasis[f.qualificationProfile] += 1;
    if (f.evidenceTier) tiers[f.evidenceTier] += 1;
  }
  return { status, stableBasis, tiers, providers: providers.size };
}

async function readProduct({ spec, sha, text, feed, fetchText, previous, integrations, packages }) {
  const what = `${spec.repository}@${sha.slice(0, 7)} ${spec.feedPath}`;
  // The feed's inputs, at the same commit, must hash to what it says.
  for (const input of feed.sources) {
    const bytes = await fetchText(rawUrl(spec.repository, sha, input.path));
    if (sha256hex(bytes) !== input.sha256) throw new Rejected(`${what}: input ${input.path} does not match its sha256 in the feed`);
  }
  const m = feed.supportMatrix;
  const counted = summariseMatrix(m);
  const inconsistent = [];
  if (m.families.length !== m.familyCount) inconsistent.push(`familyCount ${m.familyCount} but ${m.families.length} families listed`);
  if (counted.providers !== m.providerCount) inconsistent.push(`providerCount ${m.providerCount} but ${counted.providers} providers listed`);
  for (const [k, n] of Object.entries(m.distribution)) {
    if (counted.status[k] !== n) inconsistent.push(`distribution.${k} ${n} but ${counted.status[k]} families have that status`);
  }
  // The feed's release against what the registries say right now.
  const index = registryIndex(integrations, packages);
  const crossChecked = [];
  for (const p of feed.release.packages) {
    const hit = index.get(`${p.ecosystem}:${p.name}`);
    if (!hit?.rec || hit.rec.freshness !== 'fresh' || hit.rec.value.unpublished) continue;
    if (hit.rec.value.version !== p.version) inconsistent.push(`release ${safe(feed.release.version)} names ${p.ecosystem} ${p.name} ${safe(p.version)}, the registry has ${hit.rec.value.version}`);
    else crossChecked.push(hit.id);
  }
  // Never step back from the committed feed.
  const prev = previous?.value;
  if (prev) {
    if (compareSemver(feed.release.version, prev.release.version) < 0) inconsistent.push(`release ${safe(feed.release.version)} is older than the committed ${prev.release.version}`);
    if (feed.generatedAt < previous.generatedAt) inconsistent.push(`generatedAt ${safe(feed.generatedAt)} is older than the committed ${previous.generatedAt}`);
    if (m.generatedAt < prev.supportMatrix.generatedAt) inconsistent.push(`supportMatrix.generatedAt ${safe(m.generatedAt)} is older than the committed ${prev.supportMatrix.generatedAt}`);
  }
  if (inconsistent.length) throw new Rejected(`${what}: inconsistent: ${inconsistent.join('; ')}`);
  return {
    crossChecked: crossChecked.sort(),
    value: {
      release: {
        version: feed.release.version,
        tag: feed.release.tag,
        sourceRevision: feed.release.sourceRevision,
        verifiedOn: feed.release.verifiedOn,
      },
      supportMatrix: {
        benchmarksRevision: m.benchmarksRevision,
        generatedAt: m.generatedAt,
        measuredProductVersion: m.measuredProductVersion,
        measuredProductRevision: m.measuredProductRevision,
        gatedLatestRelease: m.gatedLatestRelease,
        families: m.familyCount,
        providers: m.providerCount,
        status: { ...m.distribution },
        stableBasis: counted.stableBasis,
        tiers: counted.tiers,
      },
    },
  };
}

// --- adapters: redact-secret-adapters' release feed ------------------------

async function readAdapters({ spec, sha, feed, previous, integrations, packages }) {
  const what = `${spec.repository}@${sha.slice(0, 7)} ${spec.feedPath}`;
  const index = registryIndex(integrations, packages);
  const inconsistent = [];
  const crossChecked = [];
  for (const p of feed.packages) {
    const hit = index.get(`${p.ecosystem}:${p.name}`);
    if (!hit) continue; // Not a package this site lists.
    const expected = hit.entry.registry === 'npm' ? hit.entry.tag ?? 'latest' : undefined;
    if (expected && p.channel !== expected) inconsistent.push(`${p.name} channel ${safe(p.channel)}, the site installs from ${expected}`);
    if (!hit.rec || hit.rec.freshness !== 'fresh') continue;
    if (hit.rec.value.unpublished) inconsistent.push(`${p.name} ${safe(p.version)} is declared, the registry does not have it`);
    else if (hit.rec.value.version !== p.version) inconsistent.push(`${p.name} ${safe(p.version)} is declared, the registry has ${hit.rec.value.version}`);
    else crossChecked.push(hit.id);
  }
  if (previous?.mode === 'feed' && feed.generatedAt < previous.generatedAt) inconsistent.push(`generatedAt ${safe(feed.generatedAt)} is older than the committed ${previous.generatedAt}`);
  if (inconsistent.length) throw new Rejected(`${what}: inconsistent: ${inconsistent.join('; ')}`);
  return {
    crossChecked: crossChecked.sort(),
    value: {
      packages: feed.packages.map((p) => ({
        id: p.id,
        ecosystem: p.ecosystem,
        name: p.name,
        version: p.version,
        channel: p.channel,
        core: { name: p.core.name, range: p.core.range, tested: { lowest: p.core.tested.lowest, highest: p.core.tested.highest } },
      })),
    },
  };
}

const readers = { product: readProduct, adapters: readAdapters };

function staleCopy(previous, now) {
  return { ...previous, freshness: 'stale', staleSince: previous.freshness === 'stale' ? previous.staleSince : now };
}

/**
 * Reads one upstream feed. Returns { record, reason? }: a fresh record, a
 * registry-fallback record (adapters only, when the feed is not at the
 * commit), or the previous record marked stale with `reason`. Throws when
 * the feed is rejected and there is no previous record to keep.
 */
export async function observeFeed(name, spec, previous, { fetchText, now, integrations, packages }) {
  const source = (sha, paths) => ({ kind: 'repository', repository: spec.repository, revision: sha, paths });
  try {
    const sha = await resolveSha(spec, fetchText);
    let text;
    try {
      text = await fetchText(rawUrl(spec.repository, sha, spec.feedPath));
    } catch (error) {
      if (!(error instanceof NotFound) || spec.fallback !== 'registry') throw error;
      // A feed that was read before and has now gone is not a fallback.
      if (previous?.mode === 'feed') throw new Rejected(`${spec.repository}@${sha.slice(0, 7)}: ${spec.feedPath} was read before and is no longer on ${spec.ref}`);
      return {
        record: {
          source: source(sha, [spec.feedPath]),
          ref: spec.ref,
          mode: 'registry-fallback',
          fallbackReason: `${spec.feedPath} is not on ${spec.ref} at ${sha.slice(0, 7)}; the registry records are the source`,
          observedAt: now,
          freshness: 'fresh',
        },
      };
    }
    const what = `${spec.repository}@${sha.slice(0, 7)} ${spec.feedPath}`;
    const digest = digestOf(text);
    // A commit's bytes never change: the same commit must give the same digest.
    if (previous?.source?.revision === sha && previous.digest && previous.digest !== digest) {
      throw new Rejected(`${what}: digest mismatch on re-fetch (${digest} vs the committed ${previous.digest})`);
    }
    const feed = parseJson(text, what);
    if (feed?.schemaVersion !== spec.schemaVersion) throw new Rejected(`${what}: unknown schemaVersion ${safe(feed?.schemaVersion)} (known: ${spec.schemaVersion})`);
    const schemaText = await fetchText(rawUrl(spec.repository, sha, spec.schemaPath));
    validateAgainst(parseJson(schemaText, `${spec.schemaPath}@${sha.slice(0, 7)}`), feed, spec, what);
    const { value, crossChecked } = await readers[name]({ spec, sha, text, feed, fetchText, previous, integrations, packages });
    // Read it again: the bytes validated must be the bytes recorded.
    if (digestOf(await fetchText(rawUrl(spec.repository, sha, spec.feedPath))) !== digest) throw new Rejected(`${what}: digest mismatch on re-fetch`);
    return {
      record: {
        source: source(sha, [spec.feedPath, spec.schemaPath]),
        ref: spec.ref,
        ...(spec.fallback && { mode: 'feed' }),
        observedAt: now,
        freshness: 'fresh',
        schemaVersion: feed.schemaVersion,
        generatedAt: feed.generatedAt,
        digest,
        schemaDigest: digestOf(schemaText),
        crossChecked,
        value,
      },
    };
  } catch (error) {
    if (previous) return { record: staleCopy(previous, now), reason: error.message };
    throw new Error(`feeds/${name}: ${error.message}, and there is no previous record to keep`);
  }
}
