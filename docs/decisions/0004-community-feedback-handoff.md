---
decision_id: decision-community-feedback-handoff
status: accepted
scope: redact-secret-www
title: A community page that checks feedback in the browser and hands it to GitHub
decided_at: 2026-09-29
---

# A community page that checks feedback in the browser and hands it to GitHub

## Context

Feedback about Redact Secret goes to GitHub: six issue forms and two
discussion categories in `redact-secret/redact-secret` `.github/`, plus
private security advisories. A visitor reporting a false positive or a
missed detection is, by the nature of the report, close to pasting a real
credential into a public issue. GitHub's forms warn about that; they cannot
check for it.

The maintainer asked for a community page, from a
[design mockup](https://claude.ai/artifact/5V7EaU571e3ftttvL7Wtqs), that
routes a visitor to the right form and checks what they wrote before it
reaches GitHub. That is a second surface that accepts visitor text
(after the playground, [ADR 0001](./0001-browser-only-playground.md)), and
CONVENTIONS.md requires a decision record for one.

## Decision

Add `/community/` (and `/ko/community/`): a list of feedback kinds, one
form per kind that mirrors its GitHub YAML (field ids, types, required
flags, dropdown options, title prefix), an in-browser check with the
published `@redact-secret/core`, and a **Continue on GitHub** link that
opens GitHub's own form with the fields prefilled through its documented
query parameters. The visitor submits on GitHub; this site never does.

### Boundary

1. **No transmission by this site.** The page makes no request carrying
   visitor text: no endpoint, no form submission (`<form>` never submits;
   the CSP's `form-action 'none'` holds), no analytics. The check runs in
   the same same-origin worker as the playground; its only request is the
   engine's `.wasm`, which carries no input.
2. **One exit, chosen by the visitor.** The text leaves the tab only in
   the `github.com` address the visitor opens with Continue. The page says
   so next to the button, including that the address stays in browser
   history. Continue is off until the check has run clean on every field,
   the required fields are filled, the safety box is ticked, and the
   address is under 8,000 characters.
3. **No persistence.** Drafts live in component state only — not in
   `localStorage`, `sessionStorage`, IndexedDB, cookies, or history state.
   The URL hash holds only the selected kind (`#false-positive`), never
   text.
4. **No third-party text processing.** Every field disables spellcheck,
   autocorrect, autocapitalize and the common grammar extensions, as the
   playground's input does (ADR 0001 § 3).
5. **Metadata-only findings.** A finding shows the field, line, column,
   detector type and length — the value is a solid bar, never text,
   asterisks or a partial reveal (CONVENTIONS.md § Synthetic data). The
   address box is hidden while a finding stands.
6. **Security reports never go through a form.** The security kind has no
   fields; it links the private advisory and `SECURITY.md` only.
7. **Preventive, not enforcing.** The page says the check cannot see what
   is typed on GitHub and is not the product's enforcement boundary. The
   safety box is never prefilled: GitHub asks for it again.
8. **PII off.** The check runs credentials only (the core's default
   activation). PII detection would flag the reproduction details reports
   legitimately carry (addresses in logs, example e-mail); the safety box
   covers personal data.

### Contract with GitHub

The forms' ids, options and prefixes are the prefill contract and live in
typed code (`src/content/community.ts`), checked against `main` at a named
commit; the words around them are `i18n/<locale>/community.json`. When an
upstream form changes, both change in one PR.

## Consequences

- `npm run check:community` (CI, three engines, 360px and 1280px, under the
  proposed CSP) proves the boundary: the synthetic fixture is found and never
  rendered, Continue opens the exact prefilled form, a marker typed into the
  title reaches no request and no storage. Its negative control removes the
  engine and must fail the fixture check.
- Without JavaScript the page is complete but cannot check; it says so and
  links GitHub's blank form chooser.
- If the engine cannot load, Continue stays off and the page offers the
  blank GitHub form for that kind — the visitor is never stranded, and
  never handed an unchecked prefilled address.
- Slack and Discord stay unlinked until a channel is staffed
  (ARCHITECTURE.md § What this site is).
