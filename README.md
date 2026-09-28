# redact-secret-www

The public marketing and navigation hub for
[Redact Secret](https://github.com/redact-secret/redact-secret), served at
`www.redactsecret.dev` (see [Domain](#domain) below — the design sources
assume `.com`, which is not what is provisioned today).

Status: `planned`. This repository holds no site code yet; this document set
is the planning source
([status labels](https://github.com/redact-secret/redact-secret/blob/main/CONVENTIONS.md)
follow the main repository's convention).

## What this is

A single bilingual (English / Korean) static page that answers, in order:
what the product is, why runtime redaction matters, which of your tools it
integrates with, how fast you can try it, where the trust boundary sits, and
where the evidence lives. It links out — to the docs site, to
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
index.html                 # Vite entry; prerendered to / (locale chooser), /en/, /ko/, /404/
src/
  main.tsx                 # routes + per-page <head> (lang, canonical, hreflang)
  content/en.tsx, ko.tsx   # authored prose per locale, typed by content/types.ts
  content/shared.ts        # never translated: URLs, the synthetic fixture, code snippets
  slots/catalog.json       # which packages the page lists, and on which registry
  slots/release.json       # versions, tags, ranges, dates — written by `npm run slots:refresh`, committed
  components/ui/           # primitives (Button, StatusChip, Tabs, …) + stories
  components/shell/        # Header, SideNav, Footer, AppShell + stories
  components/sections/     # the page blocks and their parts + stories
  pages/Home.tsx           # the landing page: shell + eight blocks
  tokens.css               # design-system tokens (+ documented local exceptions)
  style.css                # global base and type classes, tokens only
public/
  favicon.svg, logo-light.svg, logo-dark.svg
.storybook/                # Storybook with locale (en/ko) and theme toolbars
```

`.github/workflows/ci.yml` validates every pull request;
`.github/workflows/publish-site.yml` publishes main after CI passes (see
[ARCHITECTURE.md § Publish flow](./ARCHITECTURE.md#publish-flow)). Still to
come: `tokens.json` with a drift test.


## Domain

`redact-secret-sites`' provisioned infrastructure serves `www.redactsecret.dev`
(apex `redactsecret.dev` 301s to it). The design mockup and spec both assume
`redactsecret.com`, which
[is reserved for another purpose and explicitly out of scope](https://github.com/redact-secret/redact-secret-sites/blob/main/ARCHITECTURE.md#redactsecretcomreserved)
in that repository. This is an open mismatch, not a typo — see
[ARCHITECTURE.md § Open questions](./ARCHITECTURE.md#open-questions). Until
it is resolved, build and write copy against `.dev`; do not hard-code
`.com` anywhere.

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
