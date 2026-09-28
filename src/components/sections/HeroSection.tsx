import { Button } from '../ui';
import type { HomeCopy } from '../../content';
import { Rich } from '../ui/Rich';
import { anchors } from '../../content/shared';
import { IOBlock } from './IOBlock';
import styles from './HeroSection.module.css';

export type HeroSectionProps = {
  copy: HomeCopy['hero'];
};

/** Block 1 — what is this product? No version, count, or score here (spec § 05). */
export function HeroSection({ copy }: HeroSectionProps) {
  return (
    <section class={styles.hero} id={anchors.top} aria-labelledby="hero-title">
      <div class="wrap">
        <div class={styles.copy}>
          <p class="eyebrow"><Rich value={copy.eyebrow} /></p>
          <h1 class="display" id="hero-title">
            <Rich value={copy.title} />
          </h1>
          <p class="lede"><Rich value={copy.lede} /></p>
          <div class={styles.ctas}>
            <Button variant="primary" href={`#${anchors.firstRun}`}>
              {copy.primaryCta}
            </Button>
            <Button size="lg" href={`#${anchors.evidence}`}>
              {copy.secondaryCta}
            </Button>
          </div>
          <p class={styles.proof}><Rich value={copy.proof} /></p>
        </div>
        <IOBlock caption={copy.io.caption} footnote={<Rich value={copy.io.footnote} />} />
      </div>
    </section>
  );
}
