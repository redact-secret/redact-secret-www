---
decision_id: decision-single-static-site-separate-content-releases
status: accepted
scope: redact-secret-www
title: One static site, English at /, with separate content and application releases
decided_at: 2026-09-28
---

# One static site, English at `/`, with separate content and application releases

Records the decision in
[#6](https://github.com/redact-secret/redact-secret-www/issues/6), so the
issues that implement it build on an accepted record, not on a `proposed`
issue body.

## Context

- `/` renders a locale chooser; English lives under `/en/**` and Korean under
  `/ko/**`. The default entry language was an open question
  ([ARCHITECTURE.md § Open questions](../../ARCHITECTURE.md#open-questions)).
- English and Korean copy is compiled from TSX (`src/content/en.tsx`,
  `ko.tsx`, and the locale-specific architecture bodies). Fixing one word of
  copy needs an application build and deploy.
- Public facts are spread across authored TSX, `src/content/shared.ts`,
  `src/content/integrations.ts`, `src/slots/*.json`, registry refresh code,
  and upstream generated files, without one contract for ownership, schema,
  freshness, or publication.
- Copy changes and application changes share one release path, although they
  have different review and rollback needs.
- An earlier proposal served each locale from its own subdomain, with a
  second Region and origin failover. That is a lot of moving parts for a
  small static site that CloudFront already serves from edge caches.

## Decision

### Topology

```text
redactsecret.com ──301──▶ www.redactsecret.com
                                │
                         CloudFront (one)
                                │
                         private S3 (one, versioned)
                            us-east-1
                         ┌──────┴──────┐
                         /             /ko/
                      English         Korean
```

- **One CloudFront distribution and one private, versioned S3 bucket**, in
  the existing `redactsecret-site-www-prod` stack with its one publisher
  role. Origin access stays OAC, as today.
- **English at `/`, Korean at `/ko/`.** The locale chooser is removed. The
  language switch changes the path, never the host, and stays on the same
  page (`/architecture/vault/` ↔ `/ko/architecture/vault/`).
- **Canonical and alternates.** English canonical URLs have no prefix;
  Korean canonical URLs are `/ko/**`. `hreflang="en"` and `hreflang="ko"`
  name the equivalent path, and `x-default` names the English one.
- **Legacy `/en/**`.** Kept only as redirects to the same path without the
  prefix (`/en/architecture/vault/` → `/architecture/vault/`), never
  everything to `/`. The permanent 301 is a CloudFront viewer-request
  function owned by `redact-secret-sites`
  ([www #13](https://github.com/redact-secret/redact-secret-www/issues/13)).
  Until that function is live, this build emits a fallback document at each
  legacy path: canonical to the new URL, `noindex`, and a `meta refresh`
  with a visible link. Once the 301 is live, those objects are never
  reached.
- **Compatibility window ends 2027-03-31.** After that date the legacy
  redirect (the edge function and the fallback documents) can be removed,
  and `/en/**` becomes an ordinary 404. Removing it earlier, or keeping it
  longer, is a change to this record.

### Two release planes

**Application releases** own components, CSS, the WASM playground, route
structure, JSON Schemas and the TypeScript types generated from them, the
deterministic content renderer, and hashed assets. They publish only when
behaviour or presentation changes.

**Content releases** own reviewed prose (`i18n/{en,ko}/**`) and public data
(`data/**`), each validated against a schema under `schemas/`. A
content-only release:

1. validates schemas, cross-locale structural parity, links, provenance, and
   the no-plaintext-secret rule;
2. renders complete English and Korean HTML with the already-qualified
   renderer;
3. uploads immutable content and data objects first;
4. reads back and verifies the manifest and digests;
5. updates stable HTML and `current.json` last, with revalidation cache
   headers;
6. invalidates only the mutable HTML and pointers it changed;
7. records the content release, renderer release, source revisions, and
   invalidation identity;
8. keeps the previous valid manifest for rollback.

It never rebuilds or re-uploads unchanged JS, CSS, or WASM.

**First paint stays static.** The active content release is prerendered
into HTML, so first paint, crawlers, browsing without JavaScript, and a
failed JSON request all get the complete page. The browser may load
`current.json` for freshness, but it hydrates prerendered content; it never
fills an empty shell. Every content manifest carries a schema version, a
content-addressed release ID, the locale, the renderer release, the
generation time, full source revisions, file paths, and digests. An unknown
schema version, wrong locale, missing file, digest mismatch, or inconsistent
release fails closed.

**Data ownership.** One small schema-versioned feed per owner, not one
hand-maintained file. Each feed carries its full source revision, its
generation or observation time, and a digest. A missing source is never
shown as fresh: it keeps its original timestamp and a stale state, or the
candidate release fails. Benchmark scores, rates, and bounds stay owned by
`redact-secret-benchmarks`; this site consumes at most a provenance/link
feed.

### Framework

Keep Preact/Vite. The constraint is static S3 hosting, not the framework:
Next.js static export also resolves content at build time and has no
incremental static regeneration (ISR); ISR needs a Next runtime, which
brings regional compute, a shared cache, cache coordination, patching, and
a larger security boundary. Moving to Next.js with a runtime needs its own
ADR, and only once request-time rendering is a measured requirement whose
runtime and operating cost the project accepts.

### Cost guardrails

- No always-on server, Lambda@Edge, Next runtime, Redis/DynamoDB or other
  cache store, database, WAF, NAT gateway, second distribution, or second
  bucket. CloudFront Functions (viewer request, as the directory router and
  the legacy redirect use) are within the baseline.
- Keep the current low-cost static hosting and the OAC security boundary.
- Cache immutable hashed application and content assets for a long time;
  give HTML and release pointers revalidation semantics.
- Invalidate only the mutable paths a release changed, never `/*` by
  default.
- Keep content bundles small and split by page and locale; a visitor never
  downloads all content on entry.
- Add a per-site cost-allocation tag and a low AWS Budgets alert, but no
  monitoring stack that costs more than the site it watches.

## Rejected alternatives, and when to revisit them

| Alternative | Why not now | Revisit when |
| --- | --- | --- |
| Locale subdomains (`ko.redactsecret.com`) | A second host means more DNS, certificates, CORS and cookie scope, and an SEO migration, with no measured gain over a path prefix on one host. | A locale needs its own hosting, legal, or operational boundary that a path cannot give. |
| Second Region, or origin failover | CloudFront already serves cached objects from edge locations; an S3 origin outage mostly affects cache misses. Two origins double the publish, IAM, and consistency surface. | Measured origin availability misses a stated target that edge caching does not cover. |
| S3 Multi-Region Access Points, Cross-Region Replication, Replication Time Control | Replication cost and eventual consistency for a site that publishes a few times a week and needs atomic pointer updates. | Same trigger as a second Region. |
| Per-locale stacks (bucket, distribution, publisher role per locale) | Multiplies fixed cost and publish coordination, and splits one atomic release into several. | A locale must be released or rolled back by a different owner under different controls. |

Any of these needs **measured latency or availability demand** and **the
monthly cost delta from this baseline** in the ADR that proposes it.

## Consequences

- #8 removes the chooser, moves English to unprefixed paths, emits the
  sitemap and the legacy fallback documents, and extends the build contract
  and browser checks to both route sets.
- `redact-secret-sites` adds the `/en/**` 301 at the edge and narrows the
  publisher's invalidation; neither adds a hosting resource.
- Later issues under #6 move prose into `i18n/**`, data into schema-checked
  `data/**`, and add the content-only publish workflow described above.
- ARCHITECTURE.md's open question on the default entry language is
  resolved by this record.
