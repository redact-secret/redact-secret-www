import type { ComponentChildren } from 'preact';
import styles from './DetectorAnatomy.module.css';

export type DetectorAnatomyProps = {
  /** prefix / alphabet / run / validator, in that order. */
  parts: { label: string; value: string; desc: ComponentChildren }[];
};

/** The four-part shape every provider detector is an instance of. 2×2 below 760px. */
export function DetectorAnatomy({ parts }: DetectorAnatomyProps) {
  return (
    <dl class={styles.anatomy}>
      {parts.map((part) => (
        <div key={part.label} class={styles.part}>
          <dt class={styles.label}>{part.label}</dt>
          <dd class={styles.value}>{part.value}</dd>
          <dd class={styles.desc}>{part.desc}</dd>
        </div>
      ))}
    </dl>
  );
}
