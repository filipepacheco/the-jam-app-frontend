---
target: Foundations/Action controls with representative Jam composition
total_score: 24
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 4
target_identity: "file:/Users/e160069/WebstormProjects/the-jam-app-frontend/src/workbench/stories/Foundations/ActionControls.stories.tsx"
target_fingerprint: "sha256:d00da5b8934944b001159f985fa97947777b0f8875b5aa0b81781f4286405ac4"
target_path: /Users/e160069/WebstormProjects/the-jam-app-frontend/src/workbench/stories/Foundations/ActionControls.stories.tsx
timestamp: 2026-09-15T03-37-42Z
slug: es-foundations-actioncontrols-stories-tsx-469b1748
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
| --- | --- | --- | --- |
| 1 | Visibility of System Status | 3 | Loading is explicit but visually resembles disabled; terminal feedback is absent from the foundation evidence. |
| 2 | Match System / Real World | 4 | Performance, draft, setlist, Jam, and live-dashboard language is concrete and music-operational. |
| 3 | User Control and Freedom | 3 | Cancel is explicit; destructive reversal and confirmation are not represented here. |
| 4 | Consistency and Standards | 2 | The Action primitive is coherent, but JamCard bypasses it and a Spanish story exposes Portuguese fallback copy. |
| 5 | Error Prevention | 3 | Disabled rationale and danger styling are clear, while workflow safeguards sit outside this evidence. |
| 6 | Recognition Rather Than Recall | 2 | Text actions are strong; the bare ellipsis relies on convention. |
| 7 | Flexibility and Efficiency | 2 | Direct controls are compact, but there is no durable responsive action-group recipe. |
| 8 | Aesthetic and Minimalist Design | 2 | Three filled peers flatten hierarchy and phone wrapping forms an accidental ladder. |
| 9 | Error Recovery | 1 | Recovery, retry, and preserved failure states are not represented in this foundation evidence. |
| 10 | Help and Documentation | 2 | The disabled sentence explains its prerequisite; icon-only overflow has no visible explanation. |
| **Total** |  | **24/40** | **Acceptable** |

## Design Specificity Verdict

The controls are partially authored for Jam App: their music-specific verbs, semantic palette, and tactile geometry fit the Live Stage Console. The group remains category-interchangeable because color carries most of the personality and no shared decision grammar governs hierarchy, wrapping, overflow, and danger placement.

The deterministic detector returned zero findings across both story sources. Direct browser inspection caught a scanner coverage gap in the imported JamCard implementation: the card uses a heavy resting shadow and a legacy DaisyUI outline CTA despite the documented flat-by-default and canonical-family rules.

## Overall Impression

The primitive is a sound foundation. The largest opportunity is to turn a row of reusable buttons into a product-level decision grammar that tells hosts what is primary, what can wait, and where destructive work belongs across desktop and phone.

## What's Working

- Controls keep a stable 44px height and loading does not shift their footprint.
- Light and dark themes maintain equivalent semantic order without horizontal overflow.
- Long Jam content remains contained and readable at phone width.

## Priority Issues

### [P1] Filled semantic actions compete

Primary violet, secondary magenta, and destructive red carry near-equal visual weight. Keep one filled spotlight per cluster, make secondary treatment tonal or outlined in mixed groups, and delay danger prominence until destructive context. Durable owner: Action usage contract. Suggested command: `$impeccable quieter`.

### [P1] Mobile wrapping creates accidental meaning

Four controls form a 1–2–1 ladder at phone width, isolating the destructive action. Add a canonical responsive ActionGroup recipe with explicit primary, alternate, escape, overflow, and danger placement. Suggested command: `$impeccable adapt`.

### [P1] Loading and disabled share one signal

Both states use 58% opacity, making active work look unavailable. Preserve identity and label legibility during loading and reserve strong fading for disabled state. Suggested command: `$impeccable clarify`.

### [P1] Jam composition drifts from canonical action and locale contracts

JamCard uses a legacy outline button, and its Spanish long-content story falls back to Portuguese. Adopt the canonical destination-action treatment and add the dashboard label to every locale. Suggested command: `$impeccable harden`.

### [P2] Evidence does not prove localized Action expansion

The canonical stories use fixed English copy. Add a deterministic phone-width story using long localized action and loading labels. Suggested command: `$impeccable harden`.

### [P2] Desktop JamCard is over-stretched and over-elevated

The desktop card spans roughly 1201px with unused central space and a detached action; its resting shadow conflicts with the documented tonal-layering rule. Constrain the reading measure and regroup its action before adding elevation. Suggested command: `$impeccable layout`.

## Persona Red Flags

- **Live-event host:** three filled peers slow rapid targeting, and pending work resembles inactivity.
- **First-time host:** the ellipsis depends on convention, while the isolated phone-width danger action can appear recommended.
- **One-handed musician:** touch sizing is strong, but the 1–2–1 wrap requires three scanning passes.

## Minor Observations

- The long phone Jam card is more coherent than the desktop card because content and action share one reading path.
- The focused primary state dominates the neutral SemanticVariants screenshot after its play function runs.
- The detector's zero-result is accurate for story markup but incomplete for imported implementation.

## Questions to Consider

- Should Jam App own a reusable decision grammar rather than only reusable buttons?
- Should destructive emphasis appear only after entering a destructive context?
- Should loading feel more active and reassuring than disabled?
