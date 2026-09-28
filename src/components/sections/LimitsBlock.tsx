import type { SiteContent } from '../../content';
import styles from './LimitsBlock.module.css';

export type LimitsBlockProps = {
  copy: SiteContent['evidence']['limits'];
};

/** Never status-colored — a limit is not a failure (spec § 11). */
export function LimitsBlock({ copy }: LimitsBlockProps) {
  return (
    <aside class={styles.limits}>
      <h3 class={styles.title}>{copy.title}</h3>
      {copy.body.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </aside>
  );
}
