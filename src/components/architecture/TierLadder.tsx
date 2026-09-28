import type { ComponentChildren } from 'preact';
import styles from './TierLadder.module.css';

export type TierLadderProps = {
  /** Strongest first. */
  rungs: { tier: string; title: ComponentChildren; sub: ComponentChildren; example: string }[];
  /** What the top and bottom ends mean. */
  axis: [ComponentChildren, ComponentChildren];
};

/**
 * The five evidence tiers. Tiers are not severities, so no rung is colored
 * (design spec § 07); the axis label carries the direction.
 */
export function TierLadder({ rungs, axis }: TierLadderProps) {
  return (
    <div>
      <ol class={styles.ladder}>
        {rungs.map((rung) => (
          <li key={rung.tier} class={styles.rung}>
            <span class={styles.tier}>{rung.tier}</span>
            <span>
              <span class={styles.title}>{rung.title}</span>
              <span class={styles.sub}>{rung.sub}</span>
            </span>
            <span class={styles.example}>{rung.example}</span>
          </li>
        ))}
      </ol>
      <p class={styles.axis}>
        <span>{axis[0]}</span>
        <span>{axis[1]}</span>
      </p>
    </div>
  );
}
