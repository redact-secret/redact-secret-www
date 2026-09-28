import type { ComponentChildren } from 'preact';
import styles from './PinPair.module.css';

type Side = { label: ComponentChildren; value: number; note: ComponentChildren };

export type PinPairProps = {
  /** The live value, then the pinned one. */
  live: Side;
  pinned: Side;
};

/**
 * Two numbers from two populations, at equal weight. The gap is not computed
 * or highlighted — it is the age of the evidence, and the sentence under the
 * pair says so (design spec § 08).
 */
export function PinPair({ live, pinned }: PinPairProps) {
  return (
    <div class={styles.pair}>
      {[live, pinned].map((side, i) => (
        <div key={i}>
          <span class={styles.label}>{side.label}</span>
          <span class={styles.value}>{side.value}</span>
          <p class={styles.note}>{side.note}</p>
        </div>
      ))}
    </div>
  );
}
