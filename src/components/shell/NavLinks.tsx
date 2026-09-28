import type { ShellCopy } from '../../content';
import type { Locale } from '../../i18n';
import { linkHref } from '../../routes';
import styles from './NavLinks.module.css';

type Props = {
  locale: Locale;
  links: ShellCopy['header']['nav'];
  direction?: 'horizontal' | 'vertical';
  onNavigate?: () => void;
  /** Href of the link for the section being viewed. */
  current?: string;
};

export function NavLinks({ locale, links, direction = 'horizontal', onNavigate, current }: Props) {
  return (
    <ul class={`${styles.list} ${styles[direction]}`}>
      {links.map((link) => {
        const href = linkHref(locale, link);
        return (
          <li key={href}>
            <a class={styles.link} href={href} onClick={onNavigate} aria-current={href === current ? 'page' : undefined}>
              {link.label}
              {link.external && <span class={styles.ext} aria-hidden="true"> ↗</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
