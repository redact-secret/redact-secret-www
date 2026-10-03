---
decision_id: decision-adoption-docs-in-public-site
status: accepted
scope: redact-secret-www
title: Launch adoption documentation inside the public static site
decided_at: 2026-10-03
---

# Launch adoption documentation inside the public static site

Records the information-architecture and ownership decision for
[#34](https://github.com/redact-secret/redact-secret-www/issues/34).

## Context

New users need task-oriented documentation before they need repository
internals or architecture rationale. A separate `redact-secret-documentation`
repository was proposed, but it would duplicate the existing bilingual route,
content-release, canonical, first-paint, and deployment contracts before the
documentation has an independent operating need.

## Decision

- Launch `/docs/` and `/ko/docs/` in `redact-secret-www` as statically rendered,
  bilingual routes. English remains unprefixed and Korean remains under `/ko/`.
- The public site owns adoption journeys, navigation, concise examples, and
  source links. It does not become the engineering source of truth.
- Core owns detector behavior, policies, runtime APIs, and its support matrix.
  Adapters owns host-boundary behavior and runnable integration examples. Vault
  owns restoration and persistence contracts. Gateway owns request admission,
  forwarding, deployment, and readiness claims. Benchmarks owns measurements.
- Docs may summarize stable user-facing behavior, but version and support facts
  come from the site's existing release/evidence slots. Volatile measurements
  are linked, never copied.
- A code sample is defined once in the application and selected by a content
  identifier. CI renders every identifier and smoke-checks the executable core
  sample, so translated prose cannot silently fork the code.
- `/architecture/` remains the design-rationale surface. Repository READMEs and
  repository-local docs remain the deep technical sources.
- The site header stays dark. Documentation navigation and body use a scoped
  light canvas; this does not change the global theme or remove the preserved
  light-theme implementation.

## Consequences

- Docs reuse the current renderer, route registry, sitemap, hreflang, locale
  parity, content schemas, first-paint checks, and static deployment.
- The temporary header link to `/#integrations` is replaced only after the full
  docs route set passes qualification. `Integrations` remains a separate link.
- A separate documentation repository requires a later ADR with a measured
  ownership, release, or hosting need that this site cannot satisfy.
