import { hydrate, LocationProvider, prerender as ssr, Route, Router } from 'preact-iso';
import { Architecture, type ArchitecturePageCopy } from './pages/Architecture';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { content as staticContent, type ContentBundle } from './content';
import { siteOrigin } from './content/shared';
import { splitLocalePath, type Locale } from './i18n';
import { alternatesFor, localizedRoutes, pageRoutes, type PageRoute } from './routes';
import './tokens.css';
import './style.css';

/**
 * Directory routing: every page is its own prerendered document with its own
 * <head> (title, canonical, lang), so links load documents rather than being
 * intercepted as client-side route changes. A scope no href matches keeps
 * preact-iso's router from intercepting any click.
 */
const noClientNavigation = /(?!)/;

function Page({ locale, page, content }: { locale: Locale; page: PageRoute['page']; content: ContentBundle }) {
  const c = content[locale];
  if (page.kind === 'home') return <Home locale={locale} shell={c.shell} copy={c.home} />;
  const { id } = page;
  return (
    <Architecture
      locale={locale}
      shell={c.shell}
      section={c.architecture.section}
      page={{ id, copy: c.architecture.pages[id] } as ArchitecturePageCopy}
    />
  );
}

/**
 * English at `/`, Korean at `/ko/` (ADR 0003); every other path is the 404
 * page. `content` is every locale's copy (i18n/**); the build passes the
 * files it imported, a renderer may pass any validated set.
 */
export function App({ content = staticContent }: { content?: ContentBundle }) {
  const shells = { en: content.en.shell, ko: content.ko.shell };
  return (
    <LocationProvider scope={noClientNavigation}>
      <Router>
        {localizedRoutes.map((r) => (
          <Route
            key={r.localized}
            path={r.localized}
            component={() => <Page locale={r.locale} page={r.page} content={content} />}
          />
        ))}
        <Route default component={() => <NotFound shells={shells} />} />
      </Router>
    </LocationProvider>
  );
}

if (typeof window !== 'undefined') {
  hydrate(<App />, document.getElementById('app')!);
}

type HeadElement = { type: string; props: Record<string, string> };
type PageHead = {
  lang: Locale;
  title: string;
  description: string;
  /** hreflang → path: every locale's equivalent page, plus x-default (English). */
  alternates?: Record<string, string>;
  noindex?: boolean;
};

function headFor(path: string, content: ContentBundle): PageHead {
  const { locale, path: unprefixed } = splitLocalePath(path);
  const route = pageRoutes.find((r) => r.path === unprefixed);
  // Anything else prerendered is the 404 page, served for every missing path.
  if (!route) return { lang: 'en', title: 'Redact Secret', description: content.en.home.meta.description, noindex: true };

  const meta = content[locale].home.meta;
  const alternates = alternatesFor(unprefixed);
  if (route.page.kind === 'home') return { lang: locale, title: meta.title, description: meta.description, alternates };
  const a = content[locale].architecture.section;
  const id = route.page.id;
  const page = a.pages[id];
  return {
    lang: locale,
    title: `${page.title} — ${id === 'overview' ? 'Redact Secret' : `${a.section} · Redact Secret`}`,
    description: page.description,
    alternates,
  };
}

export async function prerender(data: { url: string }, content: ContentBundle = staticContent) {
  const { html, links } = await ssr(<App content={content} />);
  // The prerenderer passes paths without a trailing slash; directory
  // routing serves them with one, so that is the canonical form.
  const path = data.url.endsWith('/') ? data.url : `${data.url}/`;
  const head = headFor(path, content);

  const elements = new Set<HeadElement>([
    { type: 'link', props: { rel: 'canonical', href: `${siteOrigin}${path}` } },
    { type: 'meta', props: { name: 'description', content: head.description } },
  ]);
  // The 404 page is served for every missing path; keep it out of search.
  if (head.noindex) elements.add({ type: 'meta', props: { name: 'robots', content: 'noindex' } });
  for (const [hreflang, href] of Object.entries(head.alternates ?? {})) {
    elements.add({ type: 'link', props: { rel: 'alternate', hreflang, href: `${siteOrigin}${href}` } });
  }

  return {
    html,
    links,
    head: { lang: head.lang, title: head.title, elements },
  };
}
