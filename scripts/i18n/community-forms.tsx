// Loaded by check-i18n.mjs through Vite's SSR loader, so Preact, the
// renderer and the component share one module instance (hooks need that).
// Renders the community router once per feedback kind: the page prerenders
// only the default form, and every other form's words must still be read.
import { renderToString } from 'preact-render-to-string';
import { CommunityDesk } from '../../src/components/community/CommunityDesk';
import type { CommunityCopy } from '../../src/content';
import { feedbackKinds } from '../../src/content/community';
import type { Locale } from '../../src/i18n';

export function renderEveryForm(locale: Locale, copy: CommunityCopy): string[] {
  const errors: string[] = [];
  for (const { key } of feedbackKinds) {
    try {
      renderToString(<CommunityDesk locale={locale} copy={copy} version="0.0.0" initialKey={key} />);
    } catch (e) {
      errors.push(`community form "${key}" (${locale}): render failed: ${(e as Error).message}`);
    }
  }
  return errors;
}
