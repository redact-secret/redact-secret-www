import {
  ArchitectureLayout,
  Claim,
  DataTable,
  DocSection,
  HubCard,
  HubGrid,
  PageHead,
  Pager,
  SourceStrip,
} from '../components/architecture';
import { AppShell } from '../components/shell';
import { Rich } from '../components/ui/Rich';
import type { ArchitecturePagesCopy, OverviewCopy, SectionCopy, ShellCopy } from '../content';
import {
  architectureGroups,
  architecturePages,
  architecturePath,
  type ArchitecturePageId,
  type SubPageId,
} from '../content/architecture/pages';
import { localePrefix, locales, type Locale } from '../i18n';
import { Adapters } from './architecture/Adapters';
import { Detection } from './architecture/Detection';
import { EvaluationMethods } from './architecture/EvaluationMethods';
import { HowItWorks } from './architecture/HowItWorks';
import { SupportClaims } from './architecture/SupportClaims';
import { Vault } from './architecture/Vault';
import styles from './Architecture.module.css';

/** The page's own copy: i18n/<locale>/architecture/<id>.json. */
export type ArchitecturePageCopy = { [K in ArchitecturePageId]: { id: K; copy: ArchitecturePagesCopy[K] } }[ArchitecturePageId];

export type ArchitectureProps = {
  locale: Locale;
  /** i18n/<locale>/shell.json */
  shell: ShellCopy;
  /** i18n/<locale>/architecture/section.json: sidebar, pager, every page's title. */
  section: SectionCopy;
  page: ArchitecturePageCopy;
};

/**
 * One page of the architecture section (design spec § 02): the hub or one of
 * the six sub-pages. The structure is here, one template per page for both
 * locales; the words are the page's copy file.
 */
export function Architecture({ locale, shell, section: a, page }: ArchitectureProps) {
  const { id } = page;
  const alternates = Object.fromEntries(locales.map((l) => [l, architecturePath(l, id)]));
  const groups = architectureGroups.map((group) => ({
    label: a.groups[group],
    items: architecturePages
      .filter((p) => p.group === group)
      .map((p) => ({ n: p.n, label: a.pages[p.id].nav, href: architecturePath(locale, p.id), current: p.id === id })),
  }));

  const index = architecturePages.findIndex((p) => p.id === id);
  const prev = architecturePages[(index - 1 + architecturePages.length) % architecturePages.length];
  const next = architecturePages[(index + 1) % architecturePages.length];

  return (
    <AppShell locale={locale} copy={shell} alternates={alternates} current={architecturePath(locale, 'overview')}>
      <ArchitectureLayout
        section={a.section}
        path={architecturePath(locale, id)}
        navLabel={a.navLabel}
        contents={a.contents}
        groups={groups}
      >
        {page.id === 'overview' ? (
          <Hub locale={locale} section={a} copy={page.copy} />
        ) : (
          <article>
            <SubPage locale={locale} page={page} />
          </article>
        )}
        <Pager
          label={a.pager.label}
          prev={{ kicker: a.pager.prev, title: a.pages[prev.id].title, href: architecturePath(locale, prev.id) }}
          next={{
            kicker: next.id === 'overview' ? a.pager.back : a.pager.next,
            title: a.pages[next.id].title,
            href: architecturePath(locale, next.id),
          }}
        />
      </ArchitectureLayout>
    </AppShell>
  );
}

function SubPage({ locale, page }: { locale: Locale; page: Exclude<ArchitecturePageCopy, { id: 'overview' }> }) {
  switch (page.id) {
    case 'how-it-works':
      return <HowItWorks locale={locale} copy={page.copy} />;
    case 'detection':
      return <Detection locale={locale} copy={page.copy} />;
    case 'support-claims':
      return <SupportClaims locale={locale} copy={page.copy} />;
    case 'evaluation-methods':
      return <EvaluationMethods locale={locale} copy={page.copy} />;
    case 'adapters':
      return <Adapters locale={locale} copy={page.copy} />;
    case 'vault':
      return <Vault locale={locale} copy={page.copy} />;
  }
}

function Hub({ locale, section: a, copy: h }: { locale: Locale; section: SectionCopy; copy: OverviewCopy }) {
  return (
    <article>
      <PageHead display eyebrow={<Rich value={h.eyebrow} />} title={<Rich value={h.title} />} lede={<Rich value={h.lede} />} />
      <Claim sub={<Rich value={h.claim.sub} />}>
        <Rich value={h.claim.line} />
      </Claim>
      <div class={styles.hubGroups}>
        {(['engine', 'evidence', 'boundaries'] as const).map((group) => (
          <DocSection key={group} eyebrow={<Rich value={h.groups[group].eyebrow} />} title={<Rich value={h.groups[group].title} />}>
            <HubGrid>
              {architecturePages
                .filter((p) => p.group === group)
                .map((p) => {
                  const pageId = p.id as SubPageId;
                  const href = architecturePath(locale, pageId);
                  return (
                    <HubCard
                      key={p.id}
                      n={p.n}
                      title={a.pages[pageId].title}
                      question={<Rich value={h.cards[pageId].question} />}
                      href={href}
                      go={href.slice(localePrefix(locale).length)}
                    >
                      <Rich value={h.cards[pageId].body} />
                    </HubCard>
                  );
                })}
            </HubGrid>
          </DocSection>
        ))}
        <DocSection eyebrow={<Rich value={h.repos.eyebrow} />} title={<Rich value={h.repos.title} />} lede={<Rich value={h.repos.lede} />}>
          <DataTable
            wide
            label={h.repos.tableLabel}
            head={h.repos.head.map((cell) => <Rich value={cell} />)}
            rows={h.repos.rows.map((r) => [r.repo, <Rich value={r.owns} />, <Rich value={r.mustNot} />])}
          />
        </DocSection>
      </div>
      <SourceStrip label={<Rich value={h.sources.label} />}>
        <Rich value={h.sources.body} />
      </SourceStrip>
    </article>
  );
}
