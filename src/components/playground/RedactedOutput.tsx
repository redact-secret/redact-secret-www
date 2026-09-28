import { PlaceholderChip } from '../ui';
import type { Segment } from '../../playground/engine';
import styles from './RedactedOutput.module.css';

export type RedactedOutputProps = {
  segments: Segment[];
  /** Finding whose placeholder is emphasized. */
  activeId?: string;
};

/** Redacted text as text nodes, placeholders as chips. Never HTML. */
export function RedactedOutput({ segments, activeId }: RedactedOutputProps) {
  return (
    <pre class={styles.output}>
      {segments.map((segment, i) =>
        'text' in segment ? (
          segment.text
        ) : (
          <PlaceholderChip key={i} active={segment.findingId === activeId}>
            {segment.placeholder}
          </PlaceholderChip>
        ),
      )}
    </pre>
  );
}
