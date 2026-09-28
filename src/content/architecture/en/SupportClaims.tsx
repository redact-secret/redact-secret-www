import {
  Card,
  Chips,
  Claim,
  DocSection,
  FileGrid,
  Flow,
  FlowArrow,
  FlowNode,
  Grid,
  Note,
  PageHead,
  PinPair,
  RichCode,
  Dim,
  Flag,
  SourceStrip,
  StatusBar,
} from '../../../components/architecture';
import { StatusChip } from '../../../components/ui';
import type { Locale } from '../../../i18n';
import { evidence } from '../../../slots';

const { matrix, taxonomy, staleProse, sources, measurement } = evidence;

/** `2026-09-21` → `September 21`. */
function monthDay(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
}

const githubTokens = [
  { prefix: 'ghp_', desc: 'Classic personal access token' },
  { prefix: 'gho_', desc: 'OAuth access token' },
  { prefix: 'ghu_', desc: 'App user-to-server' },
  { prefix: 'ghs_', desc: 'App server-to-server' },
  { prefix: 'ghr_', desc: 'OAuth refresh token' },
  { prefix: 'github_pat_', desc: 'Fine-grained PAT, now its own detector' },
];

export function SupportClaims(_props: { locale: Locale }) {
  return (
    <>
      <PageHead
        eyebrow="03 · How a support claim is built"
        title="GitHub issues six kinds of token. Which ones do you catch?"
        lede="Answering that honestly is the entire job of this structure."
      />

      <DocSection
        eyebrow="The problem"
        title="A detector name is the wrong unit"
        lede={
          <>
            The detector called <code>github-token</code> matches <code>ghp_ | gho_ | ghu_ | ghs_ | ghr_</code>, five
            shapes. GitHub issues six. For a long time the sixth was simply not covered,{' '}
            <b>and no rule list would have told you.</b>
          </>
        }
      >
        <Grid cols={3}>
          {githubTokens.map((t) => (
            <Card key={t.prefix} compact>
              <b class="mono">{t.prefix}</b>
              <span class="tiny">{t.desc}</span>
            </Card>
          ))}
        </Grid>
        <Claim sub="One file fixes that list, independently of what the code happens to catch.">
          The unit of a support claim is not “a detector we wrote” but “a credential a provider actually issues”.
        </Claim>
        <Note tone="success" title="And it worked">
          <p>
            The sixth family sat in the taxonomy as a <b>published gap</b>, with a note naming the issue that found it.
            It now has a detector of its own, <code>github-fine-grained-pat</code>, and all six are covered.{' '}
            <b>The gap closed because it was visible</b>, which is the argument for the whole design.
          </p>
        </Note>
      </DocSection>

      <DocSection
        eyebrow="The three inputs"
        title="Three files, three different questions"
        lede={
          <>
            They are kept apart on purpose: <b>each one can be wrong on its own</b>, and each is written by a different
            process.
          </>
        }
      >
        <FileGrid
          files={[
            {
              name: 'benchmarks/detectors.json',
              question: 'What code did we ship?',
              facts: [
                { term: 'Written by', desc: "A generator, from the core's detector registry." },
                { term: 'Pinned to', desc: 'One exact commit: the build the measurement ran against.' },
                { term: 'Holds', desc: 'A flat list of detector ids and titles. Nothing about quality.' },
              ],
            },
            {
              name: 'benchmarks/support/taxonomy.json',
              question: 'What does the world issue?',
              facts: [
                { term: 'Written by', desc: 'People, by hand, with a source link or a written note for every entry.' },
                { term: 'Pinned to', desc: 'Nothing. It describes providers, not our code.' },
                { term: 'Holds', desc: 'Every credential family, whether or not we detect it.' },
              ],
            },
            {
              name: 'results-output/support-status.json',
              question: 'How well did each one do?',
              facts: [
                { term: 'Written by', desc: 'Running the benchmark corpus. Measurement, not opinion.' },
                { term: 'Pinned to', desc: 'A manifest of corpus hashes plus the version measured.' },
                {
                  term: 'Holds',
                  desc: (
                    <>
                      A verdict per <em>detector</em>: status, evidence tier, and why.
                    </>
                  ),
                },
              ],
            },
          ]}
        />
        <Note>
          <p>
            <b>Note what is missing from all three:</b> none of them contains a support claim. The claim only exists
            after they are joined, which means <b>nobody can write one by hand.</b>
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow="The join" title="Measurement lands on detectors. Claims land on families.">
        <Flow>
          <Grid cols={3}>
            <Card compact center>
              <b class="mono">detectors.json</b>
              <span class="tiny">the code that exists</span>
            </Card>
            <Card compact center>
              <b class="mono">taxonomy.json</b>
              <span class="tiny">the world's credentials</span>
            </Card>
            <Card compact center>
              <b class="mono">support-status.json</b>
              <span class="tiny">how each detector measured</span>
            </Card>
          </Grid>
          <FlowArrow />
          <FlowNode title="Broadcast, never re-derive">
            Each detector's verdict is copied, <b>word for word</b>, onto every family that detector serves. One GitHub
            detector's result lands on five families. Stripe's lands on four. The join adds no judgement of its own.
          </FlowNode>
          <FlowArrow />
          <FlowNode title="support-matrix.json" marked>
            One row per credential family. {matrix.families} of them in the copy this product ships.
          </FlowNode>
          <FlowArrow />
          <FlowNode
            title={
              <>
                <code>docs/support-matrix.md</code> and the README table
              </>
            }
          >
            Both generated. <code>npm run ci</code> fails if either drifts from the JSON.
          </FlowNode>
        </Flow>
        <p class="small">
          The one-way direction matters: the matrix reads the taxonomy, and never the reverse. A rule in the code
          review makes it explicit — <b>variant support must not be inferred from a related family name.</b> Sharing a
          prefix with a supported token is not evidence.
        </p>
      </DocSection>

      <DocSection
        eyebrow="The clever part"
        title="A family with no detector is still a row"
        lede={
          <>
            In the taxonomy, a credential nobody wrote a detector for has an empty list: <code>"detectors": []</code>.
            That is not a blank, it is <b>the instruction that produces an unsupported row</b> in the published table.
            It is also a worklist: GitHub's sixth token started here.
          </>
        }
      >
        <Grid cols={2}>
          <Card>
            <h3>
              <StatusChip tone="danger">Usual</StatusChip>
            </h3>
            <p>
              Ship a rule list. A credential nobody wrote a rule for simply is not mentioned.{' '}
              <b>You cannot tell “we checked and do not catch it” apart from “we never thought about it”.</b>
            </p>
          </Card>
          <Card>
            <h3>
              <StatusChip tone="success">Here</StatusChip>
            </h3>
            <p>
              Names the gap in the same table as the wins, with the reason attached. {taxonomy.withoutDetector}{' '}
              families have no detector today, <b>and every one of them is published.</b>
            </p>
          </Card>
        </Grid>
        <p>
          And a test enforces it: a zero-detector family <em>must</em> carry a source link or a written note. An
          unsupported claim with no reason fails the build; the spec calls that <b>a bug in the taxonomy</b>, not a
          fact about the provider.
        </p>
        <RichCode label="An unsupported row">
          <Dim>// a real unsupported row</Dim>
          {'\n"provider": "atlassian",\n"status": "unsupported",\n"detectors": [],\n"reason": '}
          <Dim>
            {
              '"the pinned third-party detector targets the distinct ATCT\n  access-token family, not the ATAT-prefixed API-token shape."'
            }
          </Dim>
        </RichCode>
      </DocSection>

      <DocSection
        eyebrow="Not every lookalike counts"
        title="Some things are left out on purpose"
        lede={
          <>
            If anything key-shaped became a family, unsupported would fill with <b>things that were never secrets</b>.
            So a few are excluded by name, with the reason recorded.
          </>
        }
      >
        <Chips
          label="Shapes excluded by name"
          struck
          items={['AWS AIDA…', 'Twilio Account SID', 'Twilio API Key SID', 'Stripe pk_…', 'Supabase sb_publishable_…']}
        />
        <Grid cols={2}>
          <Card>
            <h3>Identifiers, not secrets</h3>
            <p>
              An AWS <code>AIDA</code> value names an IAM user. A Twilio SID identifies an account: it gates detection
              of the token beside it, but leaking it is not a leak.
            </p>
          </Card>
          <Card>
            <h3>Documented as public</h3>
            <p>
              Stripe's publishable key and Supabase's publishable key are both meant to ship in browser code.{' '}
              <b>Their own vendors say so.</b>
            </p>
          </Card>
        </Grid>
        <p class="small">
          The payoff: <b>unsupported</b> means “a real credential this project does not catch”, never “a string that
          resembles our patterns”.
        </p>
      </DocSection>

      <DocSection
        eyebrow="What a row says"
        title="Provisional is arithmetic, not a feeling"
        lede={
          <>
            When a family falls short, the row carries <b>the exact gates it missed</b>, with the numbers.
          </>
        }
      >
        <RichCode label="A provisional row">
          <Dim>// a real provisional row</Dim>
          {
            '\n"provider": "anthropic",\n"status": "provisional",  "evidenceTier": "T1",\n"evidenceBasis": "provider-documented",\n"reason":\n  documented.minimumPositiveCases:   '
          }
          <Flag>5 &lt; 6</Flag>
          {'\n  documented.minimumPositiveAxes:    '}
          <Flag>2 &lt; 4</Flag>
          {'\n  documented.minimumBenignCases:     '}
          <Flag>5 &lt; 8</Flag>
          {'\n  documented.minimumControlAxes:     '}
          <Flag>3 &lt; 4</Flag>
        </RichCode>
        <p>
          That family's token format is provider-documented, the best evidence tier there is. It was still only
          provisional, because the fixture coverage behind it was one positive case and three benign controls short.{' '}
          <b>Nobody can argue with that; somebody can go and write four fixtures.</b> Most of the matrix has since done
          exactly that.
        </p>
      </DocSection>

      <DocSection eyebrow="Status distribution" title={`The shipped matrix, ${matrix.families} rows`}>
        <StatusBar
          label={`Status of the ${matrix.families} rows in the shipped matrix`}
          segments={[
            { tone: 'success', count: matrix.status.stable, word: 'Stable', desc: 'clears the bar; safe to rely on' },
            {
              tone: 'danger',
              count: matrix.status.unsupported,
              word: 'Unsupported',
              desc: 'published anyway, with the reason',
            },
            {
              tone: 'warning',
              count: matrix.status.provisional,
              word: 'Provisional',
              desc: 'useful, but the evidence is incomplete',
            },
            {
              tone: 'info',
              count: matrix.status.pending,
              word: 'Pending',
              desc: 'neither a detection nor a miss can be trusted yet',
            },
          ]}
        />
        <p class="small">
          The {matrix.status.stable} stable rows are counted in two separate streams —{' '}
          <b>{matrix.stableBasis.documented}</b> rest on a contract the provider published, and{' '}
          <b>{matrix.stableBasis.empirical}</b> were earned by measurement alone because no vendor documentation exists.
          Evidence tiers are graded again on their own axis (T1 {matrix.tiers.T1}, T2 {matrix.tiers.T2}, T3{' '}
          {matrix.tiers.T3}, T0 {matrix.tiers.T0}). <b>Qualifying empirically never promotes T2 evidence to T1.</b>
        </p>
      </DocSection>

      <DocSection eyebrow="Counting carefully" title="Two numbers that disagree mean the pin is working">
        <PinPair
          live={{
            label: 'Live taxonomy',
            value: taxonomy.families,
            note: `Families across ${taxonomy.providers} providers. The benchmarks repository keeps moving.`,
          }}
          pinned={{
            label: 'Matrix this product ships',
            value: matrix.families,
            note: 'A frozen copy. It changes only when someone re-runs the measurement and re-pins.',
          }}
        />
        <p>
          One release ago they matched exactly.{' '}
          <b>A gap between them is never an error; it is the pin telling you how old the evidence is.</b> The page keeps
          the two side by side instead of merging them into one.
        </p>
        <p>
          The same goes for versions.{' '}
          {measurement.measured ? (
            <>
              The shipped matrix was measured on <code>{measurement.measured}</code>
            </>
          ) : (
            <>The shipped matrix does not record which version it measured</>
          )}{' '}
          (benchmarks at <code>{measurement.benchmarks}</code>); the current release is{' '}
          <code>{measurement.released}</code>, and its drift gate{' '}
          {measurement.gated ? 'ran against exactly this matrix' : 'has not run against this matrix'}. Both come from
          the product's site feed at <code>{measurement.commit}</code>, read on {measurement.observedAt}.
        </p>
        <Note tone="warning" title="The third number to distrust">
          <p>
            The spec's own prose still says{' '}
            <em>
              {staleProse.families} families across {staleProse.providers} providers
            </em>
            , dated {monthDay(staleProse.dated)}. <b>It has been wrong through three releases.</b> The spec preempts
            this by naming <code>taxonomy.json</code> as the source of truth over its own paragraph.
          </p>
          <p>
            <b>The general rule:</b> prose goes stale, generated files do not. Every count that matters is computed, and
            CI fails when the written copy drifts from the computed one — which is exactly why the paragraph nobody
            generates is the one still carrying the old numbers.
          </p>
        </Note>
      </DocSection>

      <SourceStrip label="Sources.">
        <code>docs/specs/taxonomy.md</code>, <code>benchmarks/support/taxonomy.json</code>,{' '}
        <code>benchmarks/detectors.json</code> and <code>benchmarks/support/matrix.ts</code> in the benchmarks repository
        at <code>{sources.benchmarks.commit}</code>; the shipped matrix and pin manifest from the product repository at{' '}
        <code>{sources.core.commit}</code>, read on {evidence.observedAt}. Counts were computed from the JSON, not copied
        from prose.
      </SourceStrip>
    </>
  );
}
