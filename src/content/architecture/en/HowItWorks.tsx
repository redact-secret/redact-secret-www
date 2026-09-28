import { Card, Claim, DocSection, Flow, FlowArrow, FlowNode, Grid, Note, PageHead, SourceStrip, StatTile } from '../../../components/architecture';
import { IOBlock } from '../../../components/sections/IOBlock';
import { StatusChip } from '../../../components/ui';
import type { Locale } from '../../../i18n';
import { evidence } from '../../../slots';
import { urls } from '../../shared';
import { architecturePath } from '../pages';

export function HowItWorks({ locale }: { locale: Locale }) {
  const { matrix, coreLimits, sources, observedAt } = evidence;
  return (
    <>
      <PageHead
        eyebrow="01 · How it works"
        title="It finds passwords in text, and crosses them out."
        lede="That is the whole thing. Everything below is about doing it carefully."
      />

      <DocSection
        eyebrow="At the boundary"
        title="Text in, the same text out"
        lede={
          <>
            Secrets are allowed on <b>one road only</b>: from your credential manager, through a vault, to the provider.
            Redact Secret is a filter you install on every other road. Text goes in, the same text comes out, minus
            anything that looked like a credential.
          </>
        }
      >
        <IOBlock
          caption="Input and output"
          footnote={
            <>
              <b>The placeholder is a label, not a code.</b> Nothing turns it back into the key. If you need the original
              back, that is the <a href={architecturePath(locale, 'vault')}>vault</a>'s job: a separate repository, and
              something you have to reach for on purpose.
            </>
          }
        />
      </DocSection>

      <DocSection
        eyebrow="The architecture"
        title="One brain, four mouths"
        lede={
          <>
            The hard thinking happens once, in Rust. Every language gets a <b>translator</b>, not its own copy of the
            rules.
          </>
        }
      >
        <Flow>
          <Grid cols={4}>
            {[
              ['JS / Node', 'N-API addon'],
              ['Browser', 'WebAssembly'],
              ['Python', 'PyO3'],
              ['CLI', 'direct'],
            ].map(([surface, binding]) => (
              <Card key={surface} compact center>
                <b>{surface}</b>
                <span class="tiny mono">{binding}</span>
              </Card>
            ))}
          </Grid>
          <FlowArrow />
          <Claim sub={<code>detect → resolve → policy → redact</code>}>The Rust core</Claim>
          <FlowArrow />
          <FlowNode title="Safe text and safe notes">
            The notes say <em>where</em> a secret was and <em>what kind</em>. They never contain the secret.
          </FlowNode>
        </Flow>
        <Grid cols={3}>
          <StatTile value={0}>
            network calls, file reads, env lookups or telemetry inside the core. Same input, same output, always.
          </StatTile>
          <StatTile value={1}>shared test corpus every language must pass identically, down to the character offsets.</StatTile>
          <StatTile value={4}>pipeline stages. Detection never doubles as policy, and policy never doubles as detection.</StatTile>
        </Grid>
      </DocSection>

      <DocSection eyebrow="What is in the box" title="The feature set">
        <Grid cols={2}>
          <Card>
            <h3>Two sizes</h3>
            <p>
              <b>Full</b> knows every provider. <b>Common</b> keeps only the {evidence.detectors.structural} structural
              detectors, for browsers and small agents: smaller, faster, and it adds no false alarms.{' '}
              <a href={urls.benchmarks}>The measurements are on the benchmarks site.</a>
            </p>
          </Card>
          <Card>
            <h3>Runs in the browser</h3>
            <p>
              The same engine compiles to WebAssembly, so a key can be caught before it leaves the laptop. Cloudflare
              Workers is supported.
            </p>
          </Card>
          <Card>
            <h3>A CLI for CI</h3>
            <p>
              <code>redact-secret</code> checks files or a staged diff. Exit <code>0</code> clean, <code>1</code> found,{' '}
              <code>2</code> broken, and <b>broken always outranks found</b>.
            </p>
          </Card>
          <Card>
            <h3>Fails closed</h3>
            <p>
              {coreLimits.inputMiB} MiB and {coreLimits.findings.toLocaleString('en-US')} findings by default. Past
              either, you get an error, never a <b>quietly truncated clean result</b>.
            </p>
          </Card>
          <Card>
            <h3>Errors say nothing</h3>
            <p>
              Every error message is fixed text with no input in it. Your crash reports cannot leak what your scanner just
              caught.
            </p>
          </Card>
          <Card>
            <h3>Bring your own key format</h3>
            <p>
              Declare an in-house credential as a <b>ruleset</b>: plain text the core parses and matches itself, never a
              callback. The grammar is on the <a href={architecturePath(locale, 'detection')}>detection page</a>.
            </p>
          </Card>
          <Card>
            <h3>Real logging and tracing packages</h3>
            <p>
              pino, Python <code>logging</code> and an OpenTelemetry span processor ship as versioned adapters from{' '}
              <a href={architecturePath(locale, 'adapters')}>their own repository</a>.
            </p>
          </Card>
          <Card>
            <h3>Personal data, opt in</h3>
            <p>
              Email, IBAN, payment card, phone, network address and US SSN families. <b>Off by default on every
              surface.</b>
            </p>
          </Card>
        </Grid>
      </DocSection>

      <DocSection
        eyebrow="The comparison"
        title="Most secret scanners guard a different door"
        lede={
          <>
            Gitleaks, TruffleHog, detect-secrets and GitGuardian watch <b>your code</b>: did a developer commit a key?
            Redact Secret watches <b>your traffic</b>, at the moment text is about to be logged, stored, or handed to a
            model.
          </>
        }
      >
        <Flow>
          <FlowNode title="Code → commit → CI">
            Gitleaks, TruffleHog, detect-secrets, GitGuardian. Scans files and git history, before anything ships.
          </FlowNode>
          <FlowArrow />
          <FlowNode title="Running app → text in motion" marked>
            <b>Redact Secret.</b> Scans what your users, tools and models are saying, right now, in process.
          </FlowNode>
        </Flow>
        <p class="small">
          They are not rivals. Run a repository scanner in CI <em>and</em> this in your request path.
        </p>
      </DocSection>

      <DocSection eyebrow="Being honest" title="What it is not">
        <Note tone="warning" title="Pick a repository scanner instead if you need these">
          <ul>
            <li>
              <b>Breadth.</b> {matrix.families} credential families against Gitleaks' several hundred rules. Precision
              was chosen over recall, deliberately.
            </li>
            <li>
              <b>Verification.</b> It never asks a provider whether a key is live, so it cannot tell you a match is
              definitely real.
            </li>
            <li>
              <b>Git history.</b> No commit archaeology, no repository crawling, no baseline files.
            </li>
            <li>
              <b>A DLP platform.</b> There is no policy console, no quarantine and no hosted service.
            </li>
            <li>
              <b>Proven PII.</b> The personal-data families are off by default and every one of them is{' '}
              <StatusChip tone="none">Pending</StatusChip> — availability is not a support claim.
            </li>
          </ul>
        </Note>
        <Note tone="danger" title="The rule it repeats loudest">
          <p>
            <b>Browser scanning is a courtesy; server scanning is the actual boundary.</b> Old clients, modified clients,
            curl, agents and SDKs all skip your nice front end. Scan again where it counts.
          </p>
        </Note>
      </DocSection>

      <SourceStrip label="Sources.">
        Architecture, pipeline, profiles and limits from <code>README.md</code> and <code>ARCHITECTURE.md</code>; family
        counts and statuses from the generated <code>docs/support-matrix.md</code>; versions from{' '}
        <code>docs/releases/status.md</code>. Checked on {observedAt} against <code>main</code> at{' '}
        <code>{sources.core.commit}</code>, <code>{sources.core.release}</code>.
      </SourceStrip>
    </>
  );
}
