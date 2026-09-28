import type { ComponentChildren } from 'preact';
import { useId, useRef, useState } from 'preact/hooks';
import styles from './Tabs.module.css';

export type TabItem = {
  id: string;
  label: string;
  content: ComponentChildren;
};

export type TabsProps = {
  /** Accessible name of the tablist. */
  label: string;
  items: TabItem[];
  defaultId?: string;
};

/**
 * WAI-ARIA tabs: arrow keys, Home and End move between tabs; inactive panels
 * are `hidden`, so the prerendered HTML shows the first panel only.
 */
export function Tabs({ label, items, defaultId }: TabsProps) {
  const [selected, setSelected] = useState(defaultId ?? items[0]?.id);
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent, index: number) {
    const last = items.length - 1;
    const next =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    setSelected(items[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div>
      <div class={styles.list} role="tablist" aria-label={label}>
        {items.map((item, index) => {
          const isSelected = item.id === selected;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              class={styles.tab}
              id={`${baseId}-tab-${item.id}`}
              aria-controls={`${baseId}-panel-${item.id}`}
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelected(item.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          class={styles.panel}
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={item.id !== selected}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
