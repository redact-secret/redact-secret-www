import { CommunityDesk } from '../components/community';
import { AppShell } from '../components/shell';
import { Rich } from '../components/ui/Rich';
import type { CommunityCopy, ShellCopy } from '../content';
import { locales, type Locale } from '../i18n';
import { communityPath } from '../routes';
import { slots } from '../slots';
import styles from './Community.module.css';

export type CommunityProps = {
  locale: Locale;
  /** i18n/<locale>/shell.json */
  shell: ShellCopy;
  /** i18n/<locale>/community.json */
  copy: CommunityCopy;
};

/**
 * The community page: what a report is for and where it lands, then the
 * feedback router. Nothing is sent from here; Continue opens GitHub's own
 * form, prefilled, once the in-browser check is clean (ADR 0004).
 */
export function Community({ locale, shell, copy }: CommunityProps) {
  const alternates = Object.fromEntries(locales.map((l) => [l, communityPath(l)]));
  return (
    <AppShell locale={locale} copy={shell} alternates={alternates} current={communityPath(locale)}>
      <div class="wrap">
        <header class={styles.hero}>
          <p class={`eyebrow ${styles.eyebrow}`}>{copy.hero.eyebrow}</p>
          <h1 class="h1">
            <Rich value={copy.hero.title} />
          </h1>
          <p class={styles.lede}>
            <Rich value={copy.hero.lede} />
          </p>
          <ul class={styles.facts}>
            {copy.hero.facts.map((fact) => (
              <li key={fact.lead}>
                <b>{fact.lead}</b> <Rich value={fact.body} />
              </li>
            ))}
          </ul>
        </header>
        <div class={styles.body}>
          <CommunityDesk locale={locale} copy={copy} version={slots.core.npm} />
        </div>
        <p class={`small ${styles.boundary}`}>
          <Rich value={copy.boundary} />
        </p>
      </div>
    </AppShell>
  );
}
