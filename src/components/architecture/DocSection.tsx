import type { ComponentChildren } from 'preact';
import styles from './DocSection.module.css';

export type DocSectionProps = {
  eyebrow: ComponentChildren;
  title: ComponentChildren;
  /** One lede, or several paragraphs of it. */
  lede?: ComponentChildren | ComponentChildren[];
  children?: ComponentChildren;
};

/**
 * One section of an architecture page. No rule between sections — the
 * eyebrow is the divider (design spec § 05). Direct <p> children keep the
 * reading measure; grids and tables take the full width.
 */
export function DocSection({ eyebrow, title, lede, children }: DocSectionProps) {
  const ledes = Array.isArray(lede) ? lede : lede ? [lede] : [];
  return (
    <section class={styles.sec}>
      <div class={styles.head}>
        <p class="eyebrow">{eyebrow}</p>
        <h2 class="h2">{title}</h2>
        {ledes.map((l, i) => (
          <p key={i} class="lede">
            {l}
          </p>
        ))}
      </div>
      {children}
    </section>
  );
}
