/**
 * Build-time content slots. Every version, range, tag, and date on the page
 * comes from release.json — refreshed from the registries by
 * `npm run slots:refresh` and committed — never from prose in either locale.
 * See CONVENTIONS.md § Content slots.
 */
import release from './release.json';
import evidenceJson from './evidence.json';

export type PackageStatus = 'released' | 'alpha' | 'unpublished';

type Mirror = { name: string; version: string; published?: string };

export type PackageSlot = {
  registry: 'npm' | 'pypi' | 'crates';
  name: string;
  version?: string;
  published?: string;
  /** npm dist-tag this page installs from, and where `latest` points. */
  tag?: string;
  latest?: string;
  peers?: Record<string, string>;
  /** PyPI `requires_dist`. */
  requires?: string[];
  /** Set when the package is not on its registry; the repository version if known. */
  unpublished?: string | true;
  pypi?: Mirror;
  crates?: Mirror;
};

export type CoreSlot = {
  observedAt: string;
  npm: string;
  npmLatest: string;
  pypi: string;
  crate: string;
};

export type ReleaseSlots = {
  observedAt: string;
  core: CoreSlot;
  packages: Record<string, PackageSlot>;
};

export const slots = release as unknown as ReleaseSlots;

export function statusOf(slot: PackageSlot): PackageStatus {
  if (slot.unpublished) return 'unpublished';
  return /alpha|a\d+$/.test(slot.version ?? '') ? 'alpha' : 'released';
}

type Source = { repo: string; commit: string | null; release?: string };

/** Counts and limits the architecture pages cite (evidence.json), each tied to a source file. */
export type EvidenceSlots = {
  observedAt: string;
  sources: Record<'core' | 'benchmarks' | 'adapters' | 'vault', Source>;
  matrix: {
    families: number;
    providers: number;
    status: Record<'stable' | 'unsupported' | 'provisional' | 'pending', number>;
    stableBasis: Record<'documented' | 'empirical', number>;
    tiers: Record<'T1' | 'T2' | 'T3' | 'T0', number>;
  };
  taxonomy: { families: number; providers: number; withoutDetector: number };
  staleProse: { families: number; providers: number; dated: string };
  baseline: string;
  detectors: { structural: number; alphabets: number };
  coreLimits: { inputMiB: number; findings: number };
  adapterBudgets: Record<'depth' | 'arrayLength' | 'objectKeys' | 'leaves' | 'stringChars', number>;
};

export const evidence = evidenceJson as unknown as EvidenceSlots;
