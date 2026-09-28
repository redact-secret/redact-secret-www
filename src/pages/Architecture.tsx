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
import { content } from '../content';
import { hub } from '../content/architecture/hub';
import { enPages } from '../content/architecture/en';
import { koPages } from '../content/architecture/ko';
import {
  architectureGroups,
  architecturePages,
  architecturePath,
  isSubPage,
  type ArchitecturePageId,
} from '../content/architecture/pages';
import { architectureShell } from '../content/architecture/shell';
import { locales, type Locale } from '../i18n';
import styles from './Architecture.module.css';

const bodies = { en: enPages, ko: koPages };

/**
 * One page of the architecture section (design spec § 02): the hub or one of
 * the six sub-pages, every one authored in both locales.
 */
export function Architecture({ locale, id }: { locale: Locale; id: ArchitecturePageId }) {
  const c = content[locale];
  const a = architectureShell[locale];
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
  const Body = isSubPage(id) ? bodies[locale][id] : undefined;

  return (
    <AppShell content={c} alternates={alternates} current={architecturePath(locale, 'overview')}>
      <ArchitectureLayout
        section={a.section}
        path={architecturePath(locale, id)}
        navLabel={a.navLabel}
        contents={a.contents}
        groups={groups}
      >
        {Body ? (
          <article>
            <Body locale={locale} />
          </article>
        ) : (
          <Hub locale={locale} />
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

function Hub({ locale }: { locale: Locale }) {
  const h = hub[locale];
  const a = architectureShell[locale];
  return (
    <article>
      <PageHead display eyebrow={h.eyebrow} title={h.title} lede={h.lede} />
      <Claim sub={h.claim.sub}>{h.claim.line}</Claim>
      <div class={styles.hubGroups}>
        {(['engine', 'evidence', 'boundaries'] as const).map((group) => (
          <DocSection key={group} eyebrow={h.groups[group].eyebrow} title={h.groups[group].title}>
            <HubGrid>
              {architecturePages
                .filter((p) => p.group === group)
                .map((p) => {
                  const pageId = p.id as Exclude<ArchitecturePageId, 'overview'>;
                  const href = architecturePath(locale, pageId);
                  return (
                    <HubCard
                      key={p.id}
                      n={p.n}
                      title={a.pages[pageId].title}
                      question={h.cards[pageId].question}
                      href={href}
                      go={href.slice(`/${locale}`.length)}
                    >
                      {h.cards[pageId].body}
                    </HubCard>
                  );
                })}
            </HubGrid>
          </DocSection>
        ))}
        <DocSection eyebrow={h.repos.eyebrow} title={h.repos.title} lede={h.repos.lede}>
          <DataTable
            wide
            label={h.repos.tableLabel}
            head={h.repos.head}
            rows={h.repos.rows.map((r) => [r.repo, r.owns, r.mustNot])}
          />
        </DocSection>
      </div>
      <SourceStrip label={h.sources.label}>{h.sources.body}</SourceStrip>
    </article>
  );
}
