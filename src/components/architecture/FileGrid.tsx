import type { ComponentChildren } from 'preact';
import styles from './FileGrid.module.css';

export type FileGridProps = {
  files: {
    name: string;
    question: ComponentChildren;
    facts: { term: ComponentChildren; desc: ComponentChildren }[];
  }[];
};

/**
 * Input files side by side. All carry the same weight — no emphasis
 * difference between them (design spec § 07); the heavy top rule says
 * "this is an input".
 */
export function FileGrid({ files }: FileGridProps) {
  return (
    <div class={styles.grid}>
      {files.map((file) => (
        <div key={file.name} class={styles.file}>
          <span class={styles.name}>{file.name}</span>
          <span class={styles.question}>{file.question}</span>
          <dl class={styles.facts}>
            {file.facts.map((fact, i) => (
              <div key={i}>
                <dt>{fact.term}</dt>
                <dd>{fact.desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
