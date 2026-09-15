# Jam and Music migration and reconciliation

Language: ASD-STE100 Simplified Technical English

This is the decision record for issue #51. The ticket moves the Jam and Music
user interface onto the canonical design-system primitives. It also resolves the
duplicate components that the parent ticket (#27) asks each migration to
resolve. Code blocks, file paths, identifiers, and quotations in this document
are exempt from the language rule.

The ticket is incremental, like the Schedule (#52), DJ control (#53), and
Public Dashboard (#54) migrations. To keep a duplicate is a correct result when
the two components do different work. To keep a hand-rolled control is a correct
result when a canonical primitive removes necessary behavior. Each such case is
in the "Documented exceptions" section below.

## Definitions and abbreviations

| Term | Meaning |
| --- | --- |
| Canonical primitive | A component in the design system, for example `Action`, `Field`, `Badge` |
| DaisyUI | The legacy utility class library, for example `btn`, `badge`, `tabs` |
| Forced visible change | A visual change that the primitive makes necessary |
| Legacy | A component with a replacement; kept for a later deletion ticket |
| Anchor exception | A link that stays an `<a>` or a `<Link>`, because `Action` gives a `<button>` only |

## What moved

| File | Legacy pattern | Canonical replacement |
| --- | --- | --- |
| `MusicCard.tsx` | `btn`/`btn-ghost` icon buttons; `badge badge-outline badge-xs` genre | `IconAction`; `Badge` |
| `MusicTable.tsx` | Status `badge`; row action buttons; genre `badge` | `Badge`; `Action` (`primary`/`quiet`); `Badge` |
| `MusicFilters.tsx` | `input`/`select` with no label wrapper; clear-filters `btn` | `Field` with an `sm:sr-only` label; `Action` (`quiet`) |
| `MusicModal.tsx` | Footer `btn-ghost`/`btn-primary` | `Action` (`quiet`), plus two `Action` elements for idle and loading |
| `MusicModalFormFields.tsx` | `label`+`input`/`select`/`textarea` pairs | `Field`, `Field.Input`, `Field.Select`, `Field.Textarea` |
| `MusicEmptyState.tsx` | Hand-rolled empty block | Thin wrapper on `CanonicalEmptyState` |
| `MusicianProfileModal.tsx` | Spinner; error text; three `badge` groups | `LoadingState`; `ErrorState`; `Badge` |
| `EditMusicianModal.tsx` | `label`+control pairs | `Field` family |
| `SpotifyExportModal.tsx` | Name and description controls | `Field` family |
| `SpotifyImportModal.tsx` | `join` mode toggle; many `label`+control pairs; result button | Two `Action` elements; `Field` family; `Action` |
| `JamCard.tsx` | `badge` with `getJamStatusBadgeClass` | `Badge` with a local tone map |
| `JamContextDisplay.tsx` | `badge badge-outline` with the raw status value | `Badge` with `getJamStatusLabel` |
| `JamRegisterPage.tsx` | Two `btn` buttons | `Action` (`primary`/`quiet`) |
| `BrowseJamsPage.tsx` | Search `input`; sort `select`; `tabs tabs-boxed` strip; clear-filters `btn`; count badges | `Field` (screen-reader label); `NavigationTabs`; `Action` (`quiet`); `Badge` |
| `MusicPage.tsx` | Header `btn` buttons; suggested-songs trigger; bespoke `<dialog className="modal modal-open">` | `Action`; `Action` plus `Badge`; `OverlayModal`, `LoadingState`, `EmptyState`, `Action`, `Badge` |
| `JamDetailPageV2.tsx` | Sticky color bars; back and share `btn`; DaisyUI `dropdown`; show-more `btn`; register `btn` | `Status`; `IconAction`; `DropdownMenu`; `Action` (`quiet`); `Action` (`secondary`) |
| `PerformanceSelectionModal.tsx` | Footer `btn-ghost`; two `badge` groups; empty block | `Action` (`quiet`); `Badge`; `CanonicalEmptyState` |
| `SuggestSongModal.tsx` | Spinner row; "did not find" `btn` | `LoadingState`; `Action` (`quiet`) |
| `SuggestNewSongModal.tsx` | Footer buttons; Spotify URL `label`+`input`; import `btn`; success text | Two `Action` elements each; `Field`; `FormSubmissionFeedback` |
| `TimelineItem.tsx` | Status `badge`; instrument badges; register `btn` | `Badge`; `Badge`; `Action` |
| `TimelineShowcase.tsx` | `EmptyTimelineState` block | `CanonicalEmptyState` |
| `TimelineItemV2Waveform.tsx` | Three register `btn` variants | `Action` (`primary`/`secondary`/`quiet`) |
| `TimelineShowcaseV2Waveform.tsx` | Instrument filter pills; `EmptyTimelineState` block | `Action` with `aria-pressed`; `CanonicalEmptyState` |

Each `onClick` handler, each busy guard, and each request flow stays the same.
Each user-visible string keeps its `t(...)` key.

## Forced visible changes

A reviewer sees these changes. Each one is a result of the primitive contract,
not a redesign.

1. **MusicCard reject control.** The outlined error button is now a solid
   `destructive` `Action`. The canonical family has no outlined destructive
   variant.
2. **MusicCard edit control.** The button loses the `btn-active` highlight in
   the expanded state. `Action` has no active-state hook.
3. **SpotifyImportModal mode toggle.** The two modes were a DaisyUI `join`
   group. They are now two separate `Action` elements in a flex row. The
   connected button-group look is gone.
4. **Touch targets.** Each migrated button renders at the canonical minimum
   height. Small controls (`btn-xs`, `btn-sm`) become larger. This is most
   visible in the timeline filter pills, in the timeline register buttons, and
   in the jam detail header.
5. **Color tones.** `Action` gives `primary`, `secondary`, `quiet`, and
   `destructive` only. The `btn-success` approve button in the Music page
   review modal is now `primary`. The `btn-warning` suggested-songs trigger is
   now `secondary`. The `btn-info` suggested-song register button is now
   `primary`. The outlined `btn-primary btn-outline` buttons are now
   `secondary`.
6. **Badge sizes.** `Badge` has three fixed sizes. The responsive
   `badge-sm sm:badge-md lg:badge-lg` status badge on `JamCard` is now one
   size.
7. **JamContextDisplay status text.** The badge showed the raw status value,
   for example `FINISHED`. It now shows the translated label from
   `getJamStatusLabel`. This corrects a defect that was there before this
   ticket.
8. **BrowseJamsPage status tabs.** The DaisyUI `tabs tabs-boxed` strip is now
   `NavigationTabs`. The strip keeps the `tablist` and `tab` roles and gets
   arrow-key focus movement. The per-tab `title` tooltips are gone, because
   `NavigationTabItem` has no field for them.
9. **BrowseJamsPage filter row.** The search field and the sort field are now
   `Field` controls with screen-reader-only labels. The row is visually the
   same, but each control now has a programmatic label. The search field had an
   untranslated `aria-label` before.
10. **MusicPage review modal.** The bespoke `<dialog>` is now `OverlayModal`.
    The surface, the header, and the close control use the canonical overlay
    styles. The modal also gets a focus trap and escape-key dismissal.
11. **JamDetailPageV2 alert banners.** The three sticky banners were full-width
    color bars. They are now `Status` blocks inside the same sticky container.
    The banner keeps `role="alert"`.
12. **JamDetailPageV2 location control.** The location text in the metadata row
    was a `<span role="button">` with a CSS-only popover. It is now a
    `DropdownMenu` trigger, so it renders as a canonical control with
    `aria-expanded` and `aria-haspopup`. The popover closes on escape and on an
    outside click.

## Documented exceptions

### 1. Anchor as button (applies in six places)

`Action` and `IconAction` render a native `<button>` only. See
`src/components/Action.tsx`. A `<button>` cannot carry `href`, cannot do a route
transition, and cannot give the "open in new tab" behavior. So each link that
looks like a button stays a native `<a>` or a react-router `<Link>`:

- the external Spotify links in `MusicCard.tsx`, `MusicTable.tsx`,
  `SpotifyPreview.tsx` (both exports), and `SpotifyExportModal.tsx`
- the dashboard link and the details link in `JamCard.tsx`
- the profile link in `JamRegisterPage.tsx`
- the Spotify playlist link in `JamDetailPageV2.tsx`

Each site has a short code comment that points to this section.

### 2. Pagination controls in `MusicPage.tsx`

The page-size `select`, the page-number `input`, and the four step buttons stay
hand-rolled. `Field` always renders a label element, and `Action` always renders
a full-size control. These dense, label-free controls have no canonical
equivalent. A future ticket can add a compact pagination primitive.

### 3. `SearchableSelect` stays outside `Field`

`docs/design-system/form-fields.md` states that `SearchableSelect` is not
wrapped in `Field`. `Field` clones exactly one native control, and
`SearchableSelect` is a composite widget. The song picker in
`SuggestSongModal.tsx` keeps its own `label` element.

### 4. Selection cards stay buttons

The performance rows in `PerformanceSelectionModal.tsx` are full-width option
cards with a multi-line layout. `Action` renders one canonical control shell and
cannot hold that layout. The rows stay hand-rolled buttons.

### 5. Completed Performance disclosure

`TimelineItemV2Waveform.tsx` gives the whole card `role="button"` only for a
completed Performance, because only that state hides and shows details. An
active or upcoming Performance shows its details directly and does not expose
a false expand affordance. This reviewed product decision narrows the earlier
clickable-card exception while it preserves keyboard operation for the real
disclosure.

### 6. Skeletons stay hand-rolled

`JamCardSkeleton.tsx` and `jam-detail-v2/JamDetailLoadingSkeleton.tsx` keep
their shape-matched blocks. The canonical `Skeleton` draws N identical text
lines. It cannot show the card structure (title with badge, date line, three
description lines, count line, button). A shape-preserving migration is not
possible with the current API.

### 7. Past-jams toggle in `BrowseJamsPage.tsx`

The toggle keeps `aria-expanded` on a hand-rolled button. See decision 6 below
for the same `Disclosure` conflict.

### 8. Dense inline rows keep hand-rolled badges

`MusiciansBadges` in `MusicTable.tsx` stays hand-rolled, with the
`InstrumentBadges` precedent as the reason.

### 9. Shared overlay chrome is untouched

`src/components/Modal.tsx` and `src/components/ModalFooter.tsx` are shared far
beyond Jam and Music. They stay as they are, which matches the Schedule
migration precedent: existing overlay implementations stay until a
workflow-by-workflow review.

### 10. `EditMusicianModal` request error

The request-level error keeps the shared `Alert` plus `useFormState` pattern.
`FormSubmissionFeedback` is for field-level and submission-level feedback inside
a `Field` form. To change this error path is a larger behavior change than this
ticket needs.

## Issue #56 visual normalization

Issue #56 applies the established foundation rules after the structural
migration and the issue #55 contraction. It does not change requests, routes,
permissions, callbacks, or product copy.

- `MusicCard` and the suggested-song review now use the canonical music data
  surface without a second generic card shell. Song titles, artists,
  descriptions, and performance notes use the user-content wrapping rule. This
  keeps the music title as the primary reading target instead of turning it into
  clipped dashboard metadata.
- Jam-context and Jam-detail page titles use the documented heading foundation.
  The foundation now includes heading and subheading classes for the existing
  type tokens, so this change retains a distinct page hierarchy after the
  browser heading reset.
- The active timeline gives its title the flexible column at phone width and
  moves status beneath it until the desktop three-column arrangement is
  available. Performer names and choice-card titles also wrap. This preserves a
  readable tap target with localized and unbroken content.
- The Music filter clear action keeps its text label at every width. On phones
  it moves to its own row rather than making the filter controls or their label
  too narrow.
- Native Spotify and route anchors remain anchors under the existing anchor
  exception. Their hit areas and focus treatment now use the foundation control
  contract, and Spotify preview controls use the semantic success role instead
  of a raw provider color.

Workbench coverage remains intentionally component-level and deterministic:
`Domain/Music/Library/LongContentForViewer`,
`Domain/Music/Library/FilteredPhoneLayout`,
`Domain/Jam/Performance timeline/CompleteSchedule`,
`Domain/Jam/Summary and actions/LongTranslatedSummary`, and
`Overlays/Jam forms/LongPerformanceChoice` cover the long-content, phone,
localized, reference-theme, and action states touched here.

## Required decisions

### 1. `TimelineShowcase` and `TimelineItem` against the waveform pair

`TimelineShowcase` has no consumer. Only the `jam-detail-v2` barrel re-exports
it. `TimelineItem` has one consumer, `src/workbench/stories/JamTimeline.stories.tsx`,
plus the legacy showcase itself. `TimelineShowcaseV2Waveform` is the version
that `src/pages/tabs/JamDetailPageV2.tsx` renders.

**Decision: both V1 files are legacy.** The catalogue metadata names the
replacement and the remaining consumer. Both files are still migrated onto
`Action`, `Badge`, and `CanonicalEmptyState`, which matches the
`TimelineSongItem` precedent. To delete an unreferenced file is a separate,
safe cleanup.

Because `TimelineItem` moves out of the `active` lifecycle, the coverage record
`ui.0043` leaves `jamMusicWorkbenchCoverage` in
`src/workbench/jamMusicFixtures.ts`. The story itself stays.

### 2. `FloatingRegisterButton` and `FloatingSuggestButton` against `DualActionFAB`

Neither floating button has a consumer, in production or in a story. Only the
barrel re-exports them. `DualActionFAB` is the control that
`JamDetailPageV2.tsx` renders, and it has a story.

**Decision: both are legacy, superseded by `DualActionFAB`.** They are dead
code. A follow-up ticket can delete them.

### 3. `DualActionFAB` internals stay as they are

`IconAction` sets a fixed 44px square (`ds-action--icon-only` sets
`inline-size: var(--ds-control-touch)`). The FAB uses `btn-circle btn-lg`
circles with a count badge in an absolute overlay and a large shadow. To force
these onto `IconAction` makes the FAB smaller and cannot show the overlay badge,
because `Badge` is inline.

**Decision: keep `DualActionFAB` hand-rolled, as a documented exception.** This
also keeps the `FloatingActionsByPermission` story valid. That story clicks
`buttons.at(-2)` by position. Any later change to the FAB internals needs a
query by role and name instead.

### 4. `CanvasWaveform`

No consumer, in production or in a story. No replacement component draws a
canvas waveform: `TimelineItemV2Waveform` uses a dot-based status.

**Decision: legacy, no replacement, kept for a deletion ticket.**

### 5. `CollapsibleSidebar`

No consumer. It wraps `CollapsibleSection` with a "How it works" panel, but
`JamDetailPageV2.tsx` calls `CollapsibleSection` directly.

**Decision: legacy, superseded by the direct `CollapsibleSection` usage.**

### 6. `CollapsibleSection` stays hand-rolled

`docs/design-system/overlays.md` maps "optional details" onto `Disclosure`.
`Disclosure` renders native `<details>`/`<summary>`, which does not set
`aria-expanded`. The `CollapsibleInteraction` story asserts
`aria-expanded` on the toggle.

**Decision: keep `CollapsibleSection` hand-rolled.** Only its count badge moves
to `Badge`. The same conflict applies to the past-jams toggle in
`BrowseJamsPage.tsx`.

### 7. `JamCard` against `MusicCard`

The two cards show different domains (a jam session summary against a song
entry), with different data and different consumers. `MusicCard` already uses
`DataCard` from a prior ticket, and `docs/design-system/data-display.md` states
that the ticket did not migrate the rest of the application.

**Decision: keep them separate, and do not move `JamCard` onto `DataCard`.**
The same applies to the `card bg-base-200` wrappers in `JamContextDisplay.tsx`
and `JamRegisterPage.tsx`. Only badges and buttons moved.

### 8. The Music page review modal against `Modal.tsx`

The "Suggested Songs Review" block was a second, hand-rolled
`<dialog className="modal modal-open">`. It repeated the work of `Modal.tsx`:
backdrop dismissal, a close control, and a scrollable body.

**Decision: the bespoke dialog moves onto the canonical `OverlayModal`, not
onto `Modal.tsx`.** This removes the duplicate and adds the focus trap and the
escape-key dismissal. `Modal.tsx` stays untouched (see exception 9 above).

### 9. Status tone map stays local

`getJamStatusBadgeClass` in `src/lib/statusUtils.ts` returns DaisyUI classes.
The host pages `JamManagementPage.tsx` and `HostDashboardPage.tsx` still use it,
and they belong to issue #57. So `JamCard.tsx` and `JamContextDisplay.tsx` each
keep a small local `jamStatusTone` function. When #57 migrates the host pages,
move this map into `lib/statusUtils.ts`.

## Catalogue and stories

- `component-catalogue.metadata.json` records the legacy lifecycle for
  `TimelineShowcase.tsx`, `TimelineItem.tsx`, `FloatingRegisterButton.tsx`,
  `FloatingSuggestButton.tsx`, `CanvasWaveform.tsx`, and
  `CollapsibleSidebar.tsx`. Each note names the replacement and the remaining
  consumers.
- `src/workbench/jamMusicFixtures.ts` drops the `ui.0043` coverage record, for
  the reason in decision 1.
- `src/workbench/stories/JamTimeline.stories.tsx` asserted
  `toHaveClass('btn-primary')` on the selected filter pill. The pills are
  `Action` controls now, so the assertion uses `aria-pressed` and
  `data-action-variant`.
- No other story needed a change. `JamComponents.stories.tsx` queries by role
  and name, or uses `args` only, except the `FloatingActionsByPermission` story,
  and `DualActionFAB` is unchanged (decision 3).

## Follow-up tickets

1. Delete the dead components: `FloatingRegisterButton.tsx`,
   `FloatingSuggestButton.tsx`, `CanvasWaveform.tsx`, `CollapsibleSidebar.tsx`,
   and, if the story moves, the `TimelineShowcase.tsx` and `TimelineItem.tsx`
   pair.
2. Add a compact pagination primitive, then remove exception 2.
3. Move the jam status tone map into `lib/statusUtils.ts` with issue #57.
