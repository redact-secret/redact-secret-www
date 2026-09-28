import { Band, SectionHeader } from '../ui';
import type { HomeCopy } from '../../content';
import { Rich } from '../ui/Rich';
import { anchors } from '../../content/shared';
import { LimitsBlock } from './LimitsBlock';
import { RoutingTable } from './RoutingTable';
import styles from './EvidenceSection.module.css';

export type EvidenceSectionProps = {
  copy: HomeCopy['evidence'];
  /** The routing table is optional for launch (ARCHITECTURE.md § Open questions). */
  showRouting?: boolean;
};

/** Block 7 — is there evidence? Links out; never copies a number. */
export function EvidenceSection({ copy, showRouting = true }: EvidenceSectionProps) {
  return (
    <Band id={anchors.evidence} labelledBy="evidence-title">
      <SectionHeader id="evidence-title" eyebrow={<Rich value={copy.eyebrow} />} title={<Rich value={copy.title} />} lede={<Rich value={copy.lede} />} />
      <div class={styles.links}>
        {copy.links.map((link) => (
          <a key={link.href} class={styles.link} href={link.href}>
            <h3 class="h3"><Rich value={link.title} /></h3>
            <p class={styles.body}><Rich value={link.body} /></p>
            <span class={styles.go}><Rich value={link.go} /></span>
          </a>
        ))}
      </div>
      {showRouting && <RoutingTable copy={copy.routing} />}
      <LimitsBlock copy={copy.limits} />
    </Band>
  );
}
