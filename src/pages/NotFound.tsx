import { AppShell } from '../components/shell';
import { Rich, RichLocale } from '../components/ui/Rich';
import type { ShellCopy } from '../content';
import { homePath, locales, type Locale } from '../i18n';
import styles from './NotFound.module.css';

export type NotFoundProps = {
  /** i18n/<locale>/shell.json for every locale: the body speaks all of them. */
  shells: Record<Locale, ShellCopy>;
};

/**
 * One page for every missing path: CloudFront serves /404/index.html with
 * status 404 for misses under both the English (/…) and Korean (/ko/…) route
 * sets (redact-secret-sites `NotFoundPage`), so the body speaks both
 * languages and links both homes instead of guessing.
 */
export function NotFound({ shells }: NotFoundProps) {
  return (
    <AppShell locale="en" copy={shells.en}>
      <div class={`wrap ${styles.body}`}>
        <p class="eyebrow">404</p>
        {locales.map((locale) => {
          const copy = shells[locale].notFound;
          return (
            <section class={styles.locale} lang={locale} key={locale}>
              <h1 class="h2">{copy.title}</h1>
              <p class="lede">
                <RichLocale.Provider value={locale}>
                  <Rich value={copy.body} />
                </RichLocale.Provider>
              </p>
              <p>
                <a href={homePath(locale)} hreflang={locale}>
                  {copy.home}
                </a>
              </p>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
