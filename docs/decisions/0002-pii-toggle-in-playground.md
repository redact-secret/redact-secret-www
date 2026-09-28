---
decision_id: decision-demo-pii-opt-in-in-playground
status: accepted
scope: redact-secret-www
title: Demonstrate opt-in PII detection in the playground
decided_at: 2026-09-28
---

# Demonstrate opt-in PII detection in the playground

## Context

The site's scope excluded PII because PII support was a `beta.10`
development target. `@redact-secret/core@0.1.0-beta.10` has since been
published (npm `beta` tag; `latest` is still `0.1.0-beta.8`) with PII
detection as an **opt-in**: `initialize({ pii })`, off when omitted. The
design spec predates it, so the playground (ADR 0001) could not show it.

Verified against `0.1.0-beta.10`:

- Selectors: `pii` (= `pii:global`: email, phone, payment card, network
  address, IBAN) and `pii:us` (global + US SSN). Family- and other
  jurisdiction selectors (`pii:email`, `pii:kr`, …) are rejected.
- **Activation is fixed per engine instance.** After `initialize()`, a
  different selection fails with `PII_ACTIVATION_CONFLICT`; the same page
  cannot switch one engine between modes.
- Reserved documentation values are deliberately not detected
  (`example.com`, `555-01xx`, `4111…` test card, `192.0.2.0/24`,
  `2001:db8::`).

## Decision

The playground gets a three-way PII switch — **Off** (default, matching the
package), **Global**, **Global + US** — and nothing else on the page changes:
no PII marketing copy, no PII claims outside the playground.

1. **One Web Worker per mode.** Each mode is its own same-origin module
   worker with its own engine instance, created only when that mode is first
   chosen. This follows from the activation rule above and also keeps
   scanning off the main thread. Workers are part of the tab: ADR 0001's "no
   transmission, no persistence" rules apply unchanged.
2. **Off is the default.** The page must not imply PII detection is on by
   default in the packages.
3. **One synthetic fixture per PII family**, each unmistakably not a person:
   `synthetic.person@fixture.local` (reserved special-use domain),
   `444-444-4444` (unassigned area code), `4242 4242 4242 4242` (Stripe's
   public test card), `10.0.0.5` (private address), `078-05-1120` (the
   voided "wallet" SSN), `GB82 WEST 1234 5698 7654 32` (the standard example
   IBAN). Documentation-reserved values are not used, because the engine
   skips them and the demo would show nothing.
4. The default input mixes credential and PII lines, so switching PII on
   changes the output of the same text.

## Verification

Accepted 2026-09-28. In Chromium 153, Firefox 155, and WebKit 26.6,
`npm run qualify:playground` switches from PII off to Global on the same
text and checks the finding count (3 → 8 after typing), that switching mode
fetches only the engine's own same-origin assets, and that typing with PII on
makes no request
([record](../qualification/playground-2026-09-28.md)).

## Consequences

- README.md, ARCHITECTURE.md, and CONVENTIONS.md stop saying "no PII"; they
  say "PII only as the playground's opt-in switch" and link here.
- Up to three workers each compile the ~740 KB wasm (fetched once, then
  cached). Only modes a visitor actually picks are started.
- A future Content-Security-Policy (ADR 0001) needs `worker-src 'self'`.
- On each core bump, re-verify the selector names, the activation rule, and
  that every PII fixture is still detected.
