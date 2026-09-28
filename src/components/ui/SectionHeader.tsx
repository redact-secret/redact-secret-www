import type { ComponentChildren } from 'preact';
import styles from './SectionHeader.module.css';

export type SectionHeaderProps = {
  eyebrow: ComponentChildren;
  title: ComponentChildren;
  lede?: ComponentChildren;
  id?: string;
};

export function SectionHeader({ eyebrow, title, lede, id }: SectionHeaderProps) {
  return (
    <div class={styles.head}>
      <p class="eyebrow">{eyebrow}</p>
      <h2 class="h2" id={id}>
        {title}
      </h2>
      {lede && <p class="lede">{lede}</p>}
    </div>
  );
}
