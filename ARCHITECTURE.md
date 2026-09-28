# Architecture

## Overview

One static page, built once per locale, with no server and no runtime API.
Preact components are prerendered to HTML at build time and hydrated in the
browser for tab switching, theme, and language toggling only —
nothing on the page calls back to this repository, the product repository,
or any API at request time.

```text
build (Vite + TS)  ──▶  dist/en/*, dist/ko/*, dist/assets/*
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

## Bilingual model

Two directory-routed locales, `/en/` and `/ko/`, built from the same block
structure and the same code examples, with independently authored prose.
Korean is not a translation appended to an English layout — see
[CONVENTIONS.md](./CONVENTIONS.md#bilingual-content) for what is shared
between locales and what each locale authors on its own.

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

## Evidence and repository boundaries

This site states claims and links to where they are backed, rather than
reproducing evidence:

| Claim | Backed by | Linked, not copied |
| --- | --- | --- |
| "Supports these hosts" | Package cards, registry metadata via `npm run slots:refresh` | Adapter and vault READMEs, package registry |
| "Measured against a corpus" | `benchmarks.redactsecret.dev` | Never a rate, bound, or score |
| "This is what's released" | `redact-secret`'s `docs/releases/status.md` | Version and observed-date slots only |
| "Here's the support matrix" | `redact-secret`'s support matrix doc | Link only |

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
| Canonical URLs | Every page declares `<link rel="canonical">` for its own locale path; no client-side route changes to account for, since this is `directory` mode, not `spa` |

### Publish flow

```text
pull request / push to main
  └─▶ .github/workflows/ci.yml
        build (check-slots, tsc, prerender) → build contract → deterministic
        rebuild → Storybook; playground qualification in Chromium, Firefox,
        WebKit (+ negative control, + proposed CSP)
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
table above (pages present, canonical URLs, root-relative references, hashed
`assets/`, no leftover `.dev` hub URL) in both workflows.

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

| Question | This repository's default until decided | Why it's open |
| --- | --- | --- |
| `--sunken` / `--sunken-2` tokens | Local override in this repository's `tokens.css`, not upstream | Needs design-system acceptance; `redact-secret-benchmarks` carries the same local exception today. |
| Mobile logo minimum width | Ship the mockup's ~60px exception, flagged in the PR | Conflicts with the system's stated 64px minimum; needs explicit sign-off, not a quiet fix. |
| Default entry language at `/` | Undecided — redirect, content negotiation, and a chooser screen are all on the table | Affects routing and possibly needs a CloudFront Function change in `redact-secret-sites`. |
| Routing/comparison table in the evidence block | Ship it, built to be deletable without a layout change | Explicitly optional per the content blueprint; can be cut right before launch with no cost either way. |
| A fourth runtime tab for Rust | Link to a guide instead of adding a tab | No verified first-example Rust snippet existed when the spec was written; promote to a tab once one is confirmed working. |
| Relationship to the docs site | Nav item links out; no assumption about its design | `/docs/` is out of scope for this repository and not yet a repository itself. |
