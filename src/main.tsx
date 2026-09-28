import { hydrate, LocationProvider, prerender as ssr, Route, Router } from 'preact-iso';
import { Home } from './pages/Home';
import { LocaleChooser } from './pages/LocaleChooser';
import { NotFound } from './pages/NotFound';
import { content } from './content';
import { siteOrigin } from './content/shared';
import { isLocale, locales, type Locale } from './i18n';
import './tokens.css';
import './style.css';

export function App() {
  return (
    <LocationProvider>
      <Router>
        <Route path="/" component={LocaleChooser} />
        <Route path="/en/" component={() => <Home locale="en" />} />
        <Route path="/ko/" component={() => <Home locale="ko" />} />
        <Route default component={NotFound} />
      </Router>
    </LocationProvider>
  );
}

if (typeof window !== 'undefined') {
  hydrate(<App />, document.getElementById('app')!);
}

type HeadElement = { type: string; props: Record<string, string> };

export async function prerender(data: { url: string }) {
  const { html, links } = await ssr(<App />);
  // The prerenderer passes paths without a trailing slash; directory
  // routing serves them with one, so that is the canonical form.
  const path = data.url.endsWith('/') ? data.url : `${data.url}/`;
  const segment = path.split('/')[1] ?? '';
  const pageLocale: Locale | undefined = isLocale(segment) ? segment : undefined;
  const lang: Locale = pageLocale ?? 'en';
  const meta = content[lang].meta;

  const elements = new Set<HeadElement>([
    { type: 'link', props: { rel: 'canonical', href: `${siteOrigin}${path}` } },
    { type: 'meta', props: { name: 'description', content: meta.description } },
  ]);
  // The 404 page is served for every missing path; keep it out of search.
  if (path === '/404/') elements.add({ type: 'meta', props: { name: 'robots', content: 'noindex' } });
  if (pageLocale) {
    for (const l of locales) {
      elements.add({ type: 'link', props: { rel: 'alternate', hreflang: l, href: `${siteOrigin}/${l}/` } });
    }
    elements.add({ type: 'link', props: { rel: 'alternate', hreflang: 'x-default', href: `${siteOrigin}/` } });
  }

  return {
    html,
    links,
    head: { lang, title: pageLocale ? meta.title : 'Redact Secret', elements },
  };
}
