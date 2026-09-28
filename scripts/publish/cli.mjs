// The publish entry point the workflows call (#11). All logic lives in
// scripts/publish/release.mjs; this file parses and validates arguments,
// picks the real bucket (--stack, through the aws CLI) or a directory
// standing in for it (--bucket-dir, for local dry runs), and writes the job
// summary.
//
//   cli.mjs app      --commit <sha> (--stack <name> | --bucket-dir <dir>) [--dist dist] [--renderer build/renderer] [--source .]
//   cli.mjs content  --commit <sha> (--stack <name> | --bucket-dir <dir>) [--source .] [--trigger <event>]
//                    [--feed product|adapters --feed-revision <sha>]
//   cli.mjs rollback --release-id sha256:<hex> (--stack <name> | --bucket-dir <dir>)
//   common:          [--summary <file>] [--keep <n>]
//
// Every argument is untrusted and checked against a strict pattern before
// use. Output names commits, release IDs, digests, paths and the
// invalidation ID — never an object body or a copy string.
import { appendFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gitIn } from './plan.mjs';
import { KEEP_RELEASES, publishApp, publishContent, PublishError, rollbackContent, sha256 } from './release.mjs';
import { awsCdn, awsStore, fakeCdn, fsStore, stackOutputs } from './store.mjs';

const REVISION = /^[0-9a-f]{40}$/;
const RELEASE_ID = /^sha256:[0-9a-f]{64}$/;
const [command, ...rest] = process.argv.slice(2);
const args = {};
for (let i = 0; i < rest.length; i++) {
  const m = /^--([a-z-]+)$/.exec(rest[i]);
  if (!m) usage(`unexpected argument`);
  const value = rest[i + 1];
  if (value === undefined || value.startsWith('--')) usage(`--${m[1]} needs a value`);
  args[m[1]] = value;
  i++;
}

function usage(message) {
  console.error(`publish: ${message}\nusage: cli.mjs app|content|rollback … (see the header of scripts/publish/cli.mjs)`);
  process.exit(2);
}
const need = (name, pattern, what) => {
  const v = args[name];
  if (v === undefined) usage(`--${name} is required`);
  if (!pattern.test(v)) usage(`--${name} must be ${what}`);
  return v;
};
const known = {
  app: ['commit', 'stack', 'bucket-dir', 'dist', 'renderer', 'source', 'summary', 'keep'],
  content: ['commit', 'stack', 'bucket-dir', 'source', 'trigger', 'feed', 'feed-revision', 'summary', 'keep'],
  rollback: ['release-id', 'stack', 'bucket-dir', 'summary', 'keep'],
};
if (!known[command]) usage(`unknown command ${JSON.stringify(String(command ?? '').slice(0, 20))}`);
for (const k of Object.keys(args)) if (!known[command].includes(k)) usage(`--${k} is not an option of ${command}`);
if (Boolean(args.stack) === Boolean(args['bucket-dir'])) usage('give exactly one of --stack or --bucket-dir');
if (args.stack !== undefined) need('stack', /^[A-Za-z][A-Za-z0-9-]{0,127}$/, 'a CloudFormation stack name');
const keep = args.keep === undefined ? KEEP_RELEASES : Number(need('keep', /^[1-9][0-9]{0,2}$/, 'a number of releases (1–999)'));
const trigger = args.trigger ?? 'workflow_dispatch';
if (!['workflow_run', 'workflow_dispatch', 'repository_dispatch'].includes(trigger)) usage('--trigger must be workflow_run, workflow_dispatch or repository_dispatch');
if ((args.feed === undefined) !== (args['feed-revision'] === undefined)) usage('--feed and --feed-revision go together');
if (args.feed !== undefined) {
  need('feed', /^(product|adapters)$/, 'product or adapters');
  need('feed-revision', REVISION, 'a full 40-character commit SHA');
}

const summaryLines = [];
const summary = (line = '') => summaryLines.push(line);
const log = (line) => console.log(`publish: ${line}`);
function flushSummary() {
  if (args.summary && summaryLines.length) appendFileSync(args.summary, `${summaryLines.join('\n')}\n`);
}

class Skip extends Error {}

async function target() {
  if (args['bucket-dir']) return { store: fsStore(resolve(args['bucket-dir'])), cdn: fakeCdn(), where: `directory ${args['bucket-dir']}` };
  const { bucket, distributionId } = await stackOutputs(args.stack);
  return { store: awsStore(bucket), cdn: awsCdn(distributionId), where: `stack ${args.stack}` };
}

function record(result) {
  const title = { app: 'Application release', content: 'Content release', rollback: 'Content rollback' }[result.kind];
  summary(`### ${title} — www.redactsecret.com`);
  summary();
  summary(`- content release: \`${result.releaseId}\``);
  summary(`- previous content release: ${result.previousReleaseId ? `\`${result.previousReleaseId}\`` : '(none)'}`);
  summary(`- renderer (application) release: \`${result.rendererRelease}\``);
  summary(`- source revisions:`);
  for (const s of result.sources) {
    const rev = s.source.revision ?? s.source.version ?? '(authored)';
    summary(`  - ${s.name}: ${s.source.repository ?? s.source.package} \`${rev}\`${s.freshness === 'stale' ? ' (STALE)' : ''}`);
  }
  summary(`- mutable objects changed: ${result.changed.length}${result.changed.length ? ` (${result.changed.slice(0, 40).map((k) => `\`${k}\``).join(', ')}${result.changed.length > 40 ? ', …' : ''})` : ''}`);
  summary(`- invalidation: ${result.invalidation.id ? `\`${result.invalidation.id}\` (${result.invalidation.paths.length} paths)` : 'none (nothing mutable changed)'}`);
  const puts = Object.entries(result.puts).map(([k, v]) => `${k} ${v}`).join(', ');
  summary(`- objects uploaded: ${puts}`);
  if (result.prunedAssets) summary(`- unreferenced assets pruned: ${result.prunedAssets.length}`);
  summary(`- retained content releases: ${result.retention.kept.length}; deleted: ${result.retention.deletedReleases.length}; application releases deleted: ${result.retention.deletedAppReleases.length}`);
  summary(`- roll back to the previous content release: dispatch **Publish content** with operation \`rollback\` and release_id \`${result.previousReleaseId ?? '…'}\``);
}

const workDir = mkdtempSync(join(tmpdir(), 'publish-renderer-'));
try {
  const { store, cdn, where } = await target();
  log(`${command} against ${where}`);
  let result;
  if (command === 'app') {
    const commit = need('commit', REVISION, 'a full 40-character commit SHA');
    result = await publishApp({
      store, cdn, commit, keep, workDir, log,
      distDir: resolve(args.dist ?? 'dist'),
      rendererDir: resolve(args.renderer ?? 'build/renderer'),
      sourceDir: resolve(args.source ?? '.'),
    });
  } else if (command === 'content') {
    const commit = need('commit', REVISION, 'a full 40-character commit SHA');
    const sourceDir = resolve(args.source ?? '.');
    const git = gitIn(sourceDir);
    result = await publishContent({
      store, cdn, sourceDir, commit, keep, workDir, log,
      // The commit's application tree must be the deployed renderer's: the
      // copy is validated by, and rendered with, the same application code.
      async guard({ current }) {
        const deployed = current.rendererRelease;
        if (!git.hasCommit(deployed)) throw new PublishError(`deployed application release ${deployed} is not in this clone's history`);
        if (!git.sameAppTree(deployed, commit)) {
          throw new PublishError(`${commit} changes application files relative to the deployed release ${deployed}; publish it with publish-site.yml, not as content`);
        }
        // A CI-triggered run never replaces newer live content with older.
        if (trigger === 'workflow_run') {
          const body = await store.get(current.manifest.path);
          if (!body || sha256(body) !== current.manifest.digest) throw new PublishError(`${current.manifest.path}: missing or digest mismatch against current.json`);
          const www = JSON.parse(body.toString('utf8')).sources?.find((s) => s.name === 'www')?.source.revision;
          if (www && www !== commit && git.hasCommit(www) && !git.isAncestor(www, commit)) {
            throw new Skip(`live content comes from ${www}, which ${commit} does not contain`);
          }
        }
      },
    });
    if (args.feed) {
      const release = JSON.parse(readFileSync(join(sourceDir, 'data/release.json'), 'utf8'));
      const committed = release.feeds?.[args.feed]?.source?.revision;
      summary(
        committed === args['feed-revision']
          ? `- upstream dispatch: feed \`${args.feed}\` at \`${args['feed-revision']}\` matches the committed record`
          : `- upstream dispatch: feed \`${args.feed}\` announced \`${args['feed-revision']}\`, the committed record is \`${committed ?? 'none'}\` — drift; run npm run slots:refresh and review the diff (nothing unreviewed is published)`,
      );
    }
  } else {
    const releaseId = need('release-id', RELEASE_ID, 'sha256:<64 lowercase hex>');
    result = await rollbackContent({ store, cdn, releaseId, workDir, keep, log });
  }
  record(result);
  log(`done: content release ${result.releaseId}, invalidation ${result.invalidation.id ?? 'none'}`);
} catch (e) {
  if (e instanceof Skip) {
    summary(`### Content release skipped\n\n- ${e.message}`);
    log(`skipped: ${e.message}`);
  } else {
    const message = e instanceof PublishError ? e.message : `unexpected failure: ${e.message}`;
    summary(`### ${command} failed — nothing past the failing step went live\n\n\`\`\`\n${message}\n\`\`\``);
    flushSummary();
    const first = message.split('\n')[0];
    console.error(process.env.GITHUB_ACTIONS === 'true' ? `::error title=publish ${command}::${first}` : `publish: ${first}`);
    if (message.includes('\n')) console.error(message.split('\n').slice(1).join('\n'));
    process.exitCode = 1;
  }
} finally {
  rmSync(workDir, { recursive: true, force: true });
  if (process.exitCode !== 1) flushSummary();
}

