# Conventions

These rules keep the hub small and honest about what it claims. The reasons
behind them are in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Scope

- This repository holds one bilingual marketing/navigation page, the
  architecture section (`/architecture/`), its build, and its publish
  workflow. It never holds documentation content (that is a
  separate, not-yet-created repository), scanning logic, benchmark results,
  or PII content. The one exception is the playground's opt-in PII switch and
  its synthetic PII fixtures
  ([ADR 0002](./docs/decisions/0002-pii-toggle-in-playground.md)).
- Never commit a real credential — in source, fixtures, copy, a screenshot,
  or a commit message — even as an example. Use the one synthetic fixture
  (below) instead of inventing a new one.
- Never write an AWS account ID, bucket name, role ARN, or distribution ID
  into this repository. The publish workflow reads them from the GitHub
  `production` environment.

## Code style

- Vite + Preact + TypeScript, rendered to static HTML per locale route by
  the renderer (`src/render.tsx`, built by `scripts/build-site.mjs`); the
  client bundle never imports `i18n/` or `data/` — it hydrates from each
  page's embedded page data. Component styles are CSS Modules
  (`Component.module.css`) next to the component.
- Every component in `src/components/` has a `*.stories.tsx` next to it.
- `src/tokens.css`, `src/tokens.json`: Redact Secret design tokens, copied
  from the design system, not recalculated. Add a test that fails on drift,
  the same way `redact-secret-benchmarks` does.
- `src/style.css`: tokens only. No hex values, no raw pixel lengths (device
  hairlines and `@media` conditions are the only exceptions, since CSS
  cannot take those from variables), no shadows, no border radius beyond
  what the design system defines.
- `src/components/`: pure render functions. No data fetching and no app
  state inside a component — content and slot data are passed in — so a
  component can move to the design system or be reused by the docs site
  later without carrying this repository's assumptions with it.
- `--sunken` / `--sunken-2` are a **local exception**, not canonical design
  system tokens, until the design system accepts the proposal. Do not treat
  them as settled, and do not introduce a third one-off token the same way
  without a decision record.

## Bilingual content

- English (served at `/`, no prefix) and Korean (`/ko/`) are equals; English
  being the default entry locale
  ([ADR 0003](./docs/decisions/0003-single-static-site-separate-releases.md))
  does not make Korean secondary. Korean is authored for its own page, not
  translated in place from the English layout — a Korean sentence that is
  much longer or shorter than its English counterpart is expected, not a
  bug.
- Every visitor-visible word lives in `i18n/<locale>/`, one JSON file per
  page and locale: `shell.json` (header, footer, 404 body), `home.json`, and
  `architecture/<page>.json` for the hub (`overview`), each sub-page, and the
  section's own shell (`section`). A copy correction touches only `i18n/**`;
  if one cannot, the word is in code by mistake. Each file names its schema
  in `schemaVersion` (`locale-<name>-v1`, e.g. `locale-architecture-vault-v1`)
  and its `locale`; see [Data contracts](#data-contracts).
- Markup inside copy is the structured rich-text form of
  `schemas/locale-common-v1.schema.json`, never an HTML string: a value is a
  string or a list of inline nodes (`{ "b": … }`, `{ "em": … }`,
  `{ "code": … }`, `{ "span": …, "class": "mono" }`, `{ "br": true }`,
  `{ "a": …, "to": "architecture/vault" }` or `{ "a": …, "href": "https://…" }`,
  `{ "var": "name" }`, `{ "status": …, "tone": … }`, and `dim`, `flag`,
  `placeholder` for code samples). One component renders it
  (`src/components/ui/Rich.tsx`); nothing uses `dangerouslySetInnerHTML`.
- An internal link in copy names a route ID (`home`, `architecture`,
  `architecture/<page>`, optionally `#<anchor>`, or `#<anchor>` alone),
  resolved in the page's locale by `src/routes.ts` — copy never holds a
  locale path. External links are `https` URLs.
- A value that could change without the prose changing — a version, a date,
  a count, a commit — is a `{ "var": … }` the page fills from the slots, and
  so is a clause that depends on data (e.g. "at `<commit>`" only for a
  repository source): the page picks between authored keys, the copy never
  holds the condition.
- Shared, not translated: code snippets and install commands (both locales
  run the same example), package names, version numbers, dates — these come
  from [content slots](#content-slots), never from either locale's prose.
  Mechanism constants (tier names, marker strings, byte classes, the
  grading lattice) and the synthetic fixtures stay in typed code, not in
  `i18n/`.
- Both locales have the same keys, the same list lengths, and in rich text
  the same vars, link targets and marks (`code`, chips, placeholders, line
  breaks); emphasis (`b`, `em`) may sit where each language needs it. A
  locale that deliberately omits an element says so with `null`, where the
  schema allows it. `npm run check:i18n` (part of `npm run build`) fails on a
  missing file, a parity break, a link to an unknown route or anchor or a
  non-https URL, a page whose copy (shell + page + section) is over 32 KiB of
  minified JSON, and a key no page reads — it renders every page in both
  locales from tracked copy to find those.
- Translated, reviewed: descriptive prose, card one-line descriptions,
  status labels (status chips carry Korean words too, e.g. "출시됨" for
  "Released" — color is never the only signal). No unreviewed machine
  translation ships to either locale.
- Korean body copy: `word-break: keep-all`, a 62ch measure (narrower than
  English's 66ch), and the Montserrat/Merriweather → Noto Sans KR/Noto Serif
  KR font fallback stack already used by `redact-secret-benchmarks`.
- Hero and other large headline breaks are explicit `{ "br": true }` nodes
  (a `<br>`) per locale, authored at the intended break point — never left
  to wrap based on viewport width.
- Never hand-write a locale path. In copy use a route ID (above); in code
  use `homePath(locale)` or `localePath(locale, path)` from `src/i18n.ts`,
  and `architecturePath()` for architecture pages, so English stays
  unprefixed and Korean stays under `/ko/`. No internal link points into `/en/` — those paths are legacy
  redirects only, until 2027-03-31; the build contract fails a page that
  links to one.
- A new top-level page goes into `pageRoutes` in `src/routes.ts` (the
  architecture pages come from their own registry), which gives it both
  locale routes, canonical and `hreflang` tags, a sitemap entry, and a legacy
  `/en/` redirect; add its paths to `scripts/check-build-contract.mjs`.
- A page in one locale that links to a resource only available in the
  other (e.g., an English-only upstream `SECURITY.md`) says so in the link
  text. Do not switch a visitor's locale silently by following a link.
- No fixed height on a card, button, table cell, or grid row to accommodate
  one locale's text length. Content sets height; check both locales land on
  the same row/column count where the layout assumes it, rather than
  constraining either one to fit the other.

## Content slots

- Never hand-write a package version, adapter version, peer range, observed
  date, or count into prose in either locale. Read it from a single
  build-time data source instead, and always render the observed date next
  to the value it describes.
- That data source is **committed to this repository** and refreshed
  deliberately (by a maintainer or a scheduled job), not fetched from the
  GitHub API during the build — a build must be self-contained per
  `redact-secret-sites`'
  [build contract](https://github.com/redact-secret/redact-secret-sites/blob/main/ARCHITECTURE.md#site-build-contract).
- That source is the three files in `data/`, each under a versioned
  contract (see [Data contracts](#data-contracts)). Components read them only
  through `src/slots` and `src/content/integrations.ts`, never directly.
- Refresh release data with `npm run slots:refresh`, which reads npm, PyPI,
  and crates.io for every package in `data/integrations.json` and rewrites
  `data/release.json`. Review the diff and commit it; a card shows only what
  is published, never a version a repository merely declares (a declared
  version is shown only as "not published", with its repository revision in
  `declared.source`). A registry the refresh cannot read keeps its previous
  record, marked `stale` with its **original** `observedAt`; the page dates
  a block by its oldest observation, and `npm run check:data` names every
  stale record until a refresh reads it again. A package with no previous
  record fails the refresh instead.
- The same refresh reads the upstream feeds into `feeds` in
  `data/release.json`: `redact-secret`'s site feed
  (`redact-secret.site-feed/v1`) and `redact-secret-adapters`' release
  feed (`redact-secret-adapters.release-feed/v1`). Each is read at the full
  commit its `main` resolves to through the GitHub API — never a branch
  URL — and validated against the schema at that same commit. Pin `main`,
  never `develop`: a develop feed may declare versions the registries do
  not have. Registry records stay the published fact; a feed is
  cross-checked against them and never overrides them. While the adapters
  feed is not on `main`, `feeds.adapters` records
  `mode: "registry-fallback"` with the commit that lacked it; never leave
  the fallback implicit.
- A feed never becomes current silently. An unknown `schemaVersion`, a
  schema-invalid payload, a digest mismatch on re-fetch (the same commit
  must always hash the same), an inconsistent payload (a version the
  registry does not have, counts that do not add up, a feed older than the
  committed one) or a network error keeps the previous feed record
  `stale`, with its original `observedAt` and first `staleSince`; with no
  previous record the refresh fails. Diagnostics name what failed, never a
  value copied out of the payload or a token. `GITHUB_TOKEN` is optional
  and sent to `api.github.com` only.
- A feed is supported only at the `schemaVersion` the refresh knows
  (`upstreamFeeds` in `scripts/data/feeds.mjs`). When an upstream ships
  `v2`, add it there with tests; until then the old record goes stale
  rather than being read under the wrong contract.
- Show what the feed says, including the uncomfortable part: the support
  matrix's measured product version is printed next to the released one
  (`evidence.measurement` in `src/slots`), never replaced by it.
- `node scripts/refresh-slots.mjs --dry-run [--report <file>]` refreshes
  in memory and prints the drift (exit 3) without writing. The weekly
  `data-freshness` workflow runs it and reports drift in its job summary
  and one `data-drift` issue; it has no write access to contents and never
  commits, pushes or publishes.
- Counts and limits the architecture pages cite (family and provider
  counts, status distribution, evidence tiers, budgets) live in
  `data/evidence.json` as `facts`, each naming one of its `sources` (a
  repository at a full commit SHA, or a published package version and its
  `gitHead`) and the files it was read from. Refresh it by hand from those
  files at a new revision, update the full SHAs and `observedAt`, and let
  `npm run check:slots` confirm the counts still add up. The matrix counts
  must equal the product feed's (`check-data` fails otherwise), so a
  refresh that brings a new matrix is committed together with the matching
  `facts.matrix`. Mechanism constants
  that describe code behaviour (an entropy threshold, a minimum length) may
  stay in prose; anything that changes when the matrix or a release changes
  may not.
- Benchmark scores, rates and bounds are never stored in `data/`: evidence
  facts are integers and names, and `check-data` rejects a fractional number
  or a key that names a measured result. Link to
  `benchmarks.redactsecret.dev` instead.
- [docs/content-inventory.md](./docs/content-inventory.md) lists every
  visitor-visible string and every datum the site reads, with its class and
  canonical owner. A PR that adds, moves or removes one updates it.
- If `npm install <package>` alone would not select the version being
  shown (e.g., `latest` points elsewhere), say so next to the install
  command rather than leaving a visitor to find out the hard way — this
  belongs in the quickstart block, not the hero.

## Data contracts

- Every committed data file is governed by a JSON Schema (draft 2020-12) in
  `schemas/<name>-v<N>.schema.json`, and names it in its `schemaVersion`
  field. Validation fails closed: a missing or unknown `schemaVersion`, or
  one from another contract family, fails before the schema runs.
  Provenance shapes (`source`, `observedAt`/`generatedAt`, `digest`,
  `freshness`, `staleSince`) are shared through `schemas/common-v1.schema.json`.
- `npm run check:data` (first step of `npm run build`, so CI and publish
  run it) validates every registered file with Ajv, checks the files agree
  with each other (every card's package is listed and has a release
  record), rejects benchmark figures, and scans every string with the
  published `@redact-secret/core` — only a value carrying the
  `SYNTHETIC_` marker may be found, and a finding never echoes the value.
  `--no-stale` also fails on a stale record.
- TypeScript types are generated from the schemas into `src/contracts/`
  (`npm run data:types`); never edit them or hand-write a duplicate. The
  build runs `npm run check:data-types`, which fails when they drift.
- `npm run test:data` runs the offline negative tests (unknown
  `schemaVersion`, missing provenance, stale handling in the refresh,
  benchmark figures, secret-shaped values) and the upstream-feed tests
  (`scripts/test-upstream-feeds.mjs`: one case per fail-closed path, both
  adapter paths, the drift report), all against stubs and the fixtures in
  `scripts/fixtures/upstream-feeds/`. CI runs it before the build.
- An upstream feed's own contract is its owner's: this repository stores
  a reduced record of it under `release-v1` `feeds`, validates the payload
  against the schema fetched at the same commit, and keeps copies of the
  feed and schema only as test fixtures.
- Locale copy (`i18n/<locale>/<name>.json`) is registered as one `dir`
  target whose family is derived from the path (`locale-<name>`, with `/`
  as `-`), so a new copy file needs only its schema. The secret scan covers
  it like any data file; a detected shape that the page shows on purpose as
  a format (the detection page's `postgres://user:pw@host`) is exempted by
  its exact text and detector in `scripts/data/illustrative.mjs`, reviewed
  like a fixture.
- **Adding a contract:** write `schemas/<name>-v1.schema.json` with an
  `$id` of `https://www.redactsecret.com/schemas/<name>-v1.schema.json`,
  `properties.schemaVersion.const` of `"<name>-v1"`, and `$ref`s into
  `common-v1.schema.json` for provenance; register the files it governs in
  `targets` in `scripts/data/contracts.mjs` (a `path`, or a `dir` for every
  `*.json` under it; add the directory to `governedDirs` so unregistered
  files fail); run `npm run data:types` and commit the generated file; add
  negative cases to `scripts/test-data-contracts.mjs`.
- **Changing a contract:** a change that an existing reader would
  misread is a new version (`<name>-v2.schema.json`, new `schemaVersion`),
  not an edit to v1. Readers keep failing closed on versions they do not
  know.
- **Release contracts** govern objects the publisher writes to the bucket,
  not committed files: `content-manifest-v2` (one content release — both
  locales, HTML and sources; it superseded the never-written, per-locale
  `content-manifest-v1`), `content-current-v1` (`/current.json`) and
  `app-release-v1` (an application release and its renderer artifact).
  `scripts/publish/release.mjs` validates each one it reads or writes with
  the same Ajv setup and fails closed the same way.

## Architecture pages

- One `Claim` (the brand-green block) per page, holding one sentence that
  can be checked against code or a spec. If a page seems to need two, split
  the page. When the code changes, the claim changes with it.
- Each page has one template, `src/pages/architecture/<Page>.tsx` (the hub
  is in `src/pages/Architecture.tsx`), shared by both locales: the component
  structure, the one claim, the slots and the mechanism constants. Its words
  are `i18n/<locale>/architecture/<page>.json`, authored per locale and kept
  at parity by `npm run check:i18n`. A structural change is a template
  change, made once for both locales. Cross-links inside copy use route IDs
  (`{ "a": …, "to": "architecture/vault" }`), so a page never links silently
  into the other locale.
- Adding a page: add it to `src/content/architecture/pages.ts` (order is
  sidebar and pager order), its sidebar label, `<title>` and description in
  both locales' `architecture/section.json`, its template under
  `src/pages/architecture/`, its copy as `i18n/{en,ko}/architecture/<id>.json`
  with a `schemas/locale-architecture-<id>-v1.schema.json` (then
  `npm run data:types`), the file to the loader in `src/content/index.ts`,
  and its path to `scripts/check-build-contract.mjs`.
- Every page ends with a `SourceStrip`: which files, at which commit, read
  on which date.
- No `style` attribute anywhere — the proposed CSP forbids inline styles.
  Diagrams are rules and grids in CSS Modules.
- Run `npm run check:architecture` before merging a change to these pages
  or their components. It loads every page in Chromium, Firefox, and WebKit
  under the proposed CSP (`scripts/csp.mjs`, shared with the playground
  qualification) and fails on a page error, a console error, a missing
  claim or a second one, a wrong `lang`, a broken sidebar, language switch,
  or link, or a sideways scroll at 360px or 1280px — for both the English
  (`/architecture/…`) and Korean (`/ko/architecture/…`) route sets. It also
  checks both homes' language switch and alternates, and that every legacy
  `/en/…` path lands on its path-equivalent English page. CI runs it with a
  negative control that must fail.

## Synthetic data

- The page uses exactly one synthetic fixture for every input/output example,
  across both locales and every runtime tab:
  `API_KEY=SYNTHETIC_REVOKED_CONTEXT_VALUE` in, `API_KEY=<SECRET_1>` out.
  Reusing it lets a reviewer recognize it as fake on sight; a second
  "realistic-looking" example undermines that.
- A raw secret value is never rendered as text or asterisks. It is a solid
  `ink`-colored bar (`role="img"` with an `aria-label`) — the design
  system's convention for "a value that must not be readable," distinct from
  the typed placeholder chip (`<SECRET_1>`) that represents the product's
  actual output.
- The playground is the only input on this site, and it stays inside
  [ADR 0001](./docs/decisions/0001-browser-only-playground.md): no
  transmission, no persistence, spellcheck and autofill off, metadata-only
  findings. No form or endpoint accepts visitor text. Any change that
  loosens one of those rules needs a new decision record.
- Run `npm run qualify:playground` (Chromium, Firefox, WebKit) before
  merging a change to the playground or a `@redact-secret/core` bump, and
  commit the record it writes under `docs/qualification/`.

## Design system

- Colors, type, spacing, and radii are copied from the Redact Secret design
  system (tokens and logo; it defines no components), never re-derived.
- The logo is swapped per theme (`logo-light.svg` / `logo-dark.svg`), never
  recolored in CSS. The two files differ only in wordmark ink.
- Status chip colors (`status-success`, `status-warning`, `status-danger`,
  `status-info`) are reserved for what they mean — a detection or
  compliance result — never used as decoration. Brand green
  (`brand-green`) is identity, not "pass"; the two must never be used
  interchangeably on the same page.
- A proposed token or component that does not yet exist in the design
  system ships here as a documented local override (see `--sunken` above)
  and is called out in the PR, not silently treated as final.

## Deploy

- The publish workflows live in this repository
  (`.github/workflows/publish-site.yml`, `.github/workflows/publish-content.yml`)
  and follow `redact-secret-sites`'
  [publishing conventions](https://github.com/redact-secret/redact-secret-sites/blob/main/CONVENTIONS.md#publishing):
  immutable assets first, then everything else with stale objects removed
  (the pages and `current.json` last), then assets pruned, then an
  invalidation of the changed paths only. If one pass changes, all of
  publish-site.sh's equivalents across the project should be revisited
  together; `redact-secret-sites` mirrors `publish-site.yml` in
  `docs/upstream/`.
- The workflows read `PUBLISHER_ROLE_ARN` and `SITE_STACK` from the GitHub
  `production` environment. Each keeps `permissions: {}` at the top; only
  its publish job requests `id-token: write`, and it assumes the role in its
  last steps, after `npm ci` (and the build) — no dependency install runs
  while an AWS session is open.
- Actions are pinned to full commit SHAs, with the version in a trailing
  comment, matching the rest of the project.
- Two release planes
  ([ARCHITECTURE.md § Publish flow](./ARCHITECTURE.md#publish-flow)):
  `publish-site.yml` publishes an application release (build, hashed
  assets, the renderer artifact, and the content with it);
  `publish-content.yml` publishes `i18n/` and `data/` with the deployed
  renderer and never builds. After a green CI run on main, both run the same
  plan (`scripts/publish/plan.mjs`) and exactly one publishes. Their publish
  jobs share one concurrency group. Keep the logic in `scripts/publish/`
  (tested offline by `npm run test:publish`), not in YAML.
- Rollback is two kinds:
  - **content** — dispatch *Publish content* with `operation: rollback` and
    a retained release ID from an earlier job summary. It verifies that
    release's manifest and objects and re-points the stable pages and
    `current.json`; no build, no render. It fails closed on a release
    rendered by another application release: republish that commit's
    content instead (`operation: publish`, `sha: <commit>`).
  - **application** — dispatch *Publish site* with an earlier commit on
    `main`, which rebuilds and republishes it, content included.
- Never invalidate `/*` by default: a release invalidates only the mutable
  paths whose bytes it changed. Hashed assets, `content/` and `releases/`
  are immutable (a year, `immutable`); HTML, `current.json` and the other
  application files revalidate (`no-cache`).
- Nothing written to the bucket may be sensitive: everything in it is
  served publicly. Job summaries, logs and errors name commits, release IDs,
  digests, paths and invalidation IDs — never an object body or a value the
  secret scan found. A dispatch input or `repository_dispatch` payload is
  untrusted: validate it against a strict pattern before use.
- Retention: the live content release, the ten before it, and the
  application release records they name. Change `KEEP_RELEASES` in
  `scripts/publish/release.mjs`, not by hand in the bucket.

## Documentation and decisions

- Status labels (`current`, `planned`, `proposed`, `unknown`) follow the
  main repository's
  [convention](https://github.com/redact-secret/redact-secret/blob/main/CONVENTIONS.md),
  with the same meanings.
- Record a decision that moves a boundary — adding a staging environment,
  accepting or rejecting a proposed design-system token, resolving the
  `.dev`/`.com` question, adding a live input surface — as an ADR under
  `docs/decisions/`, in the project's format (`decision_id`, `status`,
  `scope`, `title`, `decided_at` front matter).
- A PR that changes what the page claims, how it is built, or how it is
  published updates README.md, ARCHITECTURE.md, or this file in the same PR.
  Prefer a link to the authoritative source over copying detail into more
  than one of these three files.
- Repository documents are in English; page content is bilingual per
  [Bilingual content](#bilingual-content) above.

## Commits

- Conventional prefixes: `content:` (prose changes in either locale),
  `design:` (tokens, components, layout), `i18n:` (bilingual mechanics, not
  prose), `deploy:` (workflow, publish), `docs:` (this file set).
- A commit that changes shared content (a code snippet, a slot) and a commit
  that changes locale-specific prose are kept separate where practical, so a
  revert of one does not touch the other locale.
