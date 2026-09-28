import { Band, SectionHeader } from '../ui';
import type { SiteContent } from '../../content';
import { integrationGroups, runtimes, type CardDef } from '../../content/integrations';
import { anchors } from '../../content/shared';
import type { ReleaseSlots } from '../../slots';
import { PackageCard } from './PackageCard';
import styles from './IntegrationsSection.module.css';

export type IntegrationsSectionProps = {
  copy: SiteContent['integrations'];
  slots: ReleaseSlots;
};

/**
 * Block 6 — does it fit my stack? Core first (one row), then adapters and
 * vault split by runtime: Browser, Node.js, Python.
 */
export function IntegrationsSection({ copy, slots }: IntegrationsSectionProps) {
  const card = (def: CardDef) => (
    <PackageCard key={def.id} def={def} slot={slots.packages[def.slot]} copy={copy.cards[def.id]} labels={copy} />
  );

  return (
    <Band id={anchors.integrations} labelledBy="integrations-title">
      <SectionHeader id="integrations-title" eyebrow={copy.eyebrow} title={copy.title} lede={copy.lede} />
      {integrationGroups.map((group) => {
        const head = copy.groups[group.id];
        return (
          <section class={styles.group} key={group.id} aria-labelledby={`integrations-${group.id}`}>
            <div class={styles.groupHead}>
              <div>
                <h3 class="h3" id={`integrations-${group.id}`}>
                  {head.title}
                </h3>
                <p class="small">{head.lede}</p>
              </div>
              <a class="small" href={head.link}>
                GitHub <span aria-hidden="true">↗</span>
              </a>
            </div>
            {'cards' in group ? (
              <div class={styles.grid}>{group.cards.map(card)}</div>
            ) : (
              <div class={styles.grid}>
                {runtimes.map((runtime) => (
                  <div class={styles.column} key={runtime}>
                    <p class={`eyebrow ${styles.runtime}`}>{copy.runtimes[runtime]}</p>
                    {group.runtimes[runtime].map(card)}
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
      <p class={`tiny ${styles.observed}`}>{copy.observed(slots.observedAt)}</p>
    </Band>
  );
}
