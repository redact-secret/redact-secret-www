import { Logo } from '../ui';
import type { ShellCopy } from '../../content';
import { anchors, siteOrigin } from '../../content/shared';
import { homePath, localeNames, locales, type Locale } from '../../i18n';
import { linkHref } from '../../routes';
import { Rich } from '../ui/Rich';
import type { Alternates } from './ShellControls';
import styles from './Footer.module.css';

export type FooterProps = {
  locale: Locale;
  copy: ShellCopy['footer'];
  alternates?: Alternates;
};

const host = new URL(siteOrigin).host;

export function Footer({ locale, copy, alternates }: FooterProps) {
  const [community] = copy.columns.slice(-1);
  return (
    <footer class={styles.foot} id={anchors.community}>
      <div class={`wrap ${styles.inner}`}>
        <div class={styles.cols}>
          <div class={styles.brand}>
            <Logo href={homePath(locale)} />
            <p class={`small ${styles.tagline}`}>
              <Rich value={copy.tagline} />
            </p>
          </div>
          {copy.columns.map((column) => (
            <div key={column.title}>
              <h2 class={styles.title}>{column.title}</h2>
              <ul class={styles.links}>
                {column.links.map((link) => {
                  const href = linkHref(locale, link);
                  return (
                    <li key={href}>
                      <a href={href}>
                        {link.label}
                        {link.external && <span aria-hidden="true"> ↗</span>}
                      </a>
                    </li>
                  );
                })}
              </ul>
              {column === community && (
                <p class={`tiny ${styles.channel}`}>
                  <Rich value={copy.channelNote} />
                </p>
              )}
            </div>
          ))}
        </div>
        <div class={styles.note}>
          <p class="tiny">
            © 2026 Redact Secret · MIT · <span class="mono">{host}</span>
          </p>
          <p class="tiny">
            {locales.map((l, i) => (
              <>
                {i > 0 && ' · '}
                {l === locale ? (
                  <b>{localeNames[l]}</b>
                ) : (
                  <a href={alternates?.[l] ?? homePath(l)} hreflang={l} lang={l}>
                    {localeNames[l]}
                  </a>
                )}
              </>
            ))}{' '}
            — <Rich value={copy.languageNote} />
          </p>
        </div>
      </div>
    </footer>
  );
}
