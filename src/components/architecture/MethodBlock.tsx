import type { ComponentChildren } from 'preact';
import styles from './MethodBlock.module.css';

export type PhaseProps = { title: ComponentChildren; children?: ComponentChildren };

/** Groups method blocks under a stage heading. */
export function Phase({ title, children }: PhaseProps) {
  return (
    <div class={styles.phase}>
      <h3 class={styles.phaseTitle}>{title}</h3>
      {children && <p class={styles.phaseDesc}>{children}</p>}
    </div>
  );
}

export type MethodBlockProps = {
  /** The spec's number — an identifier, not a rank. */
  n: string;
  title: ComponentChildren;
  /** The one question this method asks of a detector. */
  ask: ComponentChildren;
  /** An optional code sample between the question and the gist. */
  children?: ComponentChildren;
  gist: ComponentChildren;
};

export function MethodBlock({ n, title, ask, children, gist }: MethodBlockProps) {
  return (
    <article class={styles.method}>
      <span class={styles.n}>{n}</span>
      <div class={styles.body}>
        <h4 class={styles.title}>{title}</h4>
        <p class={styles.ask}>{ask}</p>
        {children}
        <p class={styles.gist}>{gist}</p>
      </div>
    </article>
  );
}
