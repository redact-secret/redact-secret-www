import styles from './Chips.module.css';

export type ChipsProps = {
  /** Accessible name of the list. */
  label: string;
  items: string[];
  /**
   * Struck through: recognized and skipped, or excluded by name. Never
   * status-colored — "excluded" is not a failure (design spec § 07).
   */
  struck?: boolean;
};

export function Chips({ label, items, struck }: ChipsProps) {
  return (
    <ul class={styles.chips} aria-label={label}>
      {items.map((item) => (
        <li key={item} class={[styles.chip, struck && styles.struck].filter(Boolean).join(' ')}>
          {item}
        </li>
      ))}
    </ul>
  );
}
