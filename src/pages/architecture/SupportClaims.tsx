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
  SourceStrip,
  StatusBar,
} from '../../components/architecture';
import { StatusChip } from '../../components/ui';
import { plainText, Rich } from '../../components/ui/Rich';
import type { ArchitecturePagesCopy } from '../../content';
import type { Locale } from '../../i18n';
import { evidence } from '../../slots';

const { matrix, taxonomy, staleProse, sources, measurement } = evidence;

/** `2026-09-21` → `September 21` / `9월 21일`. */
const monthDay: Record<Locale, (date: string) => string> = {
  en: (date) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }),
  ko: (date) => {
    const [, m, d] = date.split('-');
    return `${Number(m)}월 ${Number(d)}일`;
  },
};

// GitHub's token prefixes, the three input files and the families the
// taxonomy excludes are identifiers, not copy; the words beside them are.
const githubPrefixes = ['ghp_', 'gho_', 'ghu_', 'ghs_', 'ghr_', 'github_pat_'];
const inputFiles = ['benchmarks/detectors.json', 'benchmarks/support/taxonomy.json', 'results-output/support-status.json'];
const joinFiles = ['detectors.json', 'taxonomy.json', 'support-status.json'];
const lookalikes = ['AWS AIDA…', 'Twilio Account SID', 'Twilio API Key SID', 'Stripe pk_…', 'Supabase sb_publishable_…'];
const cleverTones = ['danger', 'success'] as const;

/** 03 How a support claim is built. Words: i18n/<locale>/architecture/support-claims.json. */
export function SupportClaims({ locale, copy }: { locale: Locale; copy: ArchitecturePagesCopy['support-claims'] }) {
  const { head, theProblem: problem, theThreeInputs: inputs, theJoin: join, theCleverPart: clever } = copy;
  const { notEveryLookalikeCounts: lookalike, whatARowSays: row, statusDistribution: dist, countingCarefully: counting } = copy;
  const { measuredOn, measuredUnknown, gated, notGated } = counting;
  return (
    <>
      <PageHead eyebrow={head.eyebrow} title={head.title} lede={<Rich value={head.lede} />} />

      <DocSection eyebrow={problem.eyebrow} title={problem.title} lede={<Rich value={problem.lede} />}>
        <Grid cols={3}>
          {githubPrefixes.map((prefix, i) => (
            <Card key={prefix} compact>
              <b class="mono">{prefix}</b>
              <span class="tiny">{problem.tokens[i]}</span>
            </Card>
          ))}
        </Grid>
        <Claim sub={problem.claimSub}>
          <Rich value={problem.claim} />
        </Claim>
        <Note tone="success" title={problem.noteTitle}>
          <p>
            <Rich value={problem.p} />
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow={inputs.eyebrow} title={inputs.title} lede={<Rich value={inputs.lede} />}>
        <FileGrid
          files={inputs.files.map((file, i) => ({
            name: inputFiles[i],
            question: file.question,
            facts: file.facts.map((fact) => ({ term: fact.term, desc: <Rich value={fact.desc} /> })),
          }))}
        />
        <Note>
          <p>
            <Rich value={inputs.p} />
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow={join.eyebrow} title={join.title}>
        <Flow>
          <Grid cols={3}>
            {joinFiles.map((file, i) => (
              <Card key={file} compact center>
                <b class="mono">{file}</b>
                <span class="tiny">
                  <Rich value={join.files[i]} />
                </span>
              </Card>
            ))}
          </Grid>
          <FlowArrow />
          <FlowNode title={join.nodeTitle1}>
            <Rich value={join.node1} />
          </FlowNode>
          <FlowArrow />
          <FlowNode title={join.nodeTitle2} marked>
            <Rich value={join.node2} vars={{ families: matrix.families }} />
          </FlowNode>
          <FlowArrow />
          <FlowNode title={<Rich value={join.nodeTitle3} />}>
            <Rich value={join.node3} />
          </FlowNode>
        </Flow>
        <p class="small">
          <Rich value={join.p} />
        </p>
      </DocSection>

      <DocSection eyebrow={clever.eyebrow} title={clever.title} lede={<Rich value={clever.lede} />}>
        <Grid cols={2}>
          {clever.cards.map((card, i) => (
            <Card key={i}>
              <h3>
                <StatusChip tone={cleverTones[i]}>
                  <Rich value={card.chip} />
                </StatusChip>
              </h3>
              <p>
                <Rich value={card.body} vars={{ withoutDetector: taxonomy.withoutDetector }} />
              </p>
            </Card>
          ))}
        </Grid>
        <p>
          <Rich value={clever.p} />
        </p>
        <RichCode label={clever.codeLabel}>
          <Rich value={clever.code} />
        </RichCode>
      </DocSection>

      <DocSection eyebrow={lookalike.eyebrow} title={lookalike.title} lede={<Rich value={lookalike.lede} />}>
        <Chips label={lookalike.chipsLabel} struck items={lookalikes} />
        <Grid cols={2}>
          {lookalike.cards.map((card, i) => (
            <Card key={i}>
              <h3>
                <Rich value={card.title} />
              </h3>
              <p>
                <Rich value={card.body} />
              </p>
            </Card>
          ))}
        </Grid>
        <p class="small">
          <Rich value={lookalike.p} />
        </p>
      </DocSection>

      <DocSection eyebrow={row.eyebrow} title={row.title} lede={<Rich value={row.lede} />}>
        <RichCode label={row.codeLabel}>
          <Rich value={row.code} />
        </RichCode>
        <p>
          <Rich value={row.p} />
        </p>
      </DocSection>

      <DocSection eyebrow={dist.eyebrow} title={<Rich value={dist.title} vars={{ families: matrix.families }} />}>
        <StatusBar
          label={plainText(dist.statusBarLabel, { families: matrix.families })}
          segments={(
            [
              ['success', matrix.status.stable, 'Stable'],
              ['danger', matrix.status.unsupported, 'Unsupported'],
              ['warning', matrix.status.provisional, 'Provisional'],
              ['info', matrix.status.pending, 'Pending'],
            ] as const
          ).map(([tone, count, word], i) => ({ tone, count, word, desc: <Rich value={dist.segments[i].desc} /> }))}
        />
        <p class="small">
          <Rich
            value={dist.p}
            vars={{
              stable: matrix.status.stable,
              documented: matrix.stableBasis.documented,
              empirical: matrix.stableBasis.empirical,
              T1: matrix.tiers.T1,
              T2: matrix.tiers.T2,
              T3: matrix.tiers.T3,
              T0: matrix.tiers.T0,
            }}
          />
        </p>
      </DocSection>

      <DocSection eyebrow={counting.eyebrow} title={counting.title}>
        <PinPair
          live={{
            label: counting.liveLabel,
            value: taxonomy.families,
            note: <Rich value={counting.liveNote} vars={{ providers: taxonomy.providers }} />,
          }}
          pinned={{ label: counting.pinnedLabel, value: matrix.families, note: <Rich value={counting.pinnedNote} /> }}
        />
        <p>
          <Rich value={counting.gap} />
        </p>
        <p>
          <Rich
            value={counting.versions}
            vars={{
              measured: measurement.measured ? (
                <Rich value={measuredOn} vars={{ measured: measurement.measured }} />
              ) : (
                <Rich value={measuredUnknown} />
              ),
              benchmarks: measurement.benchmarks,
              released: measurement.released,
              gate: measurement.gated ? gated : notGated,
              commit: measurement.commit,
              observedAt: measurement.observedAt,
            }}
          />
        </p>
        <Note tone="warning" title={counting.noteTitle}>
          <p>
            <Rich
              value={counting.staleProse}
              vars={{ families: staleProse.families, providers: staleProse.providers, dated: monthDay[locale](staleProse.dated) }}
            />
          </p>
          <p>
            <Rich value={counting.staleProseNote} />
          </p>
        </Note>
      </DocSection>

      <SourceStrip label={copy.sources.label}>
        <Rich
          value={copy.sources.body}
          vars={{ benchmarksCommit: sources.benchmarks.commit, coreCommit: sources.core.commit, observedAt: evidence.observedAt }}
        />
      </SourceStrip>
    </>
  );
}
