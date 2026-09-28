import styles from './PlaceholderChip.module.css';

export type PlaceholderChipProps = {
  /** The typed placeholder the core returns, e.g. `<SECRET_1>`. */
  children: string;
  /** Emphasized, e.g. while its finding row is hovered. */
  active?: boolean;
};

/**
 * The product's actual output — meant to be read, so it is text, not a bar.
 * Never status-colored: a placeholder is not a pass/fail result.
 */
export function PlaceholderChip({ children, active }: PlaceholderChipProps) {
  return <span class={[styles.chip, active && styles.active].filter(Boolean).join(' ')}>{children}</span>;
}
