import type { ComponentChildren } from 'preact';
import styles from './Ruled.module.css';

export type RuledProps = {
  children: ComponentChildren;
  as?: 'div' | 'article';
  /** Rule in `on-brand` ink, for use on the brand-green block. */
  onBrand?: boolean;
};

/** A block topped by a 2px ink rule — the page's only "card" treatment. */
export function Ruled({ children, as: Tag = 'div', onBrand }: RuledProps) {
  return <Tag class={[styles.ruled, onBrand && styles.onBrand].filter(Boolean).join(' ')}>{children}</Tag>;
}
