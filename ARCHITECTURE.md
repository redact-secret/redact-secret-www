# Architecture

## Overview

A static landing page plus a seven-page architecture section, built once per
locale, with no server and no runtime API. Preact components are rendered
to complete HTML ahead of time — by the build, and by a content publish
through the same renderer artifact — and hydrated in the browser for tab
switching, the language menu, optional theme support, and the playground only — every link, including the
language switch, loads a prerendered document; nothing is routed
client-side — nothing on the page calls back to this repository, the
product repository, or any API at request time.

```text
application release: build (Vite + TS) ─▶ dist/assets/* (hashed) + renderer artifact
content release:     i18n/ + data/ ─ deployed renderer ─▶ every page's HTML + current.json
                          │
                          ▼
redact-secret-sites: redactsecret-site-www-prod (one S3 bucket + one CloudFront distribution)
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
  landing page: one template per page (`src/pages/architecture/`, the hub in
  `src/pages/Architecture.tsx`) holds the structure for both, and the words
  are `i18n/{en,ko}/architecture/<page>.json` (see
  [§ Bilingual model](#bilingual-model)). The English pages are written from the English
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

## Community page

`/community/` and `/ko/community/`
([ADR 0004](./docs/decisions/0004-community-feedback-handoff.md),
[mockup](https://claude.ai/artifact/5V7EaU571e3ftttvL7Wtqs)): a hero, then a
two-column router — the feedback kinds on the left (sticky), the selected
form and its hand-off on the right; stacked below 900px, where choosing a
kind scrolls the form into view.

- **Forms mirror GitHub.** `src/content/community.ts` lists the six issue
  forms, the two discussion categories and the security route with each
  form's field ids, types, required flags, dropdown options, title prefix
  and labels, as in `redact-secret/redact-secret` `.github/` on `main`.
  Continue opens `…/issues/new?template=…` or
  `…/discussions/new?category=…` with the title and one parameter per
  filled field; the safety checkbox is never prefilled.
- **A low bar to start.** Every free-text field has a plain-words
  placeholder, and while it is empty a "Fill in with a template" button
  inserts a short outline (headings only, from the copy) and puts the
  cursor on its first line. An outline left as inserted does not count as
  filling a required field.
- **The check.** Once a field has text, the playground's worker
  (`src/playground/engine.ts`, PII off) scans every field; a finding shows
  field, line, column, type and length, never the value. Continue is off
  until the check is clean, the required fields and safety box are done,
  and the address is under 8,000 characters. If the engine cannot load,
  Continue stays off and the blank GitHub form is offered instead.
- **Prerendered state.** The page prerenders the default form (bug report)
  in its empty, unchecked state, so hydration changes no text; `#<kind>` in
  the address selects a kind after hydration. Without JavaScript a note
  (hidden by an attribute once hydrated) links GitHub's form chooser.
  `check-i18n` renders every kind, so each form's copy is read and a field
  without copy fails the build.
- **No inline styles.** The address-length meter is twenty cells and a
  finding's bar has five length steps, so nothing sets a computed width.

## Bilingual model

Two directory-routed locales on one host
([ADR 0003](./docs/decisions/0003-single-static-site-separate-releases.md)):
English without a prefix (`/`, `/architecture/…`) and Korean under `/ko/`
(`/ko/`, `/ko/architecture/…`), built from the same block structure and the
same code examples, with independently authored prose. Korean is not a
translation appended to an English layout — see
[CONVENTIONS.md](./CONVENTIONS.md#bilingual-content) for what is shared
between locales and what each locale authors on its own.

**Copy is data, structure is code.** Every visitor-visible word is in
`i18n/<locale>/`: `shell.json`, `home.json`, and `architecture/<page>.json`
per page (plus `architecture/section.json` for the section's sidebar,
titles and pager), each under its own JSON Schema
(`schemas/locale-*-v1.schema.json`, types generated into `src/contracts/`).
Markup is a small structured rich-text form rendered by one component
(`src/components/ui/Rich.tsx`) — no HTML strings. Internal links in copy are
route IDs (`architecture/vault`, `home#playground`) that `src/routes.ts`
resolves per locale; versions, dates, counts and commits are `var` nodes the
page fills from the slots. Components and page templates take the copy
objects as props and never fetch.

**The application bundle holds no copy and no data.** The renderer
(`src/render.tsx`, built into the self-contained `build/renderer/renderer.mjs`)
takes a content release's files — `i18n/<locale>/**.json` and `data/*.json`
— as arguments and writes every page's complete HTML into the application
release's template (`build/renderer/template.html`, Vite's `index.html` with
the hashed asset references). Each page embeds only its own copy slice and
the release's data as inert `<script type="application/json"
id="page-data">`; `src/main.tsx` hydrates from that element — never from
the network — and if it is missing or unreadable, leaves the prerendered page
as it arrived. So a copy or data change rewrites HTML only: every file under
`assets/` stays byte-identical, which is what lets a content release publish
without a build (§ Publish flow). The slots (`src/slots/`, `snippets`,
integration groups) are derived from the release's data at render time
(`src/site-data.ts`). `src/content/index.ts` still imports the working tree's
copy, for the dev server and Storybook only. `npm run build` checks the copy
first (`check-data`: schema and secret scan; `check-i18n`: files, en/ko
parity, links, a 32 KiB per-page budget, and no key left unread by any page,
rendering every page through `src/render.tsx`).

```text
i18n/<locale>/*.json, data/*.json ─ check-data (schema, secrets) ─ check-i18n (parity, links, size, unread keys)
        └─ renderer (src/render.tsx → build/renderer/renderer.mjs) ─ src/app.tsx App({ view })
              ├─ src/pages/* templates ─ components (props only) ─ Rich (inline nodes, route IDs → paths)
              └─ <script type="application/json" id="page-data"> ─ src/main.tsx hydrate (no fetch)
```

Routing lives in one registry, `src/routes.ts`: every indexable page by its
English path, with the Korean path derived by `localePath()` in
`src/i18n.ts`. The same registry feeds:

- **Links in copy**: the route IDs `i18n/**` names (`routeIds`, `routeHref`),
  so a copy file never holds a locale path.

- **`<head>`** (`src/render.tsx`): `lang`, a canonical URL for the page's own
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

A content release is described by `schemas/content-manifest-v2.schema.json`
(§ Publish flow); the per-locale `content-manifest-v1` it replaced was never
written, and the publisher fails closed on it. [docs/content-inventory.md](./docs/content-inventory.md) lists every
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
| Deterministic build | Same commit, same output — `dist/` and the renderer artifact (`build/renderer/`) |
| Canonical URLs | Every page declares `<link rel="canonical">` for its own locale path (English unprefixed, Korean under `/ko/`), with `hreflang` alternates and `x-default` → English; no client-side route changes to account for, since this is `directory` mode, not `spa` |

### Publish flow

Two release planes share one bucket and one distribution
([ADR 0003](./docs/decisions/0003-single-static-site-separate-releases.md)
§ Two release planes): an **application release** builds the code and its
hashed assets; a **content release** renders `i18n/` and `data/` with the
deployed application release's renderer, without a build.

```text
pull request / push to main
  └─▶ .github/workflows/ci.yml
        data-contract and i18n tests → build (check-data, check-i18n, type
        drift, check-slots, tsc, client → renderer artifact → every page) →
        build contract → release-plane proofs (test:publish) → deterministic
        rebuild (site and renderer) → Storybook; playground qualification in
        Chromium, Firefox, WebKit (+ negative control, + proposed CSP);
        architecture pages and first paint without JavaScript or JSON in the
        same three engines under the proposed CSP (+ negative controls)
push to main, CI green ── plan (scripts/publish/plan.mjs, same rule in both workflows)
  ├─ application files differ from the deployed release (or none is deployed)
  │   └─▶ .github/workflows/publish-site.yml (environment: production)
  │         npm ci → npm run build → build contract → assume the publisher
  │         role → scripts/publish/cli.mjs app
  └─ only i18n/ or data/ differ
      └─▶ .github/workflows/publish-content.yml (environment: production)
            npm ci → check-data, check-i18n → assume the publisher role →
            scripts/publish/cli.mjs content
dispatch: publish-site (a commit: application rollback) ·
          publish-content (publish a commit's content, or roll back to a release ID) ·
          repository_dispatch upstream-feed-published (validated; republishes main's committed data)
```

Publishing is triggered by a successful CI run for a push to main, for that
run's commit; pull requests and forks never publish. Both workflows' `plan`
jobs read the live `/current.json` from the public site (no credentials)
and apply the same rule, so exactly one publishes; an unreadable pointer
means "build", which is always correct. The two publish jobs share one
concurrency group, so releases never interleave. All logic is in
`scripts/publish/` (Node, no new dependencies): `release.mjs` for the three
operations, `store.mjs` for the bucket and CDN — the `aws` CLI in the
workflows, a directory in the tests.

**Bucket layout.** Everything in the bucket is served publicly through the
distribution, so nothing sensitive is ever written there.

| Key | What | Cache-Control |
| --- | --- | --- |
| `assets/**` | hashed JS, CSS, WASM, worker — never contain copy or data | `public, max-age=31536000, immutable` |
| `releases/app/<commit>/release.json` | application release record (`app-release-v1`): renderer files and every asset, with digests | immutable |
| `releases/app/<commit>/renderer/{renderer.mjs,template.html}` | the renderer artifact | immutable |
| `content/<release hex>/manifest.json` | content release manifest (`content-manifest-v2`) | immutable |
| `content/<release hex>/html/**`, `…/src/{i18n,data}/**` | every rendered page, and the files it was rendered from | immutable |
| `<path>/index.html` (both route sets, `404/`) | stable HTML: byte copies of the live release's `html/**` | `no-cache` (revalidate) |
| `current.json` | pointer (`content-current-v1`): live release ID + manifest digest, renderer release + record digest | `no-cache`, written last |
| `favicon.svg`, logos, `sitemap.xml`, `robots.txt`, `en/**` redirect documents | other application files | `no-cache` |

**The renderer artifact** is stored in the bucket rather than as an Actions
artifact (which expires) or a GitHub release asset (a second store and a
token to manage): it lives next to the assets it references, the bucket is
versioned, and the publisher reads it back with `s3:GetObject`. It is the
module the build itself rendered `dist/` with, so the HTML CI checked in
three browsers is the HTML it produces; an application release refuses to
publish if it does not reproduce `dist/` byte for byte.

**The manifest** (`content-manifest-v2`) carries the schema version, a
content-addressed release ID (sha256 over `renderer <commit>` and the sorted
`<path> <digest>` lines), the locales (exactly the renderer's), the renderer
release, the generation time, full source revisions (`www` — this
repository's commit — each upstream feed in `data/release.json`, and each
source `data/evidence.json` cites), and every file's path, kind, locale,
schema version, digest and size. The publisher fails closed on an unknown
schema version, a locale set or file locale that does not match the path, a
missing or extra file, a digest or size mismatch, a release ID that does not
match the files, and a renderer release other than the deployed one.

**Application release** (`cli.mjs app`, the three passes of
`redact-secret-sites`' `scripts/publish-site.sh`, with the content release
in the middle):

1. validate, render and secret-scan the content with the new renderer, and
   check it reproduces `dist/` — before anything is written;
2. pass 1: every hashed asset not already in the bucket byte for byte
   (immutable), then the renderer artifact and its record under
   `releases/app/<commit>/` (a record is never rewritten), read back;
3. pass 2: the other application files that changed (`no-cache`), stale
   objects deleted — never under `assets/`, `content/` or `releases/`, never
   `current.json` — then the content release, published as below;
4. pass 3: assets the new release does not list, pruned once the new HTML
   is live;
5. one invalidation of the mutable paths that changed, then retention.

**Content release** (`cli.mjs content`): resolve the deployed application
release from `current.json` and verify its record, every renderer file and
every asset by digest; refuse a commit whose application files differ from
it (checked again against the bucket, not only in `plan`), and, on a CI
trigger, a commit that does not contain the live content's commit; validate
every file against its contract and its locale; render every page of both
locales; run the secret scan (`check-data`'s, with the published core) over
every source file and every page's embedded bundle — a finding fails before
any upload and names the file, pointer and detector, never the value; then

1. upload `content/<release>/` — files, then the manifest (skipped when that
   release is already stored: it is content-addressed);
2. read back the manifest and every file, verifying each digest;
3. write the stable pages whose bytes changed, then `current.json`, last;
4. invalidate only those paths (`/ko/` and `/ko/index.html` for a page,
   `/current.json`), never `/*`; nothing changed means no invalidation;
5. record the release ID, the previous one, the renderer release, the source
   revisions, the changed paths and the invalidation ID in the job summary;
6. apply retention.

It never writes under `assets/` or `releases/`: no JS, CSS or WASM is
rebuilt or re-uploaded.

**Retention.** After every release: the live content release and the ten
most recent others (by manifest `generatedAt`) are kept, with every object
under their prefix; application release records and renderers that one of
them — or `current.json` — names are kept; everything else under
`content/` and `releases/app/` is deleted. Nothing else is ever deleted by
retention. Rollback uses these retained manifests and objects, not S3
version listing (the publisher has no `s3:ListBucketVersions`).

**Rollback, two kinds.**

- *Content:* dispatch **Publish content** with `operation: rollback` and a
  retained release ID (every job summary names the previous one). It
  verifies the manifest and every object against the deployed renderer, then
  re-points the stable pages and `current.json` — byte-identical to when that
  release was live, because `current.json` is a pure function of the release.
  No build, no render, no upload. A release rendered by another application
  release fails closed (its assets may be gone); republish its content
  instead — dispatch `publish` with that commit, which renders it with the
  deployed renderer.
- *Application:* dispatch **Publish site** with an earlier commit on main: a
  full application release of that commit, content included.

**Browser.** Pages never fetch their content: the complete page is in the
HTML, and hydration reads the embedded page data. The site may later read
`/current.json` for freshness, but must never replace a page with it; today
it does not fetch it at all. `scripts/check-first-paint.mjs` proves every
page is complete with JavaScript off, and hydrated, unchanged and
interactive with every JSON request failing.

**IAM actions the publisher uses** (all through the `aws` CLI):
`cloudformation:DescribeStacks` (resolve the bucket and distribution),
`s3:ListBucket`, `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`, and
`cloudfront:CreateInvalidation`. Not `s3:GetObjectVersion` or
`s3:ListBucketVersions`.

**Topology is unchanged:** one CloudFront distribution, one private
versioned S3 bucket with OAC, one publisher role; no runtime compute,
cache or database. Rendering happens in the workflow, never at request
time.

`scripts/check-build-contract.mjs` checks `dist/` against the build contract
table above (every page in both route sets present and nothing else,
canonical URLs, `hreflang`/`x-default`, the 404 page `noindex`, each legacy
`/en/**` document pointing at its path-equivalent page, `sitemap.xml`
listing exactly the indexable pages with matching alternates, `robots.txt`
referencing it, root-relative references, hashed `assets/`, no leftover
`.dev` hub URL) in both workflows.

Both workflows read `PUBLISHER_ROLE_ARN` and `SITE_STACK` from the GitHub
`production` environment — no account ID, bucket name, or role ARN is
written into a workflow file. An application release follows the same
three-pass sequence every site in the project uses: fingerprinted `assets/`
first (cached forever, nothing deleted yet), then everything else with stale
objects removed, then `assets/` pruned once the new HTML is live. See
`redact-secret-sites`'
[publisher policy](https://github.com/redact-secret/redact-secret-sites/blob/main/ARCHITECTURE.md#publisher-policy)
and
[`scripts/publish-site.sh`](https://github.com/redact-secret/redact-secret-sites/blob/main/scripts/publish-site.sh)
for the exact sequence.

Until the `production` environment has `PUBLISHER_ROLE_ARN` and `SITE_STACK`,
the publish jobs stop with a warning rather than failing. The first
publication must be an application release: a content release needs a
`current.json` and a deployed renderer, and fails closed without them. Before it can
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

- **Input stays in the browser.** Two surfaces accept visitor text, and
  both run the core locally and never transmit or persist what is typed:
  the playground
  ([ADR 0001](./docs/decisions/0001-browser-only-playground.md)) and the
  community forms
  ([ADR 0004](./docs/decisions/0004-community-feedback-handoff.md)), whose
  only exit is the prefilled `github.com` address the visitor chooses to
  open once the check is clean. Every static example is the one committed
  synthetic fixture.
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
