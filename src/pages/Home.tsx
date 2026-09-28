import { PlaygroundSection } from '../components/playground';
import { AppShell } from '../components/shell';
import {
  BoundarySection,
  EvidenceSection,
  FinalCtaSection,
  HeroSection,
  IntegrationsSection,
  ProblemSection,
  QuickstartSection,
} from '../components/sections';
import { content } from '../content';
import type { Locale } from '../i18n';
import { slots } from '../slots';

/**
 * The eight blocks in their fixed order (ARCHITECTURE.md § Page structure):
 * problem → live demo → install → architecture → ecosystem → evidence.
 */
export function Home({ locale }: { locale: Locale }) {
  const c = content[locale];
  return (
    <AppShell content={c}>
      <HeroSection copy={c.hero} />
      <ProblemSection copy={c.problem} />
      <PlaygroundSection copy={c.playground} />
      <QuickstartSection copy={c.quickstart} core={slots.core} />
      <BoundarySection copy={c.boundary} />
      <IntegrationsSection copy={c.integrations} slots={slots} />
      <EvidenceSection copy={c.evidence} />
      <FinalCtaSection copy={c.final} />
    </AppShell>
  );
}
