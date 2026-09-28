import type { SiteContent } from '../../content';
import styles from './FlowBand.module.css';

export type FlowBandProps = {
  label: string;
  steps: SiteContent['boundary']['flow'];
};

/** Five-step flow; lives only on the brand-green block. Stacks below 900px. */
export function FlowBand({ label, steps }: FlowBandProps) {
  return (
    <ol class={styles.flow} aria-label={label}>
      {steps.map((step, i) => (
        <li key={i} class={[styles.step, step.core && styles.core].filter(Boolean).join(' ')}>
          <span class={styles.key}>{step.key}</span>
          <span class={styles.title}>{step.title}</span>
          <span class={styles.desc}>{step.description}</span>
        </li>
      ))}
    </ol>
  );
}
