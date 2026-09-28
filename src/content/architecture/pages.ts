/**
 * The architecture section's seven pages, in reading order (design spec § 02):
 * the hub, then engine → evidence → boundaries. Order here is the sidebar
 * order and the prev/next order; the last page's "next" returns to the hub.
 */
import type { Locale } from '../../i18n';
import { architectureOriginals } from '../shared';

export type ArchitectureGroup = 'section' | 'engine' | 'evidence' | 'boundaries';

export type SubPageId = keyof typeof architectureOriginals;
export type ArchitecturePageId = 'overview' | SubPageId;

type PageDef = { id: ArchitecturePageId; slug: string; group: ArchitectureGroup; n: string };

export const architecturePages: readonly PageDef[] = [
  { id: 'overview', slug: '', group: 'section', n: '00' },
  { id: 'how-it-works', slug: 'how-it-works', group: 'engine', n: '01' },
  { id: 'detection', slug: 'detection', group: 'engine', n: '02' },
  { id: 'support-claims', slug: 'support-claims', group: 'evidence', n: '03' },
  { id: 'evaluation-methods', slug: 'evaluation-methods', group: 'evidence', n: '04' },
  { id: 'adapters', slug: 'adapters', group: 'boundaries', n: '05' },
  { id: 'vault', slug: 'vault', group: 'boundaries', n: '06' },
];

export const architectureGroups: readonly ArchitectureGroup[] = ['section', 'engine', 'evidence', 'boundaries'];

/** `/ko/architecture/detection/` — directory-routed, trailing slash. */
export function architecturePath(locale: Locale, id: ArchitecturePageId) {
  const page = architecturePages.find((p) => p.id === id)!;
  return `/${locale}/architecture/${page.slug ? `${page.slug}/` : ''}`;
}

export function isSubPage(id: ArchitecturePageId): id is SubPageId {
  return id !== 'overview';
}
