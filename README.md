# redact-secret-www

The public marketing and navigation hub for
[Redact Secret](https://github.com/redact-secret/redact-secret), served at
`www.redactsecret.com` (see [Domain](#domain) below).

Status: `current` — published from `main` by
[`publish-site.yml`](./.github/workflows/publish-site.yml)
([status labels](https://github.com/redact-secret/redact-secret/blob/main/CONVENTIONS.md)
follow the main repository's convention).

## What this is

A bilingual (English / Korean) static landing page that answers, in order:
what the product is, why runtime redaction matters, which of your tools it
integrates with, how fast you can try it, where the trust boundary sits, and
where the evidence lives — plus a seven-page bilingual architecture section
(`/architecture/`) on how the core decides, how those decisions are
measured, and what lives outside it. It links out — to the docs site, to
`benchmarks.redactsecret.dev`, and to the product repository — rather than
duplicating their content.

Not in scope for this repository:

- **The documentation site.** `/docs/` is planned as a separate repository,
  [`redact-secret/redact-secret-documentation`](https://github.com/redact-secret/redact-secret-documentation)
  — not yet created. This hub links to it once it exists.
- **Benchmark numbers.** No score, rate, or bound is copied here. The
  evidence section links to `benchmarks.redactsecret.dev` and states what
  that link guarantees, never the number itself.
- **A server-side playground.** The page's playground runs the core in the
  visitor's browser only; nothing typed is sent or stored
  ([ADR 0001](./docs/decisions/0001-browser-only-playground.md)).
- **PII content.** PII detection (opt-in since `0.1.0-beta.10`) appears only
  as the playground's switch, off by default — no PII page or claims
  ([ADR 0002](./docs/decisions/0002-pii-toggle-in-playground.md)).

## Related repositories

| Repository | Relationship |
| --- | --- |
| [`redact-secret/redact-secret`](https://github.com/redact-secret/redact-secret) | The product this site markets. Release status and the support matrix this site links to live there. |
| [`redact-secret/redact-secret-benchmarks`](https://github.com/redact-secret/redact-secret-benchmarks) | Measures the product and publishes `benchmarks.redactsecret.dev`. This site links to it and never copies a number from it — see [ARCHITECTURE.md § Evidence and repository boundaries](./ARCHITECTURE.md#evidence-and-repository-boundaries). |
| [`redact-secret/redact-secret-sites`](https://github.com/redact-secret/redact-secret-sites) | Owns the hosting infrastructure this site publishes into — the bucket, the CloudFront distribution, the publisher role, and DNS. See [ARCHITECTURE.md § Deployment](./ARCHITECTURE.md#deployment). |
| [`redact-secret/redact-secret-documentation`](https://github.com/redact-secret/redact-secret-documentation) | **Planned, not yet created.** Will hold `/docs/`. This hub's nav links to it once it exists; see [ARCHITECTURE.md § Open questions](./ARCHITECTURE.md#open-questions). |

## Design sources

- [Landing page mockup](https://claude.ai/artifact/TYGozjj2gvrpaKaSwqe6Gj) —
  interactive, EN/KO and light/dark.
- [beta.11 site design spec](https://claude.ai/artifact/1ZobCPHRNENSJnfBNvUjas)
  — the seven page blocks, component inventory, bilingual rules, and open
  questions.
- [Architecture section mockup](https://claude.ai/artifact/HhdGeEQQs9REsfWotjwZSw)
  and [its design spec](https://claude.ai/artifact/8drsKw3xovoR13xjq4sPhR) —
  the hub and six pages, the shared shell, the nine section components, and
  the one-claim-per-page rule.

Both are private Claude artifacts owned by this repository's maintainer; ask
for access rather than assuming a public link. Neither is a live site —
copy, versions, and package states shown in them are point-in-time
observations, not build output.

## Start here

- [ARCHITECTURE.md](./ARCHITECTURE.md): page structure, the bilingual model,
  how design-system tokens and build-time content slots work, the deploy
  path, and the open questions the design spec left for this repository to
  resolve.
- [CONVENTIONS.md](./CONVENTIONS.md): code style, bilingual content rules,
  the no-hand-written-version rule, and how to add a page block.

## Stack

Vite + Preact + TypeScript + plain CSS (CSS Modules per component), with
every route prerendered to static HTML at build time by
`@preact/preset-vite`. This departs from `redact-secret-benchmarks`'
no-framework, string-template stack. Components are developed in Storybook
(`npm run storybook`). `directory` routing (prebuilt HTML per locale
path), not `spa`: see
[redact-secret-sites' routing modes](https://github.com/redact-secret/redact-secret-sites/blob/main/ARCHITECTURE.md#routing-modes).

```text
index.html                 # Vite entry; prerendered to / and /ko/, /architecture/… and /ko/architecture/…, /404/
data/
  integrations.json        # which packages the page lists, where, and the integrations cards (integrations-v1)
  release.json             # versions, tags, ranges, dates per package + the upstream feeds — `npm run slots:refresh`, committed (release-v1)
  evidence.json            # counts and limits the architecture pages cite, each at a source revision (evidence-v1)
schemas/                   # versioned JSON Schemas (draft 2020-12) for data/; see CONVENTIONS.md § Data contracts
src/
  main.tsx                 # routes + per-page <head> (lang, canonical, hreflang)
  routes.ts                # route registry: pages, alternates, sitemap, legacy /en/ redirects
  i18n.ts                  # locales; English unprefixed, Korean under /ko/
  content/en.tsx, ko.tsx   # authored prose per locale, typed by content/types.ts
  content/shared.ts        # never translated: URLs, the synthetic fixture, code snippets
  content/architecture/    # section registry, shell copy, hub, en/ and ko/ sub-page bodies
  slots/index.ts           # the page's read-only view of data/ (versions, dates, counts)
  contracts/               # TypeScript types GENERATED from schemas/ (`npm run data:types`)
  components/ui/           # primitives (Button, StatusChip, Tabs, …) + stories
  components/shell/        # Header, SideNav, Footer, AppShell + stories
  components/sections/     # the page blocks and their parts + stories
  components/architecture/ # the architecture section's shell and diagrams + stories
  pages/Home.tsx           # the landing page: shell + eight blocks
  pages/Architecture.tsx   # one architecture page: section shell + hub or sub-page body
  tokens.css               # design-system tokens (+ documented local exceptions)
  style.css                # global base and type classes, tokens only
public/
  favicon.svg, logo-light.svg, logo-dark.svg
.storybook/                # Storybook with locale (en/ko) and theme toolbars
```

`.github/workflows/ci.yml` validates every pull request;
`.github/workflows/publish-site.yml` publishes main after CI passes (see
[ARCHITECTURE.md § Publish flow](./ARCHITECTURE.md#publish-flow));
`.github/workflows/data-freshness.yml` checks weekly whether the registries
and upstream feeds have moved past `data/release.json` and reports drift,
never committing or publishing it. Still to
come: `tokens.json` with a drift test.


## Domain

The hub is served at `www.redactsecret.com`; the apex `redactsecret.com`
301s to it. This settles the open question the design sources left: both
assumed `.com`, and `redact-secret-sites` had reserved it. That repository
now serves the hub on `.com`
([its decision record](https://github.com/redact-secret/redact-secret-sites/blob/main/docs/decisions/2026-09-28-serve-the-hub-on-redactsecret-com.md)) and keeps
`.dev` for `benchmarks.redactsecret.dev`, which the page links to.

`src/content/shared.ts` (`siteOrigin`) is the one place the origin is
written; canonical URLs and hreflang alternates derive from it, and
`scripts/check-build-contract.mjs` fails the build if a page's canonical
URL is not under `https://www.redactsecret.com/`.

## Deployment

Published by this repository's own workflow, through the publisher role and
`www` site stack that `redact-secret-sites` creates and owns. Production
only at first — no staging environment is planned until something needs one.
See
[redact-secret-sites' site build contract](https://github.com/redact-secret/redact-secret-sites/blob/main/ARCHITECTURE.md#site-build-contract)
for what a build must produce before it can be published, and
[ARCHITECTURE.md § Deployment](./ARCHITECTURE.md#deployment) here for how
this repository meets it.

## Security boundary

Never place a real credential in source, fixtures, copy, or a screenshot —
see the [security boundary](./AGENTS.md#security-boundary) this repository
shares with the rest of the project. The page's one synthetic fixture is
`API_KEY=SYNTHETIC_REVOKED_CONTEXT_VALUE`, redacted to `API_KEY=<SECRET_1>`;
reuse it rather than inventing a second example that merely looks real.
