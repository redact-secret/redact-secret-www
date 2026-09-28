export const locales = ['en', 'ko'] as const;
export type Locale = (typeof locales)[number];

/**
 * English is served without a prefix (`/`, `/architecture/`); every other
 * locale under its own (`/ko/`, `/ko/architecture/`). ADR 0003.
 */
export const defaultLocale: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export const localeNames: Record<Locale, string> = {
  en: 'EN',
  ko: '한국어',
};

/** `''` for English, `/ko` for Korean. */
export function localePrefix(locale: Locale) {
  return locale === defaultLocale ? '' : `/${locale}`;
}

/**
 * A root-relative path in one locale, from its unprefixed (English) form:
 * `localePath('ko', '/architecture/')` → `/ko/architecture/`.
 */
export function localePath(locale: Locale, path: string) {
  return `${localePrefix(locale)}${path}`;
}

/** The locale home page: `/` or `/ko/`. */
export function homePath(locale: Locale) {
  return localePath(locale, '/');
}

/**
 * Splits a served path into its locale and unprefixed form:
 * `/ko/architecture/` → `{ locale: 'ko', path: '/architecture/' }`.
 */
export function splitLocalePath(path: string): { locale: Locale; path: string } {
  const segment = path.split('/')[1] ?? '';
  if (segment !== defaultLocale && isLocale(segment)) return { locale: segment, path: path.slice(segment.length + 1) || '/' };
  return { locale: defaultLocale, path };
}
