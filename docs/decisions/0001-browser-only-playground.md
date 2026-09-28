---
decision_id: decision-add-browser-only-playground
status: accepted
scope: redact-secret-www
title: Add a browser-only redaction playground
decided_at: 2026-09-28
---

# Add a browser-only redaction playground

## Context

The design spec and ARCHITECTURE.md ruled out a live playground: "accepting
visitor text turns a marketing page into a data-handling surface; that needs
its own security review if it's ever proposed." CONVENTIONS.md required that
review and a decision record before any input surface lands.

The maintainer has asked for one, modeled on comparable projects'
interactive demos: paste text, see it redacted immediately. This record
sets the boundary that surface must stay inside. It was accepted on
2026-09-28, once the security review below was complete.

## Decision

Add a playground block that runs the published `@redact-secret/core` in the
visitor's browser (its WebAssembly build), and nowhere else.

### Boundary

1. **No transmission.** Visitor text is never sent anywhere. The page makes
   no request that carries it: no endpoint, form submission, analytics, or
   error reporting. The only request the playground causes is the one-time,
   same-origin fetch of the engine's `.wasm` binary, which carries no input.
   Audit of `@redact-secret/core` and `@redact-secret/wasm` at
   `0.1.0-beta.8` and again at `0.1.0-beta.10`: their only `fetch` is that
   binary load, and neither touches browser storage.
2. **No persistence.** Input is held in component state only — not in
   `localStorage`, `sessionStorage`, IndexedDB, cookies, the URL, or the
   history state. Reloading the page restores the synthetic sample.
3. **No third-party text processing.** The input disables spellcheck,
   autocorrect, autocomplete, and known grammar-extension hooks, because
   browser "enhanced spellcheck" and grammar extensions can send field
   contents off-device.
4. **No plaintext echo.** Findings are rendered from safe metadata only
   (type, detector, confidence, action, range). Output is the core's
   redacted text, rendered as text nodes, never as HTML.
5. **Bounded work.** Input is capped at 32 KiB and 1,000 findings via the
   core's `limits` option; exceeding a bound shows the core's fixed error
   code, not a truncated result.
6. **Pinned engine.** The engine is an exact-pinned dependency, kept equal
   to the quickstart's `core.npm` slot by `scripts/check-slots.mjs`, loaded
   lazily (dynamic import) when the block approaches the viewport, so the
   rest of the page does not pay for it. The version shown next to the
   playground comes from the engine itself (`VERSION`), not from prose.
7. **Default content is the one synthetic fixture.** Presets reuse
   `SYNTHETIC_REVOKED_CONTEXT_VALUE` in different carriers (env, log, JSON,
   header, YAML, plain prose); no second realistic-looking value is added.
   The plain-prose preset is a deliberate miss, shown next to the page's
   limits statement.
9. **PII is opt-in and off by default.** Superseded in part by
   [ADR 0002](./0002-pii-toggle-in-playground.md), which adds a PII switch
   (one worker per mode); the default stays credentials only.
8. **The page still tells visitors not to paste live credentials.** Local
   processing is not a reason to handle a real secret on a marketing page.

### Not decided here

- Offering the `common` detector profile as a switch (a second wasm binary).
- A Content-Security-Policy with `connect-src 'self'` served by
  `redact-secret-sites`, which would make rule 1 enforceable rather than
  reviewed. Recommended as a follow-up.

## Consequences

- ARCHITECTURE.md and CONVENTIONS.md no longer say "no playground"; they say
  "no transmission, no persistence" and link here.
- The build now bundles the engine's wasm binary under `assets/` (hashed,
  loaded on demand): ~740 KB (~276 KB gzip) at `0.1.0-beta.10`, up from
  ~410 KB at beta.8. It is still self-contained: it comes from the lockfile.
- Bumping `@redact-secret/core` changes live behavior on the page and must be
  treated like a content change: re-check the presets' expected output.

## Security review checklist

Completed 2026-09-28 against `@redact-secret/core@0.1.0-beta.10`. Evidence:
[`docs/qualification/playground-2026-09-28.md`](../qualification/playground-2026-09-28.md),
produced by `npm run qualify:playground` (Playwright; Chromium 153,
Firefox 155, WebKit 26.6).

- [x] **Network: typing produces no request.** Checked two ways in all three
  engines, with PII off and on: requests the browser reports for the page and
  its workers, and requests the local server received. A negative control
  (`--negative-control`, which leaks each keystroke) makes all six leak
  checks fail.
- [x] **Storage: typing writes nothing.** No cookies, localStorage,
  sessionStorage, IndexedDB, or Cache Storage entries, and the URL and
  history are unchanged, in all three engines.
- [x] **Input field attributes verified in Chrome, Safari, Firefox.**
  `spellcheck` is `false` as each engine reports it, and the autocomplete,
  autocorrect, autocapitalize, Grammarly, and LanguageTool attributes are
  set, in Chromium, WebKit (Safari's engine), and Firefox.
- [x] **Engine version and preset outputs re-verified on each core bump.**
  Done for `0.1.0-beta.10` (Node and all three browser engines). Ongoing:
  `npm run qualify:playground` asserts the finding counts per PII mode, and
  `scripts/check-slots.mjs` fails the build if the engine and the quickstart
  disagree — rerun both on every bump.
- [x] **CSP follow-up filed in `redact-secret-sites`:**
  [redact-secret-sites#3](https://github.com/redact-secret/redact-secret-sites/issues/3).
  The proposed policy (`connect-src 'self'`, `worker-src 'self'`,
  `'wasm-unsafe-eval'`, a hash for the one inline script) was verified
  enforcing in all three engines with `--csp`; dropping `'wasm-unsafe-eval'`
  breaks the engine in every engine, as a control. Until it is deployed,
  rule 1 is enforced by review and this qualification, not by the browser.
