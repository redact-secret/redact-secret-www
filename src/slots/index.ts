/**
 * Build-time content slots. Every version, range, tag, and date on the page
 * comes from release.json — refreshed from the registries by
 * `npm run slots:refresh` and committed — never from prose in either locale.
 * See CONVENTIONS.md § Content slots.
 */
import release from './release.json';

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
