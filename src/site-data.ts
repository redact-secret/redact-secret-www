/**
 * The public data a content release carries next to the copy (data/*.json,
 * CONVENTIONS.md § Data contracts). The application bundle never imports
 * these files: the renderer passes a release's data in, and the browser reads
 * the page's own copy of it from the HTML (src/main.tsx), so a data change is
 * a content release and leaves every file under assets/ unchanged (#11).
 */
import type { EvidenceV1, IntegrationsV1, ReleaseV1 } from './contracts';
import { installIntegrations } from './content/integrations';
import { installSnippets } from './content/shared';
import { installReleaseData, slots } from './slots';

export type SiteData = {
  release: ReleaseV1.ReleaseV1;
  evidence: EvidenceV1.EvidenceV1;
  integrations: IntegrationsV1.IntegrationsV1;
};

/** Where each part of SiteData lives in a source tree (and in a content release). */
export const siteDataFiles: Record<keyof SiteData, string> = {
  release: 'data/release.json',
  evidence: 'data/evidence.json',
  integrations: 'data/integrations.json',
};

/** Derives every slot from the release's data. Call once before rendering. */
export function installSiteData(data: SiteData) {
  installReleaseData(data.release, data.evidence);
  installSnippets(slots.core);
  installIntegrations(data.integrations);
}
