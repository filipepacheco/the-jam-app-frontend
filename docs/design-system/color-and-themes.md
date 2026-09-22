# Color and themes

Jam App uses DaisyUI as its palette adapter and a small semantic layer for product decisions. Components describe the job a color performs—surface, content, border, action, focus, or status—so user-selected themes can change the palette without changing meaning.

`jam-light` and `jam-dark` are the only product themes. Both use the documented brand palette consistently: violet for primary actions, coral for secondary actions, amber for accents and warnings, and dark plum for grounding surfaces and contrasting content. `jam-dark` uses the approved light violet on its dark-plum canvas. It is the application default; both themes remain available in the theme picker and private workbench.

## Semantic roles

| Responsibility | Tokens | Use |
| --- | --- | --- |
| Surfaces | `--ds-surface-canvas`, `--ds-surface-raised`, `--ds-surface-sunken`, `--ds-surface-overlay` | Page canvas, cards, inset regions, and scrims |
| Content | `--ds-content-primary`, `--ds-content-secondary`, `--ds-content-inverse`, `--ds-content-link` | Primary copy, supporting copy, copy on actions, and links |
| Borders | `--ds-border-subtle`, `--ds-border-strong`, `--ds-border-interactive` | Separation, emphasis, and interactive boundaries |
| Actions | `--ds-action-primary`, `--ds-action-primary-content`, `--ds-action-secondary`, `--ds-action-secondary-content`, `--ds-action-danger`, `--ds-action-danger-content` | Primary, secondary, and destructive actions |
| Focus | `--ds-focus-ring`, `--ds-focus-offset` | Keyboard focus independent of component palette |
| Statuses | `--ds-status-{info,success,warning,danger}` and matching `-content` tokens | Informational, successful, cautionary, and failed or destructive states |

Use the token for the role, never a remembered hue:

```css
.save-action {
  background: var(--ds-action-primary);
  color: var(--ds-action-primary-content);
}

.save-action:focus-visible {
  outline-color: var(--ds-focus-ring);
}
```

Status color must be paired with text or iconography. “Ready” remains success and “Blocked” remains danger even when a selected theme renders those roles with a different hue.

## Selectable-theme contract

The selectable set is exactly `jam-light` and `jam-dark`. DaisyUI's built-in themes are disabled so persisted values and component defaults cannot introduce a third visual presentation.

Every selectable theme must:

- resolve every semantic role through its DaisyUI palette;
- keep content hierarchy, status meaning, and interactive boundaries recognizable;
- show a visible keyboard focus indicator;
- meet contrast requirements in the reference presentations: 4.5:1 for normal text and action labels, and 3:1 for focus indicators and meaningful UI boundaries;
- avoid using color as the only way to communicate state.

Do not add another selectable theme without revisiting this two-theme product contract. The workbench toolbar and the selectable-theme smoke gallery both consume `SELECTABLE_THEMES` from `src/design-system/foundations.ts`.

## Workbench review

Run `npm run workbench` and open **Foundations / Color and themes**:

- **Reference presentations** compares the approved light and dark brand directions.
- **Semantic role reference** exposes the role vocabulary against the current toolbar theme.
- **Selectable theme smoke** renders the representative surface, content, border, action, focus, and status combinations in every selectable theme.

Use the toolbar to inspect a component under another theme. A component that relies only on `--ds-*` roles should preserve its hierarchy without theme-specific overrides.
