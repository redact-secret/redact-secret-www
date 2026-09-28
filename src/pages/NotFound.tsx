import { AppShell } from '../components/shell';
import { content } from '../content';
import { locales } from '../i18n';
import styles from './NotFound.module.css';

/**
 * One page for every missing path: CloudFront serves /404/index.html with
 * status 404 for both /en/… and /ko/… misses (redact-secret-sites
 * `NotFoundPage`), so the body speaks both languages instead of guessing.
 */
export function NotFound() {
  return (
    <AppShell content={content.en}>
      <div class={`wrap ${styles.body}`}>
        <p class="eyebrow">404</p>
        {locales.map((locale) => {
          const copy = content[locale].notFound;
          return (
            <section class={styles.locale} lang={locale} key={locale}>
              <h1 class="h2">{copy.title}</h1>
              <p class="lede">{copy.body}</p>
              <p>
                <a href={`/${locale}/`} hreflang={locale}>
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
