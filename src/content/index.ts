/**
 * The copy types, and the working tree's copy as one ContentBundle for the
 * places that render from source: the dev server (src/dev.ts) and Storybook.
 * scripts/check-data.mjs validates each file against its schema
 * (schemas/locale-*-v1.schema.json) and scripts/check-i18n.mjs checks keys,
 * en/ko parity, links and size.
 *
 * The site itself never bundles these imports: the renderer (src/render.tsx)
 * reads a content release's files as arguments and embeds each page's slice
 * in its HTML, which the browser hydrates from (src/main.tsx). Nothing below
 * src/pages imports these files either: pages and components receive the
 * copy objects as props.
 */
import type { Locale } from '../i18n';
import type {
  LocaleArchitectureAdaptersV1,
  LocaleArchitectureDetectionV1,
  LocaleArchitectureEvaluationMethodsV1,
  LocaleArchitectureHowItWorksV1,
  LocaleArchitectureOverviewV1,
  LocaleArchitectureSectionV1,
  LocaleArchitectureSupportClaimsV1,
  LocaleArchitectureVaultV1,
  LocaleCommunityV1,
  LocaleDocsV1,
  LocaleHomeV1,
  LocaleShellV1,
} from '../contracts';
import enShell from '../../i18n/en/shell.json';
import koShell from '../../i18n/ko/shell.json';
import enHome from '../../i18n/en/home.json';
import koHome from '../../i18n/ko/home.json';
import enCommunity from '../../i18n/en/community.json';
import koCommunity from '../../i18n/ko/community.json';
import enDocs from '../../i18n/en/docs.json';
import koDocs from '../../i18n/ko/docs.json';
import enSection from '../../i18n/en/architecture/section.json';
import koSection from '../../i18n/ko/architecture/section.json';
import enOverview from '../../i18n/en/architecture/overview.json';
import koOverview from '../../i18n/ko/architecture/overview.json';
import enHowItWorks from '../../i18n/en/architecture/how-it-works.json';
import koHowItWorks from '../../i18n/ko/architecture/how-it-works.json';
import enDetection from '../../i18n/en/architecture/detection.json';
import koDetection from '../../i18n/ko/architecture/detection.json';
import enSupportClaims from '../../i18n/en/architecture/support-claims.json';
import koSupportClaims from '../../i18n/ko/architecture/support-claims.json';
import enEvaluationMethods from '../../i18n/en/architecture/evaluation-methods.json';
import koEvaluationMethods from '../../i18n/ko/architecture/evaluation-methods.json';
import enAdapters from '../../i18n/en/architecture/adapters.json';
import koAdapters from '../../i18n/ko/architecture/adapters.json';
import enVault from '../../i18n/en/architecture/vault.json';
import koVault from '../../i18n/ko/architecture/vault.json';

export type ShellCopy = LocaleShellV1.LocaleShellV1;
export type HomeCopy = LocaleHomeV1.LocaleHomeV1;
export type CommunityCopy = LocaleCommunityV1.LocaleCommunityV1;
export type DocsCopy = LocaleDocsV1.LocaleDocsV1;
export type SectionCopy = LocaleArchitectureSectionV1.LocaleArchitectureSectionV1;
export type OverviewCopy = LocaleArchitectureOverviewV1.LocaleArchitectureOverviewV1;

/** One file per architecture page, by page ID (src/content/architecture/pages.ts). */
export type ArchitecturePagesCopy = {
  overview: OverviewCopy;
  'how-it-works': LocaleArchitectureHowItWorksV1.LocaleArchitectureHowItWorksV1;
  detection: LocaleArchitectureDetectionV1.LocaleArchitectureDetectionV1;
  'support-claims': LocaleArchitectureSupportClaimsV1.LocaleArchitectureSupportClaimsV1;
  'evaluation-methods': LocaleArchitectureEvaluationMethodsV1.LocaleArchitectureEvaluationMethodsV1;
  adapters: LocaleArchitectureAdaptersV1.LocaleArchitectureAdaptersV1;
  vault: LocaleArchitectureVaultV1.LocaleArchitectureVaultV1;
};

/** Everything one locale authors: i18n/<locale>/. */
export type LocaleContent = {
  shell: ShellCopy;
  home: HomeCopy;
  community: CommunityCopy;
  docs: DocsCopy;
  architecture: { section: SectionCopy; pages: ArchitecturePagesCopy };
};

export type ContentBundle = Record<Locale, LocaleContent>;

// JSON imports are typed by their literal shape; the schema is the contract
// (validated before the build), so they are asserted to the generated types.
const typed = <T,>(json: unknown) => json as T;

export const content: ContentBundle = {
  en: {
    shell: typed(enShell),
    home: typed(enHome),
    community: typed(enCommunity),
    docs: typed(enDocs),
    architecture: {
      section: typed(enSection),
      pages: {
        overview: typed(enOverview),
        'how-it-works': typed(enHowItWorks),
        detection: typed(enDetection),
        'support-claims': typed(enSupportClaims),
        'evaluation-methods': typed(enEvaluationMethods),
        adapters: typed(enAdapters),
        vault: typed(enVault),
      },
    },
  },
  ko: {
    shell: typed(koShell),
    home: typed(koHome),
    community: typed(koCommunity),
    docs: typed(koDocs),
    architecture: {
      section: typed(koSection),
      pages: {
        overview: typed(koOverview),
        'how-it-works': typed(koHowItWorks),
        detection: typed(koDetection),
        'support-claims': typed(koSupportClaims),
        'evaluation-methods': typed(koEvaluationMethods),
        adapters: typed(koAdapters),
        vault: typed(koVault),
      },
    },
  },
};
