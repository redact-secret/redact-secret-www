import type { ComponentChildren } from 'preact';
import type { SiteContent } from '../../content';
import { anchors } from '../../content/shared';
import { Footer } from './Footer';
import { Header } from './Header';
import type { Alternates } from './ShellControls';

export type AppShellProps = {
  content: SiteContent;
  children: ComponentChildren;
  /** This page in each locale; defaults to each locale's home. */
  alternates?: Alternates;
  /** Href of the header nav link for the section being viewed. */
  current?: string;
};

export function AppShell({ content, children, alternates, current }: AppShellProps) {
  return (
    <>
      <Header locale={content.locale} copy={content.shell} alternates={alternates} current={current} />
      <main id={anchors.main} tabIndex={-1}>
        {children}
      </main>
      <Footer locale={content.locale} copy={content.footer} alternates={alternates} />
    </>
  );
}
