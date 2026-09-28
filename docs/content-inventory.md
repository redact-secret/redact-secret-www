# Content and data inventory

Every string a visitor can see and every datum the site reads, grouped by
where it lives today, with its class, its canonical owner, and how it is
kept honest. It covers the migration's first phase
([#6](https://github.com/redact-secret/redact-secret-www/issues/6),
[#9](https://github.com/redact-secret/redact-secret-www/issues/9)). Prose is
listed by page and section rather than sentence by sentence, but no file
that renders text or data is missing. When a row's file moves (e.g. prose
into `i18n/**` in #10), update the row in the same PR.

## Classes and owners

The owners are the ones #6 sets. "Freshness" says what keeps a value from
being shown as current when it is not.

| Class | What it is | Canonical owner | Schema | Freshness behaviour |
| --- | --- | --- | --- | --- |
| **Editorial** | Authored, reviewed copy in either locale | `redact-secret-www` (moving to `i18n/**`, #10) | TypeScript `SiteContent` / page bodies today; locale schemas in #10 | Reviewed in the PR that changes it; no time dimension |
| **Structure/behaviour** | Routes, anchors, navigation IDs, page registry, card layout, URLs, mechanism constants in code | `redact-secret-www` application contract | TypeScript; `integrations-v1` for the card inventory | Changes only with an application release |
| **Release metadata** | Published versions, dates, dist-tags, peer ranges | Package registries (npm, PyPI, crates.io), read into `data/release.json` | `release-v1` | Per record `observedAt` + `digest`; a failed read keeps the old record `stale` with its original `observedAt` |
| **Product evidence** | Counts, limits and statuses read from the product and its packages | `redact-secret` generated manifests; `redact-secret-adapters` / `redact-secret-vault` release manifests | `evidence-v1` (facts from `core`, `adapters`, `vault`) | Per source full revision + `observedAt` + `freshness` |
| **Benchmark evidence** | Anything measured | `redact-secret-benchmarks` `/results/*.json` | `evidence-v1` carries **counts and names only** | Scores, rates and bounds are never stored here: links only. `check-data` rejects score-like keys and fractional numbers |
| **Synthetic fixture** | The one credential example and the PII examples | Application code (`src/content/shared.ts`), ADR 0001/0002 | TypeScript | Must keep the `SYNTHETIC_` marker; `check-data` scans all data with the published core |

## Data files (`data/`)

Every file under `data/` must be registered in
`scripts/data/contracts.mjs`; `npm run check:data` fails on one that is not.

| File | Contract | Class | Canonical owner | Source revision | Time | Consumed by |
| --- | --- | --- | --- | --- | --- | --- |
| `data/integrations.json` `packages` | `integrations-v1` | Structure/behaviour (adapter inventory) | `redact-secret-www` today → `redact-secret-adapters` release feed (#15, #12) | `source.kind: authored` — the commit containing the file | `generatedAt` | `scripts/refresh-slots.mjs` (which packages to read) |
| `data/integrations.json` `packages.vault-py.declared` | `integrations-v1` | Release metadata (declared, unpublished) | `redact-secret-vault` | `redact-secret-vault@2feebe8b…` `packages/vault-py/pyproject.toml` | as the file | Integrations card "vault-py", `/architecture/vault/` tile |
| `data/integrations.json` `groups` | `integrations-v1` | Structure/behaviour | `redact-secret-www` | authored | `generatedAt` | `src/content/integrations.ts` → Integrations block (home, both locales) |
| `data/release.json` `packages.*` | `release-v1` | Release metadata | npm / PyPI / crates.io | `source.version` (+ npm `gitHead` as `source.revision`) | `observedAt` per record, `generatedAt` per file | `src/slots` → quickstart pins, integrations cards, `/architecture/adapters/`, `/architecture/vault/`, observed-date lines |
| `data/release.json` `packages.core.mirrors` | `release-v1` | Release metadata | PyPI, crates.io | `source.version` | `observedAt` per mirror | Core card "registries", Python quickstart pin |
| `data/evidence.json` `facts.matrix` | `evidence-v1` | Product evidence | `redact-secret` `docs/support-matrix.md` (generated) | `sources.core` = `redact-secret@9ab0fa02…` (`0.1.0-beta.10`) | `observedAt` | `/architecture/how-it-works/`, `/support-claims/`, `/detection/`; `check-slots` sums |
| `data/evidence.json` `facts.detectors` | `evidence-v1` | Product evidence (mechanism counts) | `redact-secret` | `sources.core` | `observedAt` | `/architecture/how-it-works/`, `/detection/` |
| `data/evidence.json` `facts.coreLimits` | `evidence-v1` | Product evidence | `redact-secret` `README.md`, `ARCHITECTURE.md` | `sources.core` | `observedAt` | `/architecture/how-it-works/` |
| `data/evidence.json` `facts.adapterBudgets` | `evidence-v1` | Product evidence | `redact-secret-adapters` (`@redact-secret/adapter` README `DEFAULT_LIMITS`) | `sources.adapters` = npm `@redact-secret/adapter@0.1.2`, gitHead `be3f2ad5…` | `observedAt` | `/architecture/adapters/` |
| `data/evidence.json` `facts.taxonomy` | `evidence-v1` | Benchmark evidence (counts) | `redact-secret-benchmarks` `benchmarks/support/taxonomy.json` | `sources.benchmarks` = `redact-secret-benchmarks@0a73b7db…` | `observedAt` | `/architecture/support-claims/` |
| `data/evidence.json` `facts.staleProse` | `evidence-v1` | Benchmark evidence (counts quoted from prose) | `redact-secret-benchmarks` `docs/specs/taxonomy.md` | `sources.benchmarks` | `observedAt` | `/architecture/support-claims/` |
| `data/evidence.json` `facts.baseline` | `evidence-v1` | Benchmark evidence (a name) | `redact-secret-benchmarks` | `sources.benchmarks` | `observedAt` | `/architecture/evaluation-methods/` |
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
| `src/main.tsx` | Routes, `<title>` composition, canonical, hreflang, `noindex` on 404 | Structure/behaviour | `redact-secret-www` | Routing changes belong to #8 |
| `src/content/architecture/pages.ts` | Page registry: ids, slugs, groups, numbers `00`–`06` | Structure/behaviour | `redact-secret-www` | |
| `src/playground/protocol.ts` `limits` | Playground input/findings caps (32 KiB, 1000) | Structure/behaviour (mechanism constant) | Application code | Shown in the size counter |
| `src/playground/engine.worker.ts` | Engine version and artifact shown in the playground footer | Release metadata | `@redact-secret/core` as installed (`package-lock.json`) | `check-slots` fails the build if it differs from the quickstart pin |
| `package.json` `dependencies["@redact-secret/core"]` | The engine the playground runs | Release metadata | `redact-secret-www` (pinned exact) | Must equal `data/release.json` `packages.core` |
| `vite.config.ts` `additionalPrerenderRoutes` | Which routes are prerendered | Structure/behaviour | `redact-secret-www` | |
| `index.html` | Font stylesheet, theme bootstrap, favicon | Structure/behaviour | `redact-secret-www` | |
| `public/logo-*.svg`, `public/favicon.svg`, `src/tokens.css` | Logo, tokens | Structure/behaviour | Redact Secret design system (copied) | |

## Visitor-visible text

Editorial unless marked. Every value inside the prose that could go stale is
a slot (above), never typed into the sentence.

| Where | Page / section | Locale | Class | Owner |
| --- | --- | --- | --- | --- |
| `src/content/en.tsx`, `src/content/ko.tsx` `meta` | `<title>`, meta description (home, 404 fallback) | en, ko | Editorial | `redact-secret-www/i18n` (#10) |
| same, `shell`, `footer` | Skip link, nav, header controls (language, theme, menu), footer columns and notes | en, ko | Editorial | same |
| same, `hero` | Block 1: eyebrow, title (explicit `<br>`), lede, CTAs, proof line, I/O caption and footnote | en, ko | Editorial | same |
| same, `problem` | Block 2: spread diagram labels, destinations, counts labels, remedy | en, ko | Editorial (counts are illustrative diagram labels, not measurements) | same |
| same, `playground` | Block 3: all labels, preset names, PII modes, errors, engine/size/finding-count formatters | en, ko | Editorial | same |
| same, `quickstart` | Block 4: tabs label, Rust note, pin sentence (`pin(core)` interpolates slots), why/expect | en, ko | Editorial + release metadata (slots) | same |
| same, `boundary` | Block 5: flow, pillars, links | en, ko | Editorial | same |
| same, `integrations` | Block 6: group titles/ledes, runtime names, fact terms, status labels, per-card title/description/coverage, observed-date sentence | en, ko | Editorial (+ release metadata via cards) | same |
| same, `evidence` | Block 7: evidence links, routing table, limits | en, ko | Editorial (links to benchmarks, no figures) | same |
| same, `final`, `notFound` | Block 8 CTA; 404 body (both locales on one page) | en, ko | Editorial | same |
| `src/content/architecture/shell.ts` | Section name, sidebar groups, per-page `<title>`/description, pager labels | en, ko | Editorial | same |
| `src/content/architecture/hub.tsx` | `/architecture/` hub body | en, ko | Editorial | same |
| `src/content/architecture/{en,ko}/HowItWorks.tsx` | 01 How it works (+ source strip) | en, ko | Editorial + product evidence (matrix, detectors, coreLimits, sources.core) | same |
| `…/Detection.tsx` | 02 Detection (+ source strip) | en, ko | Editorial + product evidence (matrix, detectors) | same |
| `…/SupportClaims.tsx` | 03 Support claims (+ source strip) | en, ko | Editorial + product evidence (matrix) + benchmark evidence counts (taxonomy, staleProse) | same |
| `…/EvaluationMethods.tsx` | 04 Evaluation methods (+ source strip) | en, ko | Editorial + benchmark evidence (baseline name, sources.benchmarks) | same |
| `…/Adapters.tsx` | 05 Adapters: tiles, budgets, local `statusLabels`/`registryNames` | en, ko | Editorial + release metadata + product evidence (adapterBudgets) | same |
| `…/Vault.tsx` | 06 Vault: tiles, dist-tag note (shown only when npm `latest` ≠ the alpha tag), local `statusLabels`/`registryNames` | en, ko | Editorial + release metadata | same |
| `src/components/sections/IOBlock.tsx` | `Input` / `Output` term labels, same in both locales | — | Editorial (shared, untranslated) | same |
| `src/components/sections/PackageCard.tsx` `registryNames` | `npm`, `PyPI`, `crates.io` | — | Structure/behaviour (proper names) | `redact-secret-www` |
| `src/pages/LocaleChooser.tsx` | `English` / `한국어` at `/` | — | Structure/behaviour | Removed by #8 (English at `/`) |
| `src/components/**` | No other literal copy: components receive text as props | — | — | — |

## Open discrepancies

Found while tying each value to a revision; not changed here because each
changes what a page says.

- **`facts.baseline` = `0.1.0-beta.10`.** At `redact-secret-benchmarks@0a73b7db`
  `baselines/` holds `0.1.0-beta.4` … `0.1.0-beta.9` only, yet
  `/architecture/evaluation-methods/` prints `baselines/0.1.0-beta.10.json`.
  Either the page should name the latest frozen baseline or the value is the
  core release the next freeze will pin; the benchmarks owners decide.
- **Hand-written counts in prose.** A few architecture sentences carry counts
  that could drift from their source: "Six packages" (05 Adapters lede),
  "The ten specs" / "ten methods" (04), "Ten ways" / "Four repositories"
  (hub). Tier counts ("five tiers") are mechanism constants and may stay.
  Move the drift-prone ones to `data/evidence.json` when #10 extracts the
  prose.
- **Adapters source strip has no commit.** `sources.adapters` is a registry
  source (the published `@redact-secret/adapter@0.1.2` and its `gitHead`),
  because that is where the budgets were verified. The page therefore cites
  the repository without a commit, as before. When the adapters' release feed
  lands (#15), cite the feed's revision instead.
