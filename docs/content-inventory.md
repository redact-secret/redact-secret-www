# Content and data inventory

Every string a visitor can see and every datum the site reads, grouped by
where it lives today, with its class, its canonical owner, and how it is
kept honest. It covers the migration's first phase
([#6](https://github.com/redact-secret/redact-secret-www/issues/6),
[#9](https://github.com/redact-secret/redact-secret-www/issues/9),
[#10](https://github.com/redact-secret/redact-secret-www/issues/10)). Prose is
listed by page and section rather than sentence by sentence, but no file
that renders text or data is missing. When a row's file moves, update the
row in the same PR.

## Classes and owners

The owners are the ones #6 sets. "Freshness" says what keeps a value from
being shown as current when it is not.

| Class | What it is | Canonical owner | Schema | Freshness behaviour |
| --- | --- | --- | --- | --- |
| **Editorial** | Authored, reviewed copy in either locale | `redact-secret-www/i18n/**` | `locale-*-v1` (one schema per file; rich text and links from `locale-common-v1`) | Reviewed in the PR that changes it; no time dimension. `check-i18n` holds en/ko parity, links, the page budget and read keys |
| **Structure/behaviour** | Routes, anchors, navigation IDs, page registry, card layout, URLs, mechanism constants in code | `redact-secret-www` application contract | TypeScript; `integrations-v1` for the card inventory | Changes only with an application release |
| **Release metadata** | Published versions, dates, dist-tags, peer ranges; release identity | Package registries (npm, PyPI, crates.io) for what is published; `redact-secret`'s site feed for the release identity; `redact-secret-adapters`' release feed for what it declares (registry fallback until the feed is on its `main`) — all read into `data/release.json` | `release-v1` (`packages`, `feeds`) | Per record `observedAt` + `digest` (feeds also the full commit and the feed's `generatedAt`); a failed read or a rejected feed keeps the old record `stale` with its original `observedAt` |
| **Product evidence** | Counts, limits and statuses read from the product and its packages | `redact-secret`'s site feed (support matrix); `redact-secret` sources for the rest; `redact-secret-adapters` / `redact-secret-vault` | `evidence-v1` (facts from `core`, `adapters`, `vault`), matrix counts checked against `release-v1` `feeds.product` | Per source full revision + `observedAt` + `freshness` |
| **Benchmark evidence** | Anything measured | `redact-secret-benchmarks` `/results/*.json` | `evidence-v1` carries **counts and names only** | Scores, rates and bounds are never stored here: links only. `check-data` rejects score-like keys and fractional numbers |
| **Synthetic fixture** | The one credential example and the PII examples | Application code (`src/content/shared.ts`), ADR 0001/0002 | TypeScript | Must keep the `SYNTHETIC_` marker; `check-data` scans all data and locale copy with the published core. Illustrative formats the detection page shows on purpose are listed by exact text in `scripts/data/illustrative.mjs` |

## Data files (`data/`)

Every file under `data/` must be registered in
`scripts/data/contracts.mjs`; `npm run check:data` fails on one that is not.

| File | Contract | Class | Canonical owner | Source revision | Time | Consumed by |
| --- | --- | --- | --- | --- | --- | --- |
| `data/integrations.json` `packages` | `integrations-v1` | Structure/behaviour (adapter inventory) | `redact-secret-www` (which packages the page lists); versions and channels are cross-checked against the `redact-secret-adapters` release feed once it is on that repository's `main` (#12) | `source.kind: authored` — the commit containing the file | `generatedAt` | `scripts/refresh-slots.mjs` (which packages to read) |
| `data/integrations.json` `packages.vault-py.declared` | `integrations-v1` | Release metadata (declared, unpublished) | `redact-secret-vault` | `redact-secret-vault@2feebe8b…` `packages/vault-py/pyproject.toml` | as the file | Integrations card "vault-py", `/architecture/vault/` tile |
| `data/integrations.json` `groups` | `integrations-v1` | Structure/behaviour | `redact-secret-www` | authored | `generatedAt` | `src/content/integrations.ts` → Integrations block (home, both locales) |
| `data/release.json` `packages.*` | `release-v1` | Release metadata | npm / PyPI / crates.io | `source.version` (+ npm `gitHead` as `source.revision`) | `observedAt` per record, `generatedAt` per file | `src/slots` → quickstart pins, integrations cards, `/architecture/adapters/`, `/architecture/vault/`, observed-date lines |
| `data/release.json` `packages.core.mirrors` | `release-v1` | Release metadata | PyPI, crates.io | `source.version` | `observedAt` per mirror | Core card "registries", Python quickstart pin |
| `data/release.json` `feeds.product` | `release-v1` | Release metadata + product evidence | `redact-secret` `docs/contracts/site-feed/v1/feed.json` (`redact-secret.site-feed/v1`) | `source.revision` = the full commit `main` resolved to, `digest` computed here, `schemaDigest` | `observedAt`; the feed's `generatedAt` | `/architecture/support-claims/` (measured vs released version, benchmarks pin); `check-data` (matrix counts, core version) |
| `data/release.json` `feeds.adapters` | `release-v1` | Release metadata (declared) | `redact-secret-adapters` `site-feed/v1/adapters.json` on `main` | `source.revision`; `mode: registry-fallback` while the feed is not on `main` (today), `mode: feed` + `digest` once it is | `observedAt` (+ `generatedAt` in feed mode) | `check-data` (versions against `packages`); not rendered yet |
| `data/evidence.json` `facts.matrix` | `evidence-v1` | Product evidence | `redact-secret` site feed `supportMatrix` (the pinned `benchmarks/support-matrix.json`); first read from `docs/support-matrix.md` | `sources.core` = `redact-secret@9ab0fa02…` (`0.1.0-beta.10`); `check-data` holds the counts equal to `feeds.product` | `observedAt` | `/architecture/how-it-works/`, `/support-claims/`, `/detection/`; `check-slots` sums |
| `data/evidence.json` `facts.detectors` | `evidence-v1` | Product evidence (mechanism counts) | `redact-secret` | `sources.core` | `observedAt` | `/architecture/how-it-works/`, `/detection/` |
| `data/evidence.json` `facts.coreLimits` | `evidence-v1` | Product evidence | `redact-secret` `README.md`, `ARCHITECTURE.md` | `sources.core` | `observedAt` | `/architecture/how-it-works/` |
| `data/evidence.json` `facts.adapterBudgets` | `evidence-v1` | Product evidence | `redact-secret-adapters` (`@redact-secret/adapter` README `DEFAULT_LIMITS`) | `sources.adapters` = npm `@redact-secret/adapter@0.1.2`, gitHead `be3f2ad5…` | `observedAt` | `/architecture/adapters/` |
| `data/evidence.json` `facts.taxonomy` | `evidence-v1` | Benchmark evidence (counts) | the published `results/provider-dossiers-v1.json` (`npm run sync:taxonomy`; the same counts as `benchmarks/support/taxonomy.json`) | `facts.taxonomy.note` names the file's origin and benchmarks revision; `sources.benchmarks` = `redact-secret-benchmarks@0a73b7db…` still pins `staleProse` and `baseline` | `observedAt` | `/architecture/support-claims/` |
| `data/evidence.json` `facts.staleProse` | `evidence-v1` | Benchmark evidence (counts quoted from prose) | `redact-secret-benchmarks` `docs/specs/taxonomy.md` | `sources.benchmarks` | `observedAt` | `/architecture/support-claims/` |
| `data/evidence.json` `facts.baseline` | `evidence-v1` | Benchmark evidence (a name) | `redact-secret-benchmarks` `baselines/0.1.0-beta.9.json` | `sources.benchmarks` | `observedAt` | `/architecture/evaluation-methods/` |
| `data/evidence.json` `sources.vault` | `evidence-v1` | Product evidence (citation) | `redact-secret-vault` | `redact-secret-vault@2feebe8b…` | `observedAt` | `/architecture/vault/` source strip |

## Application-owned data (TypeScript)

| Where | What | Class | Owner | Notes |
| --- | --- | --- | --- | --- |
| `src/content/shared.ts` `siteOrigin`, `urls` | Canonical origin; links to the repositories, SECURITY.md, guides, support matrix, release status, benchmarks site | Structure/behaviour | `redact-secret-www` | Links, never copies of what they point at |
| `src/content/shared.ts` `anchors` | In-page anchor IDs | Structure/behaviour | `redact-secret-www` | |
| `src/content/shared.ts` `fixture`, `playgroundPresets`, `playgroundDefault` | `API_KEY=SYNTHETIC_REVOKED_CONTEXT_VALUE` → `API_KEY=<SECRET_1>` and its carriers | Synthetic fixture | Application code (ADR 0001) | The only credential example on the site |
| `src/content/shared.ts` `piiFixtures` | Reserved/test PII values | Synthetic fixture | Application code (ADR 0002) | |
| `src/content/shared.ts` `snippets` | Install commands and code per runtime tab | Structure/behaviour (+ release metadata via slots) | `redact-secret-www` | Versions interpolated from `data/release.json` |
| `src/content/integrations.ts` | Reads `data/integrations.json`; `runtimes` order | Structure/behaviour | `redact-secret-www` | |
| `src/slots/index.ts` | The page's view of `data/release.json` and `data/evidence.json` | — (view layer) | `redact-secret-www` | Dates shown are the **oldest** observation, so a stale record is never dated as fresh |
| `src/i18n.ts` | Locales and their switcher labels (`EN`, `한국어`) | Structure/behaviour | `redact-secret-www` | |
| `src/render.tsx`, `src/app.tsx` | Which page a path is, `<title>` composition, canonical, hreflang, `noindex` on 404 | Structure/behaviour | `redact-secret-www` | The renderer artifact a content release renders with (#11) |
| `src/content/community.ts` | The GitHub forms the community page mirrors: field ids, types, required flags, dropdown options (English, as the YAML spells them — shown untranslated in both locales), title prefixes, labels, template/category names; the prefill URL and its 8,000-character limit | Structure/behaviour (prefill contract) | `redact-secret/redact-secret` `.github/` (mirrored here, checked at `8f97f14`) | ADR 0004; change with the upstream YAML |
| `src/content/architecture/pages.ts` | Page registry: ids, slugs, groups, numbers `00`–`06` | Structure/behaviour | `redact-secret-www` | |
| `src/routes.ts` `routeIds`, `anchorIds`, `routeHref` | The route IDs and anchors copy links name (`architecture/vault`, `home#playground`), resolved per locale | Structure/behaviour | `redact-secret-www` | `check-i18n` fails a link to an unknown one |
| `src/content/index.ts` | Copy types; the working tree's `i18n/**` as a `ContentBundle` for the dev server and Storybook | Structure/behaviour | `redact-secret-www` | The site's pages get their copy from the renderer's arguments, embedded per page |
| `src/pages/architecture/*.tsx`, `src/pages/Architecture.tsx` | One template per architecture page for both locales: structure, slots as vars, mechanism constants | Structure/behaviour | `redact-secret-www` | |
| `src/playground/protocol.ts` `limits` | Playground input/findings caps (32 KiB, 1000) | Structure/behaviour (mechanism constant) | Application code | Shown in the size counter |
| `src/playground/engine.worker.ts` | Engine version and artifact shown in the playground footer | Release metadata | `@redact-secret/core` as installed (`package-lock.json`) | `check-slots` fails the build if it differs from the quickstart pin |
| `package.json` `dependencies["@redact-secret/core"]` | The engine the playground runs | Release metadata | `redact-secret-www` (pinned exact) | Must equal `data/release.json` `packages.core` |
| `src/render.tsx` `pagePaths` | Which routes are rendered (both locales + 404) | Structure/behaviour | `redact-secret-www` | Derived from `src/routes.ts` |
| `index.html` | Font stylesheet, theme bootstrap, favicon | Structure/behaviour | `redact-secret-www` | |
| `public/logo-*.svg`, `public/favicon.svg`, `src/tokens.css` | Logo, tokens | Structure/behaviour | Redact Secret design system (copied) | |

## Visitor-visible text

Editorial unless marked. Every value inside the prose that could go stale is
a slot (above), never typed into the sentence.

| Where | Page / section | Locale | Class | Owner |
| --- | --- | --- | --- | --- |
| `i18n/{en,ko}/home.json` `meta` | `<title>`, meta description (home, 404 fallback) | en, ko | Editorial | `redact-secret-www/i18n` |
| `i18n/{en,ko}/shell.json` `header`, `footer` | Skip link, nav, header controls (language, theme, menu), footer columns and notes | en, ko | Editorial | same |
| `i18n/{en,ko}/shell.json` `notFound` | 404 body (both locales on one page) | en, ko | Editorial | same |
| `i18n/{en,ko}/home.json` `hero` | Block 1: eyebrow, title (explicit `br` node), lede, CTAs, proof line, I/O caption and footnote | en, ko | Editorial | same |
| same, `problem` | Block 2: spread diagram labels, destinations, counts labels, remedy | en, ko | Editorial (counts are illustrative diagram labels, not measurements) | same |
| same, `playground` | Block 3: all labels, preset names, PII modes, errors, engine line (`version`, `artifact` vars), size (`used`, `max`), finding count (`one`/`other`, `n`) | en, ko | Editorial | same |
| same, `quickstart` | Block 4: tabs label, Rust note, pin sentence (`npm`, `observedAt`, `pypi` vars; `pinLatest.same`/`moved` chosen by the slot), why/expect | en, ko | Editorial + release metadata (slots) | same |
| same, `boundary` | Block 5: flow, pillars, links (route IDs / https) | en, ko | Editorial | same |
| same, `integrations` | Block 6: group titles/ledes/links, runtime names, fact terms, status labels, per-card title/description/coverage (keyed by card id in `data/integrations.json`), observed-date sentence (`date` var) | en, ko | Editorial (+ release metadata via cards) | same |
| same, `evidence` | Block 7: evidence links, routing table, limits | en, ko | Editorial (links to benchmarks, no figures) | same |
| same, `final` | Block 8 CTA | en, ko | Editorial | same |
| `i18n/{en,ko}/community.json` | `/community/`: `<title>`/description, hero (explicit `br`), kind groups, per-form name/where/intro/field labels/help/placeholders (`version` var = the core slot)/safety text, security route, shared form words, check verdicts and hand-off (`count`, `line`, `col`, `n`, `used`, `max`, `fields` vars), no-JavaScript note, boundary note | en, ko | Editorial (+ release metadata: the placeholder version) | same |
| `i18n/{en,ko}/architecture/section.json` | Section name, sidebar groups, per-page nav label, `<title>`/description, pager labels | en, ko | Editorial | same |
| `i18n/{en,ko}/architecture/overview.json` | `/architecture/` hub body (template: `src/pages/Architecture.tsx` `Hub`) | en, ko | Editorial | same |
| `i18n/{en,ko}/architecture/how-it-works.json` | 01 How it works (+ source strip); template `src/pages/architecture/HowItWorks.tsx` | en, ko | Editorial + product evidence (matrix, detectors, coreLimits, sources.core as vars) | same |
| `…/detection.json` | 02 Detection (+ source strip); tier names, anatomy, exclusion list and byte classes stay in the template as mechanism constants | en, ko | Editorial + product evidence (matrix, detectors) | same |
| `…/support-claims.json` | 03 Support claims (+ source strip); token prefixes and file names stay in the template | en, ko | Editorial + product evidence (matrix) + benchmark evidence counts (taxonomy, staleProse) + release metadata (measured vs released version, from `feeds.product` via `evidence.measurement`; `measuredOn`/`measuredUnknown`, `gated`/`notGated` chosen by the data) | same |
| `…/evaluation-methods.json` | 04 Evaluation methods (+ source strip); the grading lattice and the phase → method order stay in the template | en, ko | Editorial + benchmark evidence (baseline name, sources.benchmarks) | same |
| `…/adapters.json` | 05 Adapters: tiles, budgets, `statusLabels`; markers and core surface names stay in the template | en, ko | Editorial + release metadata + product evidence (adapterBudgets) | same |
| `…/vault.json` | 06 Vault: tiles, dist-tag note (shown only when npm `latest` ≠ the alpha tag), `statusLabels` | en, ko | Editorial + release metadata | same |
| `src/components/sections/IOBlock.tsx` | `Input` / `Output` term labels, same in both locales | — | Editorial (shared, untranslated) | same |
| `src/components/sections/PackageCard.tsx` `registryNames` | `npm`, `PyPI`, `crates.io` | — | Structure/behaviour (proper names) | `redact-secret-www` |
| `src/components/sections/IntegrationsSection.tsx` | `GitHub ↗` group link label | — | Structure/behaviour (proper name) | `redact-secret-www` |
| `src/components/**`, `src/pages/**` | No other literal copy: components and page templates receive text as props (`i18n/**`) and render rich text through `src/components/ui/Rich.tsx` | — | — | — |

## Open discrepancies

Found while tying each value to a revision; not changed here because each
changes what a page says.

- ~~**`facts.baseline` = `0.1.0-beta.10`.**~~ Resolved in #12. No
  `baselines/0.1.0-beta.10.json` exists on any branch of
  `redact-secret-benchmarks`. At the recorded `sources.benchmarks` revision
  (`0a73b7db`, where the evaluation-method specs were read) the newest
  frozen baseline is `0.1.0-beta.9`, so the fact now names that file, with
  its path. The product feed's `supportMatrix.benchmarksRevision`
  (`cfaeac4d…`) was considered and not used: it pins the support-matrix
  measurement (newest baseline there: `0.1.0-beta.7`), not the specs the
  page cites.
- **Hand-written counts in prose.** A few architecture sentences carry counts
  as words: "Six packages" / "Six of them" (05 Adapters), "Ten test
  methods" / "The ten methods" / "The ten specs" (04), "Ten ways" (hub card
  and 04's description), "Four repositories" (hub), "six kinds of token"
  (03). #10 kept them as copy: each counts a list the site itself holds
  (the adapter packages in `data/integrations.json` and the page's tiles,
  the ten method entries, the hub's repository rows, the GitHub token
  prefixes), and turning the word into a numeral slot would change every
  sentence in both locales. Instead `npm run check:i18n` ties each word to
  its list (`spelledCounts` in `scripts/check-i18n.mjs`): a list that changes
  length, or a sentence that loses the word, fails the build until both
  locales are re-read. None of these lists has an upstream feed yet; when
  the adapters' release feed (#15) lists packages, count from it. Tier
  counts ("five tiers") are mechanism constants and stay.
- **Adapters source strip has no commit.** `sources.adapters` is a registry
  source (the published `@redact-secret/adapter@0.1.2` and its `gitHead`),
  because that is where the budgets were verified. The page therefore cites
  the repository without a commit, as before. The adapters' release feed is
  merged to `develop` but not yet on `main` (`feeds.adapters.mode` is
  `registry-fallback`); once a refresh reads it in `feed` mode, cite its
  revision instead. The feed does not carry the walker budgets, so
  `facts.adapterBudgets` stays hand-read.
- **Matrix measured on an older version than the release.** The product
  feed says the shipped matrix was measured on `0.1.0-beta.7` while the
  release is `0.1.0-beta.10` (its drift gate ran against that matrix).
  This is not an error; `/architecture/support-claims/` states both.
