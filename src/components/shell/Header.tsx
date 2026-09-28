import { useState } from 'preact/hooks';
import { Button, Logo } from '../ui';
import type { SiteContent } from '../../content';
import { anchors } from '../../content/shared';
import { homePath, type Locale } from '../../i18n';
import { NavLinks } from './NavLinks';
import { ShellControls, type Alternates } from './ShellControls';
import { SideNav, sideNavId } from './SideNav';
import styles from './Header.module.css';

export type HeaderProps = {
  locale: Locale;
  copy: SiteContent['shell'];
  /** This page in each locale, for the language switch. */
  alternates?: Alternates;
  /** Href of the nav link for the section being viewed. */
  current?: string;
};

/**
 * Green budget: only the logo mark is green here — "Get started" is the
 * outlined default button, not a brand fill (design spec § 09).
 */
export function Header({ locale, copy, alternates, current }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header class={styles.topbar}>
      <a class={styles.skip} href={`#${anchors.main}`}>
        {copy.skipToContent}
      </a>
      <div class={`wrap ${styles.inner}`}>
        <Logo href={homePath(locale)} />
        <nav class={styles.nav} aria-label={copy.mainNavLabel}>
          <NavLinks links={copy.nav} current={current} />
        </nav>
        <div class={styles.end}>
          <div class={styles.controls}>
            <ShellControls locale={locale} copy={copy} alternates={alternates} />
          </div>
          <Button href={`${homePath(locale)}#${anchors.firstRun}`}>{copy.getStarted}</Button>
          <span class={styles.menu}>
            <Button onClick={() => setMenuOpen(true)} expanded={menuOpen} controls={sideNavId}>
              {copy.menu}
            </Button>
          </span>
        </div>
      </div>
      <SideNav
        locale={locale}
        copy={copy}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        alternates={alternates}
        current={current}
      />
    </header>
  );
}
