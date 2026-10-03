# Design QA — docs height, logo, and package links

**Source visual truth**

- Docs clipping: `/Users/minhokang/Desktop/Screenshot 2026-10-03 at 4.24.36 PM.jpg` (2088 × 1474). Browser chrome was removed to produce `artifacts/design-qa/docs-troubleshooting-source-normalized.png` (2088 × 1426).
- Duplicate logo: `/var/folders/8j/d_ssv7cx3nn3khgst1nwjgfh0000gn/T/TemporaryItems/NSIRD_screencaptureui_7QPwpZ/Screenshot 2026-10-03 at 4.25.31 PM.jpg` (354 × 486). Browser chrome was removed to produce `artifacts/design-qa/header-logo-source-normalized.png` (354 × 438).
- Package-link placement: `/var/folders/8j/d_ssv7cx3nn3khgst1nwjgfh0000gn/T/TemporaryItems/NSIRD_screencaptureui_7EXWWo/Screenshot 2026-10-03 at 4.26.03 PM.jpg` (2410 × 1506).

**Rendered implementation**

- Docs screenshot: `artifacts/design-qa/docs-troubleshooting-fixed.png` (2088 × 1426; CSS viewport 1044 × 713; device scale factor 2).
- Logo screenshot: `artifacts/design-qa/header-logo-fixed.png` (354 × 438; CSS viewport 354 × 438; device scale factor 1).
- Integrations screenshot: `artifacts/design-qa/integrations-package-links-fixed.png` (2410 × 1506; CSS viewport 1205 × 753; device scale factor 2).
- Combined comparisons: `artifacts/design-qa/docs-troubleshooting-comparison.png`, `artifacts/design-qa/header-logo-comparison-fixed.png`, and `artifacts/design-qa/integrations-package-links-comparison.png`.
- State: English troubleshooting docs, mobile English home header, and English integrations section.

**Full-view comparison evidence**

- In the docs source, the footer starts while the long sidebar is still visibly cut off. In the implementation, the docs canvas is 1269 CSS px tall and the footer begins at 1346 px, below the 713 px viewport. Horizontal overflow is zero.
- The source mobile header visibly contains both logo variants. The implementation shows one sharp `/logo-dark.svg` wordmark; computed visibility confirms exactly one header image.
- All 16 package-card titles are visibly styled as links. Their destinations are derived from the package slot and point to the corresponding npm, PyPI, or crates.io package.

**Focused region comparison evidence**

- Logo comparison: the duplicated black and white wordmarks in the source become one white wordmark in the implementation without changing the supplied SVG asset or header proportions.
- Package comparison: Pino, OpenTelemetry traces, OpenTelemetry Python, and the other package titles remain prominent links, while upstream Pino, OpenTelemetry, MCP, and Langfuse links remain in explanatory copy.
- DOM evidence found zero nested anchors. The title-link set contains 16 registry URLs, including `@redact-secret/adapter-pino` on npm, `redact-secret-adapters` on PyPI, and `redact-secret-cli` on crates.io.

**Findings**

- No actionable P0, P1, or P2 mismatch remains.
- Fonts and typography: existing Montserrat, Roboto, and Merriweather roles, weights, line heights, wrapping, and hierarchy are unchanged.
- Spacing and layout rhythm: the docs minimum height now keeps the footer below short articles on desktop; the compact mobile layout keeps its viewport-based minimum height.
- Colors and visual tokens: dark shell, light docs canvas, green linked titles, rules, and status colors remain on the established semantic tokens.
- Image quality and asset fidelity: the original vector logo assets remain in use; CSS specificity now guarantees that only the correct theme asset is visible.
- Copy and content: upstream library references remain in descriptions, while titles now communicate the downloadable Redact Secret package destination.

**Primary interactions and runtime checks**

- Package title hrefs were inspected for every rendered card; all resolve to the appropriate package registry.
- Upstream links retained in explanatory paragraphs: Pino, OpenTelemetry, MCP, and Langfuse.
- Console and page errors: none in the captured docs and integrations states.
- CUA in-app browser was unavailable and the Chrome bridge timed out. Browser-rendered screenshots, computed layout measurements, link inspection, and console checks were completed with the repository's installed Playwright Chromium.

**Comparison history**

- Initial P1: the docs footer began before the full desktop navigation area, visually cutting off the sidebar. Fix: replace the 70vh floor with a desktop content floor that accounts for the long docs navigation, while retaining viewport-based sizing below the desktop breakpoint. Post-fix evidence: footer top 1346 px at a 713 px viewport in `docs-troubleshooting-fixed.png`.
- Initial P1: both logo variants rendered because `.logo img` outranked the `.light` hide rule. Fix: raise the theme selectors to `.logo .light` / `.logo .dark`. Post-fix evidence: one visible image, `/logo-dark.svg`, in `header-logo-fixed.png`.
- Initial P1: linked integration titles navigated to host libraries instead of Redact Secret packages. Fix: derive the title href from each package slot's registry and move upstream links into descriptions. Post-fix evidence: 16 registry title links, zero nested anchors, and retained host links in `integrations-package-links-fixed.png`.

**Implementation Checklist**

- [x] Keep the footer below short desktop docs pages with long navigation.
- [x] Render exactly one theme-appropriate logo.
- [x] Link every package-card title to npm, PyPI, or crates.io.
- [x] Keep upstream ecosystem links in explanatory copy.
- [x] Preserve bilingual parity and valid rich-text structure.
- [x] Verify desktop layout, mobile logo, package links, console, and horizontal overflow.

**Follow-up Polish**

- None required for handoff.

final result: passed
