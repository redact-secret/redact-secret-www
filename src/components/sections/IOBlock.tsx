import type { ComponentChildren } from 'preact';
import { PlaceholderChip } from '../ui';
import { fixture } from '../../content/shared';
import styles from './IOBlock.module.css';

export type IOBlockProps = {
  caption: string;
  footnote: ComponentChildren;
};

/**
 * Static input → output for the one synthetic fixture. The page never accepts
 * visitor text (ARCHITECTURE.md § Security boundary).
 */
export function IOBlock({ caption, footnote }: IOBlockProps) {
  const [key] = fixture.input.split('=');
  return (
    <figure class={styles.io}>
      <figcaption class={styles.head}>
        <span class="eyebrow">{caption}</span>
        <span class="tiny mono">{fixture.call}</span>
      </figcaption>
      <dl>
        <div class={styles.row}>
          <dt class={styles.tag}>Input</dt>
          <dd class={styles.code}>{fixture.input}</dd>
        </div>
        <div class={styles.row}>
          <dt class={styles.tag}>Output</dt>
          <dd class={styles.code}>
            {key}=<PlaceholderChip>{fixture.placeholder}</PlaceholderChip>
          </dd>
        </div>
      </dl>
      <div class={styles.foot}>
        <p class="tiny">{footnote}</p>
      </div>
    </figure>
  );
}
