# Private visual regression

The visual matrix is a private review gate for stable, high-risk Jam App
states. It runs only from this repository's Storybook, local Chromium, fixed
fixtures, and committed references. It has no publication target, third-party
visual service, or CI upload step.

## Scope and references

[`scripts/private-visual/matrix.ts`](../../scripts/private-visual/matrix.ts)
is the sole source of visual scope. Each reviewed cell explicitly records one
CSF story ID, checkpoint, `jam-light` or `jam-dark` reference theme, named
viewport, precise canvas or portal selector, and any narrowly justified masks.
The 32-cell bound is deliberate: do not generate a theme × locale × role ×
viewport product. Add a cell only when it protects a named high-risk state.

Committed PNG references live in `private-visual-baselines/baselines/` and are
private with the repository. Actual captures, diffs, capture failures, and the
temporary static workbench stay ignored in sibling runner-local folders.

## Commands

- `npm run visual:privacy` checks that no public visual service, artifact
  upload, CI update path, or missing ignored runner directory can slip in.
- `npm run visual:compare` builds the private workbench, validates that each
  matrix story is reachable, captures each exact target at CSS-pixel scale,
  then fails on missing, unexpected, or changed references.
- `npm run visual:progress` writes the deterministic JSON and Markdown
  progress report; `npm run visual:progress:check` verifies it without
  changing files.
- `npm run visual:update` is deliberately local-only. It additionally requires
  `VISUAL_BASELINE_REASON` (an issue or design-record reason) and
  `VISUAL_BASELINE_REVIEWER`. It writes `update-record.json` with the changed
  cell list for review. CI never invokes it.

Ordinary Storybook browser tests do not update references.

## Noise policy

Fixtures, auth, routes, MSW handlers, timestamps, and request failures come
from the existing workbench environment. Do not use current dates, random
values, live requests, analytics, Supabase, or backend data in a visual cell.
The helper waits for `document.fonts.ready`, two animation frames, and stable
target dimensions; it forces reduced motion, disables animation and
transitions, hides the caret, and captures a component or portal locator rather
than the browser page. Its pixel matcher permits at most a 0.05% differing
pixel ratio with a 0.1 per-pixel threshold. Unexplained layout changes fail.

A mask is an exception, not a convenience. Keep it limited to a documented
dynamic subregion and state why that subregion cannot be deterministic. Prefer
repairing the fixture or animation to adding one.

## Reviewer protocol

Before an intentional reference refresh, inspect each changed cell and record
the linked issue or design decision plus a reviewer in the update command.
Review `private-visual-baselines/update-record.json`, the committed reference
PNGs, and the local ignored diffs together. A matrix addition needs a matching
reference and report refresh; a matrix removal needs its reason in the pull
request or design record. Never accept a missing or unexpected baseline as
normal churn.
