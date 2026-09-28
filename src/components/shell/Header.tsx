import { useState } from 'preact/hooks';
import { Button, Logo } from '../ui';
import type { SiteContent } from '../../content';
import { anchors } from '../../content/shared';
import type { Locale } from '../../i18n';
import { NavLinks } from './NavLinks';
import { ShellControls } from './ShellControls';
import { SideNav, sideNavId } from './SideNav';
import styles from './Header.module.css';

export type HeaderProps = {
  locale: Locale;
  copy: SiteContent['shell'];
};

/**
 * Green budget: only the logo mark is green here — "Get started" is the
 * outlined default button, not a brand fill (design spec § 09).
 */
export function Header({ locale, copy }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header class={styles.topbar}>
      <a class={styles.skip} href={`#${anchors.main}`}>
        {copy.skipToContent}
      </a>
      <div class={`wrap ${styles.inner}`}>
        <Logo href={`/${locale}/`} />
        <nav class={styles.nav} aria-label={copy.mainNavLabel}>
          <NavLinks links={copy.nav} />
        </nav>
        <div class={styles.end}>
          <div class={styles.controls}>
            <ShellControls locale={locale} copy={copy} />
          </div>
          <Button href={`#${anchors.firstRun}`}>{copy.getStarted}</Button>
          <span class={styles.menu}>
            <Button onClick={() => setMenuOpen(true)} expanded={menuOpen} controls={sideNavId}>
              {copy.menu}
            </Button>
          </span>
        </div>
      </div>
      <SideNav locale={locale} copy={copy} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
