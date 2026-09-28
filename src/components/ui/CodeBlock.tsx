import styles from './CodeBlock.module.css';

export type CodeBlockProps = {
  code: string;
  /** Accessible name, e.g. "JavaScript example". */
  label?: string;
};

const commentLine = /^\s*(\/\/|# )/;

/** Whole-line `//` and `# ` comments render muted; nothing else is highlighted. */
export function CodeBlock({ code, label }: CodeBlockProps) {
  const lines = code.split('\n');
  return (
    <pre class={styles.code} aria-label={label} tabIndex={0}>
      <code>
        {lines.map((line, i) => (
          <>
            {commentLine.test(line) ? <span class={styles.comment}>{line}</span> : line}
            {i < lines.length - 1 && '\n'}
          </>
        ))}
      </code>
    </pre>
  );
}
