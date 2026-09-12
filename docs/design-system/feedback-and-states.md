# Canonical feedback and state UI

Use the feedback family to make the state of a request or result understandable without relying on color, motion, or pointer input.

## Choose the state by what the user needs

| Pattern | Use when | Semantics and next step |
| --- | --- | --- |
| `Alert` | A transient confirmation or an immediate failure | Use a polite status for informational/success feedback; reserve an assertive alert for failures that need attention. Add dismissal or recovery where the message can be acted on. |
| `Status` | A persistent status belongs beside the affected content | `role="status"`, a text title, plain-language description, and an optional recovery `Action`. |
| `LoadingState` | A region is waiting for a request | `role="status"`, `aria-busy="true"`, and a specific present-progress label. The spinner is decorative. |
| `Skeleton` | The shape of incoming content helps preserve page context | Pair decorative shapes with one accessible loading label; do not announce each shape. |
| `SuccessState` | A consequential change has been accepted | Say what changed and keep the message near the result. |
| `ErrorState` | A request failed and the user can recover | Say what failed, what remains safe, and provide a concrete retry or safe alternative. |
| `EmptyState` | A result or content collection has no items | Explain what belongs there. `kind="results"` describes filtered no-results; `kind="first-use"` gives first-use guidance. |

All recovery actions use the canonical `Action` family and inherit its 44px target, focus ring, semantic theme tokens, and loading/disabled contract. Copy remains owned by the consuming workflow so it can be localized in Portuguese, English, and Spanish.

Do not use an empty state for a request error, a loading placeholder for a successful empty result, or a toast when the user must act before continuing. Keep errors persistent until dismissed or resolved; transient success may be dismissed or auto-hidden when the result remains visible.

Components use the foundation motion tokens and the global reduced-motion rule. Status icons are decorative because the visible title and announcement already provide the text equivalent.
