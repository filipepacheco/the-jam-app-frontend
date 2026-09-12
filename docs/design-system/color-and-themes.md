# Color and themes

Jam App uses DaisyUI as its palette adapter and a small semantic layer for product decisions. Components describe the job a color performs—surface, content, border, action, focus, or status—so user-selected themes can change the palette without changing meaning.

`jam-light` and `jam-dark` are the approved reference presentations. Their purple and violet emphasis is intentionally music-native: energetic enough for a live venue while keeping content and controls legible. `jam-dark` is the application default; both references remain available in the theme picker and private workbench.

## Semantic roles

| Responsibility | Tokens | Use |
| --- | --- | --- |
| Surfaces | `--ds-surface-canvas`, `--ds-surface-raised`, `--ds-surface-sunken`, `--ds-surface-overlay` | Page canvas, cards, inset regions, and scrims |
| Content | `--ds-content-primary`, `--ds-content-secondary`, `--ds-content-inverse`, `--ds-content-link` | Primary copy, supporting copy, copy on actions, and links |
| Borders | `--ds-border-subtle`, `--ds-border-strong`, `--ds-border-interactive` | Separation, emphasis, and interactive boundaries |
| Actions | `--ds-action-primary`, `--ds-action-primary-content`, `--ds-action-secondary`, `--ds-action-danger` | Primary, secondary, and destructive actions |
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

The selectable set is `jam-light`, `jam-dark`, and DaisyUI's `light`, `dark`, `cupcake`, `bumblebee`, `emerald`, `corporate`, `synthwave`, `retro`, `cyberpunk`, `valentine`, `halloween`, `garden`, `forest`, `aqua`, `lofi`, `pastel`, `fantasy`, `wireframe`, `black`, `luxury`, `dracula`, `cmyk`, `autumn`, `business`, `acid`, `lemonade`, `night`, `coffee`, and `winter` themes.

Every selectable theme must:

- resolve every semantic role through its DaisyUI palette;
- keep content hierarchy, status meaning, and interactive boundaries recognizable;
- show a visible keyboard focus indicator;
- meet contrast requirements in the reference presentations: 4.5:1 for normal text and action labels, and 3:1 for focus indicators and meaningful UI boundaries;
- avoid using color as the only way to communicate state.

When adding a theme, add it to `SELECTABLE_THEMES` in `src/design-system/foundations.ts`. The workbench toolbar and the selectable-theme smoke gallery both consume that source, so the new theme is included automatically.

## Workbench review

Run `npm run workbench` and open **Foundations / Color and themes**:

- **Reference presentations** compares the approved light and dark brand directions.
- **Semantic role reference** exposes the role vocabulary against the current toolbar theme.
- **Selectable theme smoke** renders the representative surface, content, border, action, focus, and status combinations in every selectable theme.

Use the toolbar to inspect a component under another theme. A component that relies only on `--ds-*` roles should preserve its hierarchy without theme-specific overrides.
