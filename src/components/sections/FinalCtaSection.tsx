import { Band, Button } from '../ui';
import type { SiteContent } from '../../content';
import { anchors, urls } from '../../content/shared';
import styles from './FinalCtaSection.module.css';

export type FinalCtaSectionProps = {
  copy: SiteContent['final'];
};

/** Block 8 — what next? The page's second and last green decision point. */
export function FinalCtaSection({ copy }: FinalCtaSectionProps) {
  return (
    <Band labelledBy="final-title">
      <div class={styles.final}>
        <p class="eyebrow">{copy.eyebrow}</p>
        <h2 class={`h1 ${styles.title}`} id="final-title">
          {copy.title}
        </h2>
        <p class="lede">{copy.lede}</p>
        <div class={styles.ctas}>
          <Button variant="primary" href={`#${anchors.firstRun}`}>
            {copy.primaryCta}
          </Button>
          <Button size="lg" href={urls.repo}>
            {copy.secondaryCta}
          </Button>
        </div>
      </div>
    </Band>
  );
}
