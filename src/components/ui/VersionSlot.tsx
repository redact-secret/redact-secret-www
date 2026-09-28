import type { ComponentChildren } from 'preact';
import styles from './VersionSlot.module.css';

export type VersionSlotProps = {
  label: string;
  /** One sentence, rendered from slot data — always with its observed date. */
  children: ComponentChildren;
};

/** `status-info` here means "new information", not a verdict (design spec § 11). */
export function VersionSlot({ label, children }: VersionSlotProps) {
  return (
    <div class={styles.slot}>
      <span class={styles.label}>{label}</span>
      <span class={styles.body}>{children}</span>
    </div>
  );
}
