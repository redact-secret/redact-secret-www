import { StatusChip } from '../ui';
import styles from './SpanLattice.module.css';

/** A byte cell: outside the span, a secret byte caught, one leaked, or an innocent byte caught with it. */
export type SpanCell = 'none' | 'hit' | 'leak' | 'over';

export type SpanLatticeProps = {
  rows: {
    code: string;
    cells: SpanCell[];
    pass: boolean;
    /** What the strip shows, for readers who cannot see it. */
    description: string;
  }[];
  passLabel: string;
  failLabel: string;
  legend: Record<Exclude<SpanCell, 'none'>, string>;
};

/**
 * The five verdicts over a byte range. Three cell kinds, each named in the
 * legend — the strip is never read by color alone (design spec § 07, § 11).
 */
export function SpanLattice({ rows, passLabel, failLabel, legend }: SpanLatticeProps) {
  return (
    <div class={styles.wrap}>
      <ol class={styles.lattice}>
        {rows.map((row) => (
          <li key={row.code} class={`${styles.row} ${row.pass ? styles.pass : styles.fail}`}>
            <span class={styles.code}>{row.code}</span>
            <span class={styles.strip} role="img" aria-label={row.description}>
              {row.cells.map((cell, i) => (
                <i key={i} class={styles[cell]} />
              ))}
            </span>
            <span>
              <StatusChip tone={row.pass ? 'success' : 'danger'}>{row.pass ? passLabel : failLabel}</StatusChip>
            </span>
          </li>
        ))}
      </ol>
      <ul class={styles.legend}>
        {(['hit', 'leak', 'over'] as const).map((cell) => (
          <li key={cell}>
            <i class={styles[cell]} aria-hidden="true" />
            {legend[cell]}
          </li>
        ))}
      </ul>
    </div>
  );
}
