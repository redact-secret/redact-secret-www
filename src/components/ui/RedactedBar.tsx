import styles from './RedactedBar.module.css';

export type RedactedBarProps = {
  /** Spoken in place of the value. */
  label: string;
};

/**
 * A value that must not be readable: a solid ink bar, never asterisks, dots,
 * or blur (CONVENTIONS.md § Synthetic data).
 */
export function RedactedBar({ label }: RedactedBarProps) {
  return <span class={styles.bar} role="img" aria-label={label} />;
}
