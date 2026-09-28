import type { ComponentChildren } from 'preact';
import styles from './Claim.module.css';

export type ClaimProps = {
  /** The page's single claim — one sentence a reader should keep. */
  children: ComponentChildren;
  /** One paragraph on why it holds. */
  sub?: ComponentChildren;
};

/**
 * The page's one brand-green block (design spec § 03, § 06). Exactly one per
 * page: if two sentences compete for it, the page is split wrong. Nothing
 * status-colored and no logo sit on it, and the claim must be checkable
 * against code or a spec — this is the spot that stays wrong longest.
 */
export function Claim({ children, sub }: ClaimProps) {
  return (
    <div class={styles.claim}>
      <p class={styles.line}>{children}</p>
      {sub && <p class={styles.sub}>{sub}</p>}
    </div>
  );
}
