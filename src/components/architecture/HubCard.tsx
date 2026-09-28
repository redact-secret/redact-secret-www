import type { ComponentChildren } from 'preact';
import styles from './HubCard.module.css';

export type HubCardProps = {
  n: string;
  title: ComponentChildren;
  /** The question the page answers, in the reader's words. */
  question: ComponentChildren;
  children: ComponentChildren;
  href: string;
  /** The destination path, shown as the call to action. */
  go: string;
};

/** One sub-page on the hub: the whole card is the link. */
export function HubCard({ n, title, question, children, href, go }: HubCardProps) {
  return (
    <a class={styles.card} href={href}>
      <span class={styles.n}>{n}</span>
      <h3 class={styles.title}>{title}</h3>
      <p class={styles.question}>{question}</p>
      <p class={styles.body}>{children}</p>
      <span class={styles.go}>
        {go} <span aria-hidden="true">→</span>
      </span>
    </a>
  );
}

export function HubGrid({ children }: { children: ComponentChildren }) {
  return <div class={styles.grid}>{children}</div>;
}
