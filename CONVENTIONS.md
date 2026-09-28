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

- Vite + Preact + TypeScript, prerendered to static HTML per locale route
  (`vite.config.ts`). Component styles are CSS Modules
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

- `/en/` and `/ko/` are equals. Korean is authored for its own page, not
  translated in place from the English layout — a Korean sentence that is
  much longer or shorter than its English counterpart is expected, not a
  bug.
- Shared, not translated: code snippets and install commands (both locales
  run the same example), package names, version numbers, dates — these come
  from [content slots](#content-slots), never from either locale's prose.
- Translated, reviewed: descriptive prose, card one-line descriptions,
  status labels (status chips carry Korean words too, e.g. "출시됨" for
  "Released" — color is never the only signal). No unreviewed machine
  translation ships to either locale.
- Korean body copy: `word-break: keep-all`, a 62ch measure (narrower than
  English's 66ch), and the Montserrat/Merriweather → Noto Sans KR/Noto Serif
  KR font fallback stack already used by `redact-secret-benchmarks`.
- Hero and other large headline breaks are explicit `<br>` tags per locale,
  authored at the intended break point — never left to wrap based on
  viewport width.
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
- Refresh it with `npm run slots:refresh`, which reads npm, PyPI, and
  crates.io for every package in `src/slots/catalog.json` and rewrites
  `src/slots/release.json`. Review the diff and commit it; a card shows only
  what is published, never a version a repository merely declares.
- Counts and limits the architecture pages cite (family and provider
  counts, status distribution, evidence tiers, budgets) live in
  `src/slots/evidence.json`, each group tied to the file and commit it was
  read from. Refresh it by hand from those files, update `observedAt` and
  the commits, and let `npm run check:slots` confirm the counts still add
  up. Mechanism constants that describe code behaviour (an entropy
  threshold, a minimum length) may stay in prose; anything that changes
  when the matrix or a release changes may not.
- If `npm install <package>` alone would not select the version being
  shown (e.g., `latest` points elsewhere), say so next to the install
  command rather than leaving a visitor to find out the hard way — this
  belongs in the quickstart block, not the hero.

## Architecture pages

- One `Claim` (the brand-green block) per page, holding one sentence that
  can be checked against code or a spec. If a page seems to need two, split
  the page. When the code changes, the claim changes with it.
- Each sub-page has a body per locale (`src/content/architecture/en/`,
  `ko/`) with the same component structure, the same one claim, and the
  same slots; the prose in each is authored for its locale. A change to one
  locale's structure is made to the other in the same PR. Cross-links
  inside a body use `architecturePath(locale, id)`, so a page never links
  silently into the other locale.
- Adding a page: add it to `src/content/architecture/pages.ts` (order is
  sidebar and pager order), its shell copy in both locales in `shell.ts`,
  its body under both `en/` and `ko/`, and its path to
  `scripts/check-build-contract.mjs`.
- Every page ends with a `SourceStrip`: which files, at which commit, read
  on which date.
- No `style` attribute anywhere — the proposed CSP forbids inline styles.
  Diagrams are rules and grids in CSS Modules.
- Run `npm run check:architecture` before merging a change to these pages
  or their components. It loads every page in Chromium, Firefox, and WebKit
  under the proposed CSP (`scripts/csp.mjs`, shared with the playground
  qualification) and fails on a page error, a console error, a missing
  claim or a second one, a wrong `lang`, a broken sidebar, language switch,
  or link, or a sideways scroll at 360px or 1280px. CI runs it with a
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

- The publish workflow lives in this repository
  (`.github/workflows/publish-site.yml`) and follows
  `redact-secret-sites`'
  [publishing conventions](https://github.com/redact-secret/redact-secret-sites/blob/main/CONVENTIONS.md#publishing):
  immutable assets first, then everything else with `--delete`, then assets
  pruned, then an invalidation. If one pass changes, all of publish-site.sh's
  equivalents across the project should be revisited together.
- The workflow reads `PUBLISHER_ROLE_ARN` and `SITE_STACK` from the GitHub
  `production` environment. Only the publish job requests `id-token: write`,
  and it assumes the role in its last steps, after the build — no dependency
  install runs while an AWS session is open.
- Actions are pinned to full commit SHAs, with the version in a trailing
  comment, matching the rest of the project.
- Rolling back means republishing from an earlier commit on `main`; there is
  no separate rollback mechanism to maintain.

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
