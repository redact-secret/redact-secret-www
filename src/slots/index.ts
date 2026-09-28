/**
 * Content slots: the page's read-only view of the versioned data contracts
 * in data/ (schemas/, CONVENTIONS.md § Data contracts). Every version, range,
 * tag, date and count on the page comes from here — never from prose in
 * either locale. scripts/check-data.mjs validates the files before anything
 * renders them; the types are generated from the schemas.
 *
 * Nothing here imports data/*.json: the data is part of a content release
 * (#11), not of the application bundle. The renderer and the browser each
 * call installSiteData (src/site-data.ts) once, with the release's files,
 * before rendering; `slots` and `evidence` are live bindings read at render
 * time.
 */
import type { EvidenceV1, ReleaseV1 } from '../contracts';

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

function releaseSlots(release: ReleaseV1.ReleaseV1): ReleaseSlots {
  const records = Object.entries(release.packages).filter((e): e is [string, PackageRecord] => Boolean(e[1]));
  const packages = Object.fromEntries(records.map(([id, record]) => [id, toSlot(record)]));

  function required(id: string): PackageSlot {
    const slot = packages[id];
    if (!slot?.version) throw new Error(`data/release.json: package "${id}" has no published version`);
    return slot;
  }

  const coreSlot = required('core');
  const coreRecord = release.packages.core!;

  return {
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
}

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
  /**
   * From the product feed (data/release.json feeds.product): the version the
   * support matrix was measured on next to the version that is released. The
   * two can differ; the pages show both rather than let the release stand in
   * for the measurement.
   */
  measurement: Measurement;
};

export type Measurement = {
  /** The product version the benchmark run measured, or null if the matrix does not record one. */
  measured: string | null;
  /** The released version the feed describes. */
  released: string;
  /** Short benchmarks commit the matrix is pinned to. */
  benchmarks: string;
  /** Whether the release's support-matrix drift gate ran against exactly this matrix. */
  gated: boolean;
  /** Short product commit the feed was read at, and when. */
  commit: string;
  observedAt: string;
  freshness: ReleaseV1.Freshness;
};

function measurementView(release: ReleaseV1.ReleaseV1): Measurement {
  const feed = release.feeds?.product;
  if (!feed) throw new Error('data/release.json: no product feed record (run npm run slots:refresh)');
  const m = feed.value.supportMatrix;
  return {
    measured: m.measuredProductVersion,
    released: feed.value.release.version,
    benchmarks: m.benchmarksRevision.slice(0, 7),
    gated: m.gatedLatestRelease,
    commit: feed.source.revision.slice(0, 7),
    observedAt: day(feed.observedAt),
    freshness: feed.freshness,
  };
}

function evidenceSlots(evidenceData: EvidenceV1.EvidenceV1, release: ReleaseV1.ReleaseV1): EvidenceSlots {
  const { sources, facts } = evidenceData;
  return {
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
    measurement: measurementView(release),
  };
}

/** The release's package slots; set by installReleaseData before any render. */
export let slots!: ReleaseSlots;
/** The architecture pages' cited facts; set by installReleaseData before any render. */
export let evidence!: EvidenceSlots;

/** Derives `slots` and `evidence` from a content release's data/release.json and data/evidence.json. */
export function installReleaseData(release: ReleaseV1.ReleaseV1, evidenceData: EvidenceV1.EvidenceV1) {
  slots = releaseSlots(release);
  evidence = evidenceSlots(evidenceData, release);
}
