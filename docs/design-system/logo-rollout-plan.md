# Jam App logo rollout plan

Status: implemented and approved on 2026-09-20.

Approval record: the requesting product/design owner approved the finished SVG
matrix and compact navbar treatment as “all perfect” after reviewing
`Foundations/Brand identity — Reference Matrix` and
`Navigation/Application navigation — Brand Lockup Light 390`. Automated
Storybook coverage verified the paired light/dark contexts at 320px, 390px,
and 1280px, all selectable themes, accessibility, and interaction behavior.

## Approved direction

Apply the **original #2 — Together** symbol with the **custom vector wordmark from #3**, using **palette B — Warm**, across the app, browser icons, installed-app icons, and shared links.

Preserve the original #2 symbol geometry and the selected #3 wordmark shape, proportions, and spacing. The #2 wordmark and later 2A–2D shape explorations are not selected.

Production palette starting point:

| Color | Hex | Role |
| --- | --- | --- |
| Violet | `#7138C9` | Top performer |
| Coral | `#F06465` | Bottom-right performer |
| Amber | `#EAA12B` | Bottom-left performer |
| Dark plum | `#261733` | Wordmark on light surfaces and app-icon background |

Each performer's head and body use the same color. Prepare a lightened violet treatment for dark surfaces, consistent with the selected preview.

## Resolved rollout decisions

- The recovered “#2 — Together” rasters under `brand/together-warm/references/` govern the selected symbol geometry. `approved-b-warm.png` governs the Warm color direction and selected dark-symbol treatment. The #2 wordmark is not used; the #3 custom vector wordmark is paired with the #2 symbol. Do not reconstruct the hybrid from prose or substitute a placeholder.
- `brand/jam-hybrid-v1/brand-master.svg` is the hybrid vector lockup source, paired with `symbol-light.svg` and `symbol-dark.svg`. Keep the source bundle outside `public/`; serve only the reviewed, versioned outputs under `/brand/v1/`.
- The Brand Palette remains fixed across selectable application themes. Components choose only between approved light- and dark-surface treatments for contrast; theme semantic colors do not recolor the identity.
- Use the specified flat hex fills in production SVGs and derived icons. The unspecified soft gradients in the approved raster sheet are presentation lighting, not part of the reproducible identity.
- Use light violet `#AF83ED` for the approved dark-surface wordmark on dark plum `#261733`. This matches the approved dark-symbol violet and provides 5.82:1 contrast.
- `BrandLogo` callers explicitly select `surface="light"` or `surface="dark"`; the component does not infer treatment from the active theme or ancestor styles.
- Publish the rollout under semantic, versioned `/brand/v1/` asset URLs and update consumers atomically instead of overwriting generic legacy URLs.
- The global 1200×630 social image is language-neutral: approved symbol and wordmark on a branded background without localized marketing copy.
- Use violet `#7138C9` for browser and manifest theme color and dark plum `#261733` for the installed-app background color, subject to deployment-preview validation.
- Give the logo/navbar one private visual-regression reference cell by consolidating or replacing a lower-value cell after auditing the existing 32-cell matrix; do not raise the policy cap solely for this rollout.
- Generate committed PNG, ICO, maskable, and social-image derivatives reproducibly from the approved SVG masters with a checked-in Playwright/Node script using the repository's pinned Chromium renderer. Repeat generation must produce no diff; asset generation is not part of the application runtime or production build.
- Keep the compact full lockup at the standard 390px phone viewport. Add a symbol-only fallback only if the real Brand Master collides at 320px or at the `xl` desktop-navigation threshold.
- Treat rendered brand artwork as presentational and non-focusable. The containing home link owns exactly one accessible name: “Jam App.”
- Replace the overlapping `state-empty-recovery-light` private visual cell with the new navbar brand reference, retaining the stricter and richer `foundation-empty-recovery-light` cell and following the reviewed visual-update protocol.
- Add exhaustive, application-owned metadata for all selectable themes, including `brandSurface: "light" | "dark"`, and validate persisted theme names. Production theme selectors and Storybook globals must drive the same shared theme-state seam. `Navbar` resolves the metadata and passes an explicit surface to `BrandLogo`; the logo component never inspects the DOM.
- Keep `BrandLogo` deliberately constrained: `variant="lockup" | "symbol"`, required `surface="light" | "dark"`, presentational artwork, documented sizing, and no arbitrary recoloring or generic source override.
- Use transparent symbol-only browser favicons. Use the symbol on dark plum for standard installed-app icons and a separately padded, full-bleed dark-plum maskable icon.
- Make the first approval evidence an all-31-theme logo smoke gallery plus focused navbar stories in `jam-light` and `jam-dark` at 320px, 390px, and the 1280px desktop-navigation threshold. Human review covers the gallery and focused contexts; automated checks cover accessibility and interaction without creating a visual-regression cell for every combination.
- Human review happens at two gates: approve the finished SVG set with the Storybook navbar preview before deriving the remaining rollout assets, then record final Storybook approval before merge.
- The requesting project/design owner is accountable for both human approval gates. Each decision records the reviewer, Storybook stories and contexts inspected, and approval or requested changes in the pull request.
- Keep the complete `brand/together-warm/` reference, tracing, provenance, verification, and review bundle tracked outside `public/`; only reviewed production outputs are served to users.
- Use dark plum `#261733` with the reviewed dark-surface full lockup for the language-neutral 1200×630 social image.

## 1. Prepare production assets

- Use the selected #2 symbol and #3 custom vector wordmark in clean SVGs, preserving each selected shape and spacing.
- Produce the full logo, symbol-only version, and light/dark treatments.
- Use the approved raster concept as a visual reference; export production assets from the vector master.

## 2. Integrate the logo into navigation

- Add a small reusable `BrandLogo` component.
- Replace the concert icon/text combination in [Navbar.tsx](../../src/components/Navbar.tsx).
- Preserve the home link and give it one accessible “Jam App” label.
- Reserve dimensions to prevent layout shifts.
- Check mobile sizing and visibility across selectable themes.

## 3. Replace browser and installed-app icons

- Generate SVG/ICO favicons and PNG fallbacks.
- Generate a 180px Apple touch icon and 192px/512px app icons.
- Create a separately padded maskable icon.
- Update [index.html](../../index.html) and [manifest.json](../../public/manifest.json), including matching browser/install colors.

## 4. Update sharing and search metadata

- Create a branded 1200×630 social image.
- Replace organization-logo references in [App.tsx](../../src/App.tsx), [AboutPage.tsx](../../src/pages/AboutPage.tsx), and [middleware.ts](../../middleware.ts).
- Keep React, prerendered pages, and crawler responses consistent.
- Update social-image consumers where necessary, including [SEO.tsx](../../src/components/SEO.tsx) and [JamDetailPageV2.tsx](../../src/pages/tabs/JamDetailPageV2.tsx).
- Verify that new asset URLs bypass page routing.

## 5. Review in Storybook

- Register the component in the catalogue and add logo stories.
- Review the existing [navbar stories](../../src/workbench/stories/Navigation/Navbar.stories.tsx) at phone and desktop sizes.
- Review Portuguese, English, and Spanish, the reference light/dark presentations, and selectable themes.
- Check small-icon legibility, keyboard navigation, and accessible naming.
- Obtain human Storybook approval before merging, as required by the [design-system contribution workflow](./contributor-workflow.md).

## 6. Verify and roll out

- Run the applicable catalogue, workbench, visual, lint, test, and production-build checks described in the contribution workflow and [package.json](../../package.json).
- Verify favicon, install-icon, and social-image responses in a deployment preview.
- Remove the old concert assets after confirming no consumers remain.

## First reviewable deliverable

The finished SVG asset set and a Storybook navbar preview.
