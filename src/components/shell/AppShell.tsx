import type { ComponentChildren } from 'preact';
import type { SiteContent } from '../../content';
import { anchors } from '../../content/shared';
import { Footer } from './Footer';
import { Header } from './Header';

export type AppShellProps = {
  content: SiteContent;
  children: ComponentChildren;
};

export function AppShell({ content, children }: AppShellProps) {
  return (
    <>
      <Header locale={content.locale} copy={content.shell} />
      <main id={anchors.main} tabIndex={-1}>
        {children}
      </main>
      <Footer locale={content.locale} copy={content.footer} />
    </>
  );
}
