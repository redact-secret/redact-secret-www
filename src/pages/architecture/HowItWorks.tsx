import { Card, Claim, DocSection, Flow, FlowArrow, FlowNode, Grid, Note, PageHead, SourceStrip, StatTile } from '../../components/architecture';
import { IOBlock } from '../../components/sections/IOBlock';
import { Rich } from '../../components/ui/Rich';
import type { ArchitecturePagesCopy } from '../../content';
import { formatNumber, type Locale } from '../../i18n';
import { evidence } from '../../slots';

/** The binding each surface uses into the core, in the order of `surfaces` in the copy. */
const bindings = ['N-API addon', 'WebAssembly', 'PyO3', 'direct'];

/** 01 How it works. Words: i18n/<locale>/architecture/how-it-works.json. */
export function HowItWorks({ locale, copy }: { locale: Locale; copy: ArchitecturePagesCopy['how-it-works'] }) {
  const { matrix, coreLimits, sources, observedAt } = evidence;
  const { head, atTheBoundary: boundary, theArchitecture: arch, whatIsInTheBox: box, theComparison: cmp, beingHonest: honest } = copy;
  return (
    <>
      <PageHead eyebrow={head.eyebrow} title={head.title} lede={<Rich value={head.lede} />} />

      <DocSection
        eyebrow={boundary.eyebrow}
        title={boundary.title}
        lede={boundary.lede === null ? undefined : <Rich value={boundary.lede} />}
      >
        <IOBlock caption={boundary.ioCaption} footnote={<Rich value={boundary.ioFootnote} />} />
      </DocSection>

      <DocSection eyebrow={arch.eyebrow} title={arch.title} lede={<Rich value={arch.lede} />}>
        <Flow>
          <Grid cols={4}>
            {arch.surfaces.map((surface, i) => (
              <Card key={surface} compact center>
                <b>{surface}</b>
                <span class="tiny mono">{bindings[i]}</span>
              </Card>
            ))}
          </Grid>
          <FlowArrow />
          <Claim sub={<Rich value={arch.claimSub} />}>
            <Rich value={arch.claim} />
          </Claim>
          <FlowArrow />
          <FlowNode title={arch.nodeTitle}>
            <Rich value={arch.node} />
          </FlowNode>
        </Flow>
        <Grid cols={3}>
          <StatTile value={0}>
            <Rich value={arch.stat1} />
          </StatTile>
          <StatTile value={1}>
            <Rich value={arch.stat2} />
          </StatTile>
          <StatTile value={4}>
            <Rich value={arch.stat3} />
          </StatTile>
        </Grid>
      </DocSection>

      <DocSection eyebrow={box.eyebrow} title={box.title}>
        <Grid cols={2}>
          {box.cards.map((card, i) => (
            <Card key={i}>
              <h3>
                <Rich value={card.title} />
              </h3>
              <p>
                <Rich
                  value={card.body}
                  vars={{
                    structural: evidence.detectors.structural,
                    inputMiB: coreLimits.inputMiB,
                    findings: formatNumber(locale, coreLimits.findings),
                  }}
                />
              </p>
            </Card>
          ))}
        </Grid>
      </DocSection>

      <DocSection eyebrow={cmp.eyebrow} title={cmp.title} lede={<Rich value={cmp.lede} />}>
        <Flow>
          <FlowNode title={cmp.nodeTitle1}>
            <Rich value={cmp.node1} />
          </FlowNode>
          <FlowArrow />
          <FlowNode title={cmp.nodeTitle2} marked>
            <Rich value={cmp.node2} />
          </FlowNode>
        </Flow>
        <p class="small">
          <Rich value={cmp.p} />
        </p>
      </DocSection>

      <DocSection eyebrow={honest.eyebrow} title={honest.title}>
        <Note tone="warning" title={honest.limitsTitle}>
          <ul>
            {honest.items.map((item, i) => (
              <li key={i}>
                <Rich value={item} vars={{ families: matrix.families }} />
              </li>
            ))}
          </ul>
        </Note>
        <Note tone="danger" title={honest.ruleTitle}>
          <p>
            <Rich value={honest.rule} />
          </p>
        </Note>
      </DocSection>

      <SourceStrip label={copy.sources.label}>
        <Rich value={copy.sources.body} vars={{ observedAt, coreCommit: sources.core.commit, release: sources.core.release }} />
      </SourceStrip>
    </>
  );
}
