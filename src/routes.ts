/**
 * The site's route registry (ADR 0003): every indexable page by its
 * unprefixed English path, the locale variants derived from it, and the
 * build-time files that must agree with it — sitemap.xml, robots.txt, and
 * the fallback documents at legacy /en/** paths. main.tsx renders these
 * routes; vite.config.ts emits the files; scripts/check-build-contract.mjs
 * checks the output.
 */
import { architecturePages, architecturePath, type ArchitecturePageId } from './content/architecture/pages';
import { anchors } from './content/shared';
import { defaultLocale, homePath, localePath, locales, type Locale } from './i18n';

export type PageRoute = { path: string; page: { kind: 'home' } | { kind: 'architecture'; id: ArchitecturePageId } };

/** Every indexable page, by its English (unprefixed) path. */
export const pageRoutes: readonly PageRoute[] = [
  { path: '/', page: { kind: 'home' } },
  ...architecturePages.map((p) => ({
    path: architecturePath(defaultLocale, p.id),
    page: { kind: 'architecture' as const, id: p.id },
  })),
];

/**
 * Route IDs: how locale copy (i18n/**) names an internal link target, so the
 * copy never carries a locale path. `home`, `architecture` (the hub), and
 * `architecture/<page>`.
 */
export type RouteId = 'home' | 'architecture' | `architecture/${Exclude<ArchitecturePageId, 'overview'>}`;

export const routeIds: readonly RouteId[] = pageRoutes.map((r) =>
  r.page.kind === 'home' ? 'home' : r.page.id === 'overview' ? 'architecture' : (`architecture/${r.page.id}` as RouteId),
);

/** In-page anchor IDs a link may name after `#`. */
export const anchorIds: readonly string[] = Object.values(anchors);

/**
 * Resolves a route reference from locale copy — `home#playground`,
 * `architecture/vault`, or `#community` (this page) — to a root-relative
 * href in `locale`. An unknown route or anchor is an error, never a guess.
 */
export function routeHref(locale: Locale, ref: string): string {
  const [id, anchor] = ref.split('#', 2) as [string, string | undefined];
  if (anchor !== undefined && !anchorIds.includes(anchor)) throw new Error(`unknown anchor in link "${ref}"`);
  const hash = anchor === undefined ? '' : `#${anchor}`;
  if (id === '') return hash;
  const route = pageRoutes.find((_r, i) => routeIds[i] === id);
  if (!route) throw new Error(`unknown route in link "${ref}"`);
  return `${route.page.kind === 'home' ? homePath(locale) : architecturePath(locale, route.page.id)}${hash}`;
}

/** The href of a copy link (i18n/**): a route reference resolved in `locale`, or its external URL. */
export function linkHref(locale: Locale, link: { to?: string; href?: string }): string {
  if (link.to !== undefined) return routeHref(locale, link.to);
  if (link.href !== undefined) return link.href;
  throw new Error('a link needs `to` or `href`');
}

/** Every indexable page in every locale: `/`, `/ko/`, `/architecture/vault/`, `/ko/architecture/vault/`, … */
export const localizedRoutes = locales.flatMap((locale) =>
  pageRoutes.map((route) => ({ ...route, locale, localized: localePath(locale, route.path) })),
);

/** Served for every missing path, in both route sets; never indexed. */
export const notFoundPath = '/404/';

/** hreflang → root-relative path: each locale's equivalent page, and x-default → English. */
export function alternatesFor(path: string): Record<Locale | 'x-default', string> {
  return {
    ...(Object.fromEntries(locales.map((l) => [l, localePath(l, path)])) as Record<Locale, string>),
    'x-default': localePath(defaultLocale, path),
  };
}

/**
 * Legacy English paths, kept as path-preserving redirects until 2027-03-31
 * (ADR 0003): `/en/architecture/vault/` → `/architecture/vault/`, never
 * everything to `/`.
 */
export const legacyRedirects = pageRoutes.map((route) => ({ from: `/en${route.path}`, to: route.path }));

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The fallback document at a legacy path, for the time before the edge 301
 * (redact-secret-sites) is live — and harmless after, since nothing reaches
 * it then. No script and no style attribute, so it passes the proposed CSP.
 */
export function legacyRedirectDocument(origin: string, to: string) {
  const url = escape(`${origin}${to}`);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <link rel="canonical" href="${url}" />
    <meta http-equiv="refresh" content="0; url=${escape(to)}" />
    <title>Moved — Redact Secret</title>
  </head>
  <body>
    <p>This page has moved to <a href="${escape(to)}">${url}</a>.</p>
  </body>
</html>
`;
}

/** Both route sets, each URL naming its hreflang alternates (and x-default). */
export function sitemapXml(origin: string) {
  const urls = localizedRoutes.map(({ path, localized }) => {
    const links = Object.entries(alternatesFor(path)).map(
      ([hreflang, href]) => `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${escape(`${origin}${href}`)}"/>`,
    );
    return [`  <url>`, `    <loc>${escape(`${origin}${localized}`)}</loc>`, ...links, `  </url>`].join('\n');
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

export function robotsTxt(origin: string) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
}
