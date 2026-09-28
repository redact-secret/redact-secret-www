import type { ComponentChildren } from 'preact';
import styles from './Band.module.css';

export type BandProps = {
  children: ComponentChildren;
  id?: string;
  /** Heading id that names this region. */
  labelledBy?: string;
  /** `brand` is reserved for the boundary block — one per page. */
  tone?: 'default' | 'brand';
};

/** A full-width page block separated by a 1px rule; no shadows, no cards. */
export function Band({ children, id, labelledBy, tone = 'default' }: BandProps) {
  return (
    <section
      class={[styles.band, tone === 'brand' && styles.brand].filter(Boolean).join(' ')}
      id={id}
      aria-labelledby={labelledBy}
    >
      <div class={`wrap ${styles.inner}`}>{children}</div>
    </section>
  );
}
