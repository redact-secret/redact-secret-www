// Application and content releases for www.redactsecret.com (#11,
// ARCHITECTURE.md § Publish flow). Every step talks to the bucket and the
// CDN through scripts/publish/store.mjs, so the same code runs against S3 and
// CloudFront in the workflows and against a directory in the tests.
//
// Bucket layout (one bucket, one distribution, everything served publicly —
// nothing sensitive is ever written here):
//
//   assets/**                          hashed JS, CSS, WASM, worker     immutable, 1 year
//   releases/app/<commit>/release.json  app-release-v1 record            immutable, 1 year
//   releases/app/<commit>/renderer/**   renderer.mjs + template.html     immutable, 1 year
//   content/<release hex>/manifest.json content-manifest-v2              immutable, 1 year
//   content/<release hex>/html/**       every rendered page              immutable, 1 year
//   content/<release hex>/src/**        the i18n/ and data/ files        immutable, 1 year
//   <path>/index.html                   stable HTML (copies of html/**)  no-cache (revalidate)
//   current.json                        content-current-v1 pointer       no-cache, written last
//   favicon.svg, sitemap.xml, en/**…    other application files          no-cache
//
// Every failure throws PublishError before current.json or any stable page
// moves, unless it names what already went live. No message carries an
// object body.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createAjv, familyForPath, loadSchemas, secretFindings, validateDocument } from '../data/contracts.mjs';
import { illustrative } from '../data/illustrative.mjs';

export const RENDERER_API = 1;
export const KEEP_RELEASES = 10;
export const REPOSITORY = 'redact-secret/redact-secret-www';
export const CURRENT = 'current.json';
export const IMMUTABLE = 'public, max-age=31536000, immutable';
export const REVALIDATE = 'no-cache';
/** Never deleted as "stale" by an application release; each has its own retention rule. */
export const PROTECTED_PREFIXES = ['assets/', 'content/', 'releases/'];

export class PublishError extends Error {}
const fail = (message) => {
  throw new PublishError(message);
};

export const sha256 = (body) => `sha256:${createHash('sha256').update(body).digest('hex')}`;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const REVISION = /^[0-9a-f]{40}$/;
export const hexOf = (id) => id.slice('sha256:'.length);
export const contentPrefix = (releaseId) => `content/${hexOf(releaseId)}/`;
export const appPrefix = (commit) => `releases/app/${commit}/`;
const json = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};
export function contentTypeOf(key) {
  const ext = key.slice(key.lastIndexOf('.'));
  return types[ext] ?? 'application/octet-stream';
}

/** sha256 over `renderer <commit>` and the sorted `<path> <digest>` lines (content-manifest-v2 § releaseId). */
export function releaseIdOf(rendererRelease, files) {
  const lines = [`renderer ${rendererRelease}`, ...files.map((f) => `${f.path} ${f.digest}`).sort()];
  return sha256(lines.map((l) => `${l}\n`).join(''));
}

/** The viewer paths a changed mutable object is cached under: `/ko/` and `/ko/index.html` for a page. */
export function invalidationPathsFor(key) {
  if (key === 'index.html' || key.endsWith('/index.html')) return [`/${key.slice(0, -'index.html'.length)}`, `/${key}`];
  return [`/${key}`];
}

let contracts;
function checkDoc(doc, family, label) {
  contracts ??= (() => {
    const schemas = loadSchemas();
    return { schemas, ajv: createAjv(schemas) };
  })();
  const errors = validateDocument(contracts.ajv, contracts.schemas.documents, doc, { family, label });
  if (errors.length) fail(errors.slice(0, 5).join('; '));
}

function parse(body, label) {
  try {
    return JSON.parse(body.toString('utf8'));
  } catch {
    return fail(`${label}: not valid JSON`);
  }
}

const walk = (dir) => (existsSync(dir) ? readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)])) : []);
const rel = (file, base) => relative(base, file).split(sep).join('/');

// --- the renderer artifact ---------------------------------------------------

async function importRenderer(entry, template) {
  const module = await import(`${pathToFileURL(entry).href}?v=${Date.now()}`);
  if (module.rendererApi !== RENDERER_API) fail(`renderer: interface ${module.rendererApi}, this publisher knows ${RENDERER_API}`);
  for (const name of ['inputFiles', 'renderSite', 'pagePaths', 'htmlFileFor', 'localeOfPath', 'locales']) {
    if (module[name] === undefined) fail(`renderer: missing export ${name}`);
  }
  return { module, template };
}

/** The locally built artifact (build/renderer/), for an application release. */
export async function loadLocalRenderer(dir) {
  const files = walk(dir)
    .map((f) => ({ path: `renderer/${rel(f, dir)}`, body: readFileSync(f) }))
    .sort((a, b) => (a.path < b.path ? -1 : 1))
    .map((f) => ({ ...f, digest: sha256(f.body), bytes: f.body.length }));
  if (!files.some((f) => f.path === 'renderer/renderer.mjs') || !files.some((f) => f.path === 'renderer/template.html')) {
    fail(`${dir}: no renderer.mjs/template.html (run npm run build)`);
  }
  const loaded = await importRenderer(join(dir, 'renderer.mjs'), readFileSync(join(dir, 'template.html'), 'utf8'));
  return { ...loaded, files };
}

/**
 * The deployed application release: /current.json → its app-release-v1
 * record, each checked against the digest that points at it.
 */
export async function resolveDeployed(store) {
  const currentBody = await store.get(CURRENT);
  if (!currentBody) fail('no current.json in the bucket: nothing is deployed yet; publish an application release first (publish-site.yml)');
  const current = parse(currentBody, CURRENT);
  checkDoc(current, 'content-current', CURRENT);
  if (current.manifest.path !== `${contentPrefix(current.releaseId)}manifest.json`) fail('current.json: manifest path does not match its releaseId');
  if (current.app.path !== `${appPrefix(current.rendererRelease)}release.json`) fail('current.json: app path does not match its rendererRelease');
  const appBody = await store.get(current.app.path);
  if (!appBody) fail(`${current.app.path}: missing (the deployed application release record)`);
  if (sha256(appBody) !== current.app.digest) fail(`${current.app.path}: digest mismatch against current.json`);
  const app = parse(appBody, current.app.path);
  checkDoc(app, 'app-release', current.app.path);
  if (app.release !== current.rendererRelease) fail(`${current.app.path}: records release ${app.release}, current.json names ${current.rendererRelease}`);
  return { current, currentBody, app, appRef: { path: current.app.path, digest: current.app.digest } };
}

/** Downloads the deployed renderer into workDir, verifying every file's digest, and loads it. */
export async function fetchRenderer(store, app, workDir) {
  if (app.rendererApi !== RENDERER_API) fail(`application release ${app.release}: renderer interface ${app.rendererApi}, this publisher knows ${RENDERER_API}`);
  const dir = join(workDir, app.release);
  for (const f of app.files) {
    const body = await store.get(`${appPrefix(app.release)}${f.path}`);
    if (!body) fail(`${appPrefix(app.release)}${f.path}: missing (renderer artifact)`);
    if (sha256(body) !== f.digest || body.length !== f.bytes) fail(`${appPrefix(app.release)}${f.path}: digest mismatch (renderer artifact)`);
    mkdirSync(dirname(join(dir, f.path)), { recursive: true });
    writeFileSync(join(dir, f.path), body);
  }
  return importRenderer(join(dir, app.renderer), readFileSync(join(dir, app.template), 'utf8'));
}

/** Every hashed asset the deployed HTML may reference is in the bucket, byte for byte. */
export async function verifyAssets(store, app) {
  for (const a of app.assets) {
    const body = await store.get(a.path);
    if (!body) fail(`${a.path}: missing from the bucket (application release ${app.release})`);
    if (sha256(body) !== a.digest) fail(`${a.path}: digest mismatch (application release ${app.release})`);
  }
}

// --- building a content release ---------------------------------------------

function sourcesOf(files, commit) {
  const release = files['data/release.json'];
  const evidence = files['data/evidence.json'];
  const entry = (name, rec) => ({ name, source: rec.source, freshness: rec.freshness, ...(rec.digest && { digest: rec.digest }) });
  return [
    { name: 'www', source: { kind: 'repository', repository: REPOSITORY, revision: commit }, freshness: 'fresh' },
    ...Object.entries(release?.feeds ?? {}).map(([name, rec]) => entry(`feeds/${name}`, rec)),
    ...Object.entries(evidence?.sources ?? {}).map(([name, rec]) => entry(`evidence/${name}`, rec)),
  ];
}

/**
 * A manifest this publisher accepts: its own contract, the renderer's locales
 * exactly, the renderer release it must be rendered by, a release ID that
 * matches its files, every page and every input exactly once, and each
 * file's locale matching its path.
 */
export function checkManifest(manifest, { renderer, rendererRelease }) {
  checkDoc(manifest, 'content-manifest', 'manifest');
  if (manifest.schemaVersion !== 'content-manifest-v2') fail(`manifest: schemaVersion ${manifest.schemaVersion} is not one this publisher reads (content-manifest-v2)`);
  if (manifest.rendererRelease !== rendererRelease) {
    fail(`manifest: inconsistent release — rendered by application release ${manifest.rendererRelease}, the deployed one is ${rendererRelease}`);
  }
  const want = [...renderer.locales].sort().join(',');
  if ([...manifest.locales].sort().join(',') !== want) fail(`manifest: locales ${manifest.locales.join(',')}, the renderer's are ${want}`);
  const paths = manifest.files.map((f) => f.path);
  if (new Set(paths).size !== paths.length) fail('manifest: a file is listed twice');
  if (releaseIdOf(manifest.rendererRelease, manifest.files) !== manifest.releaseId) fail('manifest: releaseId does not match its files');

  const expected = new Map([
    ...renderer.pagePaths.map((p) => [`html/${renderer.htmlFileFor(p)}`, { kind: 'html', locale: renderer.localeOfPath(p) ?? undefined }]),
    ...renderer.inputFiles().map((p) => {
      const locale = /^i18n\/([^/]+)\//.exec(p)?.[1];
      return [`src/${p}`, { kind: locale ? 'copy' : 'data', locale }];
    }),
  ]);
  for (const f of manifest.files) {
    const want = expected.get(f.path);
    if (!want) fail(`manifest: ${f.path} is not a file of this site`);
    if (f.kind !== want.kind) fail(`manifest: ${f.path} is kind ${f.kind}, expected ${want.kind}`);
    if (f.locale !== want.locale) fail(`manifest: ${f.path} has locale ${f.locale ?? '(none)'}, expected ${want.locale ?? '(none)'}`);
  }
  for (const path of expected.keys()) if (!paths.includes(path)) fail(`manifest: missing ${path}`);
}

/**
 * Validates the content in `sourceDir` (i18n/, data/), renders every page
 * with `renderer`, scans the rendered bundles for plaintext secrets, and
 * returns the manifest and every object body. Touches no bucket.
 */
export async function buildContentRelease({ renderer, sourceDir, commit, rendererRelease, now = new Date() }) {
  if (!REVISION.test(commit)) fail('commit must be a full 40-character SHA');
  const r = renderer.module;
  const files = {};
  const bodies = new Map();
  const entries = [];
  for (const path of r.inputFiles()) {
    const full = join(sourceDir, path);
    if (!existsSync(full)) fail(`${path}: missing`);
    const body = readFileSync(full);
    const doc = parse(body, path);
    const family = familyForPath(path);
    if (!family) fail(`${path}: no data contract registers this file`);
    checkDoc(doc, family, path);
    const locale = /^i18n\/([^/]+)\//.exec(path)?.[1];
    if (locale !== undefined) {
      if (!r.locales.includes(locale)) fail(`${path}: ${locale} is not a locale of this site`);
      if (doc.locale !== locale) fail(`${path}: declares locale "${doc.locale}", but sits under i18n/${locale}/`);
    }
    files[path] = doc;
    bodies.set(`src/${path}`, body);
    entries.push({ path: `src/${path}`, kind: locale ? 'copy' : 'data', ...(locale && { locale }), schemaVersion: doc.schemaVersion, digest: sha256(body), bytes: body.length });
  }

  const pages = await r.renderSite(renderer.template, files);

  // The secret scan (check-data's, with the published core) over what will be
  // uploaded: every source file and every page's embedded bundle. Findings
  // name the file, pointer and detector — never the value.
  const findings = await secretFindings(
    [...Object.entries(files).map(([label, doc]) => ({ label, doc })), ...pages.map((p) => ({ label: `page ${p.path}`, doc: p.payload }))],
    { illustrative: [...illustrative, ...illustrative.map((x) => ({ ...x, under: 'page ' }))] },
  );
  if (findings.length) fail(`secret scan: ${findings.length} finding(s); nothing was uploaded\n  ${findings.slice(0, 20).join('\n  ')}`);

  for (const p of pages) {
    const body = Buffer.from(p.html);
    bodies.set(`html/${p.file}`, body);
    entries.push({ path: `html/${p.file}`, kind: 'html', ...(p.locale && { locale: p.locale }), digest: sha256(body), bytes: body.length });
  }
  entries.sort((a, b) => (a.path < b.path ? -1 : 1));
  const manifest = {
    schemaVersion: 'content-manifest-v2',
    releaseId: releaseIdOf(rendererRelease, entries),
    locales: [...r.locales],
    rendererRelease,
    generatedAt: now.toISOString(),
    sources: sourcesOf(files, commit),
    files: entries,
  };
  checkManifest(manifest, { renderer: r, rendererRelease });
  return { manifest, bodies, pages };
}

// --- storing, verifying and switching a content release ---------------------

/** Uploads a release's files, then its manifest — unless that release is already stored (content-addressed). */
export async function uploadRelease(store, { manifest, bodies }) {
  const prefix = contentPrefix(manifest.releaseId);
  if (await store.get(`${prefix}manifest.json`)) return { puts: 0, existed: true };
  let puts = 0;
  for (const f of manifest.files) {
    await store.put(`${prefix}${f.path}`, bodies.get(f.path), { contentType: contentTypeOf(f.path), cacheControl: IMMUTABLE });
    puts++;
  }
  await store.put(`${prefix}manifest.json`, json(manifest), { contentType: 'application/json', cacheControl: IMMUTABLE });
  return { puts: puts + 1, existed: false };
}

/**
 * Reads a stored release back: the manifest (checked as above, against the
 * deployed renderer) and every file it lists, each against its digest.
 * Returns the stored manifest — for a release stored earlier, that one wins.
 */
export async function verifyStoredRelease(store, releaseId, { renderer, rendererRelease }) {
  if (!DIGEST.test(releaseId)) fail('release ID must be sha256:<64 hex>');
  const prefix = contentPrefix(releaseId);
  const body = await store.get(`${prefix}manifest.json`);
  if (!body) fail(`content release ${releaseId}: no manifest in the bucket (not retained, or never published)`);
  const manifest = parse(body, `${prefix}manifest.json`);
  checkManifest(manifest, { renderer, rendererRelease });
  if (manifest.releaseId !== releaseId) fail(`${prefix}manifest.json: names release ${manifest.releaseId}`);
  const html = new Map();
  for (const f of manifest.files) {
    const b = await store.get(`${prefix}${f.path}`);
    if (!b) fail(`${prefix}${f.path}: missing`);
    if (b.length !== f.bytes || sha256(b) !== f.digest) fail(`${prefix}${f.path}: digest mismatch`);
    if (f.kind === 'html') html.set(f.path.slice('html/'.length), b);
  }
  return { manifest, manifestDigest: sha256(body), html };
}

/** current.json for a release: a pure function of it, so a rollback restores it byte for byte. */
export function currentFor(manifest, manifestDigest, appRef) {
  return json({
    schemaVersion: 'content-current-v1',
    releaseId: manifest.releaseId,
    manifest: { path: `${contentPrefix(manifest.releaseId)}manifest.json`, digest: manifestDigest },
    rendererRelease: manifest.rendererRelease,
    app: appRef,
  });
}

/**
 * Makes a verified release live: each stable page whose bytes differ, then
 * current.json, last. Returns the mutable keys it changed.
 */
export async function goLive(store, { manifest, manifestDigest, html }, appRef) {
  const changed = [];
  for (const [key, body] of [...html].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const live = await store.get(key);
    if (live && live.equals(body)) continue;
    await store.put(key, body, { contentType: contentTypeOf(key), cacheControl: REVALIDATE });
    changed.push(key);
  }
  const current = currentFor(manifest, manifestDigest, appRef);
  checkDoc(JSON.parse(current), 'content-current', CURRENT);
  const live = await store.get(CURRENT);
  if (!live || !live.equals(current)) {
    await store.put(CURRENT, current, { contentType: 'application/json', cacheControl: REVALIDATE });
    changed.push(CURRENT);
  }
  return changed;
}

async function invalidate(cdn, changed) {
  const paths = [...new Set(changed.flatMap(invalidationPathsFor))].sort();
  if (!paths.length) return { id: null, paths };
  return { id: await cdn.invalidate(paths), paths };
}

/**
 * Retention: keeps the live content release and the `keep` most recent
 * others (by manifest generatedAt), and every application release record one
 * of them — or current.json — names. Deletes the rest, and nothing outside
 * content/ and releases/app/.
 */
export async function prune(store, { keep = KEEP_RELEASES, current }) {
  const byRelease = new Map();
  for (const { key } of await store.list('content/')) {
    const hex = key.split('/')[1];
    if (!byRelease.has(hex)) byRelease.set(hex, []);
    byRelease.get(hex).push(key);
  }
  const releases = [];
  for (const hex of byRelease.keys()) {
    const body = await store.get(`content/${hex}/manifest.json`);
    let manifest = null;
    try {
      manifest = body && JSON.parse(body.toString('utf8'));
    } catch {
      manifest = null;
    }
    releases.push({ hex, generatedAt: manifest?.generatedAt ?? '', rendererRelease: manifest?.rendererRelease });
  }
  releases.sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : a.generatedAt > b.generatedAt ? -1 : 0));
  const liveHex = hexOf(current.releaseId);
  const kept = new Set([liveHex, ...releases.filter((r) => r.hex !== liveHex).slice(0, keep).map((r) => r.hex)]);
  const renderers = new Set([current.rendererRelease, ...releases.filter((r) => kept.has(r.hex)).map((r) => r.rendererRelease)]);

  const doomed = [...byRelease].filter(([hex]) => !kept.has(hex)).flatMap(([, keys]) => keys);
  const apps = new Map();
  for (const { key } of await store.list('releases/app/')) {
    const commit = key.split('/')[2];
    if (!apps.has(commit)) apps.set(commit, []);
    apps.get(commit).push(key);
  }
  const doomedApps = [...apps].filter(([commit]) => !renderers.has(commit));
  const keys = [...doomed, ...doomedApps.flatMap(([, k]) => k)];
  if (keys.some((k) => !k.startsWith('content/') && !k.startsWith('releases/app/'))) fail('prune: refusing to delete outside content/ and releases/app/');
  if (keys.length) await store.delete(keys);
  return {
    kept: [...kept].map((hex) => `sha256:${hex}`),
    deletedReleases: [...byRelease.keys()].filter((hex) => !kept.has(hex)).map((hex) => `sha256:${hex}`),
    deletedAppReleases: doomedApps.map(([commit]) => commit),
  };
}

// --- the three operations ---------------------------------------------------

/**
 * A content-only release: renders `sourceDir`'s i18n/ and data/ with the
 * DEPLOYED renderer and switches the site to it. Never builds, and never
 * writes under assets/ or releases/.
 *
 * `guard(deployed)` runs once the deployed release is known and verified,
 * before anything renders (the CLI checks there that the commit's application
 * tree is the deployed one's).
 */
export async function publishContent({ store, cdn, sourceDir, commit, workDir, keep, now, guard, log = () => {} }) {
  const deployed = await resolveDeployed(store);
  log(`deployed application release ${deployed.current.rendererRelease}, content release ${deployed.current.releaseId}`);
  await guard?.(deployed);
  const renderer = await fetchRenderer(store, deployed.app, workDir);
  await verifyAssets(store, deployed.app);
  log(`renderer and ${deployed.app.assets.length} assets verified against ${deployed.current.app.path}`);

  const built = await buildContentRelease({ renderer, sourceDir, commit, rendererRelease: deployed.current.rendererRelease, now });
  log(`rendered ${built.pages.length} pages; content release ${built.manifest.releaseId}`);
  const uploaded = await uploadRelease(store, built);
  log(uploaded.existed ? 'release already stored; verifying the stored copy' : `uploaded ${uploaded.puts} immutable objects`);
  const verified = await verifyStoredRelease(store, built.manifest.releaseId, { renderer: renderer.module, rendererRelease: deployed.current.rendererRelease });
  log(`read back and verified the manifest and ${verified.manifest.files.length} files`);
  const changed = await goLive(store, verified, deployed.appRef);
  const invalidation = await invalidate(cdn, changed);
  const retention = await prune(store, { keep, current: verified.manifest });
  return {
    kind: 'content',
    releaseId: verified.manifest.releaseId,
    previousReleaseId: deployed.current.releaseId,
    rendererRelease: deployed.current.rendererRelease,
    sources: verified.manifest.sources,
    changed,
    invalidation,
    retention,
    puts: { content: uploaded.puts },
  };
}

/** Rolls the site back to a retained content release: verified, re-pointed, no build and no render. */
export async function rollbackContent({ store, cdn, releaseId, workDir, keep, log = () => {} }) {
  if (!DIGEST.test(releaseId)) fail('release ID must be sha256:<64 hex>');
  const deployed = await resolveDeployed(store);
  const renderer = await fetchRenderer(store, deployed.app, workDir);
  await verifyAssets(store, deployed.app);
  const verified = await verifyStoredRelease(store, releaseId, { renderer: renderer.module, rendererRelease: deployed.current.rendererRelease });
  log(`verified retained release ${releaseId} (${verified.manifest.files.length} files)`);
  const changed = await goLive(store, verified, deployed.appRef);
  const invalidation = await invalidate(cdn, changed);
  const retention = await prune(store, { keep, current: verified.manifest });
  return {
    kind: 'rollback',
    releaseId,
    previousReleaseId: deployed.current.releaseId,
    rendererRelease: deployed.current.rendererRelease,
    sources: verified.manifest.sources,
    changed,
    invalidation,
    retention,
    puts: { content: 0 },
  };
}

/**
 * An application release, in the three passes every site in the project
 * uses (redact-secret-sites scripts/publish-site.sh), with the content
 * release in the middle:
 *
 *   1. hashed assets that are not already there, byte for byte (kept: nothing deleted);
 *      the renderer artifact and its record under releases/app/<commit>/, read back;
 *   2. the other application files (no-cache), stale ones removed — never
 *      under assets/, content/ or releases/, never current.json — then a
 *      content release rendered by THIS renderer, which must reproduce dist/'s
 *      pages byte for byte, switched live as publishContent does;
 *   3. assets no longer referenced pruned, once the new HTML is live.
 *
 * Then one invalidation of the mutable paths that changed, and retention.
 */
export async function publishApp({ store, cdn, distDir, rendererDir, sourceDir, commit, workDir, keep, now, log = () => {} }) {
  if (!REVISION.test(commit)) fail('commit must be a full 40-character SHA');
  const renderer = await loadLocalRenderer(rendererDir);
  const assets = walk(join(distDir, 'assets'))
    .map((f) => ({ path: rel(f, distDir), body: readFileSync(f) }))
    .sort((a, b) => (a.path < b.path ? -1 : 1))
    .map((a) => ({ ...a, digest: sha256(a.body), bytes: a.body.length }));
  if (!assets.length) fail(`${distDir}/assets: empty (run npm run build)`);
  const record = {
    schemaVersion: 'app-release-v1',
    release: commit,
    repository: REPOSITORY,
    rendererApi: renderer.module.rendererApi,
    renderer: 'renderer/renderer.mjs',
    template: 'renderer/template.html',
    files: renderer.files.map(({ path, digest, bytes }) => ({ path, digest, bytes })),
    assets: assets.map(({ path, digest, bytes }) => ({ path, digest, bytes })),
  };
  checkDoc(record, 'app-release', 'app release record');
  const recordBody = json(record);
  const appRef = { path: `${appPrefix(commit)}release.json`, digest: sha256(recordBody) };

  // Everything that can fail on content fails here, before the bucket is touched.
  const built = await buildContentRelease({ renderer, sourceDir, commit, rendererRelease: commit, now });
  for (const p of built.pages) {
    const dist = join(distDir, p.file);
    if (!existsSync(dist) || !readFileSync(dist).equals(Buffer.from(p.html))) fail(`${p.file}: the renderer artifact does not reproduce dist/ (rebuild both together)`);
  }
  const pageFiles = new Set(built.pages.map((p) => p.file));
  const siteFiles = walk(distDir)
    .map((f) => rel(f, distDir))
    .filter((k) => !k.startsWith('assets/') && !pageFiles.has(k))
    .sort();
  for (const k of siteFiles) {
    if (PROTECTED_PREFIXES.some((p) => k.startsWith(p)) || k === CURRENT) fail(`dist/${k}: collides with a publisher-owned path`);
  }

  // Pass 1: immutable assets first, and the renderer artifact.
  let assetPuts = 0;
  for (const a of assets) {
    const live = await store.get(a.path);
    if (live && sha256(live) === a.digest) continue;
    await store.put(a.path, a.body, { contentType: contentTypeOf(a.path), cacheControl: IMMUTABLE });
    assetPuts++;
  }
  let appPuts = 0;
  const existing = await store.get(appRef.path);
  if (existing && !existing.equals(recordBody)) fail(`${appRef.path}: already published with different content; an application release is never rewritten`);
  if (!existing) {
    for (const f of renderer.files) {
      await store.put(`${appPrefix(commit)}${f.path}`, f.body, { contentType: contentTypeOf(f.path), cacheControl: IMMUTABLE });
      appPuts++;
    }
    await store.put(appRef.path, recordBody, { contentType: 'application/json', cacheControl: IMMUTABLE });
    appPuts++;
  }
  // Read back what the content plane will rely on.
  const stored = await store.get(appRef.path);
  if (!stored || sha256(stored) !== appRef.digest) fail(`${appRef.path}: read-back digest mismatch`);
  await fetchRenderer(store, record, workDir);
  await verifyAssets(store, record);
  log(`pass 1: ${assetPuts} asset(s) uploaded, ${assets.length - assetPuts} already there; renderer ${appPuts ? 'uploaded' : 'already there'} and verified`);

  // Pass 2: other application files, stale ones removed, then the content release.
  const changed = [];
  for (const k of siteFiles) {
    const body = readFileSync(join(distDir, k));
    const live = await store.get(k);
    if (live && live.equals(body)) continue;
    await store.put(k, body, { contentType: contentTypeOf(k), cacheControl: REVALIDATE });
    changed.push(k);
  }
  const keepKeys = new Set([...siteFiles, ...pageFiles, CURRENT]);
  const stale = (await store.list('')).map((o) => o.key).filter((k) => !PROTECTED_PREFIXES.some((p) => k.startsWith(p)) && !keepKeys.has(k));
  if (stale.length) await store.delete(stale);
  changed.push(...stale);

  const uploaded = await uploadRelease(store, built);
  const verified = await verifyStoredRelease(store, built.manifest.releaseId, { renderer: renderer.module, rendererRelease: commit });
  const previous = await store.get(CURRENT);
  const previousReleaseId = previous ? (() => { try { return JSON.parse(previous.toString('utf8')).releaseId ?? null; } catch { return null; } })() : null;
  changed.push(...(await goLive(store, verified, appRef)));
  log(`pass 2: ${changed.length} mutable object(s) changed; content release ${verified.manifest.releaseId} live`);

  // Pass 3: prune assets the live HTML no longer references.
  const wanted = new Set(assets.map((a) => a.path));
  const unreferenced = (await store.list('assets/')).map((o) => o.key).filter((k) => !wanted.has(k));
  if (unreferenced.length) await store.delete(unreferenced);
  log(`pass 3: ${unreferenced.length} unreferenced asset(s) pruned`);

  const invalidation = await invalidate(cdn, changed);
  const retention = await prune(store, { keep, current: verified.manifest });
  return {
    kind: 'app',
    releaseId: verified.manifest.releaseId,
    previousReleaseId,
    rendererRelease: commit,
    sources: verified.manifest.sources,
    changed,
    invalidation,
    retention,
    puts: { assets: assetPuts, app: appPuts, content: uploaded.puts },
    prunedAssets: unreferenced,
  };
}
