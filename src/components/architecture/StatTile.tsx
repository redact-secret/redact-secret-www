import type { ComponentChildren } from 'preact';
import styles from './StatTile.module.css';

export type StatTileProps = {
  /** A slot value or a structural fact — never a hand-typed release number. */
  value: string | number;
  children: ComponentChildren;
};

export function StatTile({ value, children }: StatTileProps) {
  return (
    <div class={styles.stat}>
      <span class={styles.value}>{value}</span>
      <span class={styles.label}>{children}</span>
    </div>
  );
}
