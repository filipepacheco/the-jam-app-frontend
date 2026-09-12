# Canonical action controls

Use the `Action` family for new product buttons. It supplies one semantic visual choice, one mutually exclusive action state, a 44px touch target, the shared visible focus ring, and semantic theme tokens. The family deliberately does not expose unrelated presentation flags such as `iconOnly`, `loading`, `outline`, or `fullWidth`.

```tsx
import { Action, IconAction } from '../components/Action'

<Action variant="primary" onClick={saveSetlist}>
  <Action.Icon><Save aria-hidden="true" /></Action.Icon>
  <Action.Label>Save setlist</Action.Label>
</Action>

<Action variant="primary" state="loading" loadingLabel="Saving setlist…">
  <Action.Label>Save setlist</Action.Label>
</Action>

<IconAction variant="quiet" label="Open setlist actions">
  <MoreHorizontal aria-hidden="true" />
</IconAction>
```

## API

- `variant` expresses the control’s meaning: `primary`, `secondary`, `quiet`, or `destructive`.
- `state` is `idle` (the default), `loading`, or `disabled`. Loading requires a specific `loadingLabel`; it disables the native button, exposes `aria-busy`, and replaces the label with a polite status message.
- Compose text with `Action.Label` and decorative imagery with `Action.Icon`. `IconAction` is the dedicated icon-only entry point and requires `label`, which becomes the accessible name.
- Native button attributes such as `onClick`, `type`, `form`, and `aria-describedby` remain available. The native `disabled` prop is intentionally not exposed; express unavailable behavior through `state="disabled"`.

Use a clear verb-plus-object label, especially for destructive actions. The component intentionally does not confirm an irreversible operation: the owning workflow must provide the confirmation and consequence text when needed.

## Gradual migration compatibility

Existing DaisyUI `btn` controls remain supported while each workflow is migrated. Do not mechanically replace every class: first preserve the action’s behavior, submit type, callback, form ownership, keyboard order, confirmation flow, and loading copy.

| Existing pattern | Canonical replacement | Compatibility note |
| --- | --- | --- |
| `btn btn-primary` | `Action variant="primary"` | Keep explicit `type="submit"` where the legacy button submits a form. |
| `btn btn-secondary` | `Action variant="secondary"` | Review label contrast in the selected themes before release. |
| `btn btn-ghost` | `Action variant="quiet"` | Keep the visible text label unless the action is familiar and repeated. |
| `btn btn-error` | `Action variant="destructive"` | Preserve any confirmation dialog; the variant is not a safety confirmation. |
| `btn-circle` or an icon-only button | `IconAction label="…"` | Move the action name from a tooltip or title into the required label. |
| `disabled` / `loading` flags | `state="disabled"` / `state="loading"` | Supply specific progress copy with `loadingLabel`; no duplicate request may be sent while loading. |

Layout stays with the consumer: use `className="w-full"` or an action-group wrapper for width, alignment, and wrapping. Do not reintroduce compact `btn-xs` or `btn-sm` sizing for new touch controls. A pointer-dense host-only action may add `ds-control--host`, which reduces height only at the documented desktop breakpoint while retaining the 44px inline hit area.

The representative `ScheduleActionButtons` consumer demonstrates primary approval, destructive rejection or deletion, and its existing loading behavior. It explicitly retains the legacy submit-button behavior; any migration must make that intended form behavior explicit. Confirmation remains the caller or owning workflow's responsibility, because only that layer can state the specific consequence and restore focus appropriately. This ticket does not start a broad migration; unchanged controls remain compatible until their owning workflow is reviewed.
