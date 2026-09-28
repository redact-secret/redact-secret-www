// Which plane publishes a commit that passed CI on main (#11): an
// application release (publish-site.yml) or a content-only release
// (publish-content.yml). Both workflows run this on the same input and act
// on complementary answers, so exactly one of them publishes:
//
//   app      nothing is deployed yet, the deployed application release is
//            unknown to this clone, or anything outside i18n/ and data/
//            differs between it and the commit;
//   content  the commit's application tree is the deployed one's: only copy
//            or data can differ, and the deployed renderer renders it.
//
//   node scripts/publish/plan.mjs --current <current.json or empty> --target <sha> [--output $GITHUB_OUTPUT]
//
// Needs git and the commit's history; no npm install, no AWS session.
// current.json is read from the public site, so this is only a routing
// decision: the content job re-checks the same rule against the bucket
// before it renders anything.
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const REVISION = /^[0-9a-f]{40}$/;
/** The paths a content release owns; everything else is the application tree. */
export const contentPaths = ['i18n', 'data'];

export function gitIn(cwd) {
  const run = (args) => execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  return {
    hasCommit(sha) {
      try {
        run(['cat-file', '-e', `${sha}^{commit}`]);
        return true;
      } catch {
        return false;
      }
    },
    /** True when nothing outside i18n/ and data/ differs between the two commits. */
    sameAppTree(from, to) {
      try {
        run(['diff', '--quiet', from, to, '--', '.', ...contentPaths.map((p) => `:(exclude)${p}`)]);
        return true;
      } catch (e) {
        if (e.status === 1) return false;
        throw e;
      }
    },
    isAncestor(a, b) {
      try {
        run(['merge-base', '--is-ancestor', a, b]);
        return true;
      } catch (e) {
        if (e.status === 1) return false;
        throw e;
      }
    },
  };
}

/** The deployed application release named by a current.json body, or null. */
export function deployedRelease(text) {
  try {
    const current = JSON.parse(text);
    return current?.schemaVersion === 'content-current-v1' && REVISION.test(current.rendererRelease) ? current.rendererRelease : null;
  } catch {
    return null;
  }
}

export function decide({ currentText, target, git }) {
  if (!REVISION.test(target)) throw new Error('target must be a full 40-character SHA');
  const deployed = deployedRelease(currentText ?? '');
  if (!deployed) return { decision: 'app', reason: 'no deployed release could be read' };
  if (!git.hasCommit(deployed)) return { decision: 'app', reason: `deployed application release ${deployed} is not in this history` };
  if (!git.sameAppTree(deployed, target)) return { decision: 'app', reason: `application files differ from deployed release ${deployed}` };
  return { decision: 'content', reason: `only i18n/ and data/ can differ from deployed release ${deployed}` };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = (name) => {
    const i = process.argv.indexOf(name);
    return i >= 0 ? process.argv[i + 1] : undefined;
  };
  const file = arg('--current');
  const currentText = file && existsSync(file) ? readFileSync(file, 'utf8') : '';
  const { decision, reason } = decide({ currentText, target: arg('--target'), git: gitIn(process.cwd()) });
  console.log(`plan: ${decision} — ${reason}`);
  const output = arg('--output');
  if (output) appendFileSync(output, `decision=${decision}\n`);
}
