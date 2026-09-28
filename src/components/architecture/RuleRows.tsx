import type { ComponentChildren } from 'preact';
import styles from './RuleRows.module.css';

export type RuleRowsProps = {
  rows: { term: ComponentChildren; body: ComponentChildren }[];
};

/** Term / rule pairs, one per ruled row. Stacks below 640px. */
export function RuleRows({ rows }: RuleRowsProps) {
  return (
    <dl class={styles.rows}>
      {rows.map((row, i) => (
        <div key={i} class={styles.row}>
          <dt class={styles.term}>{row.term}</dt>
          <dd class={styles.body}>{row.body}</dd>
        </div>
      ))}
    </dl>
  );
}
