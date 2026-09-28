import type { ComponentChildren } from 'preact';
import styles from './Button.module.css';

export type ButtonProps = {
  children: ComponentChildren;
  /**
   * `primary` is brand-green fill — at most one per viewport (design spec
   * § 09, green budget). `default` is the outlined button.
   */
  variant?: 'primary' | 'default';
  size?: 'md' | 'lg';
  /** Renders an `<a>` when set, otherwise a `<button>`. */
  href?: string;
  onClick?: () => void;
  /** Disclosure state, for a button that opens a panel (`<button>` only). */
  expanded?: boolean;
  /** Id of the element the button controls (`<button>` only). */
  controls?: string;
};

export function Button({ children, variant = 'default', size, href, onClick, expanded, controls }: ButtonProps) {
  // Primary is always the large size in the mockup.
  const large = size === 'lg' || (size === undefined && variant === 'primary');
  const className = [styles.button, large && styles.lg, variant === 'primary' && styles.primary]
    .filter(Boolean)
    .join(' ');

  return href ? (
    <a class={className} href={href}>
      {children}
    </a>
  ) : (
    <button type="button" class={className} onClick={onClick} aria-expanded={expanded} aria-controls={controls}>
      {children}
    </button>
  );
}
