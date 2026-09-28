import type { ComponentChildren } from 'preact';
import styles from './StatusChip.module.css';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'none';

export type StatusChipProps = {
  /**
   * Status colors mean a result, never decoration, and never sit on the
   * brand-green block (design spec § 07, § 09).
   */
  tone: StatusTone;
  /** A word is always required — color is never the only signal. */
  children: ComponentChildren;
};

export function StatusChip({ tone, children }: StatusChipProps) {
  return <span class={`${styles.chip} ${styles[tone]}`}>{children}</span>;
}
