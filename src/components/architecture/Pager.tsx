import styles from './Pager.module.css';

type PagerLink = { kicker: string; title: string; href: string };

export type PagerProps = {
  label: string;
  prev: PagerLink;
  next: PagerLink;
};

/** Previous / next. The seven pages form a loop: the last page's next is the hub. */
export function Pager({ label, prev, next }: PagerProps) {
  return (
    <nav class={styles.pager} aria-label={label}>
      <a href={prev.href} rel="prev">
        <span class={styles.kicker}>{prev.kicker}</span>
        <span class={styles.title}>{prev.title}</span>
      </a>
      <a href={next.href} rel="next" class={styles.next}>
        <span class={styles.kicker}>{next.kicker}</span>
        <span class={styles.title}>{next.title}</span>
      </a>
    </nav>
  );
}
