# Architecture

## Overview

A static landing page plus a seven-page architecture section, built once per
locale, with no server and no runtime API. Preact components are prerendered
to HTML at build time and hydrated in the browser for tab switching, theme,
and the playground only — every link, including the language switch, loads a
prerendered document; nothing is routed client-side —
nothing on the page calls back to this repository, the product repository,
or any API at request time.

```text
build (Vite + TS)  ──▶  dist/* (English), dist/ko/* (Korean), dist/assets/*
                          │
                          ▼
redact-secret-sites: redactsecret-site-www-prod (S3 + CloudFront)
                          │
                          ▼
                 www.redactsecret.com  (+ apex 301, per redact-secret-sites)
```

This repository owns page content, the bilingual build, and the publish
workflow. `redact-secret-sites` owns the bucket, the distribution, the
publisher role, and DNS — see its
[ARCHITECTURE.md](https://github.com/redact-secret/redact-secret-sites/blob/main/ARCHITECTURE.md)
for that side.

## What this site is, and is not

The design spec fixed these as premises, not choices this repository
re-opens:

| Question | Answer | Why |
| --- | --- | --- |
| Numbers in the hero? | No. No version, detector count, or accuracy figure above the fold. | Keeps the first screen about the product, not a claim to defend. |
| A competitor scorecard? | No. At most one neutral routing table, in the evidence section, removable without touching layout. | The project shares its detection boundary with other tools; a scorecard would misstate that. |
| A live playground? | Browser-only, per [ADR 0001](./docs/decisions/0001-browser-only-playground.md): the published core runs as WebAssembly in the visitor's browser; input is never transmitted or stored. | Accepting visitor text turns a marketing page into a data-handling surface; the ADR sets that boundary and its review checklist. |
| Benchmark numbers copied here? | No. Links to `benchmarks.redactsecret.dev` with a sentence on what that page guarantees. | One source of truth for measured numbers; this site is not it. |
| PII content? | Only as the playground's opt-in switch (off by default); no PII copy or claims elsewhere. | PII detection shipped as opt-in in `0.1.0-beta.10` (npm `beta` tag). See [ADR 0002](./docs/decisions/0002-pii-toggle-in-playground.md). |
| Community chat links (Slack, Discord)? | No, until a channel is actually staffed. | An unattended channel linked from a security tool's marketing page is worse than no channel. |

## Page structure — eight blocks

The home page is eight blocks in a fixed order, separated by a 1px rule, no
shadows or rounded cards. Each block answers one visitor question before
handing off to the next — the problem, then the product solving it live,
then how to install it, how it works, what it connects to, and the evidence:

| # | Block | Question it answers |
| --- | --- | --- |
| 1 | Hero + input/output | What is this product? |
| 2 | The runtime problem (spread diagram) | What problem does it solve? |
| 3 | Playground (browser-only, [ADR 0001](./docs/decisions/0001-browser-only-playground.md)) | How does it solve it, live? |
| 4 | First run (runtime tabs: JS, Python, CLI) | How do I install it? |
| 5 | How it works · Control (the one large brand-green block) | Where does it run, and who enforces `block`? |
| 6 | Core, adapters, and vault (cards; adapters and vault split by Browser / Node.js / Python) | Does it fit my stack? |
| 7 | Evidence (links, optional routing table, limits) | Is there evidence for this? |
| 8 | Next step (final CTA) | What do I do next? |

Block 5 is deliberately the only block carrying the brand color as a fill —
everywhere else, brand green is reserved for the primary CTA. This mirrors
the design system's "one green per screen" rule applied across a scrolling
page: see the design spec's green-budget table for the block-by-block
accounting.

## Architecture section

`/architecture/` (English) and `/ko/architecture/` (Korean) are a hub plus
six pages, in the order a reader builds
trust — what decides, why to believe it, what sits outside the core
([design spec](https://claude.ai/artifact/8drsKw3xovoR13xjq4sPhR),
[mockup](https://claude.ai/artifact/HhdGeEQQs9REsfWotjwZSw)):

| # | Path | Group | Question it answers |
| --- | --- | --- | --- |
| 00 | `/architecture/` | — | The rules are written once: four repositories, one direction |
| 01 | `/architecture/how-it-works/` | Engine | What is this thing? |
| 02 | `/architecture/detection/` | Engine | How sure, and why? |
| 03 | `/architecture/support-claims/` | Evidence | What shipped, what does the world issue, how did each measure? |
| 04 | `/architecture/evaluation-methods/` | Evidence | How many ways can it be wrong, and what stops each? |
| 05 | `/architecture/adapters/` | Boundaries | Who fetches the text? |
| 06 | `/architecture/vault/` | Boundaries | What if you need the original back? |

- **One shell.** Every page shares `ArchitectureLayout`: a section bar with
  the page's path, a sticky sidebar listing all seven pages (a `<details>`
  below 1040px), and a prev/next pager that loops back to the hub. The page
  registry is `src/content/architecture/pages.ts`; its order is the sidebar
  and pager order.
- **Language.** All seven pages are authored in both locales, like the
  landing page: the hub in `src/content/architecture/hub.tsx`, the six
  sub-pages in `src/content/architecture/en/` and `ko/`, sharing one
  component structure. The English pages are written from the English
  originals the Korean pages were first drafted from, so the site no longer
  links out to those drafts. Every page names both locales (and
  `x-default` → English) as hreflang alternates; the language switch goes
  to the same page in the other locale (`/architecture/vault/` ↔
  `/ko/architecture/vault/`). `scripts/check-build-contract.mjs` fails a
  build where an alternate is wrong or a page is `noindex`. Cross-links use
  `architecturePath(locale, id)`, never a hand-written path.
- **Green budget.** One `Claim` block per page carries the page's single
  checkable sentence (design spec § 03); the sidebar's current-page rule is
  the only other green. A second claim means the page is split wrong.
- **Numbers.** Counts and limits the pages cite come from
  `data/evidence.json`, each tied to its source file and commit;
  versions come from `data/release.json` as on the landing page. See
  [CONVENTIONS.md § Content slots](./CONVENTIONS.md#content-slots).
- **No inline styles.** Diagrams are rules and grids only (no SVG, no
  images), and nothing sets a `style` attribute — the proposed CSP has
  `style-src 'self'`, so the status bar draws one cell per family instead of
  a computed width. The build contract check enforces this.

Deliberate departures from the mockup:

- **No competitor comparison table** on the how-it-works page. This site
  carries no scorecard ([What this site is](#what-this-site-is-and-is-not));
  the page keeps the neutral "a different door" flow instead.
- **No speed or size figures** for the `common` profile — those are
  measurements and live on `benchmarks.redactsecret.dev`, which the page
  links.
- The mockup's note about adapter versions disagreeing between sources is
  replaced by the observed-date line every slot carries.

## Bilingual model

Two directory-routed locales on one host
([ADR 0003](./docs/decisions/0003-single-static-site-separate-releases.md)):
English without a prefix (`/`, `/architecture/…`) and Korean under `/ko/`
(`/ko/`, `/ko/architecture/…`), built from the same block structure and the
same code examples, with independently authored prose. Korean is not a
translation appended to an English layout — see
[CONVENTIONS.md](./CONVENTIONS.md#bilingual-content) for what is shared
between locales and what each locale authors on its own.

Routing lives in one registry, `src/routes.ts`: every indexable page by its
English path, with the Korean path derived by `localePath()` in
`src/i18n.ts`. The same registry feeds:

- **`<head>`** (`src/main.tsx`): `lang`, a canonical URL for the page's own
  path, and `hreflang` `en` / `ko` alternates at the equivalent paths plus
  `x-default` → English.
- **`sitemap.xml`**, listing both route sets with the same alternates, and
  **`robots.txt`**, which points at it (emitted by `vite.config.ts`).
- **Legacy `/en/**` redirects.** English used to live under `/en/`. Until
  2027-03-31 each old path redirects to the same path without the prefix
  (`/en/architecture/vault/` → `/architecture/vault/`), never everything to
  `/`. The permanent 301 is a CloudFront Function in `redact-secret-sites`
  ([#13](https://github.com/redact-secret/redact-secret-www/issues/13));
  until it is live, the build writes a fallback document at each legacy
  path — canonical to the new URL, `noindex`, `meta refresh`, and a visible
  link, with no script. Once the 301 is live, those objects are never
  reached.
- **404.** One `noindex` page, `/404/index.html`, which CloudFront serves for
  a miss in either route set; it speaks both languages and links both homes.

Layout consequences that follow from this:

- No fixed-height cards, buttons, or grid cells. Content sets height; the two
  locales are checked against each other, not against a fixed box.
- Hero line breaks are explicit per locale (`<br>` at an authored point), not
  left to reflow.
- Korean body copy uses `word-break: keep-all` and a narrower measure (62ch,
  vs. the English 66ch) — a wide Latin measure does not read well in Hangul.
- Each locale's canonical URL points at itself; a Korean page linking to an
  English-only resource (e.g., an upstream `SECURITY.md`) says so in the link
  text rather than switching language silently.

## Design system integration

Colors, type, and spacing are copied from the Redact Secret design system
(tokens and logo only — it defines no components) and are not recalculated
here. This is the same integration `redact-secret-benchmarks` uses: vendor
`tokens.json`/`tokens.css`, add a test that fails on drift, and keep
`style.css` to token references only — no hex, no raw pixel values, no
shadows, no border radius beyond what the system defines.

Two things the design spec asked this repository to carry as **local
exceptions**, not settled system values, until a decision record resolves
them:

- **`--sunken` / `--sunken-2`.** Proposed new tokens for code-block and
  input/output backgrounds, which the system does not currently define.
  `redact-secret-benchmarks` already uses the same values informally. Land
  them here as a local override; do not treat them as canonical until the
  design system accepts the proposal.
- **Mobile logo minimum width.** The system's minimum lockup width (64px) is
  incompatible with a header that also fits under the mobile hero without
  pushing content down; the spec's mockup ships at ~60px on mobile as a
  documented, unapproved exception. Do not silently "fix" this by shrinking
  the logo further or dropping the rule elsewhere — flag it in the PR that
  first ships the header.

The logo is swapped per theme (`logo-light.svg` / `logo-dark.svg`), never
recolored via CSS — the two files differ only in wordmark ink.

## Content slots

Package versions, adapter versions and peer ranges, release dates, and any
count that could go stale are never hand-written into prose in either
locale. They render from a single build-time data source, always paired with
the date it was observed. Rationale, precedent, and exact examples are in
[CONVENTIONS.md](./CONVENTIONS.md#content-slots).

Per `redact-secret-sites`' build contract, that data source is **committed
content in this repository**, refreshed by a maintainer or a scheduled job —
not a live GitHub API call made during the build. A build must be
self-contained: it uses only the checked-out commit and its lockfile, no
network calls beyond package installation. This mirrors how the hub's
release-news content stays "committed content, so every build is
self-contained," per
[redact-secret-sites' description of the hub](https://github.com/redact-secret/redact-secret-sites/blob/main/ARCHITECTURE.md#hub-www).

The data source is three files, each under a versioned JSON Schema in
`schemas/` ([CONVENTIONS.md § Data contracts](./CONVENTIONS.md#data-contracts)):

```text
data/integrations.json  integrations-v1  packages the page lists + integrations cards   authored here
data/release.json       release-v1       what each package has published, plus the       npm / PyPI / crates.io,
                                         upstream feeds cross-checked against it          redact-secret + -adapters feeds
data/evidence.json      evidence-v1      counts and limits the architecture pages cite   redact-secret, -benchmarks, -adapters, -vault
        │
        ├─ npm run check:data ── schema (unknown schemaVersion fails), cross-file
        │                        consistency, provenance, no benchmark figures,
        │                        no plaintext secret (scanned with @redact-secret/core)
        ├─ src/contracts/*.ts ── generated from the schemas; drift fails the build
        └─ src/slots, src/content/integrations.ts ── the only readers; components get props
```

Every record says where it came from and how current it is: a `source`
(a repository at a full commit SHA, or a registry package at a version,
with its `gitHead` when npm records one), an `observedAt` or `generatedAt`,
a `digest` of every fetched registry payload, and a `freshness` of `fresh`
or `stale`. A registry the refresh cannot read keeps its previous record
marked `stale`, with its original `observedAt` and a `staleSince`; the page
dates a block by its oldest observation, so a stale value is never shown as
current, and `check-data` names it on every build. A new record with no
previous value fails the refresh rather than being invented.
`data/release.json` also records the two upstream feeds (#12), each
fetched at the full commit its repository's `main` points to (resolved
through the GitHub API) and validated against the schema at that same
commit:

```text
redact-secret           docs/contracts/site-feed/v1/feed.json   redact-secret.site-feed/v1
  → feeds.product       release identity; support-matrix counts; the version the matrix
                        measured next to the released one (the pages show both)
redact-secret-adapters  site-feed/v1/adapters.json              redact-secret-adapters.release-feed/v1
  → feeds.adapters      mode "feed" once it is on main; until then mode "registry-fallback",
                        and the registry records stay the only source (recorded, not implied)
```

Each feed record keeps the commit, a sha256 of the bytes computed here, the
feed's own `generatedAt` and the refresh's `observedAt`. Registry records
remain the published fact; a feed never overrides them, it is
cross-checked against them. The refresh fails closed: an unknown
`schemaVersion`, a schema-invalid payload, a digest that differs on
re-fetch (or from the committed digest for the same commit), an
inconsistent payload (a version the registry does not have, counts that do
not add up, a feed older than the committed one) or a network error keeps
the previous record `stale` — or, with no previous record, fails. A weekly
workflow (`.github/workflows/data-freshness.yml`) runs the refresh in
dry-run mode and reports drift in its job summary and one `data-drift`
issue; it never commits or publishes.

`schemas/content-manifest-v1.schema.json` defines the per-locale content
release manifest the content-only publish will write (#6); nothing writes one
yet. [docs/content-inventory.md](./docs/content-inventory.md) lists every
visitor-visible string and datum with its class and canonical owner.

## Evidence and repository boundaries

This site states claims and links to where they are backed, rather than
reproducing evidence:

| Claim | Backed by | Linked, not copied |
| --- | --- | --- |
| "Supports these hosts" | Package cards, registry metadata via `npm run slots:refresh` into `data/release.json` | Adapter and vault READMEs, package registry |
| "Measured against a corpus" | `benchmarks.redactsecret.dev` | Never a rate, bound, or score |
| "This is what's released" | `redact-secret`'s site feed (`feeds.product` in `data/release.json`), cross-checked against the registries | Version and observed-date slots only |
| "Here's the support matrix" | `redact-secret`'s support matrix doc | Link only |
| "Measured on one version, released as another" | `redact-secret`'s site feed: `supportMatrix.measuredProductVersion`, `benchmarksRevision`, `gatedLatestRelease` | Both versions shown side by side on `/architecture/support-claims/`, never merged |
| Architecture pages' family counts and statuses | `redact-secret`'s site feed (the pinned support matrix), benchmarks' `taxonomy.json` | Counts only, via `data/evidence.json`, which `check-data` holds equal to the feed's counts — never a rate, bound, or score (`evidence-v1` allows integers only, and `check-data` rejects score-like keys) |
| Architecture pages' limits and budgets | `redact-secret` `README.md`/`ARCHITECTURE.md`; the published `@redact-secret/adapter` README | Values via `data/evidence.json`, tied to the commit or package version and `gitHead` they were read at |

Ownership of each class of data (editorial, structure, release metadata,
product evidence, benchmark evidence, synthetic fixture) and where each
comes from is in [docs/content-inventory.md](./docs/content-inventory.md).
`redact-secret`'s site feed is consumed today. `redact-secret-adapters`'
release feed is consumed once it reaches that repository's `main`; until
then the registry records are the checked fallback, and
`feeds.adapters.mode` says so. Benchmark provenance needs no feed of its
own: the product feed already pins the benchmarks commit the matrix was
measured at, and the pages link to the benchmarks site for everything
measured (#16).

## Deployment

### Build contract compliance

`redact-secret-sites` requires each of the following before it will publish;
this is where each is met here:

| Requirement | How this repository meets it |
| --- | --- |
| Static output to one directory | `npm run build` writes `dist/` |
| Self-contained build | No AWS credentials, API tokens, or live GitHub calls during build; content slots read committed data |
| Hashed assets under `assets/` | Vite's default; everything else may change at the same path |
| Root-relative paths | Site is served from `/` of `www.redactsecret.com` |
| Declared runtime | `package.json` `engines` states the supported Node range |
| Deterministic build | Same commit, same output |
| Canonical URLs | Every page declares `<link rel="canonical">` for its own locale path (English unprefixed, Korean under `/ko/`), with `hreflang` alternates and `x-default` → English; no client-side route changes to account for, since this is `directory` mode, not `spa` |

### Publish flow

```text
pull request / push to main
  └─▶ .github/workflows/ci.yml
        data-contract tests → build (check-data, type drift, check-slots,
        tsc, prerender) → build contract → deterministic
        rebuild → Storybook; playground qualification in Chromium, Firefox,
        WebKit (+ negative control, + proposed CSP); architecture pages in
        the same three engines under the proposed CSP (+ negative control)
push to main, CI green
  └─▶ .github/workflows/publish-site.yml (environment: production)
        npm ci → npm run build → build contract → assume
        redactsecret-publisher-production → sync dist/ to the www stack's
        bucket → invalidate /*
```

Publishing is triggered by a successful CI run for a push to main, and builds
that run's commit; pull requests and forks never publish. A manual dispatch
takes a commit on main, which is how a rollback is done.
`scripts/check-build-contract.mjs` checks `dist/` against the build contract
table above (every page in both route sets present and nothing else,
canonical URLs, `hreflang`/`x-default`, the 404 page `noindex`, each legacy
`/en/**` document pointing at its path-equivalent page, `sitemap.xml`
listing exactly the indexable pages with matching alternates, `robots.txt`
referencing it, root-relative references, hashed `assets/`, no leftover
`.dev` hub URL) in both workflows.

The workflow reads `PUBLISHER_ROLE_ARN` and `SITE_STACK` from the GitHub
`production` environment — no account ID, bucket name, or role ARN is
written into the workflow file. Publishing follows the same three-pass
sequence every site in the project uses: fingerprinted `assets/` first
(cached forever, nothing deleted yet), then everything else with
`--delete`, then `assets/` pruned once the new HTML is live. See
`redact-secret-sites`'
[publisher policy](https://github.com/redact-secret/redact-secret-sites/blob/main/ARCHITECTURE.md#publisher-policy)
and
[`scripts/publish-site.sh`](https://github.com/redact-secret/redact-secret-sites/blob/main/scripts/publish-site.sh)
for the exact sequence.

Until the `production` environment has `PUBLISHER_ROLE_ARN` and `SITE_STACK`,
the publish job stops with a warning rather than failing. Before it can
publish, `redact-secret-sites` must add
this repository's OIDC subject to `ProductionSubjects` and deploy a
`redactsecret-site-www-prod` stack — both are `redact-secret-sites` changes,
tracked there, not here.

No staging environment is planned initially: nothing feeds this site content
that changes between commits the way benchmark results do, so there is
nothing for a staging environment to show that production would not. Add one
if that stops being true (e.g., a preview-before-publish workflow gets
adopted).

## Security boundary

- **Input stays in the browser.** The one surface that accepts visitor
  text is the playground, which runs the core locally and never transmits
  or persists what is typed
  ([ADR 0001](./docs/decisions/0001-browser-only-playground.md)). Every
  static example is the one committed synthetic fixture.
- **No real credentials, anywhere** — source, fixtures, copy, screenshots, or
  commit history. Same rule as the rest of the project
  ([AGENTS.md § Security boundary](./AGENTS.md#security-boundary)).
- **No telemetry, no third-party scripts** beyond Google Fonts, matching
  `redact-secret-benchmarks`' `index.html`.
- **No AWS credentials or scanner binaries in this repository.** This site
  never runs Gitleaks or TruffleHog; it has nothing to scan.

## Open questions

Resolved: the domain is `www.redactsecret.com`, with the apex redirecting to
it ([redact-secret-sites decision](https://github.com/redact-secret/redact-secret-sites/blob/main/docs/decisions/2026-09-28-serve-the-hub-on-redactsecret-com.md)).
The default entry language is English at `/`, with Korean at `/ko/`
([ADR 0003](./docs/decisions/0003-single-static-site-separate-releases.md)).

| Question | This repository's default until decided | Why it's open |
| --- | --- | --- |
| `--sunken` / `--sunken-2` tokens | Local override in this repository's `tokens.css`, not upstream | Needs design-system acceptance; `redact-secret-benchmarks` carries the same local exception today. |
| Mobile logo minimum width | Ship the mockup's ~60px exception, flagged in the PR | Conflicts with the system's stated 64px minimum; needs explicit sign-off, not a quiet fix. |
| Routing/comparison table in the evidence block | Ship it, built to be deletable without a layout change | Explicitly optional per the content blueprint; can be cut right before launch with no cost either way. |
| A fourth runtime tab for Rust | Link to a guide instead of adding a tab | No verified first-example Rust snippet existed when the spec was written; promote to a tab once one is confirmed working. |
| Relationship to the docs site | Nav item links out; no assumption about its design | `/docs/` is out of scope for this repository and not yet a repository itself. |
| Status counts on `.com` | Show the shipped matrix's status counts on the support-claims page, sourced and dated | They are counts from the product's own generated matrix, not benchmark scores — but the design spec asks whether even counts belong only on `.dev`. |
| Refreshing `data/evidence.json` | By hand, from the named files at the named full commits; `check-data` validates provenance, holds the matrix counts equal to the product feed in `data/release.json`, and `check-slots` verifies the counts add up | The matrix counts are now checked against `redact-secret`'s site feed, but the other facts (detector counts, limits, adapter budgets, taxonomy) have no feed; they stay hand-read until an owner publishes them. |
