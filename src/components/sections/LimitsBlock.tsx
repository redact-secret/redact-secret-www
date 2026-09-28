import type { HomeCopy } from '../../content';
import { Rich } from '../ui/Rich';
import styles from './LimitsBlock.module.css';

export type LimitsBlockProps = {
  copy: HomeCopy['evidence']['limits'];
};

/** Never status-colored — a limit is not a failure (spec § 11). */
export function LimitsBlock({ copy }: LimitsBlockProps) {
  return (
    <aside class={styles.limits}>
      <h3 class={styles.title}><Rich value={copy.title} /></h3>
      {copy.body.map((paragraph, i) => (
        <p key={i}><Rich value={paragraph} /></p>
      ))}
    </aside>
  );
}
