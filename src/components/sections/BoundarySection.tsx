import { Band, Ruled, SectionHeader } from '../ui';
import type { HomeCopy } from '../../content';
import type { Locale } from '../../i18n';
import { Rich } from '../ui/Rich';
import { anchors } from '../../content/shared';
import { linkHref } from '../../routes';
import { FlowBand } from './FlowBand';
import styles from './BoundarySection.module.css';

export type BoundarySectionProps = {
  locale: Locale;
  copy: HomeCopy['boundary'];
};

/**
 * Block 5 — how it works: the page's one large green block. No logo, no status chips, no
 * gradient or tint on it (design spec § 09).
 */
export function BoundarySection({ locale, copy }: BoundarySectionProps) {
  return (
    <Band id={anchors.boundary} labelledBy="boundary-title" tone="brand">
      <div class={styles.head}>
        <SectionHeader id="boundary-title" eyebrow={<Rich value={copy.eyebrow} />} title={<Rich value={copy.title} />} lede={<Rich value={copy.lede} />} />
      </div>
      <FlowBand label={copy.flowLabel} steps={copy.flow} />
      <div class={styles.pillars}>
        {copy.pillars.map((pillar, i) => (
          <Ruled key={i} onBrand>
            <h3 class="h3"><Rich value={pillar.title} /></h3>
            <p class="small"><Rich value={pillar.body} /></p>
          </Ruled>
        ))}
      </div>
      <p class={`small ${styles.links}`}>
        {copy.links.map((link) => {
          const href = linkHref(locale, link);
          return (
            <a key={href} href={href}>
              {link.label}
            </a>
          );
        })}
      </p>
    </Band>
  );
}
