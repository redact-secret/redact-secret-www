import { localePath, type Locale } from '../../i18n';

export const docsGroups = ['start', 'core', 'integrations', 'products', 'concepts'] as const;
export type DocsGroup = (typeof docsGroups)[number];

export const docsPages = [
  { id: 'overview', group: 'start', path: '/docs/', n: '00' },
  { id: 'quickstart', group: 'start', path: '/docs/quickstart/', n: '01' },
  { id: 'installation', group: 'start', path: '/docs/installation/', n: '02' },
  { id: 'javascript', group: 'core', path: '/docs/core/javascript/', n: '03' },
  { id: 'python', group: 'core', path: '/docs/core/python/', n: '04' },
  { id: 'pino', group: 'integrations', path: '/docs/integrations/pino/', n: '05' },
  { id: 'opentelemetry', group: 'integrations', path: '/docs/integrations/opentelemetry/', n: '06' },
  { id: 'python-logging', group: 'integrations', path: '/docs/integrations/python-logging/', n: '07' },
  { id: 'mcp', group: 'integrations', path: '/docs/integrations/mcp/', n: '08' },
  { id: 'ai-context', group: 'integrations', path: '/docs/integrations/ai-context/', n: '09' },
  { id: 'gateway', group: 'products', path: '/docs/gateway/', n: '10' },
  { id: 'vault', group: 'products', path: '/docs/vault/', n: '11' },
  { id: 'detection-policies', group: 'concepts', path: '/docs/concepts/detection-policies/', n: '12' },
  { id: 'supported-credentials', group: 'concepts', path: '/docs/reference/supported-credentials/', n: '13' },
  { id: 'security', group: 'concepts', path: '/docs/security/', n: '14' },
  { id: 'troubleshooting', group: 'concepts', path: '/docs/troubleshooting/', n: '15' },
] as const satisfies readonly { id: string; group: DocsGroup; path: `/${string}/`; n: string }[];

export type DocsPageId = (typeof docsPages)[number]['id'];

export function docsPath(locale: Locale, id: DocsPageId) {
  const page = docsPages.find((candidate) => candidate.id === id);
  if (!page) throw new Error(`unknown docs page "${id}"`);
  return localePath(locale, page.path);
}
