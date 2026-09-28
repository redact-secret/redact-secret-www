import { AppShell } from '../components/shell';
import { content } from '../content';
import type { Locale } from '../i18n';
import styles from './NotFound.module.css';

export function NotFound({ locale = 'en' }: { locale?: Locale }) {
  const c = content[locale];
  return (
    <AppShell content={c}>
      <div class={`wrap ${styles.body}`}>
        <p class="eyebrow">404</p>
        <h1 class="h1">{c.notFound.title}</h1>
        <p class="lede">{c.notFound.body}</p>
        <p>
          <a href={`/${locale}/`}>{c.notFound.home}</a>
        </p>
      </div>
    </AppShell>
  );
}
