import { Band, Ruled, SectionHeader } from '../ui';
import type { SiteContent } from '../../content';
import { anchors } from '../../content/shared';
import { FlowBand } from './FlowBand';
import styles from './BoundarySection.module.css';

export type BoundarySectionProps = {
  copy: SiteContent['boundary'];
};

/**
 * Block 5 — how it works: the page's one large green block. No logo, no status chips, no
 * gradient or tint on it (design spec § 09).
 */
export function BoundarySection({ copy }: BoundarySectionProps) {
  return (
    <Band id={anchors.boundary} labelledBy="boundary-title" tone="brand">
      <div class={styles.head}>
        <SectionHeader id="boundary-title" eyebrow={copy.eyebrow} title={copy.title} lede={copy.lede} />
      </div>
      <FlowBand label={copy.flowLabel} steps={copy.flow} />
      <div class={styles.pillars}>
        {copy.pillars.map((pillar, i) => (
          <Ruled key={i} onBrand>
            <h3 class="h3">{pillar.title}</h3>
            <p class="small">{pillar.body}</p>
          </Ruled>
        ))}
      </div>
      <p class={`small ${styles.links}`}>
        {copy.links.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </p>
    </Band>
  );
}
