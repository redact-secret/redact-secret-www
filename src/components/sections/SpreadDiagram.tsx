import { RedactedBar, StatusChip } from '../ui';
import type { SiteContent } from '../../content';
import { fixture } from '../../content/shared';
import styles from './SpreadDiagram.module.css';

export type SpreadDiagramProps = {
  copy: SiteContent['problem'];
};

/**
 * One paste, five destinations, zero places to fix it. Rules and `└→` only —
 * no curves or illustration (design spec § 06). `status-danger` is literal
 * here: the value is kept, and the chip says so in words.
 */
export function SpreadDiagram({ copy }: SpreadDiagramProps) {
  return (
    <div class={styles.spread}>
      <div class={styles.source}>
        <p class="eyebrow">{copy.sourceLabel}</p>
        <p class={styles.value}>
          {fixture.key}=<RedactedBar label={copy.redactedLabel} />
        </p>
        <p class="small">{copy.sourceNote}</p>
      </div>
      <div>
        <ul class={styles.dests}>
          {copy.destinations.map((dest, i) => (
            <li class={styles.dest} key={i}>
              <span class={styles.arm} aria-hidden="true">
                └→
              </span>
              <span class={styles.name}>
                {dest.name}
                <small class={styles.note}>{dest.note}</small>
              </span>
              <StatusChip tone="danger">{copy.kept}</StatusChip>
            </li>
          ))}
        </ul>
        <div class={styles.count}>
          {copy.counts.map((count) => (
            <div key={count.value}>
              <b>{count.value}</b>
              <span>{count.label}</span>
            </div>
          ))}
        </div>
        <p class={`small ${styles.remedy}`}>{copy.remedy}</p>
      </div>
    </div>
  );
}
