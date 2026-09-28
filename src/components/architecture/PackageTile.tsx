import type { ComponentChildren } from 'preact';
import { StatusChip, type StatusTone } from '../ui';
import type { PackageStatus } from '../../slots';
import styles from './PackageTile.module.css';

/** `contract`: a written contract with no implementation — not a package at all yet. */
export type TileStatus = PackageStatus | 'contract';

export type PackageTileProps = {
  name: string;
  status: TileStatus;
  /** The status in words — color is never the only signal. */
  statusLabel: string;
  /** Registry, version, host range — from slots, never prose. */
  meta?: ComponentChildren;
  children: ComponentChildren;
};

const tones: Record<TileStatus, StatusTone> = {
  released: 'success',
  alpha: 'info',
  unpublished: 'none',
  contract: 'none',
};

/**
 * The top rule encodes the state (design spec § 07): ink released,
 * status-info alpha, dashed ink-muted unpublished or contract-only — always
 * with the status chip's word beside it.
 */
export function PackageTile({ name, status, statusLabel, meta, children }: PackageTileProps) {
  return (
    <article class={`${styles.tile} ${styles[status]}`}>
      <h3 class={styles.name}>{name}</h3>
      <p class={styles.meta}>
        {meta && <span>{meta}</span>}
        <StatusChip tone={tones[status]}>{statusLabel}</StatusChip>
      </p>
      <p class={styles.desc}>{children}</p>
    </article>
  );
}
