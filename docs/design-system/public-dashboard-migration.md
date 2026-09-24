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
| `Navbar.tsx` | `btn btn-sm join-item` layout toggle pair; two `select select-sm` controls; `btn btn-sm btn-ghost` close button; plain destination anchors | `Action` (primary/secondary by selection) in a `role="group"` for layout; `Field` + `Field.Select` for slide duration and auto-refresh; `NavigationLink` for destinations; `IconAction variant="quiet"` for close | This is a host-facing settings drawer, not projected content, so the standard 44px control size and `Field`'s stacked label are appropriate. `ds-control--host` is used on the layout toggle pair since it is a pointer-dense, host-only control at the desktop breakpoint. Values, handlers, and option order are unchanged. |
| `PollingControls.tsx` | `select select-sm` with a `form-control`/`label-text` pair | `Field` + `Field.Select` | Same reasoning as `Navbar`'s selects. This component currently has no consumer (see catalogue note on `ui.0089`); it is migrated so it is canonical-clean whenever it is wired back up. |
| `QRCodeCorner.tsx` | `btn btn-primary` "Close" button inside the expanded QR modal | `Action variant="primary"` | The modal is a close-range interaction (viewer walks up and taps to scan), not distance-read content; the primary button's size and color were unchanged by the swap. |
| `carousel/CarouselIndicator.tsx` | Tiny hardcoded dot buttons with English `aria-label` | Shared-display control target with localized `t('publicDashboard.goToSlide', …)` | The dots retain their visual treatment and `aria-selected` semantics while gaining a reliable venue-display touch target and localized accessible names. |

New locale keys (`en`/`es`/`pt`): `publicDashboard.enterFullscreen`,
`publicDashboard.exitFullscreen`, `publicDashboard.closeNavbar`,
`publicDashboard.goToSlide`, `publicDashboard.dashboardControls`,
`publicDashboard.switchLanguage`, `publicDashboard.qrCodeAlt`,
`publicDashboard.expandQrCode`, `publicDashboard.joinTheJam`,
`publicDashboard.scanOrTypeCode`, `publicDashboard.scanWithPhone`,
`publicDashboard.autoRefresh`, and `publicDashboard.off`. All existing keys
and their fallback strings were preserved as-is.

## Documented display-specific wrappers (no primitive swap)

| File | Canonical primitive considered | Why it stays hand-rolled |
| --- | --- | --- |
| `CurrentSongCard.tsx`, `NextSongCard.tsx`, `StartingSoonCard.tsx` | `DataCard` | `DataCard` fixes its own background (`--ds-surface-raised`), border radius, and padding scale (`--ds-space-cluster`/`--ds-space-section`). The existing cards use a semi-transparent `bg-base-200/80` tuned against the dashboard canvas, an accent `border-primary/20` on the current-song card only (the sole visual cue that it is playing now, distinct from the plain `border-base-300` on the other two), and padding (`p-8 md:p-12`) sized for the `text-5xl` to `text-8xl` type scale. Swapping to `DataCard` would change the surface contrast and remove the current/next visual distinction, which is a redesign the ticket forbids. |
| `QRCodeCorner.tsx` (corner trigger button) | `IconAction` | The trigger is not an icon-only control: it renders a full QR code plus a caption inside a large, always-visible touch surface, sized well past 44px for cross-room visibility and thumb reach. `IconAction` is a single 44px glyph button and would shrink this control and remove the caption. |
| `OfflineBanner.tsx` | `Status` / `StatusIndicator` | Both canonical components use the data-display content tokens (`--ds-content-primary`, etc.), not the `bg-warning`/`text-warning-content` pairing this banner relies on for contrast against the venue screen. The banner already satisfies the `Status` contract's semantics (`role="status"`, `aria-live="polite"`, plain-language text next to the icon, no color-only signal), so no primitive swap is needed to meet the accessibility bar; only the exact visual container is kept. |
| `LanguageSelector.tsx` | `Action` / `IconAction` per language button | Its three pill buttons live inside the tight, single-line settings bar. Converting each to a full 44px `Action` is possible but was left out of this pass: it is a close-range control (see decision 5 below), not a projected-content control, so it carries no distance-legibility risk, but resizing it reflows the entire settings row, which is layout churn better done together with a from-scratch settings-bar layout, not smuggled into this migration. Flagged for a follow-up, not fixed here. |

## The five required duplicate decisions

### 1. `CurrentSongCard` vs `carousel/NowPlayingPanel`

**Keep both, documented.** `CurrentSongCard` shares the screen with
`NextSongCard` in the classic layout (both current and next song are
visible at once), so its type scale (`text-5xl` to `text-8xl`) and padding
are tuned to coexist with a second card below it. `NowPlayingPanel` owns
the entire carousel slide by itself, so it uses an even larger type scale
(`text-7xl` to `text-9xl`) and a different visual language (centered,
semantic primary eyebrow) appropriate to a
single-focus slide. They render the same underlying `DashboardSongDto` but
for two different information architectures (simultaneous vs. sequential
display); merging them would force one layout's constraints onto the
other.

### 2. `NextSongCard` vs `carousel/UpNextPanel`

**Keep both, documented.** Same reasoning as decision 1: `NextSongCard` is
the secondary, smaller-type element beneath `CurrentSongCard` in the
classic layout, while `UpNextPanel` is a full-screen carousel slide with
its own semantic secondary eyebrow and full-slide type scale. They are not
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
- `carousel/*Panel.tsx` and the classic-layout cards: retained their
  distance-legible type scale and spacing, while their labels now use
  semantic accent tokens and user-provided titles/names wrap instead of
  truncating. `CarouselIndicator` keeps its visual dots but now uses the
  shared-display touch target and localized accessible names.

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
- Existing reduced-motion hooks remain in use. The carousel slide transition
  now explicitly skips opacity/scale animation when the preference is set;
  no new ambient motion was introduced.
- Every user-visible string that already had a translation key kept that
  key and its fallback; new controls reuse existing keys
  (`publicDashboard.autoRefresh`, `publicDashboard.off`,
  `publicDashboard.layoutClassic`, `publicDashboard.layoutCarousel`,
  `publicDashboard.slideDuration`) or add new keys documented above, all
  added to `en.json`, `es.json`, and `pt.json` together.

## Issue #58 normalization follow-up

Issue #58 aligned the public dashboard and active marketing surfaces with the
same token and primitive rules without changing the polling, layout, carousel,
QR, or fullscreen behavior. The dashboard canvas now uses semantic surfaces
and the `ds-shared-display` context; carousel accents use semantic primary and
secondary tokens; long song, artist, venue, musician, URL, and localized
labels use `ds-wrap-user-content`; and the settings drawer wraps and scrolls
on narrow screens. The carousel indicator retains its dot appearance but now
uses the shared-display touch target. QR foreground/background colors remain
explicit because scanners require predictable contrast.

The classic cards, carousel panels, QR corner/panel, warning banner, and
compact language selector remain the documented display-specific exceptions.
Marketing CTAs use `NavigationLink`'s `primary` and `secondary` destination
variants, which preserve native anchor semantics while providing the intended
emphasis.

## Venue display redesign (September 2026)

The audience brief is a landscape TV/projector that announces the current
Performance and Musicians, prepares the next lineup, and invites people to
register for upcoming Music. The default `classic` preference now means the
persistent stage-and-next layout; explicit saved carousel preferences remain
supported. The carousel remains an optional sequential display.

The page reuses `CurrentSongCard`, `NextSongCard`, `InstrumentGroup`, `Header`,
and `QRCodePanel`. The current Performance occupies the dominant left region;
the next Performance and its lineup sit below it. `QRCodePanel`'s invitation
variant stays in a dedicated right column, with a quiet zone, a readable link,
and localized scan/choose/register instructions. It uses the canonical
`NavigationLink`; header controls still use `IconAction`. The previous two
corner QR overlays are no longer used by the page, but `QRCodeCorner` remains
in its existing workbench story and is not deleted without the separate
zero-consumer/approval gate.

`DataCard` was reconsidered: its ordinary content scale and padding do not own
the distance-readable Performance hierarchy. These existing domain wrappers
therefore retain their display-specific CSS, shared in `venue-display.css`.
Revisit this exception if a canonical shared-display primitive gains this
contract. `InstrumentGroup` shows written localized instrument names and large
musician names rather than depending on an emoji alone. Song titles and names
wrap; the page reflows on phones and permits vertical growth for unusually
large lineups instead of clipping performers. Routine 16:9 content is intended
to show all three regions together.

Waiting keeps the upcoming Performance separate from the stage. An empty next
queue explains how to participate. Finished Jams hide stale next entries and
replace the signup invitation with a link to the Jam. The dashboard DTO has no
instrument capacity/availability data, so it does not invent vacant slots.
Polling, stale-data retention, fullscreen, and the existing registration routes
remain in place. Ambient card pulsing and the classic waveform were removed;
stage text updates immediately without an entrance that hides time-critical content.

Review evidence: Public Dashboard transitions / Live Classic, Long Lineups,
Phone, Empty Queue, Starting Soon, Finished, Stale Data, Musician Change
Transition, and Live Carousel; Cards and display / Current And Next and Header
Controls. Human approval is pending; automated evidence does not approve the
new visual references.

### Verification and review status

- Browser review covered a normal lineup at 1920×1080 and 1280×720, a crowded
  lineup with long content at 1920×1080, and Spanish phone layout at 390×844.
- The complete unit run passed 333 tests using two workers. After the shared
  reduced-motion correction, the affected dashboard/hook tests passed (15
  tests, including two new first-render preference cases).
- Focused Storybook MCP interaction/a11y checks pass for live, long-content,
  phone, starting, empty, finished, musician changes, carousel, header,
  controls, legacy QR, and stale-data states. The full suite's last run was
  212/216; its controls-panel first-frame failure was then fixed and checked
  through MCP. Three failures are outside this surface: Create Jam/Musicians
  delete/error heading order and Jam Detail's expected title class.
- Locale verification, workbench TypeScript, catalogue baseline, progressive
  governance, scoped lint (no errors), deterministic private build, production
  compilation/isolation, and visual privacy passed. Full lint encounters six
  parsing errors in existing nested `.claude/worktrees` copies.
- `npm run build` could not own the occupied prerender port 45678. A temporary
  copy using port 45679 rendered all five routes; local Chrome cleanup hung
  after completion and was interrupted. The temporary file was removed.
- Host-native visual comparison found 7 passing and 25 changed cells, with no
  missing/unexpected references. This includes intentional dashboard changes
  and differences outside the dashboard. Per the visual-regression policy,
  macOS results are diagnostic; final references require the canonical Linux
  renderer and human review. Existing PNG references and checked-in progress
  counts were preserved, so visual comparison/progress are not green.

### Selected appearance and live change cues

The user retained the original stage/next/invitation appearance after comparing
the three private art-direction proposals. The current-song card loses its
lavender top cap and decorative status dot. Its content and placement remain.

The user then requested live-show energy beyond the initial conservative cues.
A later motion pass replaced the ring and particle burst with the cues below.

- Ambient: live songs show animated level bars. Two soft stage lights drift on slow cycles of 11 and 14 seconds, and two light beams sweep from the top edge on cycles of 7 and 9 seconds. They do not pulse.
- Tempo: one constant, `TEMPO` in `venueMotion.ts`, sets the pace of all audience cues. It is 1.5 now. The timings below are at tempo 1, so multiply them by `TEMPO`.
- Song change: each title and artist line has its own mask. A strong ease-out clears the old lines in about 150 ms. The new title starts at 190 ms and rises word by word, 80 ms apart, and each word has its own mask. Each line rises over 950 ms, so two titles never share a mask.
- Stage light: a spotlight bloom and one light sweep cross the current-song card with the new title.
- Lineup: the instrument groups land one after another. Each group rises with a spring (about 12% overshoot) and fades in from a light blur.
- Next card: it uses the same roll, 160 ms after the stage, so the audience reads the stage first.
- Lineup edit: only the new or renamed musician moves, and a highlight marks the group.
- First paint: the cards rise once, then their lines roll in.
- Pause: the stage lights fade out over 600 ms and the level meter settles into a flat line. Resume reverses the change. Both use CSS transitions, so a quick pause and resume do not jump.
- Finale: when the Jam finishes, the last song rolls out and the closing message rolls in on the same stage card.
- Invitation: the signup card glows on a 4-second cycle, and a light crosses it every 8 seconds. Both layers sit behind the content, and the QR code does not move.

These audience announcements intentionally exceed routine control durations.
Hidden copies of the old lines (`aria-hidden`) give the exit animation. The copies stay only while the cue runs.
The masks clip only while a cue runs, so text at rest never loses a descender.
A spring is sampled once from the existing Motion library into a CSS `linear()` easing. Browsers without `linear()` use an expo-out curve.
All cues use WAAPI or CSS on `transform`, `opacity` and `filter` only. No audio or microphone is involved.
All curves come from `venueMotion.ts`. Entrances and exits use the strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)`, and no element uses ease-in.
The banner, the controls panel and the carousel give Motion full `transform` strings, so the compositor runs them.
Visible-value comparisons stop unchanged polling responses from replaying cues.
Reduced-motion mode stops all movement and ambient motion. Song and lineup changes then use a short opacity fade: 120 ms out and 200 ms in. The banner, the controls panel and the carousel also fade without movement.
Hidden documents stop all cues.
Rapid updates cancel the previous cue, and QR content never moves.
Classic mode uses these local cues in place of routine full-screen confetti.
The controls panel and the offline banner now also animate out, and exits are shorter than entrances.

The `Live Changes` preview provides manual song, musician, next-song and unchanged
refresh controls. TypeScript passed; broad workbench tests were not rerun, following
the user's explicit request to prioritize direct visual review.
