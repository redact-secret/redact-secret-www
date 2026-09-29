/**
 * The renderer: the server-side entry an application release builds into a
 * self-contained module (build/renderer/renderer.mjs, scripts/build-site.mjs)
 * and publishes as its renderer artifact (#11). It turns a content release's
 * files — i18n/<locale>/**.json and data/*.json — into the complete HTML of
 * every page, against the HTML template of the same application release
 * (whose hashed asset references it keeps as they are).
 *
 * The build renders dist/ through this module, and a content-only publish
 * renders through the deployed copy of it, so an application release and a
 * content release produce the same bytes from the same inputs.
 *
 * Nothing here imports i18n/ or data/: the inputs are arguments.
 */
import { renderToString } from 'preact-render-to-string';
import { App, payloadElementId, viewFor, type PagePayload } from './app';
import type { ContentBundle, LocaleContent } from './content';
import { architecturePages } from './content/architecture/pages';
import { siteOrigin } from './content/shared';
import { locales, splitLocalePath, type Locale } from './i18n';
import { alternatesFor, localizedRoutes, notFoundPath, pageRoutes } from './routes';
import { installSiteData, siteDataFiles, type SiteData } from './site-data';

/** Bumped when the interface below changes; a publisher refuses a renderer it does not know. */
export const rendererApi = 1;

export { locales };

/** Every served path this renderer writes: both locales' pages, then the 404 page. */
export const pagePaths: readonly string[] = [...localizedRoutes.map((r) => r.localized), notFoundPath];

/** `/ko/architecture/vault/` → `ko/architecture/vault/index.html`; `/` → `index.html`. */
export function htmlFileFor(path: string) {
  return `${path.slice(1)}index.html`;
}

/** The locale a page is written in, or null for the 404 page, which speaks every locale. */
export function localeOfPath(path: string): Locale | null {
  return path === notFoundPath ? null : splitLocalePath(path).locale;
}

const copyFiles = ['shell.json', 'home.json', 'community.json', 'architecture/section.json', ...architecturePages.map((p) => `architecture/${p.id}.json`)];

/** Every source file of a content release, repository-relative: each locale's copy, then the data. */
export function inputFiles(): string[] {
  return [...locales.flatMap((l) => copyFiles.map((f) => `i18n/${l}/${f}`)), ...Object.values(siteDataFiles)];
}

/** Assembles the renderer's inputs from parsed files keyed by inputFiles() paths. */
export function inputsFrom(files: Record<string, unknown>): { content: ContentBundle; data: SiteData } {
  const read = <T,>(path: string): T => {
    if (!(path in files)) throw new Error(`renderer: missing input ${path}`);
    return files[path] as T;
  };
  const localeContent = (l: Locale): LocaleContent => ({
    shell: read(`i18n/${l}/shell.json`),
    home: read(`i18n/${l}/home.json`),
    community: read(`i18n/${l}/community.json`),
    architecture: {
      section: read(`i18n/${l}/architecture/section.json`),
      pages: Object.fromEntries(architecturePages.map((p) => [p.id, read(`i18n/${l}/architecture/${p.id}.json`)])) as LocaleContent['architecture']['pages'],
    },
  });
  const content = Object.fromEntries(locales.map((l) => [l, localeContent(l)])) as ContentBundle;
  const data = Object.fromEntries(Object.entries(siteDataFiles).map(([k, path]) => [k, read(path)])) as SiteData;
  return { content, data };
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
  const route = path === notFoundPath ? undefined : pageRoutes.find((r) => r.path === unprefixed);
  // Anything else prerendered is the 404 page, served for every missing path.
  if (!route) return { lang: 'en', title: 'Redact Secret', description: content.en.home.meta.description, noindex: true };

  const meta = content[locale].home.meta;
  const alternates = alternatesFor(unprefixed);
  if (route.page.kind === 'home') return { lang: locale, title: meta.title, description: meta.description, alternates };
  if (route.page.kind === 'community') {
    const c = content[locale].community.meta;
    return { lang: locale, title: c.title, description: c.description, alternates };
  }
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

/** The page's body markup and <head> for one served path (`/ko/architecture/`). */
export async function prerender(request: { url: string }, content: ContentBundle, data: SiteData) {
  // Served paths end in a slash (directory routing); that is the canonical form.
  const path = request.url.endsWith('/') ? request.url : `${request.url}/`;
  installSiteData(data);
  const view = viewFor(path, content);
  const html = renderToString(<App view={view} />);
  const head = headFor(path, content);

  const elements: HeadElement[] = [
    { type: 'link', props: { rel: 'canonical', href: `${siteOrigin}${path}` } },
    { type: 'meta', props: { name: 'description', content: head.description } },
  ];
  // The 404 page is served for every missing path; keep it out of search.
  if (head.noindex) elements.push({ type: 'meta', props: { name: 'robots', content: 'noindex' } });
  for (const [hreflang, href] of Object.entries(head.alternates ?? {})) {
    elements.push({ type: 'link', props: { rel: 'alternate', hreflang, href: `${siteOrigin}${href}` } });
  }
  const payload: PagePayload = { v: 1, path, view, data };
  return { html, payload, head: { lang: head.lang, title: head.title, elements } };
}

const escapeText = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (text: string) => escapeText(text).replace(/"/g, '&quot;');

/**
 * JSON that is inert inside a <script type="application/json"> element: no
 * `<` can close it, and U+2028/2029 cannot end a line. JSON.parse reads it
 * back unchanged.
 */
export function inertJson(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function replaceOnce(template: string, marker: string, replacement: string) {
  const at = template.indexOf(marker);
  if (at < 0 || template.indexOf(marker, at + 1) >= 0) throw new Error(`renderer: the template must contain ${marker} exactly once`);
  return template.slice(0, at) + replacement + template.slice(at + marker.length);
}

/**
 * One complete HTML document: the template (the application release's
 * index.html, with its hashed script and stylesheet references) with this
 * page's <head>, its prerendered body, and its payload as inert JSON after
 * the mount point, where hydration does not see it.
 */
export async function renderDocument(template: string, path: string, content: ContentBundle, data: SiteData) {
  const { html, payload, head } = await prerender({ url: path }, content, data);
  const tags = head.elements.map(({ type, props }) => {
    const attrs = Object.entries(props)
      .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
      .join('');
    return `<${type}${attrs}>`;
  });
  let doc = replaceOnce(template, '<html>', `<html lang="${escapeAttr(head.lang)}">`);
  doc = replaceOnce(doc, '<head>', `<head>\n    <title>${escapeText(head.title)}</title>`);
  doc = replaceOnce(doc, '</head>', `  ${tags.join('\n    ')}\n  </head>`);
  doc = replaceOnce(
    doc,
    '<div id="app"></div>',
    `<div id="app">${html}</div>\n    <script type="application/json" id="${payloadElementId}">${inertJson(payload)}</script>`,
  );
  return { html: doc, payload };
}

/**
 * Every page of the site from one content release's files (keyed by
 * inputFiles() paths). `payload` is the JSON each page embeds, for the
 * publisher's secret scan.
 */
export async function renderSite(template: string, files: Record<string, unknown>) {
  const { content, data } = inputsFrom(files);
  const pages = [];
  for (const path of pagePaths) {
    const { html, payload } = await renderDocument(template, path, content, data);
    pages.push({ path, file: htmlFileFor(path), locale: localeOfPath(path), html, payload });
  }
  return pages;
}
