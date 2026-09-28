import {
  Card,
  Claim,
  DataTable,
  DocSection,
  Flow,
  FlowArrow,
  FlowNode,
  Grid,
  Note,
  PackageTile,
  PageHead,
  RuleRows,
  SourceStrip,
  StatTile,
} from '../../../components/architecture';
import { StatusChip } from '../../../components/ui';
import type { Locale } from '../../../i18n';
import { evidence, slots, statusOf, type PackageSlot, type PackageStatus } from '../../../slots';
import { architecturePath } from '../pages';

const statusLabels: Record<PackageStatus, string> = { released: 'Released', alpha: 'Alpha', unpublished: 'Not published' };
const registryNames: Record<PackageSlot['registry'], string> = { npm: 'npm', pypi: 'PyPI', crates: 'crates.io' };

/** `opentelemetry-sdk<2,>=1.16.0; extra == "otel"` → `opentelemetry-sdk <2,>=1.16.0`. */
function pythonExtra(requires: string[] | undefined, extra: string) {
  for (const line of requires ?? []) {
    const [spec, marker] = line.split(';').map((part) => part.trim());
    if (marker?.match(/extra == "([^"]+)"/)?.[1] !== extra) continue;
    const name = spec.match(/^[A-Za-z0-9_.-]+/)?.[0] ?? '';
    return `${name} ${spec.slice(name.length)}`;
  }
  return undefined;
}

function hostRange(slot: PackageSlot) {
  return Object.entries(slot.peers ?? {})
    .filter(([name]) => name !== '@redact-secret/core')
    .map(([name, range]) => `${name} ${range}`)
    .join(', ');
}

function meta(slot: PackageSlot, ...extra: (string | undefined)[]) {
  return [registryNames[slot.registry], slot.version, ...extra].filter(Boolean).join(' · ');
}

export function Adapters({ locale }: { locale: Locale }) {
  const p = slots.packages;
  const budgets = evidence.adapterBudgets;
  const n = (value: number) => value.toLocaleString('en-US');
  const tile = (key: string) => ({ name: p[key].name, status: statusOf(p[key]), statusLabel: statusLabels[statusOf(p[key])] });

  return (
    <>
      <PageHead
        eyebrow="05 · Adapters"
        title="The core knows what a secret is. Something has to go and get the text."
        lede={
          <>
            Six packages whose entire job is fetching and carrying. <b>They decide nothing.</b>
          </>
        }
      />

      <DocSection eyebrow="The problem it solves" title="A copied example is a fork you now own">
        <p>
          The core repository ships worked examples of wiring a logger or a tracer into the scanner. You could copy
          the file. From that moment you owned it: no version, no changelog, no notice when the host SDK's contract
          moved, and no way for the project to fix wiring it had written itself.
        </p>
        <Grid cols={2}>
          <Card>
            <h3>
              <StatusChip tone="danger">Before</StatusChip>
            </h3>
            <p>
              Copy <code>pino-redact.mjs</code> out of the examples folder. It works today.{' '}
              <b>Nobody tells you</b> when pino's next major changes the hook signature.
            </p>
          </Card>
          <Card>
            <h3>
              <StatusChip tone="success">Now</StatusChip>
            </h3>
            <p>
              <code>npm install {p['adapter-pino'].name}</code>. A declared pino range, <b>tested at both ends</b>,
              with its own changelog inside the tarball.
            </p>
          </Card>
        </Grid>
        <p>
          That is the whole reason this repository exists, and it closes the gap{' '}
          <b>without moving the wiring into the core</b>.
        </p>
      </DocSection>

      <DocSection eyebrow="Where they sit" title="Between your host and the engine">
        <Flow>
          <FlowNode title="Your host">
            A pino logger, an OpenTelemetry span, a Python log record, an MCP tool result, a model prompt.
          </FlowNode>
          <FlowArrow>the adapter carries the text in</FlowArrow>
          <Claim sub="It decides what a secret is. The adapter does not.">The Redact Secret core</Claim>
          <FlowArrow>and carries the answer back out</FlowArrow>
          <FlowNode title="The same host, sanitized">
            The log line, the span attribute or the tool result goes on to its destination with nothing secret in it.
          </FlowNode>
        </Flow>
      </DocSection>

      <DocSection eyebrow="The packages" title="Six of them, on two registries">
        <Grid cols={2}>
          <PackageTile {...tile('adapter')} meta={meta(p.adapter)}>
            The shared base everything else is built on: one primitive for masking a string, and the{' '}
            <b>bounded walker</b> that finds strings inside nested objects. Install it directly only when writing your
            own integration.
          </PackageTile>
          <PackageTile {...tile('adapter-pino')} meta={meta(p['adapter-pino'], hostRange(p['adapter-pino']))}>
            Redacts <b>by value</b>, alongside pino's own path-based <code>redact</code> rather than instead of it.
            pino cannot see a token inside a message string or an error message; this can.
          </PackageTile>
          <PackageTile {...tile('adapter-otel')} meta={meta(p['adapter-otel'], hostRange(p['adapter-otel']))}>
            Every string and string-array attribute on a span and its events, redacted before the span reaches the
            next processor. Attribute names are not allowlisted, so OpenInference and GenAI conventions are covered{' '}
            <b>without hardcoding either</b>.
          </PackageTile>
          <PackageTile {...tile('adapter-ai-context')} meta={meta(p['adapter-ai-context'])}>
            A framework-neutral boundary for AI work: user input, tool results, a constructed context and streamed
            text, sanitized before any of it reaches a model. <b>It names no model vendor, agent framework or
            transport.</b>
          </PackageTile>
          <PackageTile {...tile('adapter-mcp')} meta={meta(p['adapter-mcp'])}>
            The Model Context Protocol boundary: a tool's result, optionally its arguments, and what a client reads
            with <code>resources/read</code>. A thin specialization of the package above, adding only the MCP shape.{' '}
            <b>It imports no MCP SDK, even for types.</b>
          </PackageTile>
          <PackageTile {...tile('adapters-py')} meta={meta(p['adapters-py'], 'logging filter', '[otel] extra')}>
            Python's standard library has no value-based redaction at all. This filter adds it, and the{' '}
            <code>[otel]</code> extra covers spans.
          </PackageTile>
        </Grid>
        <p class="small">
          A masking-callback host such as Langfuse <b>needs no dedicated package</b>: the shared walker is the whole
          integration.
        </p>
        <p class="tiny">Versions and host ranges were read from the npm and PyPI registries on {slots.observedAt}.</p>
      </DocSection>

      <DocSection
        eyebrow="The design rule"
        title="When in doubt, print a marker"
        lede={
          <>
            Every adapter shares one primitive for masking a string, and that primitive{' '}
            <b>never lets an error put text on the wire.</b> These markers are public API: they are what a host sees,
            and they change only in a major version.
          </>
        }
      >
        <DataTable
          label="Adapter markers"
          head={['Marker', 'When']}
          rows={[
            [
              <span class="mono">[REDACTED:BLOCKED]</span>,
              <>
                A <code>block</code> finding. The <b>entire leaf</b> is replaced, not just the matched span.
              </>,
            ],
            [
              <span class="mono">[REDACTED:ERROR]</span>,
              "Any failure inside the core call, including an uninitialized core. Never the original text, and never the error's own message.",
            ],
            [
              <span class="mono">[REDACTED:LIMIT_EXCEEDED]</span>,
              <>
                A value past a walk budget. <b>It is never scanned, and never passed through unmasked.</b>
              </>,
            ],
            [<span class="mono">[REDACTED:CYCLE]</span>, 'A self-referencing object.'],
          ]}
        />
        <Note tone="danger">
          <p>
            <b>Read the third row twice.</b> The tempting behaviour when something is too big to scan is to let it
            through. <b>That is exactly how a secret escapes.</b> Here, unscannable means unprintable.
          </p>
        </Note>
        <h3 class="h3">The budgets</h3>
        <Grid cols={4}>
          <StatTile value={n(budgets.depth)}>max depth</StatTile>
          <StatTile value={n(budgets.arrayLength)}>max array length</StatTile>
          <StatTile value={n(budgets.objectKeys)}>max object keys</StatTile>
          <StatTile value={n(budgets.leaves)}>max total leaves</StatTile>
        </Grid>
        <p class="small">
          Plus a {n(budgets.stringChars)}-character cap per string. Elements and keys beyond a limit are{' '}
          <b>dropped, not passed through.</b> Every bound is overridable per call.
        </p>
      </DocSection>

      <DocSection eyebrow="Why it stays small" title="Four things from the core, and nothing else">
        <RuleRows
          rows={[
            { term: 'initialize()', body: 'Load the engine.' },
            { term: 'scanAndRedact()', body: 'And the shape of what it returns.' },
            { term: 'findings', body: 'As an array.' },
            {
              term: 'finding.action',
              body: (
                <>
                  Whether it is <code>block</code> or <code>warn</code>.
                </>
              ),
            },
          ]}
        />
        <p>
          That surface is what the declared compatibility range protects. Because these packages are written in
          TypeScript against the core's own exported types, a change to it{' '}
          <b>fails the build rather than degrading silently.</b>
        </p>
        <Note tone="success">
          <p>
            <b>And it buys independence.</b> The core is released in lockstep across Rust, npm, PyPI and the CLI. These
            packages are not in that lockstep: <b>a new pino release moves <code>adapter-pino</code> and nothing
            else.</b>
          </p>
        </Note>
      </DocSection>

      <DocSection
        eyebrow="What “supported” means here"
        title="A range you can check, not a guess"
        lede={
          <>
            Every published adapter states the host range it supports and runs a test against a{' '}
            <b>real instance of that host, at both ends of the declared range</b>, in CI.
          </>
        }
      >
        <DataTable
          label="Declared host range per adapter"
          head={['Adapter', 'Declared range', 'Verified by']}
          rows={[
            ['adapter-pino', <span class="mono">{hostRange(p['adapter-pino'])}</span>, 'a real pino logger writing to a captured stream'],
            [
              'adapter-otel',
              <span class="mono">{hostRange(p['adapter-otel'])}</span>,
              <>
                a real span passed through <code>onEnd</code>
              </>,
            ],
            ['Python logging', <span class="mono">CPython &gt;=3.10</span>, 'a real logger with the filter attached'],
            [
              'Python otel',
              <span class="mono">{pythonExtra(p['adapters-py'].requires, 'otel')}</span>,
              'a real span through a real tracer provider',
            ],
          ]}
        />
        <p>
          A pino major outside the declared range is <b>deliberately</b> not claimed. It may well work. It is not
          tested, so it is not claimed — <b>the same discipline the core applies to its detectors.</b>
        </p>
      </DocSection>

      <DocSection eyebrow="Being honest" title="What is not here">
        <Note tone="warning" title="Deliberately out of scope">
          <ul>
            <li>
              <b>Detection.</b> Deciding what a secret is stays in the core, always.
            </li>
            <li>
              <b>Stream adapters.</b> Node <code>Transform</code> and Web <code>TransformStream</code> ship inside the
              core itself, as <code>./node-stream</code> and <code>./web-stream</code>.
            </li>
            <li>
              <b>LangChain, and a Langfuse package.</b> A masking-callback host needs no package; the shared walker is
              the integration.
            </li>
            <li>
              <b>Restoration.</b> Adapters sanitize outbound sinks. They <b>never</b> gain the ability to put a value
              back — that belongs to a <a href={architecturePath(locale, 'vault')}>separate repository</a>, and these
              packages do not depend on it.
            </li>
          </ul>
        </Note>
      </DocSection>

      <SourceStrip label="Sources.">
        <code>README.md</code> and <code>ARCHITECTURE.md</code> in{' '}
        <code>{evidence.sources.adapters.repo.split('/')[1]}</code>
        {evidence.sources.adapters.commit && (
          <>
            {' '}
            at <code>{evidence.sources.adapters.commit}</code>
          </>
        )}
        , plus each package's own README and changelog. Versions were read from the npm and PyPI registries on{' '}
        {slots.observedAt}, not from the repository.
      </SourceStrip>
    </>
  );
}
