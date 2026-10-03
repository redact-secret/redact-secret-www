import { useState } from 'preact/hooks';
import type { ShellCopy } from '../../content';
import { homePath, localeNames, locales, type Locale } from '../../i18n';
import styles from './ShellControls.module.css';

export type Alternates = Partial<Record<Locale, string>>;

type Props = {
  locale: Locale;
  copy: ShellCopy['header'];
  /** This page in each locale; defaults to that locale's home. */
  alternates?: Alternates;
};

/** A compact language menu. Theme support remains available, but is not shown in the site header. */
export function ShellControls({ locale, copy, alternates }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div
      class={styles.language}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
      }}
    >
      <button
        type="button"
        class={styles.trigger}
        aria-label={copy.languageLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span lang={locale}>{localeNames[locale]}</span>
        <span class={styles.chevron} aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div class={styles.options} role="menu" aria-label={copy.languageLabel}>
          {locales.map((language) => (
            <a
              key={language}
              class={styles.option}
              href={alternates?.[language] ?? homePath(language)}
              hrefLang={language}
              lang={language}
              role="menuitem"
              aria-current={language === locale ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {localeNames[language]}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
