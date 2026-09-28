import type { ComponentChildren } from 'preact';
import styles from './GateList.module.css';

export type GateListProps = {
  gates: { title: ComponentChildren; body: ComponentChildren }[];
};

/**
 * Checks that are evaluated together, not in sequence — so numbered rows,
 * no arrows (design spec § 07).
 */
export function GateList({ gates }: GateListProps) {
  return (
    <ol class={styles.gates}>
      {gates.map((gate, i) => (
        <li key={i} class={styles.gate}>
          <span class={styles.n} aria-hidden="true">
            {i + 1}
          </span>
          <span class={styles.text}>
            <b>{gate.title}</b> {gate.body}
          </span>
        </li>
      ))}
    </ol>
  );
}
