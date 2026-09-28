import { Button } from '../ui';
import type { SiteContent } from '../../content';
import { anchors } from '../../content/shared';
import { IOBlock } from './IOBlock';
import styles from './HeroSection.module.css';

export type HeroSectionProps = {
  copy: SiteContent['hero'];
};

/** Block 1 — what is this product? No version, count, or score here (spec § 05). */
export function HeroSection({ copy }: HeroSectionProps) {
  return (
    <section class={styles.hero} id={anchors.top} aria-labelledby="hero-title">
      <div class="wrap">
        <div class={styles.copy}>
          <p class="eyebrow">{copy.eyebrow}</p>
          <h1 class="display" id="hero-title">
            {copy.title}
          </h1>
          <p class="lede">{copy.lede}</p>
          <div class={styles.ctas}>
            <Button variant="primary" href={`#${anchors.firstRun}`}>
              {copy.primaryCta}
            </Button>
            <Button size="lg" href={`#${anchors.evidence}`}>
              {copy.secondaryCta}
            </Button>
          </div>
          <p class={styles.proof}>{copy.proof}</p>
        </div>
        <IOBlock caption={copy.io.caption} footnote={copy.io.footnote} />
      </div>
    </section>
  );
}
