# Public Dashboard migration and reconciliation

This is the decision record for issue #54, migrating Public Dashboard
consumers onto canonical design-system primitives. It follows the parent
design-system ticket (#27), which is explicitly incremental: keeping a
duplicate pattern is a legitimate outcome when the venue-projection layout
has a real constraint the alternative does not share.

## Context: the venue-projection constraint

The Public Dashboard is projected on a screen viewed from across a room.
Its primary content (current song, next song, starting-soon state, the
carousel panels) uses a much larger type scale, higher-contrast surfaces,
and simpler layout than any other product area. The canonical primitives in
`src/components/data-display`, `Action.tsx`, and `Field.tsx` are tuned for
close-range, pointer-driven product UI. Where applying one of them would
shrink text, change a proven contrast pairing, or reduce a touch target on
the projected screen, this migration keeps the existing hand-rolled markup
and documents the exception instead of forcing the primitive in, per the
ticket's hard constraint against visual redesign.

The Public Dashboard's settings drawer (`Navbar.tsx`, `PollingControls.tsx`)
is a different case: it is opened by a host standing close to the display to
change a setting, not projected content read from a distance. Canonical
primitives were applied there.

## Components migrated to canonical primitives

| File | Before | After | Why it was safe |
| --- | --- | --- | --- |
| `Header.tsx` | Two `btn btn-sm btn-ghost` icon-only buttons with manual `min-h/min-w` overrides | `IconAction variant="quiet"` with a real, localized `label` | `IconAction` renders transparent (`quiet`) exactly like `btn-ghost`, already guarantees the 44px target through `ds-control`, and the icon glyphs and overlay position are unchanged. |
| `Navbar.tsx` | `btn btn-sm join-item` layout toggle pair; two `select select-sm` controls; `btn btn-sm btn-ghost` close button | `Action` (primary/secondary by selection) in a `role="group"` for layout; `Field` + `Field.Select` for slide duration and auto-refresh; `IconAction variant="quiet"` for close | This is a host-facing settings drawer, not projected content, so the standard 44px control size and `Field`'s stacked label are appropriate. `ds-control--host` is used on the layout toggle pair since it is a pointer-dense, host-only control at the desktop breakpoint. Values, handlers, and option order are unchanged. |
| `PollingControls.tsx` | `select select-sm` with a `form-control`/`label-text` pair | `Field` + `Field.Select` | Same reasoning as `Navbar`'s selects. This component currently has no consumer (see catalogue note on `ui.0089`); it is migrated so it is canonical-clean whenever it is wired back up. |
| `QRCodeCorner.tsx` | `btn btn-primary` "Close" button inside the expanded QR modal | `Action variant="primary"` | The modal is a close-range interaction (viewer walks up and taps to scan), not distance-read content; the primary button's size and color were unchanged by the swap. |
| `carousel/CarouselIndicator.tsx` | Hardcoded English `aria-label` | Localized through `t('publicDashboard.goToSlide', …)` | Pure accessibility/i18n fix; `aria-selected` semantics and visual dots are untouched. |

New locale keys (`en`/`es`/`pt`): `publicDashboard.enterFullscreen`,
`publicDashboard.exitFullscreen`, `publicDashboard.closeNavbar`,
`publicDashboard.goToSlide`. All existing keys and their fallback strings
were preserved as-is.

## Documented display-specific wrappers (no primitive swap)

| File | Canonical primitive considered | Why it stays hand-rolled |
| --- | --- | --- |
| `CurrentSongCard.tsx`, `NextSongCard.tsx`, `StartingSoonCard.tsx` | `DataCard` | `DataCard` fixes its own background (`--ds-surface-raised`), border radius, and padding scale (`--ds-space-cluster`/`--ds-space-section`). The existing cards use a semi-transparent `bg-base-200/80` tuned against the animated gradient background, an accent `border-primary/20` on the current-song card only (the sole visual cue that it is playing now, distinct from the plain `border-base-300` on the other two), and padding (`p-8 md:p-12`) sized for the `text-5xl` to `text-8xl` type scale. Swapping to `DataCard` would change the surface contrast and remove the current/next visual distinction, which is a redesign the ticket forbids. |
| `QRCodeCorner.tsx` (corner trigger button) | `IconAction` | The trigger is not an icon-only control: it renders a full QR code plus a caption inside a large, always-visible touch surface, sized well past 44px for cross-room visibility and thumb reach. `IconAction` is a single 44px glyph button and would shrink this control and remove the caption. |
| `OfflineBanner.tsx` | `Status` / `StatusIndicator` | Both canonical components use the data-display content tokens (`--ds-content-primary`, etc.), not the `bg-warning`/`text-warning-content` pairing this banner relies on for contrast against the venue screen's animated background. The banner already satisfies the `Status` contract's semantics (`role="status"`, `aria-live="polite"`, plain-language text next to the icon, no color-only signal), so no primitive swap is needed to meet the accessibility bar; only the exact visual container is kept. |
| `LanguageSelector.tsx` | `Action` / `IconAction` per language button | Its three pill buttons live inside the tight, single-line settings bar. Converting each to a full 44px `Action` is possible but was left out of this pass: it is a close-range control (see decision 5 below), not a projected-content control, so it carries no distance-legibility risk, but resizing it reflows the entire settings row, which is layout churn better done together with a from-scratch settings-bar layout, not smuggled into this migration. Flagged for a follow-up, not fixed here. |

## The five required duplicate decisions

### 1. `CurrentSongCard` vs `carousel/NowPlayingPanel`

**Keep both, documented.** `CurrentSongCard` shares the screen with
`NextSongCard` in the classic layout (both current and next song are
visible at once), so its type scale (`text-5xl` to `text-8xl`) and padding
are tuned to coexist with a second card below it. `NowPlayingPanel` owns
the entire carousel slide by itself, so it uses an even larger type scale
(`text-7xl` to `text-9xl`) and a different visual language (centered,
tracked-letter-spacing eyebrow in `purple-300`) appropriate to a
single-focus slide. They render the same underlying `DashboardSongDto` but
for two different information architectures (simultaneous vs. sequential
display); merging them would force one layout's constraints onto the
other.

### 2. `NextSongCard` vs `carousel/UpNextPanel`

**Keep both, documented.** Same reasoning as decision 1: `NextSongCard` is
the secondary, smaller-type element beneath `CurrentSongCard` in the
classic layout, while `UpNextPanel` is a full-screen carousel slide with
its own eyebrow color (`cyan-300`) and full-slide type scale. They are not
interchangeable without changing one layout's hierarchy.

### 3. `StartingSoonCard` vs `carousel/StartingSoonPanel`

**Keep both, documented.** `StartingSoonCard` is the classic layout's
single-column fallback when there is no current song, including its own
`animate-pulse` emoji treatment sized for that layout's card padding.
`StartingSoonPanel` is a carousel slide with a much larger emoji and type
scale to fill the whole screen, and it participates in the carousel's
`AnimatePresence` slide transition, which the classic card does not need.

### 4. `QRCodeCorner` vs `carousel/QRCodePanel`

**Keep both, documented.** `QRCodeCorner` is a persistent, collapsible
corner overlay that coexists with the classic layout's song cards at all
times and offers a tap-to-expand modal so it does not compete with the
song content for attention. `QRCodePanel` is a dedicated, full-size
carousel slide: the carousel model already gives the QR code its own
uninterrupted screen time, so it does not need the corner affordance or the
expand/collapse interaction at all. The two components solve the same goal
("let a phone camera find the join link") under two different layout
constraints, and neither can be deleted without breaking the other layout's
QR flow.

### 5. `LanguageSelector` vs the layout toggle buttons in `Navbar.tsx`

**Keep both, documented.** There is no raw `<select>` for language in
`Navbar.tsx`; the potential duplication is architectural, not markup-level:
`LanguageSelector` is a bespoke "pick one of a few" pill-button group, and
the layout toggle in `Navbar.tsx` is a second, independently hand-rolled
"pick one of a few" button pair (now migrated to `Action` in this change,
see the table above). The design system does not yet define a canonical
segmented-control/toggle-group primitive, so there is nothing to converge
both onto. Rather than inventing one as a side effect of this ticket, the
layout toggle was moved onto the existing `Action` primitive (closing part
of the gap: both now render through the same button component), while
`LanguageSelector` keeps its compact pill styling for its tighter space
constraint. A shared segmented-control primitive is a candidate for a
future design-system ticket, not for issue #54.

## Distance-legibility exceptions summary

Explicit list of places a canonical primitive was considered and
deliberately not applied because it would shrink text, change contrast, or
reduce a touch target on the venue-projected screen:

- `CurrentSongCard.tsx`, `NextSongCard.tsx`, `StartingSoonCard.tsx`: kept
  their bespoke surfaces instead of `DataCard` (background, border accent,
  and padding scale are load-bearing for the current/next distinction and
  the large type scale).
- `QRCodeCorner.tsx` corner trigger: kept its bespoke oversized touch
  surface instead of `IconAction` (an icon-only 44px control would shrink
  a control that is intentionally much larger for cross-room visibility).
- `OfflineBanner.tsx`: kept its `bg-warning`/`text-warning-content` banner
  instead of `Status`/`StatusIndicator` (those primitives do not carry the
  same warning contrast pairing).
- `carousel/*Panel.tsx` and the classic-layout cards: unchanged type scale
  and spacing throughout; only `CarouselIndicator`'s accessible name moved
  behind i18n, with no visual change.

## Preserved behavior checklist

The following were verified unchanged by reading the surrounding hooks and
components (not modified in this change):

- Current/next song transition logic (`PublicDashboardPage.tsx`'s
  `isNotStarted`/`nextSongToShow` derivation) is untouched.
- The offline banner's visibility source (`useOfflineQueue`) and message
  prop are untouched.
- Polling interval state (`pollingMs`, `setPollingMs`) and its `onChange`
  wiring through `Navbar`/`PollingControls` are untouched; only the control
  markup changed.
- Fullscreen toggle (`useFullscreen`) wiring is untouched; `Header` still
  calls `onToggleFullscreen` and reflects `isFullscreen` via `aria-pressed`.
- Navbar show/hide (`showNavbar`/`setShowNavbar`, backdrop click, Escape
  key) logic is untouched.
- QR flows: `QRCodeCorner`'s expand/collapse state, `Escape` handling, and
  the carousel's `QRCodePanel` are untouched other than the "Close" button
  swap in `QRCodeCorner`.
- Carousel auto-advance and its interval (`useCarouselCycle`,
  `carouselIntervalMs`) are untouched.
- Confetti on song change (`useConfettiOnSongChange`, `ConfettiWrapper`) is
  untouched.
- Reduced motion (`useReducedMotion`, `src/workbench/reducedMotion.ts`) is
  untouched; no new `motion` usage was introduced by this change.
- Every user-visible string that already had a translation key kept that
  key and its fallback; new controls reuse existing keys
  (`publicDashboard.autoRefresh`, `publicDashboard.off`,
  `publicDashboard.layoutClassic`, `publicDashboard.layoutCarousel`,
  `publicDashboard.slideDuration`) or add new keys documented above, all
  added to `en.json`, `es.json`, and `pt.json` together.
