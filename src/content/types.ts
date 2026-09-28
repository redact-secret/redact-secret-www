import type { ComponentChildren } from 'preact';
import type { CoreSlot, PackageStatus } from '../slots';
import type { FactKind, GroupDef, Runtime } from './integrations';
import type { Locale } from '../i18n';
import type { PiiMode } from '../playground/protocol';
import type { PlaygroundPreset } from './shared';

type Rich = ComponentChildren;
type Link = { label: Rich; href: string; external?: boolean };

export type IntegrationCopy = {
  title: Rich;
  description: Rich;
  /** What this package does NOT cover — a card without it does not ship (spec § 07). */
  coverage: Rich;
};

/**
 * Everything one locale authors. Code, package names, and versions are not
 * here — they are shared (./shared.ts) or slots (../slots).
 */
export type SiteContent = {
  locale: Locale;
  meta: { title: string; description: string };
  shell: {
    skipToContent: string;
    mainNavLabel: string;
    nav: Link[];
    getStarted: string;
    languageLabel: string;
    themeLabel: string;
    themeLight: string;
    themeDark: string;
    menu: string;
    closeMenu: string;
  };
  footer: {
    tagline: Rich;
    columns: { title: string; links: Link[] }[];
    channelNote: Rich;
    languageNote: Rich;
  };
  hero: {
    eyebrow: Rich;
    /** Line breaks are authored per locale with explicit <br>. */
    title: Rich;
    lede: Rich;
    primaryCta: string;
    secondaryCta: string;
    proof: Rich;
    io: { caption: string; footnote: Rich };
  };
  problem: {
    eyebrow: Rich;
    title: Rich;
    lede: Rich;
    sourceLabel: Rich;
    sourceNote: Rich;
    redactedLabel: string;
    destinations: { name: Rich; note: Rich }[];
    kept: string;
    counts: { value: string; label: Rich }[];
    remedy: Rich;
  };
  integrations: {
    eyebrow: Rich;
    title: Rich;
    lede: Rich;
    groups: Record<GroupDef['id'], { title: Rich; lede: Rich; link: string }>;
    runtimes: Record<Runtime, string>;
    terms: Record<FactKind, string>;
    statusLabels: Record<PackageStatus, string>;
    notPublished: string;
    cards: Record<string, IntegrationCopy>;
    observed: (date: string) => Rich;
  };
  quickstart: {
    eyebrow: Rich;
    title: Rich;
    lede: Rich;
    tabsLabel: string;
    rustNote: Rich;
    pinLabel: string;
    pin: (core: CoreSlot) => Rich;
    why: { title: Rich; body: Rich };
    expect: { title: Rich; body: Rich };
  };
  playground: {
    eyebrow: Rich;
    title: Rich;
    lede: Rich;
    privacy: Rich;
    presetsLabel: string;
    presets: Record<PlaygroundPreset, string>;
    styleLabel: string;
    piiLabel: string;
    piiModes: Record<PiiMode, string>;
    piiNote: Rich;
    inputLabel: string;
    outputLabel: string;
    clear: string;
    reset: string;
    loading: string;
    loadFailed: string;
    retry: string;
    staleEngine: string;
    reload: string;
    engine: (version: string, artifact: string) => Rich;
    size: (used: string, max: string) => string;
    findingCount: (n: number) => string;
    findingsTitle: Rich;
    columns: { id: string; type: string; detector: string; confidence: string; action: string; range: string };
    noFindings: Rich;
    errors: Partial<Record<string, string>> & { default: string };
  };
  boundary: {
    eyebrow: Rich;
    title: Rich;
    lede: Rich;
    flowLabel: string;
    flow: { key: Rich; title: Rich; description: Rich; core?: boolean }[];
    pillars: { title: Rich; body: Rich }[];
    links: Link[];
  };
  evidence: {
    eyebrow: Rich;
    title: Rich;
    lede: Rich;
    links: { title: Rich; body: Rich; go: Rich; href: string }[];
    routing: {
      title: Rich;
      problemHeader: string;
      startHeader: string;
      rows: { problem: Rich; start: Rich }[];
      note: Rich;
    };
    limits: { title: Rich; body: Rich[] };
  };
  final: {
    eyebrow: Rich;
    title: Rich;
    lede: Rich;
    primaryCta: string;
    secondaryCta: string;
  };
  notFound: { title: string; body: Rich; home: string };
};
