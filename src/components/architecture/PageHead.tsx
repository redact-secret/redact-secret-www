import type { ComponentChildren } from 'preact';
import styles from './PageHead.module.css';

export type PageHeadProps = {
  eyebrow: ComponentChildren;
  title: ComponentChildren;
  lede: ComponentChildren;
  /** The hub's title uses the display size; the six pages use h1 (design spec § 05). */
  display?: boolean;
};

export function PageHead({ eyebrow, title, lede, display }: PageHeadProps) {
  return (
    <header class={styles.head}>
      <p class="eyebrow">{eyebrow}</p>
      <h1 class={display ? 'display' : 'h1'}>{title}</h1>
      <p class="lede">{lede}</p>
    </header>
  );
}
