# Schedule and registration migration and reconciliation

This is the decision record for issue #52, migrating Schedule and
registration consumers onto canonical design-system primitives and
reconciling the duplicate candidates the parent ticket (#27) asks every
sibling migration to resolve. As with the DJ control (#53) and Public
Dashboard (#54) migrations, this ticket is explicitly incremental: keeping a
duplicate is a legitimate outcome when the two components serve genuinely
different host/musician workflows or list densities.

`ScheduleActionButtons` was already the representative canonical consumer
per `docs/design-system/action-controls.md` before this ticket; it is
unchanged here and remains the reference for the legacy submit-button
behavior it intentionally retains.

## What moved

| File | Legacy pattern | Canonical replacement |
| --- | --- | --- |
| `ScheduleCompactCard.tsx` | Two `btn btn-sm btn-success`/`btn-error` suggested-song buttons | `Action` (`primary`/`destructive`), with `loadingLabel` wired to the same `schedule.actions.approving`/`rejecting` copy `ScheduleActionButtons` uses |
| `ScheduleCollapsibleCard.tsx` | Two `btn btn-sm btn-square` glyph-only (`✓`/`✕`) approve/reject buttons | `IconAction` (`primary`/`destructive`), accessible name moved from `title`/`aria-label` into the required `label` |
| `ScheduleOverflowMenu.tsx` | Hand-rolled DaisyUI `dropdown`/`dropdown-content`, manual blur-then-refocus | Canonical `OverflowMenu` from `../Navigation`, same item order (status transition, add musician, approve all, edit music, delete) and the same trigger accessible name (`common.actions`) |
| `ScheduleDisplayItem.tsx` | `btn btn-sm btn-primary` enroll button | `Action variant="primary"`, emoji kept as a decorative `Action.Icon` |
| `MusicianSlotRow.tsx` | Three `btn btn-circle btn-ghost btn-sm` icon-only buttons (approve/reject/delete) with `title` duplicating `aria-label` | `IconAction variant="quiet"`, `title` dropped, name lives only in `label` |
| `RegistrationList.tsx` | `btn btn-xs btn-outline` add-musician button; `btn btn-xs btn-success/error btn-outline` glyph-only (`✓`/`✕`) approve/reject; `btn btn-xs btn-error btn-outline` delete | `Action variant="secondary"` for add-musician (tooltip kept via native `title`); `IconAction variant="quiet"` for approve/reject/delete, keeping the exact `✓`/`✕` glyphs as icon content so no new iconography is introduced |
| `NotesEditor.tsx` | `btn btn-sm btn-ghost`/`btn-primary` cancel/save; `btn btn-ghost btn-circle` edit-pencil; `btn btn-ghost` add-notes | `Action`/`IconAction` equivalents; the `textarea` itself is unchanged (see exceptions) |
| `HostMusicianRegistrationModal.tsx` | Two `label` + `select select-bordered` fields; `btn btn-sm btn-outline` add-to-queue; `btn btn-ghost btn-xs btn-circle` remove-from-queue | `Field` + `Field.Select` for both selects; `Action variant="secondary"` for add-to-queue; `IconAction variant="quiet"` for remove |
| `ScheduleEnrollmentModal.tsx` | `label` + `select select-bordered` instrument field | `Field` + `Field.Select` |
| `forms/OAuthButton.tsx` | `btn btn-outline` with a hand-rolled loading spinner | `Action variant="secondary"`, using the primitive's own `state="loading"`/`loadingLabel` instead of a manual spinner span |
| `forms/SupabaseLoginForm.tsx` | `label` + `input input-bordered` name/email/password fields; `btn btn-primary` submit; `btn btn-accent btn-sm` sign-up/sign-in toggle | `Field` + `Field.Input` for all three fields; `Action variant="primary"`/`"secondary"` for submit and toggle |

Every `onClick`, `disabled`/loading guard, confirmation-free destructive
delete, and rapid-action guard (the `submitting`/`loading` flags that block a
second submission while a request is in flight) is unchanged. Every
user-visible string keeps its existing `t(...)` key and fallback; no new
locale keys were introduced anywhere in this migration.

`forms/JamRegistrationForm.tsx` was already fully migrated onto `Field`,
`Action`, and `FormSubmissionFeedback` before this ticket (per
`docs/design-system/form-fields.md`); it needed no further changes.
`forms/SearchableSelect.tsx` is explicitly named in `form-fields.md` as a
bespoke composite widget not to wrap until its keyboard and focus contracts
are audited; it is unchanged here, matching that guidance.

## Forced visible changes

1. **Touch target size.** Every migrated button (`btn-sm`, `btn-xs`,
   `btn-circle btn-sm`) now renders at the canonical 44px minimum height and
   width. Several rows (`MusicianSlotRow`, `NotesEditor`) already carried
   manual `min-h-[44px] min-w-[44px]` overrides for the same reason; those
   are now redundant and covered by the primitive itself.
2. **Outline buttons lost their border-only styling.** `Action` only exposes
   `primary`/`secondary`/`quiet`/`destructive`, and none of them reproduce a
   bordered-but-transparent `btn-outline` control. `RegistrationList`'s
   add-musician button, `HostMusicianRegistrationModal`'s add-to-queue
   button, and `forms/OAuthButton.tsx` all used `btn-outline`; they now
   render as a filled `secondary` control instead of an outlined one. This
   mirrors the DJ control migration's decision to accept the closest
   available variant rather than invent a new one.
3. **Glyph-only approve/reject buttons.** `ScheduleCollapsibleCard`'s
   `✓`/`✕` square buttons are now `IconAction`, which enforces a perfectly
   square 44px hit area (`ds-action--icon-only`) instead of DaisyUI's
   `btn-square btn-sm`. The glyphs themselves are unchanged.
4. **`RegistrationList`'s inline `✓`/`✕` buttons.** These were deliberately
   kept as the same text glyphs (not swapped for `CheckCircle`/`XCircle`
   icons, even though those are already imported and used for the status
   pills a few lines away) specifically to avoid introducing a visual
   redesign beyond what `IconAction`'s sizing already forces.
5. **`SupabaseLoginForm` field labels.** The email and password inputs
   previously used a `label` that was not associated with its input via
   `htmlFor`/`id` (the password label was not connected to the input at
   all). `Field` requires and produces that association, so this is an
   accessibility fix bundled into the migration, not a visual layout change;
   the visible label text and position are unchanged.

No layout, spacing, color-tone, or copy changes were made beyond what the
primitives require to render.

## Required decisions

### 1. The card family: `ScheduleCompactCard` vs `ScheduleCollapsibleCard` vs `ScheduleDetailsCard` vs `ScheduleDisplayItem` vs `ScheduleCardManagement`

**Mixed decision**, verified against actual JSX consumers (not just barrel
exports), because the catalogue already flagged three of these five as
`lifecycle: "uncertain"` with "no current consumers":

- **`ScheduleCollapsibleCard` is the production default.** It is the only
  one of the five rendered from `src/pages/tabs/ScheduleTab.tsx` (the host
  management tab), and the only one with real workbench story coverage
  (`ScheduleRegistration.stories.tsx`).
- **`ScheduleCardManagement` — decision: legacy, replaced by
  `ScheduleCollapsibleCard`.** Its own file header already says
  `ScheduleCompactCard` "replaces `ScheduleCardManagement` with a denser
  layout," and grep confirms it has no consumer besides its own barrel
  export and `src/workbench/stories/Environment.stories.tsx`. It renders a
  full `RegistrationList` grid per card rather than the compact
  `MusicianSlotList` rows the production card uses, so it is not
  byte-identical to either `ScheduleCollapsibleCard` or `ScheduleCompactCard`
  and was not deleted; `component-catalogue.metadata.json` now records the
  replacement and the sole remaining consumer.
- **`ScheduleCompactCard` — decision: keep, uncertain, not deprecated.**
  It also has zero consumers beyond its barrel export, but nothing has
  superseded it the way `ScheduleCardManagement` was superseded — it is a
  denser alternative layout that was never wired into a page. Marking it
  legacy would misstate the situation (there is no replacement to point to);
  it stays flagged `uncertain` with a note that it is available but unadopted.
- **`ScheduleDisplayItem` — decision: legacy, no current replacement
  component.** It has no consumer anywhere, including stories. The
  musician-facing schedule display on the live `jam-detail-v2` page renders
  schedule items inline through `TimelineShowcaseV2Waveform`
  (`src/components/jam-detail-v2/`, out of this ticket's scope per the
  hard-constraint list), which functionally replaced it. Recorded as the
  named replacement even though that component is not itself a drop-in API
  match, because it is what actually serves that role in production today.
- **`ScheduleDetailsCard` — decision: keep, distinct purpose, not a
  duplicate.** It is a compact read-only summary (title/artist/duration)
  used only inside `HostMusicianRegistrationModal` and
  `ScheduleEnrollmentModal` to remind the user which song they are acting
  on. It has no status-color background, no registrations list, and no
  actions, so it does not overlap with the list-item cards above. `DataCard`
  was considered; it was not applied because `ScheduleDetailsCard`'s
  `bg-base-200` block is a small in-modal aside, not a primary content
  surface, and the padding/token change would be a visible redesign of a
  component that is otherwise a single-purpose passthrough.

### 2. The status family: `ScheduleStatusBadge` vs `StatusDot` vs `SlotFillIndicator` vs `InstrumentBadges` vs `InstrumentsSummary`

**Decision: keep all five, hand-rolled, documented.** Each is a real
consumer of the canonical `Badge`/`StatusIndicator` primitives' problem
space but none can adopt them without a visible redesign:

- `StatusDot` is a bare colored dot with no visible text by design (used in
  `ScheduleCollapsibleCard`'s ~44px collapsed row, where space is the
  entire point). `StatusIndicator` requires visible text next to its dot;
  adding that text would grow the collapsed row, which the hard constraint
  against redesign forbids. Kept as-is.
- `ScheduleStatusBadge` maps five schedule statuses (including a
  `isSuggested` variant) through `getStatusColor`/`getStatusLabel`/
  `getStatusIcon` helpers shared with `ScheduleDisplayItem`. `Badge`'s tone
  set (`neutral`/`info`/`success`/`warning`/`danger`) does not have a 1:1
  slot for every existing DaisyUI status color without re-deriving the
  color mapping, which is a larger, behavior-risking change than this
  ticket's scope; the existing helper-driven badge already satisfies the
  "status meaning is in the label" contract `data-display.md` asks for.
- `SlotFillIndicator` and `InstrumentsSummary` both encode a live
  numeric/ratio state (`counts registered / needed`) as part of the badge
  text itself (`2/4`, `+2`), which is a compact composition `Badge` does not
  model as a single prop.
- `InstrumentBadges` renders a small multi-badge row (duration + one badge
  per instrument) sized specifically to fit inside the ~110px
  `ScheduleCompactCard`; `Badge`'s size scale and padding tokens do not
  target that density.

This mirrors the Public Dashboard migration's precedent of keeping
distance/density-tuned presentational pieces hand-rolled and documenting
why, rather than forcing every badge onto the shared primitive.

### 3. The slot/row family: `MusicianSlotRow` vs `EmptySlotRow` vs `MusicianSlotList` vs `RegistrationList`

**Decision: keep both compositions, documented; they are not duplicates of
each other, they are two different list densities for two different card
families.**

- `MusicianSlotList` (which composes `MusicianSlotRow` and `EmptySlotRow`)
  is the compact, single-line-per-musician layout consumed by the
  production `ScheduleCollapsibleCard` and the unadopted
  `ScheduleCompactCard`. It groups registrations by instrument into a
  responsive 1/2-column grid of dense rows.
- `RegistrationList` is the wider card-grid layout (one column per
  instrument, one elevated card per musician with avatar, status pill, and
  contact/level detail) consumed by the legacy `ScheduleCardManagement` and
  the unconsumed `ScheduleDisplayItem`.

Both were migrated onto `IconAction`/`Action` in this ticket (see the table
above) because both are explicitly in this ticket's file scope, so neither
regresses if `ScheduleCardManagement` or `ScheduleDisplayItem` is reinstated
later. Converging them into one component would mean picking one visual
density for both the current collapsible-card list and any future revival
of the card-grid layout, which is a larger layout decision than this
migration ticket owns.

### 4. The modal family: `HostMusicianRegistrationModal` vs `ScheduleEnrollmentModal`

**Decision: keep both, documented — different personas and different
mutation shapes, not a duplicate.**

- `ScheduleEnrollmentModal` is the musician-facing, single-registration
  self-enroll flow: pick one instrument, submit one `registrationService.create`
  call for the current user.
- `HostMusicianRegistrationModal` is the host-facing, multi-registration
  batch flow: pick any number of musician+instrument pairs into a queue,
  then submit them sequentially with per-item progress and partial-failure
  handling (`SubmissionProgress`, retry-by-resubmitting-the-failed-subset).

Both are catalogued `readiness.workbench: "exempt"` already, for the same
underlying reason (their mutations use internal services rather than an
injectable scenario adapter); that exemption is unchanged by this ticket.
Both had their instrument/musician `<select>` elements migrated onto
`Field`/`Field.Select` (a direct, low-risk match for the documented
`form-fields.md` compatibility table), and their action buttons onto
`Action`/`IconAction`, without touching the shared `Modal`/`ModalFooter`
wrapper both consume (see "Modal chrome" below).

## Modal chrome: `Modal`/`ModalFooter` vs canonical `OverlayModal`/`ConfirmationDialog`

Not one of the four required decisions, but worth recording because both
in-scope modals use it. `HostMusicianRegistrationModal` and
`ScheduleEnrollmentModal` both compose the pre-existing `src/components/Modal.tsx`
and `src/components/ModalFooter.tsx`, not the canonical `OverlayModal`.
**Decision: leave the modal wrapper itself unchanged.** `Modal.tsx` is not
listed in this ticket's file scope (it is a shared component consumed well
beyond Schedule), and `docs/design-system/overlays.md` states plainly that
"existing overlay implementations remain unchanged pending
workflow-by-workflow review" — the feedback dialog remains the one
representative production `OverlayModal` integration. Swapping either
modal's chrome to `OverlayModal` would change its focus-trap and dismissal
implementation (a real behavior change, not a mechanical class swap) without
a corresponding review of `Modal.tsx`'s other consumers, which is out of
this ticket's scope. Their *contents* (selects, buttons) were still migrated
onto `Field`/`Action`, which is unaffected by which dialog wrapper contains
them.

## Catalogue and stories

- `component-catalogue.metadata.json` was updated for `ScheduleCardManagement.tsx`
  (now `lifecycle: "legacy"`, replacement and sole consumer named),
  `ScheduleCompactCard.tsx` (still `uncertain`, note clarified — no
  replacement exists), and `ScheduleDisplayItem.tsx` (now
  `lifecycle: "legacy"`, replacement named). No other metadata rules were
  touched.
- `npm run catalogue:generate` was run after the code changes so
  `docs/design-system/component-catalogue.json`/`.md` reflect the new
  primitive dependencies (`../Action`, `../Field`, `../Navigation`) in place
  of raw DaisyUI classes.
- `src/workbench/stories/SchedulePrimitives.stories.tsx` and
  `ScheduleRegistration.stories.tsx` were not modified: their `play`
  functions assert on accessible names and roles (`getByRole('button', {name: /approve/i})`,
  the overflow menu's `/ações|actions|acciones/i` trigger name, and clicking
  `buttons.at(-1)!` for the overflow menu's delete item), and this migration
  was written specifically to preserve those names, that trigger label, and
  that item order, so the existing stories continue to exercise the
  migrated components without modification.
- `src/__tests__/schedule-workbench.test.ts` and
  `src/__tests__/JamRegistrationForm.test.tsx` were not modified for the
  same reason — this migration did not change any `lifecycle: "active"`
  Schedule/registration catalogue id, so `scheduleWorkbenchCoverage` still
  matches, and `JamRegistrationForm` was already on canonical primitives
  before this ticket.
