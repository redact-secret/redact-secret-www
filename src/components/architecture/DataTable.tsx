import type { ComponentChildren } from 'preact';
import styles from './DataTable.module.css';

export type DataTableProps = {
  /** Accessible name of the scroll region. */
  label: string;
  head: ComponentChildren[];
  rows: ComponentChildren[][];
  /** Keeps a minimum width and scrolls inside its own box on narrow screens. */
  wide?: boolean;
};

/** A plain table. The first cell of each row is its header. */
export function DataTable({ label, head, rows, wide }: DataTableProps) {
  return (
    <div class={styles.scroll} tabIndex={0} role="region" aria-label={label}>
      <table class={[styles.table, wide && styles.wide].filter(Boolean).join(' ')}>
        <thead>
          <tr>
            {head.map((cell, i) => (
              <th key={i} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) =>
                c === 0 ? (
                  <th key={c} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={c}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
