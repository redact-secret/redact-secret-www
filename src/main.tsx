import { hydrate, LocationProvider, prerender as ssr, Route, Router } from 'preact-iso';
import { Architecture } from './pages/Architecture';
import { Home } from './pages/Home';
import { LocaleChooser } from './pages/LocaleChooser';
import { NotFound } from './pages/NotFound';
import { content } from './content';
import { architecturePages, architecturePath } from './content/architecture/pages';
import { architectureShell } from './content/architecture/shell';
import { siteOrigin } from './content/shared';
import { isLocale, locales, type Locale } from './i18n';
import './tokens.css';
import './style.css';

/** Every architecture page in every locale: /en/architecture/, /ko/architecture/detection/, … */
const architectureRoutes = locales.flatMap((locale) =>
  architecturePages.map((page) => ({ locale, id: page.id, path: architecturePath(locale, page.id) })),
);

/**
 * Directory routing: every page is its own prerendered document with its own
 * <head> (title, canonical, lang), so links load documents rather than being
 * intercepted as client-side route changes. A scope no href matches keeps
 * preact-iso's router from intercepting any click.
 */
const noClientNavigation = /(?!)/;

export function App() {
  return (
    <LocationProvider scope={noClientNavigation}>
      <Router>
        <Route path="/" component={LocaleChooser} />
        <Route path="/en/" component={() => <Home locale="en" />} />
        <Route path="/ko/" component={() => <Home locale="ko" />} />
        {architectureRoutes.map((r) => (
          <Route key={r.path} path={r.path} component={() => <Architecture locale={r.locale} id={r.id} />} />
        ))}
        <Route default component={NotFound} />
      </Router>
    </LocationProvider>
  );
}

if (typeof window !== 'undefined') {
  hydrate(<App />, document.getElementById('app')!);
}

type HeadElement = { type: string; props: Record<string, string> };
type PageHead = {
  title: string;
  description: string;
  /** hreflang → path, when the page exists as a translation in every locale. */
  alternates?: Record<string, string>;
  noindex?: boolean;
};

function headFor(path: string, lang: Locale, pageLocale: Locale | undefined): PageHead {
  const meta = content[lang].meta;
  const arch = architectureRoutes.find((r) => r.path === path);
  if (arch) {
    const a = architectureShell[arch.locale];
    const page = a.pages[arch.id];
    const title = `${page.title} — ${arch.id === 'overview' ? 'Redact Secret' : `${a.section} · Redact Secret`}`;
    return {
      title,
      description: page.description,
      alternates: Object.fromEntries(locales.map((l) => [l, architecturePath(l, arch.id)])),
    };
  }
  return {
    title: pageLocale ? meta.title : 'Redact Secret',
    description: meta.description,
    alternates: pageLocale ? { ...Object.fromEntries(locales.map((l) => [l, `/${l}/`])), 'x-default': '/' } : undefined,
    noindex: path === '/404/',
  };
}

export async function prerender(data: { url: string }) {
  const { html, links } = await ssr(<App />);
  // The prerenderer passes paths without a trailing slash; directory
  // routing serves them with one, so that is the canonical form.
  const path = data.url.endsWith('/') ? data.url : `${data.url}/`;
  const segment = path.split('/')[1] ?? '';
  const pageLocale: Locale | undefined = isLocale(segment) ? segment : undefined;
  const lang: Locale = pageLocale ?? 'en';
  const head = headFor(path, lang, pageLocale);

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
    head: { lang, title: head.title, elements },
  };
}
