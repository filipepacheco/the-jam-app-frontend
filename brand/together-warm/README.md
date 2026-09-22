# Original Together / Warm source bundle

This bundle recovers the actual artwork selected in the logo-design conversation. It does not change any production asset or consumer.

## Authority and approval status

The user selected the original **02 / Together** design, rejected the later 2A–2D shape variations, and then selected **B / Warm** for its coloring.

Two original rasters define the approved identity:

1. **Geometry, proportions, lettering, and spacing:** the middle row labeled **02 / TOGETHER** in [original-concepts.png](./references/original-concepts.png). This is the authoritative original Brand Master reference. The other rows are not selected. The main lockup reference region is `x=480, y=397, width=572, height=238` in the original 1536×1024 image.
2. **Palette and selected dark-surface treatment:** [approved-b-warm.png](./references/approved-b-warm.png). Its lower-right dark-plum app-icon sample is the approved dark-surface reference. The reference viewport is `x=1215, y=710, width=275, height=255`, including a small surrounding margin.

The generated color sheet has minor geometric differences from the original. It is authoritative for the color direction, not a replacement for the original shape/spacing reference.

**No SVG or other vector master was previously created or approved in the design session.** The SVGs in this bundle are new deterministic contour traces of the original geometry, supplied as reconstruction candidates. They must pass the finished-SVG review gate in [the rollout plan](../../docs/design-system/logo-rollout-plan.md) before becoming approved production masters. They are not 2A–2D designs and were not reconstructed from a prose description.

The approved dark reference is an app-icon/symbol sample, not a complete dark-surface wordmark proof. A dark full lockup remains part of the implementation task's SVG review.

## Inspectable files

| File | Purpose | Status |
| --- | --- | --- |
| [references/original-concepts.png](./references/original-concepts.png) | Exact original comparison board; row 02 governs geometry | Authoritative raster |
| [references/approved-b-warm.png](./references/approved-b-warm.png) | Exact selected light lockup and dark app-icon color preview | Authoritative raster |
| [original-together.reference.svg](./original-together.reference.svg) | Viewport onto original row 02 pixels | Raster viewport, not vector artwork |
| [selected-dark-preview.reference.svg](./selected-dark-preview.reference.svg) | Viewport onto selected B dark-icon pixels | Raster viewport, not vector artwork |
| [brand-master.trace.svg](./brand-master.trace.svg) | Original full lockup contours with flat B fills | Vector candidate, pending fidelity approval |
| [symbol-light.trace.svg](./symbol-light.trace.svg) | Same original symbol paths with light-surface palette | Vector candidate |
| [symbol-dark.trace.svg](./symbol-dark.trace.svg) | Same original symbol paths with selected lightened violet | Vector candidate |
| [review.html](./review.html) | Original and traced artwork together for visual inspection | Local review page |
| [references/initial-together-concept.png](./references/initial-together-concept.png) | Earlier standalone concept before the clear comparison and palette selection | Historical reference only |

Open `review.html` locally to inspect the source viewports and traces together. The two `.reference.svg` files link their original PNGs and must remain beside the `references` directory; they are not standalone vector exports. The `.trace.svg` files contain real paths, no raster embedding, no external fonts, and no script.

## Color mapping

These are the flat color values specified in the approved B generation prompt and rollout plan, rather than sampled estimates of the raster's lighting or texture.

| Element | Light surface | Dark surface |
| --- | --- | --- |
| Top performer's head and body | `#7138C9` | `#AF83ED` |
| Right performer's head and body | `#F06465` | `#F06465` |
| Left performer's head and body | `#EAA12B` | `#EAA12B` |
| Wordmark | `#261733` | Full dark wordmark treatment requires review |
| Dark icon background | — | `#261733` |

## Trace reproducibility and fidelity

Run from the repository root using the existing Node dependencies:

```sh
node brand/together-warm/trace-reference.mjs
node brand/together-warm/verify-trace.mjs
```

The trace script verifies the original board's SHA-256, isolates its 13 separate ink components, interpolates the 50% luminance contour, and simplifies it with a maximum tolerance of 0.18 source pixels. It retains the original coordinates and spacing, including the outlined wordmark and its counters. The full lockup viewBox is `480 397 572 238`; the symbol viewBox is `480 397 228 238`.

[trace-provenance.json](./trace-provenance.json) records the source checksum, component bounds, trace settings, and color assignments. [trace-verification.json](./trace-verification.json) records the local Chromium render comparison: **99.6068% binary silhouette intersection-over-union**, with **179 differing thresholded pixels** over a 572×238 source region. This measures geometry at the source resolution and excludes palette differences; it is not proof of exact pixel identity or human approval.

The verification script opens only local artwork, blocks HTTP(S) requests, and writes a temporary review screenshot to `/private/tmp/together-warm-review.png`. It does not run or modify the application. This local check is not a replacement for the rollout's pinned visual-review pipeline.

## Original-file integrity

All three raster files are byte-for-byte copies of the design-session outputs. None was regenerated, cropped, recolored, or recompressed.

| Repository file | Original generated filename | SHA-256 |
| --- | --- | --- |
| `references/original-concepts.png` | `exec-be8ced36-f4ac-4d54-9964-f93e1fa4b46b.png` | `48397daf36db3e3a9a9ccf579cd60fead24b86d1b6fe28d9820f1d7aa9e57e9b` |
| `references/approved-b-warm.png` | `exec-6e3676cc-fdd6-489a-89f2-ad85f0ec816b.png` | `1b668cc075c72ec43f7593053a5a3c84dd1f50d2268eccf066f18e1f6f953cac` |
| `references/initial-together-concept.png` | `exec-0ad7b239-a175-49f1-b7f2-b9136c58f82f.png` | `a2cbb4e25d933c292d6d7c927f79b52d874907f1a9cd2fd35de90d617b248a29` |

Original directory: `/Users/e160069/.codex/generated_images/01a0bc34-e050-70a1-8a20-8e4678207377/`.

This source bundle lives under `brand/` because `.gitignore` excludes new files under `docs/*`. It is outside `public/` and is not served or imported by the application.
