import type { ComponentChildren } from 'preact';
import { StatusChip, type StatusTone } from '../ui';
import styles from './StatusBar.module.css';

export type StatusBarProps = {
  /** Accessible name of the legend, e.g. "Status of 108 families". */
  label: string;
  segments: { tone: Exclude<StatusTone, 'none'>; count: number; word: string; desc: ComponentChildren }[];
};

/**
 * One axis of counts as a proportional bar: one cell per counted item, so
 * widths are exact without an inline style (the proposed CSP has no
 * 'unsafe-inline'). The bar is decoration for sighted readers; the legend
 * carries every word and every number (design spec § 07, § 11).
 */
export function StatusBar({ label, segments }: StatusBarProps) {
  return (
    <div class={styles.wrap}>
      <div class={styles.bar} aria-hidden="true">
        {segments.flatMap((s) => Array.from({ length: s.count }, (_, i) => <i key={`${s.word}-${i}`} class={styles[s.tone]} />))}
      </div>
      <ul class={styles.legend} aria-label={label}>
        {segments.map((s) => (
          <li key={s.word}>
            <StatusChip tone={s.tone}>{s.word}</StatusChip> <b>{s.count}</b> — {s.desc}
          </li>
        ))}
      </ul>
    </div>
  );
}
