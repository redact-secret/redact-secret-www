/**
 * The page tree, shared by the renderer (src/render.tsx) and the browser
 * (src/main.tsx). A page is rendered from a PagePayload: which page, the copy
 * it shows, and the release's data. The renderer embeds that same payload in
 * the HTML as inert JSON, so the browser hydrates the prerendered markup from
 * exactly the objects it was rendered from — no fetch, and no application
 * rebuild when copy or data changes (#11).
 */
import { Architecture, type ArchitecturePageCopy } from './pages/Architecture';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import type { ContentBundle, HomeCopy, SectionCopy, ShellCopy } from './content';
import type { Locale } from './i18n';
import { localizedRoutes, notFoundPath } from './routes';
import type { SiteData } from './site-data';

/** One page's copy: only what that page renders, never the whole bundle. */
export type PageView =
  | { kind: 'home'; locale: Locale; shell: ShellCopy; copy: HomeCopy }
  | { kind: 'architecture'; locale: Locale; shell: ShellCopy; section: SectionCopy; page: ArchitecturePageCopy }
  | { kind: 'not-found'; shells: Record<Locale, ShellCopy> };

/** Embedded in every page as `<script type="application/json" id="page-data">`. */
export type PagePayload = { v: 1; path: string; view: PageView; data: SiteData };

export const payloadElementId = 'page-data';

/** The view for a served path (`/ko/architecture/vault/`); anything unknown is the 404 page. */
export function viewFor(path: string, content: ContentBundle): PageView {
  const route = path === notFoundPath ? undefined : localizedRoutes.find((r) => r.localized === path);
  if (!route) return { kind: 'not-found', shells: { en: content.en.shell, ko: content.ko.shell } };
  const c = content[route.locale];
  if (route.page.kind === 'home') return { kind: 'home', locale: route.locale, shell: c.shell, copy: c.home };
  const { id } = route.page;
  return {
    kind: 'architecture',
    locale: route.locale,
    shell: c.shell,
    section: c.architecture.section,
    page: { id, copy: c.architecture.pages[id] } as ArchitecturePageCopy,
  };
}

export function App({ view }: { view: PageView }) {
  if (view.kind === 'home') return <Home locale={view.locale} shell={view.shell} copy={view.copy} />;
  if (view.kind === 'architecture') return <Architecture locale={view.locale} shell={view.shell} section={view.section} page={view.page} />;
  return <NotFound shells={view.shells} />;
}
