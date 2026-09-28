import type { HomeCopy } from '../../content';
import { Rich } from '../ui/Rich';
import styles from './FlowBand.module.css';

export type FlowBandProps = {
  label: string;
  steps: HomeCopy['boundary']['flow'];
};

/** Five-step flow; lives only on the brand-green block. Stacks below 900px. */
export function FlowBand({ label, steps }: FlowBandProps) {
  return (
    <ol class={styles.flow} aria-label={label}>
      {steps.map((step, i) => (
        <li key={i} class={[styles.step, step.core && styles.core].filter(Boolean).join(' ')}>
          <span class={styles.key}><Rich value={step.key} /></span>
          <span class={styles.title}><Rich value={step.title} /></span>
          <span class={styles.desc}><Rich value={step.description} /></span>
        </li>
      ))}
    </ol>
  );
}
