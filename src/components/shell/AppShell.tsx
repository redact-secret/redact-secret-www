import type { ComponentChildren } from 'preact';
import type { ShellCopy } from '../../content';
import { anchors } from '../../content/shared';
import type { Locale } from '../../i18n';
import { RichLocale } from '../ui/Rich';
import { Footer } from './Footer';
import { Header } from './Header';
import type { Alternates } from './ShellControls';

export type AppShellProps = {
  locale: Locale;
  /** i18n/<locale>/shell.json */
  copy: ShellCopy;
  children: ComponentChildren;
  /** This page in each locale; defaults to each locale's home. */
  alternates?: Alternates;
  /** Href of the header nav link for the section being viewed. */
  current?: string;
};

export function AppShell({ locale, copy, children, alternates, current }: AppShellProps) {
  return (
    <RichLocale.Provider value={locale}>
      <Header locale={locale} copy={copy.header} alternates={alternates} current={current} />
      <main id={anchors.main} tabIndex={-1}>
        {children}
      </main>
      <Footer locale={locale} copy={copy.footer} alternates={alternates} />
    </RichLocale.Provider>
  );
}
