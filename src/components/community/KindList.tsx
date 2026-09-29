import styles from './KindList.module.css';

export type KindItem = { key: string; name: string; where: string; current: boolean };
export type KindGroup = { key: string; label: string; items: KindItem[] };

export type KindListProps = {
  /** Names the navigation landmark. */
  label: string;
  groups: KindGroup[];
  onSelect?: (key: string) => void;
};

/** The feedback kinds, grouped by what the visitor wants to say. The current one is marked, never colored alone. */
export function KindList({ label, groups, onSelect }: KindListProps) {
  return (
    <nav class={styles.kinds} aria-label={label}>
      {groups.map((group) => (
        <div class={styles.group} key={group.key}>
          <h2 class={`eyebrow ${styles.head}`}>{group.label}</h2>
          <ul class={styles.list}>
            {group.items.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  class={styles.kind}
                  aria-current={item.current ? 'true' : undefined}
                  onClick={() => onSelect?.(item.key)}
                >
                  <span class={styles.dot} aria-hidden="true" />
                  <span class={styles.name}>{item.name}</span>
                  <span class={styles.where}>{item.where}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
