/**
 * Build-time content slots: the page's read-only view of the versioned data
 * contracts in data/ (schemas/, CONVENTIONS.md § Data contracts). Every
 * version, range, tag, date and count on the page comes from here — never
 * from prose in either locale. scripts/check-data.mjs validates the files
 * before the build reads them; the types are generated from the schemas.
 */
import releaseJson from '../../data/release.json';
import evidenceJson from '../../data/evidence.json';
import type { EvidenceV1, ReleaseV1 } from '../contracts';

const release = releaseJson as unknown as ReleaseV1.ReleaseV1;
const evidenceData = evidenceJson as unknown as EvidenceV1.EvidenceV1;

export type PackageStatus = 'released' | 'alpha' | 'unpublished';

type PackageRecord = ReleaseV1.PackageRecord;

export type PackageSlot = Omit<ReleaseV1.PackageValue, 'unpublished'> & {
  /** Set when the package is not on its registry; the version its repository declares if known. */
  unpublished?: string | true;
  pypi?: ReleaseV1.MirrorValue;
  crates?: ReleaseV1.MirrorValue;
  /** When this record was read, and whether a later refresh could not re-read it. */
  observedAt: string;
  freshness: ReleaseV1.Freshness;
};

export type CoreSlot = {
  observedAt: string;
  npm: string;
  npmLatest: string;
  pypi: string;
  crate: string;
};

export type ReleaseSlots = {
  /** The OLDEST observation among the records: a stale record is never dated as fresh. */
  observedAt: string;
  core: CoreSlot;
  packages: Record<string, PackageSlot>;
};

const day = (timestamp: string) => timestamp.slice(0, 10);

function toSlot(record: PackageRecord): PackageSlot {
  const { unpublished, ...value } = record.value;
  const slot: PackageSlot = { ...value, observedAt: day(record.observedAt), freshness: record.freshness };
  if (unpublished) slot.unpublished = record.declared?.version ?? true;
  if (record.mirrors?.pypi) slot.pypi = record.mirrors.pypi.value;
  if (record.mirrors?.crates) slot.crates = record.mirrors.crates.value;
  return slot;
}

function oldest(records: PackageRecord[]): string {
  const dates = records.flatMap((r) => [r.observedAt, ...Object.values(r.mirrors ?? {}).map((m) => m.observedAt)]);
  return day(dates.sort()[0]);
}

const records = Object.entries(release.packages).filter((e): e is [string, PackageRecord] => Boolean(e[1]));
const packages = Object.fromEntries(records.map(([id, record]) => [id, toSlot(record)]));

function required(id: string): PackageSlot {
  const slot = packages[id];
  if (!slot?.version) throw new Error(`data/release.json: package "${id}" has no published version`);
  return slot;
}

const coreSlot = required('core');
const coreRecord = release.packages.core!;

export const slots: ReleaseSlots = {
  observedAt: oldest(records.map(([, r]) => r)),
  core: {
    observedAt: oldest([coreRecord, release.packages.cli!]),
    npm: coreSlot.version!,
    npmLatest: coreSlot.latest ?? coreSlot.version!,
    pypi: coreSlot.pypi?.version ?? '',
    crate: required('cli').version!,
  },
  packages,
};

export function statusOf(slot: PackageSlot): PackageStatus {
  if (slot.unpublished) return 'unpublished';
  return /alpha|a\d+$/.test(slot.version ?? '') ? 'alpha' : 'released';
}

type Source = { repo: string; commit: string | null; release?: string };

function sourceView({ source }: EvidenceV1.EvidenceSource): Source {
  // Only a repository source is cited by commit; a registry source is cited by
  // its package version (the pages name the repository without a commit).
  if (source.kind === 'repository') {
    return { repo: source.repository, commit: source.revision.slice(0, 7), ...(source.release && { release: source.release }) };
  }
  return { repo: source.repository ?? source.package, commit: null };
}

type Facts = EvidenceV1.EvidenceV1['facts'];

/** Counts and limits the architecture pages cite (data/evidence.json), each tied to a source. */
export type EvidenceSlots = {
  observedAt: string;
  sources: Record<keyof EvidenceV1.EvidenceV1['sources'], Source>;
  matrix: Facts['matrix']['value'];
  taxonomy: Facts['taxonomy']['value'];
  staleProse: Facts['staleProse']['value'];
  baseline: Facts['baseline']['value'];
  detectors: Facts['detectors']['value'];
  coreLimits: Facts['coreLimits']['value'];
  adapterBudgets: Facts['adapterBudgets']['value'];
};

const { sources, facts } = evidenceData;

export const evidence: EvidenceSlots = {
  observedAt: day(evidenceData.observedAt),
  sources: {
    core: sourceView(sources.core),
    benchmarks: sourceView(sources.benchmarks),
    adapters: sourceView(sources.adapters),
    vault: sourceView(sources.vault),
  },
  matrix: facts.matrix.value,
  taxonomy: facts.taxonomy.value,
  staleProse: facts.staleProse.value,
  baseline: facts.baseline.value,
  detectors: facts.detectors.value,
  coreLimits: facts.coreLimits.value,
  adapterBudgets: facts.adapterBudgets.value,
};
