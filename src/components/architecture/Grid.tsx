import type { ComponentChildren } from 'preact';
import styles from './Grid.module.css';

export type GridProps = {
  cols: 2 | 3 | 4;
  children: ComponentChildren;
};

/** 2-, 3-, or 4-up; one column below 900px (four go 2×2 between 600 and 900px). */
export function Grid({ cols, children }: GridProps) {
  return <div class={`${styles.grid} ${styles[`c${cols}`]}`}>{children}</div>;
}

export type CardProps = {
  children: ComponentChildren;
  /** Tight padding for token-shape tiles. */
  compact?: boolean;
  center?: boolean;
};

/** A hairline box. Content sets its height — never fixed (CONVENTIONS.md § Bilingual). */
export function Card({ children, compact, center }: CardProps) {
  return (
    <div class={[styles.card, compact && styles.compact, center && styles.center].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
