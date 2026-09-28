import type { SiteContent } from '../../content';
import styles from './NavLinks.module.css';

type Props = {
  links: SiteContent['shell']['nav'];
  direction?: 'horizontal' | 'vertical';
  onNavigate?: () => void;
  /** Href of the link for the section being viewed. */
  current?: string;
};

export function NavLinks({ links, direction = 'horizontal', onNavigate, current }: Props) {
  return (
    <ul class={`${styles.list} ${styles[direction]}`}>
      {links.map((link) => (
        <li key={link.href}>
          <a
            class={styles.link}
            href={link.href}
            onClick={onNavigate}
            aria-current={link.href === current ? 'page' : undefined}
          >
            {link.label}
            {link.external && <span class={styles.ext} aria-hidden="true"> ↗</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}
