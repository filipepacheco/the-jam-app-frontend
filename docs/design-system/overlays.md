# Canonical overlays

Use the canonical overlay family for new focused tasks. It provides shared focus entry and restoration, Tab containment, Escape and backdrop dismissal, page-scroll containment, responsive panel sizing, and an action layout that stacks on phones and aligns on desktop.

```tsx
import {
  ConfirmationDialog,
  Disclosure,
  OverlayActions,
  OverlayDrawer,
  OverlayModal,
} from '../../src/components/overlays'
```

## Choose the correct semantic shape

| Need | Component | Semantics and dismissal |
| --- | --- | --- |
| A focused task such as editing an arrangement | `OverlayModal` | `role="dialog"`, `aria-modal="true"`; Escape, the close control, and backdrop dismiss by default. |
| A focused edge panel such as navigation | `OverlayDrawer` | Still a modal `dialog` because it locks the background; uses the drawer panel treatment. |
| An interruptive, consequential decision | `ConfirmationDialog` | `role="alertdialog"`; names and describes the consequence, focuses Cancel first, and uses a destructive `Action` for the irreversible choice. |
| Optional details, filters, or extra help | `Disclosure` | Native `details`/`summary` in document flow. It is not a dialog, does not trap focus, and does not lock scrolling. |

Every modal and drawer needs a visible `title`; it becomes the accessible name. Give consequence or instruction text through `description`, which becomes the accessible description. Supply a localized `closeLabel` that names the specific surface, and keep that close control available unless a current submission makes dismissal unsafe. Use `initialFocusRef` for the first field or task control; use `initialFocus="heading"` for long informational content.

## Layout and long content

`OverlayModal` is bottom-aligned at phone and mixed-input widths, then centered from the documented 64rem desktop breakpoint. Its body is the only scrolling region, uses overscroll containment, and reserves header and footer space. Put decision controls in `OverlayActions`; they are full-width and stacked on phones, then inline and end-aligned at desktop widths. Let translated action labels wrap rather than shrinking controls.

```tsx
<OverlayModal
  isOpen={isEditing}
  onDismiss={closeEditor}
  closeLabel="Close arrangement editor"
  title="Edit performance"
  description="Changes are visible to the host after saving."
  actions={
    <OverlayActions>
      <Action variant="quiet" onClick={closeEditor}><Action.Label>Cancel</Action.Label></Action>
      <Action variant="primary" onClick={save}><Action.Label>Save arrangement</Action.Label></Action>
    </OverlayActions>
  }
>
  <PerformanceFields />
</OverlayModal>
```

The workbench’s **Overlays / Canonical family** stories cover long phone content, desktop-capable action layout, drawer behavior, safe-first destructive confirmation, submitting confirmation, and non-modal disclosure. The feedback dialog is the single representative production integration; existing overlay implementations remain unchanged pending workflow-by-workflow review.
