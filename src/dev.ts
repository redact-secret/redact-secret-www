/**
 * Development only (`npm run dev`): the working tree's copy and data for the
 * page being viewed. Loaded by src/main.tsx behind `import.meta.env.DEV`, so
 * a production build never includes it.
 */
import type { PagePayload } from './app';
import { viewFor } from './app';
import { content } from './content';
import type { SiteData } from './site-data';
import release from '../data/release.json';
import evidence from '../data/evidence.json';
import integrations from '../data/integrations.json';

const data = { release, evidence, integrations } as unknown as SiteData;

export function devPayload(pathname: string): PagePayload {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return { v: 1, path, view: viewFor(path, content), data };
}
