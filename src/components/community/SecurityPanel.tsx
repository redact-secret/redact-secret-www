import type { CommunityCopy } from '../../content';
import { Rich } from '../ui/Rich';
import styles from './SecurityPanel.module.css';

export type SecurityPanelProps = {
  copy: CommunityCopy['security'];
  advisoryHref: string;
  policyHref: string;
};

/** A vulnerability never goes through a public form: this panel has no fields, only the private route. */
export function SecurityPanel({ copy, advisoryHref, policyHref }: SecurityPanelProps) {
  return (
    <div class={styles.panel}>
      <h2 class="h2">{copy.name}</h2>
      <div class={styles.security}>
        <h3 class="h3">{copy.title}</h3>
        <p>
          <Rich value={copy.body} />
        </p>
        <ul>
          {copy.rules.map((rule, i) => (
            <li key={i}>
              <Rich value={rule} />
            </li>
          ))}
        </ul>
        <div class={styles.actions}>
          <a class={styles.button} href={advisoryHref}>
            {copy.advisory}
          </a>
          <a href={policyHref}>{copy.policy}</a>
        </div>
      </div>
    </div>
  );
}
