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
  then fails on missing, unexpected, or changed references. It also requires
  the checked-in update record's reviewed matrix list to match exactly, so an
  added matrix cell cannot bypass the intentional update protocol.
- `npm run workbench:test` writes its private JSON result to the ignored runner
  directory. `npm run visual:compare` writes the matching private visual
  summary there. `npm run visual:progress` reduces those outputs to stable
  counts in the deterministic JSON and Markdown report; `npm run
  visual:progress:check` verifies those checked-in counts without changing
  files. Run the commands in that order.
- `npm run visual:update` is deliberately local-only. It additionally requires
  `VISUAL_BASELINE_REASON` (a linked issue or design-record reason) and
  `VISUAL_BASELINE_REVIEWER`. It writes `update-record.json` with every added,
  byte-changed, and removed cell, including tolerance-passing changes, for review. When a
  matrix change retires a reference, it also requires
  `VISUAL_BASELINE_REMOVAL_REASON` and records the removed cells. A no-op
  update is rejected so it cannot overwrite prior review evidence. CI never
  invokes it.

Ordinary Storybook browser tests do not update references.

## Noise policy

Fixtures, auth, routes, MSW handlers, timestamps, and request failures come
from the existing workbench environment. Do not use current dates,
uncontrolled random values, live requests, analytics, Supabase, or backend
data in a visual cell. The capture browser pins decorative randomness before
each document loads. The helper waits for `document.fonts.ready`, two
animation frames, and stable target dimensions; it forces reduced motion,
removes animation and transitions, hides the caret, and captures a component
or portal locator rather than the browser page. Its pixel matcher permits at
most a 0.05% differing pixel ratio with a 0.1 per-pixel threshold. Unexplained
layout changes fail.

A mask is an exception, not a convenience. Keep it limited to a documented
dynamic subregion and state why that subregion cannot be deterministic. Prefer
repairing the fixture or animation to adding one.

## Reviewer protocol

Before an intentional reference refresh, inspect each changed cell and record
the linked issue or design decision plus a reviewer in the update command.
Review `private-visual-baselines/update-record.json`, the committed reference
PNGs, and the local ignored diffs together. A matrix addition needs a matching
reference and report refresh; for a matrix removal, include a specific removal
reason and review the recorded removed-cell list. Never accept a missing or
unexpected baseline as normal churn.
