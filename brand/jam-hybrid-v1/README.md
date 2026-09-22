# Jam App hybrid v1 source bundle

This approved production bundle combines the exact selected **#2 / Together**
performer-symbol geometry with the rounded **#3 / In The Groove** `jam app`
lettering. It retains the approved Warm palette.

The sources remain the approval authorities:

- `brand/together-warm/references/original-concepts.png` governs the #2 symbol
  geometry; its existing protected contour trace is imported without altering
  its paths.
- `references/in-the-groove-wordmark-source.png` is the approved #3 reference
  image for the wordmark. Its SHA-256 is verified before tracing.

`brand-master.svg`, `symbol-light.svg`, `symbol-dark.svg`, and
`wordmark.trace.svg` passed the human SVG and Storybook fidelity gates on
2026-09-20. The master’s fixed light-surface fills
are deliberately stable: `#7138C9` top performer and `#261733` wordmark.
Consumers can derive the approved dark treatment by transforming those two
fixed fills to `#AF83ED`; coral and amber stay unchanged.

Run the complete deterministic generation pipeline from the repository root:

```sh
node scripts/generate-brand-assets.mjs
```

It writes the approved source SVGs, semantic `/brand/v1/` public outputs,
transparent browser favicons, installed-app icons, a separately padded
maskable icon, a language-neutral 1200×630 social card, and `public/favicon.ico`.
The generator records SHA-256 provenance for every generated output in
`provenance.json`. It uses only checked-in raster/vector inputs and the
repository-pinned Playwright Chromium renderer; it does not use external
fonts, networks, or a runtime application dependency.
