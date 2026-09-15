---
name: Jam App
description: Live-music energy with control-console clarity.
colors:
  stage-violet: "var(--color-primary)"
  encore-magenta: "var(--color-secondary)"
  spotlight-amber: "var(--color-accent)"
  house-light: "var(--color-base-100)"
  house-raised: "var(--color-base-200)"
  house-sunken: "var(--color-base-300)"
  house-ink: "var(--color-base-content)"
  live-green: "var(--color-success)"
  caution-amber: "var(--color-warning)"
  stop-red: "var(--color-error)"
typography:
  display:
    fontFamily: "Archivo, sans-serif"
    fontSize: "var(--ds-text-display)"
    fontWeight: 800
    lineHeight: 1.15
  heading:
    fontFamily: "Nunito Sans, system-ui, -apple-system, sans-serif"
    fontSize: "var(--ds-text-heading)"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Nunito Sans, system-ui, -apple-system, sans-serif"
    fontSize: "var(--ds-text-body)"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Nunito Sans, system-ui, -apple-system, sans-serif"
    fontSize: "var(--ds-text-ui)"
    fontWeight: 600
    lineHeight: 1.35
rounded:
  selector: "0.5rem"
  field: "0.625rem"
  box: "1rem"
  pill: "999px"
spacing:
  related: "0.25rem"
  compact: "0.5rem"
  control: "0.75rem"
  cluster: "1rem"
  section: "1.5rem"
  region: "2rem"
  layout: "3rem"
  spacious: "4rem"
  stage: "6rem"
components:
  action-primary:
    backgroundColor: "{colors.stage-violet}"
    textColor: "var(--color-primary-content)"
    typography: "{typography.label}"
    rounded: "{rounded.field}"
    padding: "0.5rem 0.75rem"
    height: "2.75rem"
  action-secondary:
    backgroundColor: "{colors.encore-magenta}"
    textColor: "var(--color-secondary-content)"
    typography: "{typography.label}"
    rounded: "{rounded.field}"
    padding: "0.5rem 0.75rem"
    height: "2.75rem"
  field:
    backgroundColor: "{colors.house-light}"
    textColor: "{colors.house-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0.5rem 0.75rem"
    height: "2.75rem"
  data-card:
    backgroundColor: "{colors.house-raised}"
    textColor: "{colors.house-ink}"
    rounded: "{rounded.box}"
    padding: "{spacing.section}"
---

# Design System: Jam App

## Overview

**Creative North Star: "The Live Stage Console"**

Jam App combines live-music energy with the clarity of equipment trusted during a performance. The current Music, live state, and next useful action hold visual authority; supporting controls stay disciplined so the interface feels lively without becoming noisy or generic administrative software.

The system adapts its density rather than changing identity. Musician phone surfaces are reachable and forgiving, host controls are compact and precise, and audience displays are sparse, large, and legible at venue distance. Shared semantic tokens keep these contexts related while allowing genuinely different operational demands.

**Key Characteristics:**

- Music-first hierarchy with explicit live-state feedback.
- Violet-led identity supported by semantic status color.
- Tonal, layered surfaces with restrained structural elevation.
- Tactile, confident controls and quieter passive presentation.
- Context-aware density across phone, host console, and venue display.

## Colors

The palette pairs a stage-like violet anchor with a warmer magenta encore and amber spotlight, all carried through semantic DaisyUI roles that adapt between light and dark themes.

### Primary

- **Stage Violet:** the scarce brand and primary-action signal; its exact value is supplied by the active theme's primary token.

### Secondary

- **Encore Magenta:** supports secondary actions and moments of participation without competing with the primary path.

### Tertiary

- **Spotlight Amber:** draws attention to selected highlights and warm supporting emphasis; it is not a substitute for warning status.

### Neutral

- **House Light:** the theme-aware canvas on which product state remains readable.
- **Raised House:** groups controls or related content through tonal separation.
- **Sunken House:** marks nested, selected, or recessed regions without ornamental chrome.
- **House Ink:** the theme-aware primary content color; secondary content is derived by reducing its presence rather than introducing a disconnected gray scale.

### Named Rules

**The Semantic Cue Rule.** Components consume semantic `--ds-*` roles; they do not hard-code presentation colors or use raw Tailwind text colors.

**The Status Has a Voice Rule.** Information, success, warning, and danger color always travel with text, iconography, or another explicit state cue.

**The One Spotlight Rule.** Stage Violet identifies the main action or dominant live state; repeating it across peer actions destroys its authority.

## Typography

**Display Font:** Archivo (with sans-serif fallback)
**Body Font:** Nunito Sans (with system sans-serif fallbacks)

**Character:** Archivo gives high-value music and venue moments a direct, poster-like presence. Nunito Sans keeps dense controls, labels, and operational content approachable and highly readable.

### Hierarchy

- **Display** (800, `var(--ds-text-display)`, 1.15): current Music, major venue state, and rare top-level moments; shared displays increase this role at the venue breakpoint.
- **Heading** (700, `var(--ds-text-heading)`, 1.25): page regions and decisive operational groups.
- **Subheading** (700, `var(--ds-text-subheading)`, 1.25): component families and nested workflow sections.
- **Body** (400, `var(--ds-text-body)`, 1.55): primary reading content, constrained to 70 characters where prose is continuous.
- **Label** (600, `var(--ds-text-ui)`, 1.35): controls, field labels, and short operational metadata.
- **Caption** (600 where labeled, `var(--ds-text-caption)`, 1.35): badges and compact metadata that support rather than lead.

### Named Rules

**The Music Leads Rule.** Display typography belongs to current Music and major live state, not routine settings, repeated card headings, or decorative slogans.

**The Operational Sentence Rule.** Labels and feedback use sentence case and plain language that survives Portuguese, English, and Spanish expansion.

## Layout

The system follows a semantic four-point spacing rhythm, from closely related content (`0.25rem`) through compact and control spacing to section, region, layout, and stage separation. Layouts use the smallest durable grouping that preserves hierarchy instead of defaulting to repeated card grids.

Controls have a `2.75rem` touch minimum by default, become `2.25rem` in host-console contexts from `64rem`, and reach `3.5rem` for shared displays from `90rem`. Venue typography expands at the same wide breakpoint. User-generated names and Music titles wrap safely; single-line truncation is used only when the complete value remains available elsewhere.

## Elevation & Depth

The system is layered rather than float-heavy. Canvas, raised, and sunken tonal surfaces provide most depth. Borders separate durable regions; shadows are reserved for overlays, menus, and selected-state reinforcement where spatial stacking must be unmistakable.

### Shadow Vocabulary

- **Focus offset** (`0 0 0 2px var(--ds-focus-offset)`): separates the three-pixel focus outline from its surface.
- **Menu lift** (`0 0.75rem 2rem color-mix(in oklch, var(--ds-content-primary) 18%, transparent)`): lifts transient navigation menus above page content.
- **Overlay lift** (`0 1.5rem 4rem color-mix(in oklch, var(--ds-content-primary) 28%, transparent)`): communicates modal or drawer stacking.
- **Selection ring** (`0 0 0 2px color-mix(in oklch, var(--ds-focus-ring) 28%, transparent)`): reinforces a selected data card without pretending it is floating.

### Named Rules

**The Layer Before Shadow Rule.** Use tonal surface changes and borders for ordinary hierarchy; add shadow only when an element truly occupies a higher interaction layer.

## Shapes

Controls use gently curved `0.625rem` corners, compact selectors use `0.5rem`, and grouped surfaces use a more generous `1rem`. Badges and status pills may use fully rounded ends. The corner scale is consistent and functional: it distinguishes controls, containers, and compact labels without producing a page of unrelated silhouettes.

## Components

### Buttons

Tactile and confident: operation controls press by one pixel, respond quickly, and keep loading or disabled state within the same footprint.

- **Shape:** gently curved field radius (`0.625rem`) with a `2.75rem` touch minimum.
- **Primary:** Stage Violet with theme-provided primary content color and `0.75rem` inline padding.
- **Secondary:** Encore Magenta with equivalent geometry for real secondary operations.
- **Quiet:** transparent at rest and tonal on hover for low-emphasis actions.
- **Destructive:** the semantic danger pair; destructive operations retain confirmation and pending safeguards supplied by their workflow.
- **Hover / Focus:** a short `120ms` semantic-color transition and a strong three-pixel focus outline with separation from the surface.

### Chips

- **Style:** pill geometry, compact label typography, and a subtle semantic border.
- **State:** status variants tint the surface while retaining primary content color; color is never the sole status indicator.

### Cards / Containers

- **Corner Style:** grouped-surface radius (`1rem`).
- **Background:** Raised House over the active canvas.
- **Shadow Strategy:** flat by default; selection uses a restrained semantic ring.
- **Border:** a one-pixel subtle content-derived border.
- **Internal Padding:** `1rem` compact or `1.5rem` comfortable.

### Inputs / Fields

- **Style:** full-width canvas field with a subtle border, field radius, and `0.5rem 0.75rem` padding.
- **Focus:** semantic interactive border plus the shared focus treatment.
- **Error / Disabled:** error uses the danger role with adjacent text; disabled fields move to a raised surface with reduced content emphasis.

### Navigation

Ordinary navigation is quiet and destination-oriented. Current links and selected tabs receive a low-chroma violet tint and Stage Violet text. Call-to-action navigation is explicit and opt-in; operational buttons remain separate from links so browser and route semantics stay intact. Desktop controls compact at the host breakpoint, while mobile navigation moves behind a named drawer trigger.

### Live Status

Status indicators pair a stable label with a semantic dot. Live, pending, offline, and completed states remain understandable without motion, and stale data keeps the last trustworthy Music or Jam context visible alongside its recovery message.

## Do's and Don'ts

### Do:

- **Do** put current Music, live state, and the next consequential action at the top of the hierarchy.
- **Do** choose density for the actual musician, host, or venue context.
- **Do** use canonical Action, Field, Navigation, feedback, overlay, and data-display contracts when their semantics fit.
- **Do** verify `jam-light`, `jam-dark`, Portuguese reference copy, long English or Spanish copy, and reduced motion in representative pairs.
- **Do** keep pending, stale, failure, rollback, and recovery feedback attached to the affected operation.

### Don't:

- **Don't** replace semantic colors with raw Tailwind text colors or hard-coded status hues.
- **Don't** turn every region into an equally weighted card or repeat Stage Violet across peer actions.
- **Don't** use decorative gradients, glow-heavy dark UI, or excessive glass effects as the default visual language.
- **Don't** normalize musician, host, and audience density when their operating contexts require different contracts.
- **Don't** change Jam, Performance, Schedule, Live Queue, Music, or Musician behavior as a side effect of visual refinement.
