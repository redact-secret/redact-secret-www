import { Ruled, StatusChip, type StatusTone } from '../ui';
import type { HomeCopy } from '../../content';
import type { CardDef, FactKind } from '../../content/integrations';
import { statusOf, type PackageSlot, type PackageStatus } from '../../slots';
import { Rich } from '../ui/Rich';
import styles from './PackageCard.module.css';

export type PackageCardProps = {
  def: CardDef;
  slot: PackageSlot;
  /** What the card says; `coverage` — what the package does NOT cover — is required (spec § 07). */
  copy: HomeCopy['integrations']['cards'][keyof HomeCopy['integrations']['cards']];
  labels: Pick<HomeCopy['integrations'], 'terms' | 'statusLabels' | 'notPublished'>;
};

const tones: Record<PackageStatus, StatusTone> = {
  released: 'success',
  alpha: 'info',
  unpublished: 'none',
};

const registryNames: Record<PackageSlot['registry'], string> = { npm: 'npm', pypi: 'PyPI', crates: 'crates.io' };

/** `redact-secret<0.2,>=0.1.0b6` → `redact-secret <0.2,>=0.1.0b6`; `extra` picks an extra's requirement. */
function pythonRequirement(requires: string[] | undefined, match: (name: string, extra?: string) => boolean) {
  for (const line of requires ?? []) {
    const [spec, marker] = line.split(';').map((part) => part.trim());
    const extra = marker?.match(/extra == "([^"]+)"/)?.[1];
    const name = spec.match(/^[A-Za-z0-9_.-]+/)?.[0] ?? '';
    if (match(name, extra)) return `${name} ${spec.slice(name.length)}`;
  }
  return undefined;
}

function factValue(kind: FactKind, def: CardDef, slot: PackageSlot, notPublished: string): string | undefined {
  switch (kind) {
    case 'version':
      if (slot.unpublished) return [typeof slot.unpublished === 'string' && slot.unpublished, notPublished].filter(Boolean).join(' · ');
      return [slot.version, slot.published].filter(Boolean).join(' · ');
    case 'registries':
      return [
        `${registryNames[slot.registry]} ${slot.version}`,
        slot.pypi && `PyPI ${slot.pypi.version}`,
        slot.crates && `crates.io ${slot.crates.version}`,
      ]
        .filter(Boolean)
        .join(' · ');
    case 'core':
      return slot.peers?.['@redact-secret/core'] ?? pythonRequirement(slot.requires, (name, extra) => name === 'redact-secret' && !extra);
    case 'host':
      if (def.extra) return pythonRequirement(slot.requires, (_name, extra) => extra === def.extra);
      return Object.entries(slot.peers ?? {})
        .filter(([name]) => name !== '@redact-secret/core')
        .map(([name, range]) => `${name} ${range}`)
        .join(', ') || undefined;
    case 'tag':
      if (!slot.tag || slot.tag === 'latest') return undefined;
      return slot.latest && slot.latest !== slot.version ? `${slot.tag} · latest → ${slot.latest}` : slot.tag;
    case 'install':
      return slot.version && def.install?.(slot.version);
  }
}

/**
 * Title + status, package, one line, facts, coverage note. Every fact comes
 * from the slot (registry data), never from prose; the coverage note — what
 * the package does NOT cover — is the point of the card (spec § 07).
 */
export function PackageCard({ def, slot, copy, labels }: PackageCardProps) {
  const status = statusOf(slot);
  const facts = def.facts
    .map((kind) => ({ kind, value: factValue(kind, def, slot, labels.notPublished) }))
    .filter((fact): fact is { kind: FactKind; value: string } => Boolean(fact.value));

  return (
    <Ruled as="article">
      <div class={styles.head}>
        <h4 class={styles.title}>
          <Rich value={copy.title} />
        </h4>
        <StatusChip tone={tones[status]}>{labels.statusLabels[status]}</StatusChip>
      </div>
      <p class={styles.pkg}>
        {def.display ?? slot.name}{' '}
        {!slot.unpublished && <span class={`tiny ${styles.registry}`}>({registryNames[slot.registry]})</span>}
      </p>
      <p class={styles.desc}>
        <Rich value={copy.description} />
      </p>
      {facts.length > 0 && (
        <dl class={styles.facts}>
          {facts.map((fact) => (
            <>
              <dt>{labels.terms[fact.kind]}</dt>
              <dd>{fact.value}</dd>
            </>
          ))}
        </dl>
      )}
      <p class="tiny">
        <Rich value={copy.coverage} />
      </p>
    </Ruled>
  );
}
