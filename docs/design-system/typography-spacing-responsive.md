# Typography, spacing, sizing, and responsive foundations

These foundations keep Jam App readable and operable in three very different settings: a musician holding a phone in a crowded venue, a host moving quickly through a desktop console, and an audience reading the Public Dashboard from across the room. Use the semantic roles below instead of inventing local sizes or gaps.

## Typography roles

The product uses `--font-body` for body and UI copy, and `--font-display` for high-emphasis display content. The fixed product-UI scale prevents routine controls from growing unpredictably; shared displays opt into a larger scale at the venue breakpoint.

| Role | Token | Size | Weight | Line height | Use |
| --- | --- | ---: | ---: | ---: | --- |
| Caption | `--ds-text-caption` | 12px | 600 for labels, 400 otherwise | 1.35 | Timestamps, compact metadata, and nonessential annotations |
| Secondary | `--ds-text-secondary` | 14px | 400 | 1.35 | Supporting details and helper text |
| Body | `--ds-text-body` | 16px | 400 | 1.55 | Instructions, descriptions, form values, and primary reading text |
| UI | `--ds-text-ui` | 16px | 500 | 1.35 | Buttons, compact controls, and interface labels; apply `.ds-type-ui` |
| Subheading | `--ds-text-subheading` | 20px | 700 | 1.25 | Card and grouped-content headings |
| Heading | `--ds-text-heading` | 24px | 700 | 1.25 | Page and panel headings |
| Display | `--ds-text-display` | 32px | 800 | 1.15 | Current-song and other singular, time-critical display content |

Body copy should normally use `.ds-type-body`, which limits measure to 70 characters for readable paragraphs. Use `.ds-type-ui` for controls and concise interface labels; it has an explicit 500 weight and 1.35 line height. Use `.ds-type-display` only for a short, dominant value—not for navigation, buttons, paragraphs, or an entire page.

### Long and translated content

- Let headings, instructions, names, and user-entered notes wrap. Apply `.ds-wrap-user-content` to URLs, IDs, stage names, and other untrusted strings that may not contain natural break points.
- Reserve `.ds-truncate-single` for repeated, space-constrained rows where the full value is also available nearby or through an accessible detail view. Never truncate an error, safety instruction, form label, current performer, or the only occurrence of a song title.
- Do not make containers or controls depend on English copy length. Test representative Portuguese and Spanish strings, including diacritics and text around 30% longer than the English equivalent.
- Prefer two or three natural lines over shrinking type. User zoom and browser text-size settings must remain usable.
- Use sentence case. Weight and placement create hierarchy; all-caps text and letter spacing are not substitutes for a semantic role.

## Semantic spacing

All spacing is a multiple of four. Choose a token for the relationship it communicates, rather than selecting a new numeric value to make one screen look balanced.

| Relationship | Token | Value | Typical use |
| --- | --- | ---: | --- |
| Related | `--ds-space-related` | 4px | Icon-to-label, title-to-metadata |
| Compact | `--ds-space-compact` | 8px | Items inside a compact control or metadata group |
| Control | `--ds-space-control` | 12px | Control padding and closely related fields |
| Cluster | `--ds-space-cluster` | 16px | Items within a card or action group |
| Section | `--ds-space-section` | 24px | Distinct groups within one panel |
| Region | `--ds-space-region` | 32px | Cards or major sections on a phone |
| Layout | `--ds-space-layout` | 48px | Desktop columns and page sections |
| Spacious | `--ds-space-spacious` | 64px | Large-screen breathing room |
| Stage | `--ds-space-stage` | 96px | Separation between audience-facing display regions |

Start with the smallest relationship: label and value use `related` or `compact`; controls in one task use `cluster`; separate tasks use `section` or `region`; page regions use `layout` and above. Do not use margin to compensate for unclear grouping. Add a container or revise the hierarchy when the relationship is ambiguous.

## Controls and density

The minimum size applies to the complete interactive hit area, not just its visible icon. Keep at least `--ds-space-compact` between adjacent targets and provide a visible `.ds-focusable` focus treatment for custom controls.

| Context | Token/class | Minimum | Guidance |
| --- | --- | ---: | --- |
| Touch/default | `--ds-control-touch` / `.ds-control` | 44px square | Baseline for phones, tablets, and mixed-input screens |
| Comfortable | `--ds-control-comfortable` | 48px | Primary venue actions and controls used while moving |
| Pointer-dense host console | `--ds-control-compact-pointer` / `.ds-control--host` | 36px high | Desktop-only secondary actions; never shrink the inline hit area below its label |
| Shared-display remote control | `--ds-control-shared-display` / `.ds-control--shared-display` | 56px square | Controls viewed or operated at a distance |

Dense does not mean cramped. On a desktop host console, compact secondary actions may use 36px height after the `64rem` breakpoint, while primary actions such as “Start performance” should remain comfortable. Destructive and high-frequency actions need separation to prevent accidental activation. Icon-only controls require an accessible name and should be reserved for familiar, repeated actions.

## Responsive adaptation

Responsive behavior follows the user’s context, not device labels alone. Reflow and reprioritize content before hiding it.

### Phone: one-handed venue use

- Use one primary column and keep the current task and primary action close together.
- Keep controls at least 44px, or 48px for the next likely venue action. Place frequent actions within easy reach without pinning destructive actions beside them.
- Stack actions when translated labels would collide. Allow song titles, performer names, and status messages to wrap.
- Show essential status in text as well as color. Move secondary metadata below the primary value instead of compressing it.

### Desktop: host console

- Use the additional width for parallel context, such as queue plus now-playing details, while preserving a clear reading and keyboard-focus order.
- Compact 36px secondary controls are allowed from `64rem` when pointer input is expected. Keep primary, destructive, and time-critical actions at 44–48px.
- Prefer persistent labels and status text over tooltip-only controls. Keep dense rows aligned to the same type and spacing roles.
- Cap reading-width content; do not stretch body copy across the console.

### Shared Public Dashboard

- Add `.ds-shared-display` to the display root. At `90rem` it increases body, subheading, heading, and display roles for distance reading.
- Prioritize the current song and performer, then the next actionable event. Remove host-only controls and low-value metadata rather than creating a dense wall of information.
- Use `stage` separation between major regions and maintain strong contrast under venue lighting. Do not convey queue state by color alone.
- Long titles wrap to a controlled number of lines; they do not force time-critical status or the next performer off screen.
- Any audience-facing or remote-operated control uses `.ds-control--shared-display` and a minimum 56px target.

## Reference examples

The private workbench story `Foundations/Typography, spacing, and responsive` demonstrates all three contexts with realistic English, Portuguese, and Spanish content. Review each story in both `jam-light` and `jam-dark`, then use the locale toolbar to confirm that hierarchy survives language changes.

Before shipping a new layout, check that it still works at the phone (390 × 844), desktop host-console (1440 × 900), and venue-display (1920 × 1080) workbench viewports, with browser zoom and long-content behavior included in the review.
