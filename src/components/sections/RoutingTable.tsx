import type { SiteContent } from '../../content';
import styles from './RoutingTable.module.css';

export type RoutingTableProps = {
  copy: SiteContent['evidence']['routing'];
};

/** Routes a visitor to the right tool. No scores, no badges — three rows. */
export function RoutingTable({ copy }: RoutingTableProps) {
  return (
    <div class={styles.routing}>
      <h3 class={`h3 ${styles.title}`}>{copy.title}</h3>
      <div class={styles.scroll} tabIndex={0} role="region" aria-label={String(copy.title)}>
        <table class={styles.table}>
          <thead>
            <tr>
              <th scope="col">{copy.problemHeader}</th>
              <th scope="col">{copy.startHeader}</th>
            </tr>
          </thead>
          <tbody>
            {copy.rows.map((row, i) => (
              <tr key={i}>
                <td>{row.problem}</td>
                <td>{row.start}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p class={`tiny ${styles.note}`}>{copy.note}</p>
    </div>
  );
}
