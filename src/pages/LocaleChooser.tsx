import { Logo } from '../components/ui';
import { localeNames, locales } from '../i18n';
import styles from './LocaleChooser.module.css';

/**
 * Default entry at `/` is an open question (ARCHITECTURE.md); a plain chooser
 * is the placeholder until redirect vs. negotiation is decided.
 */
export function LocaleChooser() {
  return (
    <main class={`wrap ${styles.chooser}`}>
      <Logo href="/" />
      <ul class={styles.list}>
        {locales.map((l) => (
          <li key={l}>
            <a href={`/${l}/`} hreflang={l} lang={l}>
              {localeNames[l] === 'EN' ? 'English' : localeNames[l]}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
