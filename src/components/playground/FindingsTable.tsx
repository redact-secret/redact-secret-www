import type { SecretFinding } from '@redact-secret/core';
import type { SiteContent } from '../../content';
import styles from './FindingsTable.module.css';

export type FindingsTableProps = {
  findings: readonly SecretFinding[];
  columns: SiteContent['playground']['columns'];
  label: string;
  onActivate?: (id: string | undefined) => void;
};

/**
 * Safe metadata only — a finding never carries the matched value, and this
 * table never looks it up from the input (ADR 0001 § 4).
 */
export function FindingsTable({ findings, columns, label, onActivate }: FindingsTableProps) {
  return (
    <div class={styles.scroll} role="region" aria-label={label} tabIndex={0}>
      <table class={styles.table}>
        <thead>
          <tr>
            <th scope="col">{columns.id}</th>
            <th scope="col">{columns.type}</th>
            <th scope="col">{columns.detector}</th>
            <th scope="col">{columns.confidence}</th>
            <th scope="col">{columns.action}</th>
            <th scope="col">{columns.range}</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((f) => (
            <tr key={f.id} onMouseEnter={() => onActivate?.(f.id)} onMouseLeave={() => onActivate?.(undefined)}>
              <td class={styles.mono}>{f.id}</td>
              <td class={styles.mono}>{f.type}</td>
              <td class={styles.mono}>{f.detector}</td>
              <td>{f.confidence}</td>
              <td>{f.action}</td>
              <td class={styles.mono}>
                {f.start}–{f.end}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
