import styles from './SegmentedControl.module.css';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  /** Renders the option as a link (e.g. a locale switch), marked with `aria-current`. */
  href?: string;
  hrefLang?: string;
};

export type SegmentedControlProps<T extends string> = {
  /** Accessible name of the group. */
  label: string;
  options: SegmentOption<T>[];
  /** Selected value; `undefined` renders nothing selected (e.g. theme before hydration). */
  value?: T;
  onChange?: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div class={styles.group} role="group" aria-label={label}>
      {options.map((option) =>
        option.href ? (
          <a
            key={option.value}
            class={styles.item}
            href={option.href}
            hreflang={option.hrefLang}
            lang={option.hrefLang}
            aria-current={option.value === value ? 'page' : undefined}
          >
            {option.label}
          </a>
        ) : (
          <button
            key={option.value}
            type="button"
            class={styles.item}
            aria-pressed={option.value === value}
            onClick={() => onChange?.(option.value)}
          >
            {option.label}
          </button>
        ),
      )}
    </div>
  );
}
