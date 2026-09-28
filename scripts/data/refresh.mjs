// Builds a release-v1 document from the registries. Pure apart from the
// injected `fetchText`, so the stale-on-failure behaviour is tested without
// a network (scripts/test-data-contracts.mjs). scripts/refresh-slots.mjs is
// the CLI around it.
import { createHash } from 'node:crypto';

export class NotFound extends Error {}

const sha256 = (text) => `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`;

const urls = {
  npm: (name) => `https://registry.npmjs.org/${name.replace('/', '%2f')}`,
  pypi: (name) => `https://pypi.org/pypi/${name}/json`,
  crates: (name) => `https://crates.io/api/v1/crates/${name}`,
};

// Each reader turns one registry document into { version, revision?, value }.
const readers = {
  npm(doc, name, tag = 'latest') {
    const tags = doc['dist-tags'];
    const version = tags[tag] ?? tags.latest;
    const manifest = doc.versions[version];
    return {
      version,
      revision: /^[0-9a-f]{40}$/.test(manifest.gitHead ?? '') ? manifest.gitHead : undefined,
      value: {
        registry: 'npm',
        name,
        version,
        published: doc.time[version].slice(0, 10),
        latest: tags.latest,
        tag: tags[tag] ? tag : 'latest',
        peers: manifest.peerDependencies ?? {},
        dependencies: manifest.dependencies ?? {},
      },
    };
  },
  pypi(doc, name) {
    const version = doc.info.version;
    const files = doc.releases[version] ?? [];
    return {
      version,
      value: {
        registry: 'pypi',
        name,
        version,
        published: files[0]?.upload_time?.slice(0, 10),
        requires: doc.info.requires_dist ?? [],
      },
    };
  },
  crates(doc, name) {
    const latest = doc.versions.find((v) => v.num === doc.crate.max_version);
    return { version: latest.num, value: { registry: 'crates', name, version: latest.num, published: latest.created_at.slice(0, 10) } };
  },
};

/** A stale copy of a previous record: same value, same observedAt, same digest. */
function stale(previous, now, reason) {
  return { ...previous, freshness: 'stale', staleSince: previous.freshness === 'stale' ? previous.staleSince : now, _reason: reason };
}

/**
 * Observes one package on one registry. Returns a fresh record, a fresh
 * "not on the registry" record, or — when the registry cannot be read — the
 * previous record marked stale. With no previous record to fall back on, it
 * throws: a value is never invented, and never shown as fresh.
 */
async function observe({ registry, name, tag }, previous, { fetchText, now }) {
  const url = urls[registry](name);
  const source = { kind: 'registry', registry, package: name, url };
  let text;
  try {
    text = await fetchText(url);
  } catch (error) {
    if (error instanceof NotFound) {
      return { source, observedAt: now, freshness: 'fresh', value: { registry, name, unpublished: true } };
    }
    if (previous) return stale(previous, now, error.message);
    throw new Error(`${registry}:${name}: ${error.message}, and there is no previous record to keep`);
  }
  const { version, revision, value } = readers[registry](JSON.parse(text), name, tag);
  if (!value.published) delete value.published;
  return {
    source: { ...source, version, ...(revision && { revision }) },
    observedAt: now,
    freshness: 'fresh',
    digest: sha256(text),
    value,
  };
}

/**
 * integrations: a valid integrations-v1 document (the package list).
 * previous: the committed release-v1 document, or undefined.
 * Returns { release, stale: [label, reason][] }.
 */
export async function buildRelease({ integrations, previous, fetchText, now = new Date().toISOString() }) {
  const old = previous?.schemaVersion === 'release-v1' ? previous.packages : {};
  const packages = {};
  const staleList = [];
  const note = (label, rec) => {
    if (rec._reason) staleList.push([label, rec._reason]);
    delete rec._reason;
    return rec;
  };
  for (const [id, entry] of Object.entries(integrations.packages)) {
    const rec = note(id, await observe(entry, old[id], { fetchText, now }));
    if (rec.value.unpublished && entry.declared) rec.declared = entry.declared;
    else delete rec.declared;
    for (const also of entry.also ?? []) {
      const mirror = note(`${id}/${also.registry}`, await observe(also, old[id]?.mirrors?.[also.registry], { fetchText, now }));
      if (mirror.value.unpublished) continue;
      rec.mirrors ??= {};
      const { registry: _r, requires: _q, ...rest } = mirror.value;
      rec.mirrors[also.registry] = { ...mirror, value: { name: rest.name, version: rest.version, ...(rest.published && { published: rest.published }) } };
    }
    packages[id] = rec;
  }
  return {
    release: {
      $schema: '../schemas/release-v1.schema.json',
      schemaVersion: 'release-v1',
      generatedAt: now,
      generator: 'scripts/refresh-slots.mjs',
      packages,
    },
    stale: staleList,
  };
}
