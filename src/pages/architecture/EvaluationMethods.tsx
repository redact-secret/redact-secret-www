import {
  Card,
  Claim,
  DocSection,
  Grid,
  MethodBlock,
  Note,
  PageHead,
  Phase,
  RichCode,
  RuleRows,
  SourceStrip,
  SpanLattice,
} from '../../components/architecture';
import { StatusChip } from '../../components/ui';
import { Rich } from '../../components/ui/Rich';
import type { ArchitecturePagesCopy } from '../../content';
import type { Locale } from '../../i18n';
import { evidence } from '../../slots';

// The grading lattice is the benchmark's mechanism: each verdict's byte
// pattern over an eight-byte example, and whether it passes.
const lattice = [
  { code: 'Exact', pass: true, cells: ['none', 'none', 'hit', 'hit', 'hit', 'hit', 'none', 'none'] },
  { code: 'Covered', pass: true, cells: ['none', 'over', 'hit', 'hit', 'hit', 'hit', 'over', 'none'] },
  { code: 'Overbroad', pass: false, cells: ['over', 'over', 'hit', 'hit', 'hit', 'hit', 'over', 'over'] },
  { code: 'Partial', pass: false, cells: ['none', 'none', 'hit', 'hit', 'hit', 'leak', 'none', 'none'] },
  { code: 'Miss', pass: false, cells: ['none', 'none', 'leak', 'leak', 'leak', 'leak', 'none', 'none'] },
] as const;

/** The four phases and, in each, the methods (by number) it runs — reading order, not numeric order. */
const phases = [['01'], ['02', '06'], ['03', '04', '05', '07'], ['08', '09', '10']];

const escapeTones = ['success', 'danger', 'none'] as const;
const buysTones = ['success', 'none'] as const;

/** 04 Evaluation methods. Words: i18n/<locale>/architecture/evaluation-methods.json. */
export function EvaluationMethods({ copy }: { locale: Locale; copy: ArchitecturePagesCopy['evaluation-methods'] }) {
  const { sources } = evidence;
  const { head, theRule: rule, howAResultIsGraded: graded, theTenMethods: ten, theEscapeHatch: hatch, whatItAllBuys: buys } = copy;
  return (
    <>
      <PageHead eyebrow={head.eyebrow} title={head.title} lede={<Rich value={head.lede} />} />

      <DocSection eyebrow={rule.eyebrow} title={rule.title} lede={<Rich value={rule.lede} />}>
        <RuleRows rows={rule.rows.map((r) => ({ term: r.term, body: <Rich value={r.body} /> }))} />
        <p class="small">
          <Rich value={rule.p} />
        </p>
      </DocSection>

      <DocSection eyebrow={graded.eyebrow} title={graded.title} lede={<Rich value={graded.lede} />}>
        <SpanLattice
          passLabel={graded.passLabel}
          failLabel={graded.failLabel}
          legend={{ hit: graded.hit, leak: graded.leak, over: graded.over }}
          rows={lattice.map((row, i) => ({ ...row, cells: [...row.cells], description: graded.rows[i].description }))}
        />
        <Claim sub={<Rich value={graded.claimSub} />}>
          <Rich value={graded.claim} />
        </Claim>
      </DocSection>

      <DocSection eyebrow={ten.eyebrow} title={ten.title} lede={<Rich value={ten.lede} />}>
        {phases.map((methods, p) => (
          <>
            <Phase title={ten.phases[p].title}>
              <Rich value={ten.phases[p].body} />
            </Phase>
            {methods.map((n) => {
              const m = ten.methods[Number(n) - 1];
              return (
                <MethodBlock
                  n={n}
                  title={m.title}
                  ask={m.ask}
                  gist={<Rich value={m.gist} vars={{ baseline: evidence.baseline }} />}
                >
                  {m.sample && (
                    <RichCode label={m.sampleLabel}>
                      <Rich value={m.sample} />
                    </RichCode>
                  )}
                </MethodBlock>
              );
            })}
          </>
        ))}
      </DocSection>

      <DocSection eyebrow={hatch.eyebrow} title={hatch.title} lede={<Rich value={hatch.lede} />}>
        <Grid cols={3}>
          {hatch.cards.map((card, i) => (
            <Card key={i}>
              <h3>
                <StatusChip tone={escapeTones[i]}>
                  <Rich value={card.chip} />
                </StatusChip>
              </h3>
              <p>
                <Rich value={card.body} />
              </p>
            </Card>
          ))}
        </Grid>
        <p>
          <Rich value={hatch.p} />
        </p>
        <Note>
          <p>
            <Rich value={hatch.note} />
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow={buys.eyebrow} title={buys.title}>
        <Grid cols={2}>
          {buys.cards.map((card, i) => (
            <Card key={i}>
              <h3>
                <StatusChip tone={buysTones[i]}>
                  <Rich value={card.chip} />
                </StatusChip>
              </h3>
              <p>
                <Rich value={card.body} />
              </p>
            </Card>
          ))}
        </Grid>
        <p class="small">
          <Rich value={buys.p} />
        </p>
      </DocSection>

      <SourceStrip label={copy.sources.label}>
        <Rich value={copy.sources.body} vars={{ benchmarksCommit: sources.benchmarks.commit, observedAt: evidence.observedAt }} />
      </SourceStrip>
    </>
  );
}
