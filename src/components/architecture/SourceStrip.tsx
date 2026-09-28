import type { ComponentChildren } from 'preact';
import styles from './SourceStrip.module.css';

export type SourceStripProps = {
  label: ComponentChildren;
  /** Which files, at which commit, read on which date. */
  children: ComponentChildren;
};

/** Required on every architecture page: what the page was written from (design spec § 05). */
export function SourceStrip({ label, children }: SourceStripProps) {
  return (
    <footer class={styles.strip}>
      <p>
        <b>{label}</b> {children}
      </p>
    </footer>
  );
}
