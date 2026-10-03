import { ArchitectureLayout, DocSection, PageHead, Pager } from '../components/architecture';
import { AppShell } from '../components/shell';
import { CodeBlock } from '../components/ui';
import { Rich } from '../components/ui/Rich';
import type { DocsCopy, ShellCopy } from '../content';
import { docsGroups, docsPages, docsPath, type DocsPageId } from '../content/docs/pages';
import { snippetsForDocs } from '../content/docs/snippets';
import type { Locale } from '../i18n';
import { linkHref } from '../routes';
import { evidence, slots } from '../slots';
import styles from './Docs.module.css';

export type DocsPageCopy = DocsCopy['pages'][number];

type DocsProps = {
  locale: Locale;
  shell: ShellCopy;
  copy: DocsCopy;
  id: DocsPageId;
};

export function Docs({ locale, shell, copy, id }: DocsProps) {
  const page = copy.pages.find((candidate) => candidate.id === id);
  if (!page) throw new Error(`docs: missing copy for ${id}`);

  const alternates = Object.fromEntries((['en', 'ko'] as const).map((language) => [language, docsPath(language, id)]));
  const groups = docsGroups.map((group) => ({
    label: copy.section.groups[group],
    items: docsPages
      .filter((candidate) => candidate.group === group)
      .map((candidate) => ({
        n: candidate.n,
        label: copy.pages.find((entry) => entry.id === candidate.id)!.nav,
        href: docsPath(locale, candidate.id),
        current: candidate.id === id,
      })),
  }));
  const index = docsPages.findIndex((candidate) => candidate.id === id);
  const prev = docsPages[(index - 1 + docsPages.length) % docsPages.length];
  const next = docsPages[(index + 1) % docsPages.length];
  const snippets = snippetsForDocs(slots);

  return (
    <AppShell locale={locale} copy={shell} alternates={alternates} current={docsPath(locale, 'overview')}>
      <div class={styles.docs} data-docs-theme="light" data-theme="light">
        <ArchitectureLayout
          section={copy.section.title}
          path={docsPath(locale, id)}
          navLabel={copy.section.navLabel}
          contents={copy.section.contents}
          groups={groups}
        >
          <article class={styles.article}>
            <PageHead
              display={id === 'overview'}
              eyebrow={page.eyebrow}
              title={page.title}
              lede={<Rich value={page.lede} vars={{ families: evidence.matrix.families }} />}
            />
            {page.sections.map((section, sectionIndex) => (
              <DocSection key={section.title} eyebrow={`${String(sectionIndex + 1).padStart(2, '0')} · ${page.nav}`} title={section.title}>
                <div class={styles.copy}>
                  {section.body.map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex}><Rich value={paragraph} /></p>
                  ))}
                </div>
                {section.bullets && (
                  <ul class={styles.list}>
                    {section.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex}><Rich value={bullet} /></li>
                    ))}
                  </ul>
                )}
                {section.snippet && <CodeBlock code={snippets[section.snippet]} label={section.snippetLabel} />}
                {section.links && (
                  <div class={styles.links}>
                    {section.links.map((link) => (
                      <a key={link.to ?? link.href} href={linkHref(locale, link)}>
                        {link.label}<span aria-hidden="true"> {link.href ? '↗' : '→'}</span>
                      </a>
                    ))}
                  </div>
                )}
              </DocSection>
            ))}
          </article>
          <Pager
            label={copy.section.pager.label}
            prev={{ kicker: copy.section.pager.prev, title: copy.pages.find((entry) => entry.id === prev.id)!.title, href: docsPath(locale, prev.id) }}
            next={{
              kicker: next.id === 'overview' ? copy.section.pager.back : copy.section.pager.next,
              title: copy.pages.find((entry) => entry.id === next.id)!.title,
              href: docsPath(locale, next.id),
            }}
          />
        </ArchitectureLayout>
      </div>
    </AppShell>
  );
}
