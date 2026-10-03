# Design QA — logo repair and adoption docs

**Source visual truth**

- `/var/folders/8j/d_ssv7cx3nn3khgst1nwjgfh0000gn/T/TemporaryItems/NSIRD_screencaptureui_nVKubI/Screenshot 2026-10-03 at 2.53.20 PM.jpg`
- Source pixels: 2048 × 192. The screenshot demonstrates the broken dark-header state: the black wordmark is effectively invisible.
- Normalized focused crop: `artifacts/design-qa/source-header-normalized.png`, resized to 1440 × 100 from the visible site-header region.

**Rendered implementation**

- Local URL: `http://127.0.0.1:4173/docs/`
- Desktop screenshot: `artifacts/design-qa/docs-desktop.png` (1440 × 1751 full-page; CSS viewport 1440 × 900; device scale factor 1).
- Mobile screenshot: `artifacts/design-qa/docs-mobile.png` (390 × 2374 full-page; CSS viewport 390 × 844; device scale factor 1).
- Focused implementation header: `artifacts/design-qa/implementation-header.png` (1440 × 77).
- Combined focused comparison: `artifacts/design-qa/header-comparison.png` (source above, implementation below).
- State: English docs home on desktop; Korean docs home with the mobile menu open; focused English header regression capture.

**Full-view comparison evidence**

- The dark header and footer frame a scoped white docs reading canvas. Computed colors were `rgb(0, 0, 0)` for the header and `rgb(255, 255, 255)` for the docs canvas.
- The desktop docs layout has a stable sidebar, readable measure, clear hierarchy, and no horizontal overflow.
- The 390 px layout collapses the global navigation into its side panel and the docs navigation into a native disclosure without horizontal overflow.

**Focused region comparison evidence**

- In the combined header comparison, the source shows a green mark with an unreadable black wordmark. The implementation shows the intended green mark with a white `REDACT SECRET` wordmark.
- DOM/computed-style evidence confirms `/logo-light.svg` is hidden and `/logo-dark.svg` is visible at both 1440 px and 390 px.
- The implementation keeps the established header scale rather than reproducing the screenshot's zoomed browser capture; this is an intentional normalization difference, not a fidelity defect.

**Findings**

- No actionable P0, P1, or P2 mismatch remains.
- Fonts and typography: established Montserrat/Roboto/Merriweather roles, weights, wrapping, and reading measure remain consistent; Korean wrapping is readable.
- Spacing and layout rhythm: header, section bar, sidebar, content column, pager, and footer align cleanly at desktop and mobile sizes.
- Colors and visual tokens: the header/footer remain dark; docs alone use light semantic tokens; green link and current-page states remain legible on white.
- Image quality and asset fidelity: the existing vector logo asset is used directly and renders sharply; no substitute or generated mark was introduced.
- Copy and content: the docs home exposes the six adoption choices, explicit limits, bilingual parity, and official upstream links without volatile benchmark claims.

**Primary interactions tested**

- Desktop language dropdown opens and reports `aria-expanded="true"`.
- Mobile menu opens and closes; its language dropdown opens.
- Mobile docs contents disclosure opens.
- Console and page errors: none in the three captured states.
- CUA in-app and Chrome-extension preview attempts timed out/unavailable; browser-rendered evidence was captured with local Playwright Chromium instead.

**Comparison history**

- Initial P1: dark header selected the black-wordmark logo whenever no explicit `data-theme` attribute existed. Fix: make the dark logo the default and switch to the black-wordmark asset only under explicit light theme. Post-fix evidence: `header-comparison.png` and computed visibility checks at desktop/mobile.

**Implementation Checklist**

- [x] Correct dark-header logo selected before theme attributes exist.
- [x] Dark header retained on docs routes.
- [x] Docs main body scoped to a light theme.
- [x] Desktop and mobile layouts checked for overflow.
- [x] Language and navigation interactions checked.
- [x] Reduced-motion fallback retained for the docs entrance motion.

**Follow-up Polish**

- None required for handoff.

final result: passed
