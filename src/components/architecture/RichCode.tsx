import type { ComponentChildren } from 'preact';
import styles from './RichCode.module.css';

export type RichCodeProps = {
  /** Accessible name, e.g. "Ruleset example". */
  label?: string;
  /** Text with <Dim> and <Flag> marks; whitespace is preserved. */
  children: ComponentChildren;
};

/**
 * A code sample with two marks. Examples here show shapes and formats, not
 * values — every value in one is synthetic (design spec § 10).
 */
export function RichCode({ label, children }: RichCodeProps) {
  return (
    <pre class={styles.code} aria-label={label} tabIndex={0}>
      <code>{children}</code>
    </pre>
  );
}

/** Commentary and elided spans: muted. */
export function Dim({ children }: { children: ComponentChildren }) {
  return <span class={styles.dim}>{children}</span>;
}

/** A failing check or a leaked byte range — status-danger, paired with its words. */
export function Flag({ children }: { children: ComponentChildren }) {
  return <span class={styles.flag}>{children}</span>;
}
