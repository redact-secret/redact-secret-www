import type { ComponentChildren } from 'preact';
import styles from './Note.module.css';

/**
 * The left rule carries meaning, never decoration: `info` is new information
 * (e.g. a language label), `warning` a limit or trade-off, `danger` a rule
 * whose breach leaks a secret, `success` a result that held.
 */
export type NoteTone = 'neutral' | 'info' | 'warning' | 'danger' | 'success';

export type NoteProps = {
  tone?: NoteTone;
  title?: ComponentChildren;
  /** Paragraphs or a list. */
  children: ComponentChildren;
};

export function Note({ tone = 'neutral', title, children }: NoteProps) {
  return (
    <aside class={`${styles.note} ${styles[tone]}`}>
      {title && <h3 class={styles.title}>{title}</h3>}
      {children}
    </aside>
  );
}
