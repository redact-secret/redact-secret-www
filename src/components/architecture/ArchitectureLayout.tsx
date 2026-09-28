import type { ComponentChildren } from 'preact';
import styles from './ArchitectureLayout.module.css';

export type SectionNavItem = { n: string; label: string; href: string; current?: boolean };
export type SectionNavGroup = { label: string; items: SectionNavItem[] };

export type SectionNavProps = { groups: SectionNavGroup[] };

/**
 * Every page of the section, always — the order is a recommendation, not a
 * dependency (design spec § 02). The current page is marked three ways, so
 * color is never the only signal: aria-current, weight, and the green rule.
 */
export function SectionNav({ groups }: SectionNavProps) {
  return (
    <div class={styles.groups}>
      {groups.map((group) => (
        <div key={group.label}>
          <p class={`eyebrow ${styles.groupLabel}`}>{group.label}</p>
          <ul class={styles.items}>
            {group.items.map((item) => (
              <li key={item.href}>
                <a class={styles.item} href={item.href} aria-current={item.current ? 'page' : undefined}>
                  <span class={styles.n}>{item.n}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export type ArchitectureLayoutProps = {
  /** Section name in the section bar, e.g. "Architecture". */
  section: string;
  /** The page's own path, shown in mono — the address a shared link lands on. */
  path: string;
  navLabel: string;
  /** Summary of the collapsible contents below 1040px. */
  contents: string;
  groups: SectionNavGroup[];
  children: ComponentChildren;
};

/**
 * The one shell all seven architecture pages share (design spec § 05): a
 * section bar, a sticky sidebar that becomes a <details> below 1040px, and
 * the page body. Only the body differs between pages.
 */
export function ArchitectureLayout({ section, path, navLabel, contents, groups, children }: ArchitectureLayoutProps) {
  return (
    <>
      <div class={styles.bar}>
        <div class={`wrap ${styles.barInner}`}>
          <span class={styles.section}>{section}</span>
          <span class={styles.path}>{path}</span>
        </div>
      </div>
      <details class={styles.mobile}>
        <summary class={`wrap ${styles.summary}`}>{contents}</summary>
        <nav class={`wrap ${styles.mobileInner}`} aria-label={contents}>
          <SectionNav groups={groups} />
        </nav>
      </details>
      <div class={`wrap ${styles.layout}`}>
        <nav class={styles.sidenav} aria-label={navLabel}>
          <SectionNav groups={groups} />
        </nav>
        <div class={styles.body}>{children}</div>
      </div>
    </>
  );
}
