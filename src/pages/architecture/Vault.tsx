import {
  Card,
  Claim,
  DocSection,
  Flow,
  FlowArrow,
  FlowNode,
  GateList,
  Grid,
  Note,
  PackageTile,
  PageHead,
  RuleRows,
  SourceStrip,
} from '../../components/architecture';
import { StatusChip } from '../../components/ui';
import { Rich } from '../../components/ui/Rich';
import type { ArchitecturePagesCopy } from '../../content';
import type { Locale } from '../../i18n';
import { evidence, slots, statusOf, type PackageSlot } from '../../slots';

const registryNames: Record<PackageSlot['registry'], string> = { npm: 'npm', pypi: 'PyPI', crates: 'crates.io' };

function meta(slot: PackageSlot) {
  if (slot.unpublished) return typeof slot.unpublished === 'string' ? slot.unpublished : undefined;
  return [registryNames[slot.registry], slot.version].filter(Boolean).join(' · ');
}

const trapTones = ['none', 'success'] as const;

/** 06 Vault. Words: i18n/<locale>/architecture/vault.json. */
export function Vault({ copy }: { locale: Locale; copy: ArchitecturePagesCopy['vault'] }) {
  const p = slots.packages;
  const vault = p.vault;
  const tile = (key: string) => ({
    name: p[key].name,
    status: statusOf(p[key]),
    statusLabel: copy.statusLabels[statusOf(p[key])],
    meta: meta(p[key]),
  });
  const { head, theTension: tension, theShapeOfIt: shape, theCentralRule: rule, aTrapItClosesOnPurpose: trap } = copy;
  const { whatMayBeKept: kept, thePieces: pieces, beingHonest: honest, sources } = copy;
  // Read up front: the install-trap note below is shown only while npm
  // `latest` lags, the commit clause only for a repository source.
  const { trapTitle, trap: trapBody } = honest;
  const { atCommit } = sources;

  return (
    <>
      <PageHead eyebrow={head.eyebrow} title={head.title} lede={<Rich value={head.lede} />} />

      <DocSection eyebrow={tension.eyebrow} title={tension.title}>
        <Grid cols={2}>
          {tension.cards.map((card, i) => (
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
        <Note tone="danger">
          <p>
            <Rich value={tension.note} />
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow={shape.eyebrow} title={shape.title}>
        <Flow>
          {shape.steps.map((step) => (
            <>
              <FlowNode title={step.title}>
                <Rich value={step.body} />
              </FlowNode>
              <FlowArrow>
                <Rich value={step.arrow} />
              </FlowArrow>
            </>
          ))}
          <Claim sub={shape.claimSub}>
            <Rich value={shape.claim} />
          </Claim>
        </Flow>
      </DocSection>

      <DocSection eyebrow={rule.eyebrow} title={rule.title} lede={<Rich value={rule.lede} />}>
        <GateList gates={rule.gates.map((gate) => ({ title: gate.title, body: <Rich value={gate.body} /> }))} />
        <Note tone="danger">
          <p>
            <Rich value={rule.note} />
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow={trap.eyebrow} title={trap.title} lede={<Rich value={trap.lede} />}>
        <Grid cols={2}>
          {trap.cards.map((card, i) => (
            <Card key={i}>
              <h3>
                <StatusChip tone={trapTones[i]}>
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
          <Rich value={trap.p} />
        </p>
      </DocSection>

      <DocSection eyebrow={kept.eyebrow} title={kept.title}>
        <RuleRows rows={kept.rows.map((row) => ({ term: row.term, body: <Rich value={row.body} /> }))} />
        <Note tone="success">
          <p>
            <Rich value={kept.note} />
          </p>
        </Note>
      </DocSection>

      <DocSection eyebrow={pieces.eyebrow} title={pieces.title}>
        <Grid cols={2}>
          <PackageTile {...tile('vault')}>
            <Rich value={pieces.tiles[0]} />
          </PackageTile>
          <PackageTile {...tile('vault-server')}>
            <Rich value={pieces.tiles[1]} />
          </PackageTile>
          <PackageTile {...tile('vault-py')} name={`${p['vault-py'].name} (Python)`}>
            <Rich value={pieces.tiles[2]} />
          </PackageTile>
          <PackageTile name="@redact-secret/store-*" status="alpha" statusLabel={pieces.contractLabel}>
            <Rich value={pieces.tiles[3]} />
          </PackageTile>
        </Grid>
        <p class="small">
          <Rich value={pieces.p} />
        </p>
      </DocSection>

      <DocSection eyebrow={honest.eyebrow} title={honest.title}>
        <Note tone="warning" title={honest.limitsTitle}>
          <ul>
            {honest.items.map((item, i) => (
              <li key={i}>
                <Rich value={item} />
              </li>
            ))}
          </ul>
        </Note>
        {vault.latest && vault.latest !== vault.version && (
          <Note tone="danger" title={trapTitle}>
            <p>
              <Rich
                value={trapBody}
                vars={{
                  name: vault.name,
                  latest: vault.latest,
                  npm: slots.core.npm,
                  tag: vault.tag,
                  version: vault.version,
                  redactSecretCore: vault.peers?.['@redact-secret/core'],
                }}
              />
            </p>
          </Note>
        )}
      </DocSection>

      <SourceStrip label={sources.label}>
        <Rich
          value={sources.body}
          vars={{
            vaultRepo: evidence.sources.vault.repo.split('/')[1],
            atCommit: evidence.sources.vault.commit && (
              <Rich value={atCommit} vars={{ commit: evidence.sources.vault.commit }} />
            ),
            observedAt: slots.observedAt,
          }}
        />
      </SourceStrip>
    </>
  );
}
