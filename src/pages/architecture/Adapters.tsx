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
} from '../../components/architecture';
import { StatusChip } from '../../components/ui';
import { Rich } from '../../components/ui/Rich';
import type { ArchitecturePagesCopy } from '../../content';
import { formatNumber, type Locale } from '../../i18n';
import { evidence, slots, statusOf, type PackageSlot } from '../../slots';

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

// Identifiers, not copy: the markers are public API, the four core calls are
// its names, and the ranges come from the release record.
const markers = ['[REDACTED:BLOCKED]', '[REDACTED:ERROR]', '[REDACTED:LIMIT_EXCEEDED]', '[REDACTED:CYCLE]'];
const coreSurface = ['initialize()', 'scanAndRedact()', 'findings', 'finding.action'];
const problemTones = ['danger', 'success'] as const;

/** 05 Adapters. Words: i18n/<locale>/architecture/adapters.json. */
export function Adapters({ locale, copy }: { locale: Locale; copy: ArchitecturePagesCopy['adapters'] }) {
  const p = slots.packages;
  const budgets = evidence.adapterBudgets;
  const n = (value: number) => formatNumber(locale, value);
  const tile = (key: string) => ({ name: p[key].name, status: statusOf(p[key]), statusLabel: copy.statusLabels[statusOf(p[key])] });
  const { head, theProblemItSolves: problem, whereTheySit: where, thePackages: pkgs, theDesignRule: rule } = copy;
  const { whyItStaysSmall: small, whatSupportedMeansHere: ranges, beingHonest: honest, sources } = copy;
  // Read up front: the commit clause is shown only for a repository source.
  const { atCommit } = sources;
  const tiles: [string, string][] = [
    ['adapter', meta(p.adapter)],
    ['adapter-pino', meta(p['adapter-pino'], hostRange(p['adapter-pino']))],
    ['adapter-otel', meta(p['adapter-otel'], hostRange(p['adapter-otel']))],
    ['adapter-ai-context', meta(p['adapter-ai-context'])],
    ['adapter-mcp', meta(p['adapter-mcp'])],
    ['adapters-py', meta(p['adapters-py'], pkgs.pythonMeta, '[otel] extra')],
  ];
  const hostRanges = [
    ['adapter-pino', hostRange(p['adapter-pino'])],
    ['adapter-otel', hostRange(p['adapter-otel'])],
    ['Python logging', 'CPython >=3.10'],
    ['Python otel', pythonExtra(p['adapters-py'].requires, 'otel')],
  ];

  return (
    <>
      <PageHead eyebrow={head.eyebrow} title={head.title} lede={<Rich value={head.lede} />} />

      <DocSection eyebrow={problem.eyebrow} title={problem.title}>
        {problem.intro !== null && (
          <p>
            <Rich value={problem.intro} />
          </p>
        )}
        <Grid cols={2}>
          {problem.cards.map((card, i) => (
            <Card key={i}>
              <h3>
                <StatusChip tone={problemTones[i]}>
                  <Rich value={card.chip} />
                </StatusChip>
              </h3>
              <p>
                <Rich value={card.body} vars={{ adapterPinoName: p['adapter-pino'].name }} />
              </p>
            </Card>
          ))}
        </Grid>
        <p>
          <Rich value={problem.outro} />
        </p>
      </DocSection>

      <DocSection eyebrow={where.eyebrow} title={where.title}>
        <Flow>
          <FlowNode title={where.nodeTitle1}>
            <Rich value={where.node1} />
          </FlowNode>
          <FlowArrow>
            <Rich value={where.arrow1} />
          </FlowArrow>
          <Claim sub={where.claimSub}>
            <Rich value={where.claim} />
          </Claim>
          <FlowArrow>
            <Rich value={where.arrow2} />
          </FlowArrow>
          <FlowNode title={where.nodeTitle2}>
            <Rich value={where.node2} />
          </FlowNode>
        </Flow>
      </DocSection>

      <DocSection eyebrow={pkgs.eyebrow} title={pkgs.title}>
        <Grid cols={2}>
          {tiles.map(([key, tileMeta], i) => (
            <PackageTile {...tile(key)} meta={tileMeta}>
              <Rich value={pkgs.tiles[i]} />
            </PackageTile>
          ))}
        </Grid>
        <p class="small">
          <Rich value={pkgs.note} />
        </p>
        <p class="tiny">
          <Rich value={pkgs.observed} vars={{ observedAt: slots.observedAt }} />
        </p>
      </DocSection>

      <DocSection eyebrow={rule.eyebrow} title={rule.title} lede={<Rich value={rule.lede} />}>
        <DataTable
          label={rule.markersLabel}
          head={[rule.head[0], rule.head[1]]}
          rows={markers.map((marker, i) => [<span class="mono">{marker}</span>, <Rich value={rule.markers[i]} />])}
        />
        <Note tone="danger">
          <p>
            <Rich value={rule.warning} />
          </p>
        </Note>
        <h3 class="h3">
          <Rich value={rule.budgetsHeading} />
        </h3>
        <Grid cols={4}>
          {[budgets.depth, budgets.arrayLength, budgets.objectKeys, budgets.leaves].map((budget, i) => (
            <StatTile value={n(budget)}>
              <Rich value={rule.budgets[i]} />
            </StatTile>
          ))}
        </Grid>
        <p class="small">
          <Rich value={rule.budgetsNote} vars={{ stringChars: n(budgets.stringChars) }} />
        </p>
      </DocSection>

      <DocSection eyebrow={small.eyebrow} title={small.title}>
        <RuleRows rows={coreSurface.map((term, i) => ({ term, body: <Rich value={small.rows[i]} /> }))} />
        <p>
          <Rich value={small.p} />
        </p>
        <Note tone="success">
          <p>
            <Rich value={small.note} />
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow={ranges.eyebrow} title={ranges.title} lede={<Rich value={ranges.lede} />}>
        <DataTable
          label={ranges.rangesLabel}
          head={[ranges.head[0], ranges.head[1], ranges.head[2]]}
          rows={hostRanges.map(([adapter, range], i) => [
            adapter,
            <span class="mono">{range}</span>,
            <Rich value={ranges.verifiedBy[i]} />,
          ])}
        />
        <p>
          <Rich value={ranges.p} />
        </p>
      </DocSection>

      <DocSection eyebrow={honest.eyebrow} title={honest.title}>
        <Note tone="warning" title={honest.noteTitle}>
          <ul>
            {honest.items.map((item, i) => (
              <li key={i}>
                <Rich value={item} />
              </li>
            ))}
          </ul>
        </Note>
      </DocSection>

      <SourceStrip label={sources.label}>
        <Rich
          value={sources.body}
          vars={{
            adaptersRepo: evidence.sources.adapters.repo.split('/')[1],
            atCommit: evidence.sources.adapters.commit && (
              <Rich value={atCommit} vars={{ commit: evidence.sources.adapters.commit }} />
            ),
            observedAt: slots.observedAt,
          }}
        />
      </SourceStrip>
    </>
  );
}
