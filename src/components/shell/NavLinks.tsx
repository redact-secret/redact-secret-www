import type { SiteContent } from '../../content';
import styles from './NavLinks.module.css';

type Props = {
  links: SiteContent['shell']['nav'];
  direction?: 'horizontal' | 'vertical';
  onNavigate?: () => void;
};

export function NavLinks({ links, direction = 'horizontal', onNavigate }: Props) {
  return (
    <ul class={`${styles.list} ${styles[direction]}`}>
      {links.map((link) => (
        <li key={link.href}>
          <a class={styles.link} href={link.href} onClick={onNavigate}>
            {link.label}
            {link.external && <span class={styles.ext} aria-hidden="true"> ↗</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}
