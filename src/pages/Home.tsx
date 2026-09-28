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
import type { HomeCopy, ShellCopy } from '../content';
import type { Locale } from '../i18n';
import { slots } from '../slots';

export type HomeProps = {
  locale: Locale;
  /** i18n/<locale>/shell.json */
  shell: ShellCopy;
  /** i18n/<locale>/home.json */
  copy: HomeCopy;
};

/**
 * The eight blocks in their fixed order (ARCHITECTURE.md § Page structure):
 * problem → live demo → install → architecture → ecosystem → evidence.
 */
export function Home({ locale, shell, copy }: HomeProps) {
  return (
    <AppShell locale={locale} copy={shell}>
      <HeroSection copy={copy.hero} />
      <ProblemSection copy={copy.problem} />
      <PlaygroundSection copy={copy.playground} />
      <QuickstartSection copy={copy.quickstart} core={slots.core} />
      <BoundarySection locale={locale} copy={copy.boundary} />
      <IntegrationsSection copy={copy.integrations} slots={slots} />
      <EvidenceSection copy={copy.evidence} />
      <FinalCtaSection copy={copy.final} />
    </AppShell>
  );
}
