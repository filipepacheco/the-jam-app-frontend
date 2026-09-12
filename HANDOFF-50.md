# Handoff: issue #50 "Migrate shared account marketing and page UI"

Status: INCOMPLETE. Stopped early on explicit instruction from the coordinator
because the session was near a token limit. This file is a working document
for the next agent, not a deliverable, so it is plain English, not
ASD-STE100.

## Branch and commit

- Branch: `feat/migrate-shared-account-marketing-50`
- This branch was created from the worktree branch
  `worktree-agent-adf7fcd4b9b7a2e20` in
  `/Users/e160069/WebstormProjects/the-jam-app-frontend/.claude/worktrees/agent-adf7fcd4b9b7a2e20`.
- The commit SHA is whatever this commit resolves to — check
  `git log -1 --format=%H` on this branch after pushing. (I could not embed
  the SHA before creating the commit that contains this very file.)
- No PR was opened, per instructions.

## File scope (copied verbatim from the task)

### YOUR FILE SCOPE - do not edit anything outside it

A parallel agent is implementing #51 (Jam and Music UI) at the same time.
Staying inside your scope is what prevents a collision. You own:

- Marketing: src/components/CallToAction.tsx, Features.tsx, Footer.tsx,
  HowItWorks.tsx, Testimonials.tsx, EnhancedHero.tsx,
  src/components/PromoVideo/**, src/components/hero/**
- Shared chrome and account: src/components/Navbar.tsx, MobileDrawer.tsx,
  DesktopUserMenu.tsx, RouteGuards.tsx, SEO.tsx, PageAlerts.tsx,
  PageHeaderSkeleton.tsx, QuickEditPanel.tsx, ProfileFormSection.tsx,
  OnboardingModal.tsx, ShareModal.tsx, FeedbackButton.tsx, FeedbackModal.tsx,
  Avatar.tsx, FullPageSpinner.tsx
- Pages: src/pages/AboutPage.tsx, LoginPage.tsx, NotFoundPage.tsx,
  ProfilePage.tsx, SpotifyCallbackPage.tsx, JamShortRedirect.tsx,
  SlugRedirect.tsx
- src/workbench/stories/PageCompositions.stories.tsx,
  src/workbench/stories/PublicDashboardCards.stories.tsx

### EXPLICITLY OFF LIMITS (other tickets own these)

- src/components/jam-detail-v2/**, src/components/music/**
- src/components/ root: JamCard.tsx, JamCardSkeleton.tsx,
  JamContextDisplay.tsx, MusicCard.tsx, MusicEmptyState.tsx,
  MusicFilters.tsx, MusicModal.tsx, MusicModalFormFields.tsx,
  MusicTable.tsx, MusicianProfileModal.tsx, EditMusicianModal.tsx,
  SpotifyExportModal.tsx, SpotifyImportModal.tsx, SpotifyPreview.tsx
- src/pages/MusicPage.tsx, src/pages/BrowseJamsPage.tsx,
  src/pages/JamRegisterPage.tsx
- src/pages/host/** (issue #57), src/pages/tabs/**
- src/components/dj-control/**, src/components/publicDashboard/**,
  src/components/schedule/** (already migrated)
- src/workbench/stories/JamComponents.stories.tsx

Note: Navbar.tsx and MobileDrawer.tsx in src/components/ root are ours. Do
not confuse them with src/components/publicDashboard/Navbar.tsx, which is
already migrated and off limits.

I did not touch anything outside the "YOUR FILE SCOPE" list above. I did not
touch any off-limits file.

## Status table: every in-scope file

| File | Status | Notes |
| --- | --- | --- |
| src/components/CallToAction.tsx | Not started | No btn/select/modal classes found in an earlier grep pass (0 hits), likely a documented-exception marketing surface, but I never opened the file to confirm or write the comment. |
| src/components/Features.tsx | Not started | 0 grep hits in the pre-scan. Never opened. |
| src/components/Footer.tsx | Not started | 0 grep hits. Never opened. |
| src/components/HowItWorks.tsx | Not started | 0 grep hits. Never opened. |
| src/components/Testimonials.tsx | Not started | 0 grep hits. Never opened. |
| src/components/EnhancedHero.tsx | Not started | 6 grep hits (btn/select/etc. patterns) in the pre-scan — this one likely has real migratable buttons. Never opened. |
| src/components/PromoVideo/** (7 files) | Not started | 0 grep hits each. Never opened. |
| src/components/hero/HeroDashboardMockup.tsx | Not started | 0 grep hits. Never opened. |
| src/components/Navbar.tsx | Migrated (already mostly canonical) | Already used `NavigationAction`/`NavigationLink` before I touched it. I added documentation comments only: the logo anchor, the register CTA anchor, and the loading skeleton are now explicitly commented as deliberate exceptions (real-anchor semantics needed; Skeleton primitive shape mismatch). No behavior changes. |
| src/components/MobileDrawer.tsx | Migrated | Close button -> `IconAction`. Register/login CTA anchor -> `Action variant="primary"`. Nav items and profile link -> `NavigationLink`. Feedback list item -> `Action variant="quiet"`. Language/theme selects -> `Field` + `Field.Select` (they already had visible labels, so this was a direct match per form-fields.md). Logout button -> `Action variant="quiet"`. Full file compiles under `tsc -b --force`. **Caveat**: catalogue metadata says `MobileDrawer.tsx` and `ModalFooter.tsx` are `readiness.workbench: "exempt"` because they are only inspected indirectly, through Navbar, in the Navigation/Responsive navbar story. I did NOT check whether that story still renders/exercises MobileDrawer correctly after this migration (I did not run Storybook or the workbench tests). Verify this before considering MobileDrawer done. |
| src/components/DesktopUserMenu.tsx | Migrated, with a documented interaction-preservation exception | Trigger buttons and the profile/logout buttons -> `Action variant="quiet"`. The login anchor (unauthenticated state) was kept as a real `<a>` styled with the existing `ds-menu__item` CSS class (that class is defined globally in Navigation.css, so this reuses canonical styling without instantiating the stateful `OverflowMenu`/`DropdownMenu` React components). Reason recorded in-file: `DropdownMenu`/`OverflowMenu` have no exposed "close on selection" hook, and this component's dropdown open/close relies on a pure-CSS `:focus-within` mechanism (via the `dropdown dropdown-end` DaisyUI wrapper) plus manual `blur()` calls (`closeDropdown()`) on the profile/logout actions. Forcing the stateful canonical component would leave the menu open after navigating away, a real behavior regression. The two settings `<select>` elements (language, theme) were deliberately kept hand-rolled: they have no visible label (only an icon + `aria-label`), and `Field` always renders a visible label, so wrapping them would add visible text and grow the compact row — a redesign this ticket forbids. The `isLoading` skeleton pulse (avatar + name shape) was also kept hand-rolled: `Skeleton` from FeedbackStates.tsx always renders full-width text lines, not this specific avatar-circle-plus-bar shape. All three exceptions have inline comments in the file. |
| src/components/RouteGuards.tsx | Not started | 0 grep hits in the pre-scan (route guard logic, unlikely to have UI). Never opened — should double check there truly is nothing to migrate (maybe a loading fallback) before recording it as "no work needed." |
| src/components/SEO.tsx | Not started | 0 grep hits, this is almost certainly a `<Helmet>`/meta-tag component with no UI controls. Likely a fast "nothing to migrate" file but never opened to confirm. |
| src/components/PageAlerts.tsx | Opened, read only, not modified | Thin wrapper around `Alert` (from `./Alert.tsx`, NOT in scope). `Alert.tsx` itself is not in my file scope list, so I left `PageAlerts.tsx` completely untouched — there was nothing to migrate onto Action/Field/etc. inside this file itself. Consider this file done as "no canonical primitive applies directly here; the underlying Alert component is out of scope." |
| src/components/PageHeaderSkeleton.tsx | Opened, read only, not modified | Pure skeleton shapes (back button, title, description, stats grid) with very specific shapes/sizes. The canonical `Skeleton` primitive only renders uniform full-width lines, so applying it would change the loading silhouette significantly. I had NOT yet written the documentation comment recording this as a deliberate exception — that still needs to be added to the file and to the migration doc. |
| src/components/QuickEditPanel.tsx | Migrated | Title/artist/description/link/info fields -> `Field` + `Field.Input`/`Field.Textarea`. Genre select -> `Field` + `Field.Select`. Instrument steppers (+/- icon buttons) -> `IconAction variant="quiet"` with `state="disabled"` at the min/max bounds. Cancel/Save buttons -> `Action variant="quiet"`/`Action variant="primary"`, with a separate loading-state `<Action>` element (see "Type traps" below — this file already does the split-branch pattern correctly). The minutes/seconds duration number inputs were deliberately left as native `<input>` elements (not `Field`): the original design has ONE visible label ("Duration") shared across TWO inputs, and `Field` binds one label to exactly one control, so wrapping them individually would either duplicate the label text twice or drop the shared-label layout. This exception is not yet written into the file as a comment — only decided. Compiles clean under `tsc -b --force`. |
| src/components/ProfileFormSection.tsx | Migrated | Edit-mode branches (select/textarea/text input) -> `Field` + `Field.Select`/`Field.Textarea`/`Field.Input`, keyed by `profile-field-${field.name}`. View-mode (read-only display box) deliberately left as plain markup — `Field` always wraps an editable control, and this is a static, non-interactive value display, so it does not fit the Field contract. Comment recorded in file. Compiles clean. |
| src/components/OnboardingModal.tsx | Migrated, with a documented Modal.tsx exception | Name/Phone/Instrument/Level fields -> `Field` + `Field.Input`/`Field.Select`, all with `required`/`requiredLabel={t('common.required')}` (verified that key exists in `src/locales/en.json`). Footer submit button -> `Action variant="primary"`, split into two separate `<Action>` elements for the loading vs. idle case (see "Type traps" below). The `Modal` wrapper itself (from `./Modal.tsx`) was deliberately left as-is — `Modal.tsx` is shared by many out-of-scope consumers (MusicModal, jam-detail-v2 modals, ProfileSetupModal, ConfirmDialog, SpotifyImportModal, SpotifyExportModal, EditMusicianModal, MusicianProfileModal, HostMusicianRegistrationModal, ScheduleEnrollmentModal, and more — see `grep -rl "from '.*Modal'" src` for the full list). Swapping only these two usages to `OverlayModal` would fork the modal implementation without a review of Modal.tsx's other consumers. This mirrors the precedent already recorded in `docs/design-system/schedule-registration-migration.md` under "Modal chrome." Comment recorded in file. Compiles clean. |
| src/components/ShareModal.tsx | Migrated, with the same Modal.tsx exception | Copy/WhatsApp/Instagram/Native-share buttons (`btn btn-outline`) -> `Action variant="secondary"` (documented: `Action` has no border-only/outline variant, so this is a filled-vs-outline visible change, same trade-off the Schedule migration already documented for `RegistrationList`/`HostMusicianRegistrationModal`). The transient copy/share feedback toast (`alert alert-success`/`alert-info`) -> `Status` from FeedbackStates.tsx (`tone="success"`/`tone="info"`, using the toast text as `title` since there is no separate description). `Modal` wrapper left as-is, same reasoning and same comment style as OnboardingModal. Unused `Check` icon import removed. Compiles clean. |
| src/components/FeedbackButton.tsx | Not started | 2 grep hits (`btn btn-ghost gap-2 ...`). Simple: should become `Action variant="quiet"`, keeping the conditional icon-only rendering (there's an `iconOnly` prop already, so this might actually be closer to `IconAction` when `iconOnly` is true and `Action` when it is false — needs a decision, or just keep it as one `Action` whose visible label is conditionally rendered, matching what I did for DesktopUserMenu's settings trigger). Never opened beyond the initial read (see the Read tool call output already in the transcript — the file is only 38 lines and I did read its full content, I just did not edit it). |
| src/components/FeedbackModal.tsx | Migrated (was already mostly canonical) | This was already on `OverlayModal`/`Action` before I touched it (per `docs/design-system/overlays.md`, it's called out as "the single representative production integration"). I additionally migrated the comment `<textarea>` to `Field` + `Field.Textarea` with `hint` wired to the character-count text. The 5-star rating radio group was deliberately left hand-rolled with a comment: `Field` wraps exactly one control, and this is five radio inputs forming one widget, so it does not fit. Compiles clean. |
| src/components/Avatar.tsx | Not started | 0 grep hits — this is a pure display component (colored circle + initials), almost certainly a `data-display`-family candidate (`DataCard`/`Badge` do not fit; there is no direct "avatar" primitive in the canonical set that I saw). Likely ends up "keep hand-rolled, documented" but I never opened/decided this for real — I did read the full file (see transcript) but made no decision or edit. |
| src/components/FullPageSpinner.tsx | Reviewed and documented as an exception, not restructured | Added an in-file comment explaining why this stays hand-rolled instead of `LoadingState` (FeedbackStates.tsx): `LoadingState` requires a label and always renders a live region; `FullPageSpinner`'s `label` prop is optional, and `App.tsx` renders it with NO label at all during the earliest app boot (see `src/App.tsx:68`), before any text is safe to announce. `LoadingState`'s inline feedback-row layout also does not match this component's full-viewport centered layout. No code was changed beyond adding the comment. This is essentially "done" (a documented exception), but the migration doc still needs the same reasoning written into it. |
| src/pages/AboutPage.tsx | Not started | 6 grep hits. Never opened. |
| src/pages/LoginPage.tsx | Not started | 2 grep hits. Never opened. |
| src/pages/NotFoundPage.tsx | Not started | 4 grep hits (surprising for a 37-line file — check what's actually there, might be `btn`-classed links back home). Never opened. |
| src/pages/ProfilePage.tsx | Migrated | Edit/Cancel/Save buttons -> `Action` (primary/quiet/primary), with the loading vs. idle Save button split into two separate `<Action>` elements (see "Type traps" below). Emoji decorations (✏️, 💾) kept as plain `<span aria-hidden="true">` siblings of `Action.Label`, matching the pattern of icon + label elsewhere. `btn-lg` sizing was dropped (Action has no size variants) — this is a forced visible change (buttons shrink to the standard 44px control size) that needs to be listed in the PR description and the migration doc; I did not yet write it down anywhere except this handoff. The full-page loading skeleton (avatar circle, two card sections, button row) was deliberately left hand-rolled — same reasoning as `PageHeaderSkeleton.tsx` (shape mismatch with the uniform `Skeleton` primitive) — but I have NOT yet added the in-file comment for this one. `Alert` usage (from `./Alert.tsx`, out of scope) untouched. Compiles clean under `tsc -b --force`. |
| src/pages/SpotifyCallbackPage.tsx | Not started | 3 grep hits. Never opened. |
| src/pages/JamShortRedirect.tsx | Not started | 0 grep hits — likely a pure redirect component with no UI, probably "nothing to migrate," but never confirmed. |
| src/pages/SlugRedirect.tsx | Not started | 0 grep hits — same as above, likely a pure redirect, never confirmed. |
| src/workbench/stories/PageCompositions.stories.tsx | Not started | Never opened. This may need updates if any story asserts on button roles/positions for components I changed (DesktopUserMenu, MobileDrawer, ProfilePage, OnboardingModal, ShareModal, QuickEditPanel, ProfileFormSection). Check this file's `play()` functions carefully against the "known trap" below. |
| src/workbench/stories/PublicDashboardCards.stories.tsx | Not started — but has a KNOWN, ALREADY-DIAGNOSED BUG | See "Traps" section below. This must be fixed regardless of anything else. |

## Files I read but made zero decision on

`RouteGuards.tsx`, `SEO.tsx`, `Avatar.tsx`, `FeedbackButton.tsx` — I did read
`FeedbackButton.tsx` and `Avatar.tsx` in full during this session (their
content is in the transcript), but did not act on them. `RouteGuards.tsx`
and `SEO.tsx` I never opened at all; the "0 grep hits" pre-scan is a
reasonable prior that they have little or no DaisyUI button/select/modal
markup, but it is only a prior, not a confirmed finding — check by opening
the files.

## Decisions already made and why (the expensive part — do not redo)

1. **DesktopUserMenu keeps its DaisyUI `dropdown dropdown-end` wrapper.**
   Canonical `DropdownMenu` (Navigation.tsx) manages its own internal
   `open` boolean with no prop to close it from outside. This component's
   existing behavior calls `closeDropdown()` (a manual `blur()`) right
   before navigating away on profile-click and logout-click, relying on
   the DaisyUI `:focus-within` CSS trick to open/close. Swapping to
   `DropdownMenu` would leave the menu open after the user clicks an item
   that causes an in-app route change (since focus does not naturally
   leave the menu tree on a SPA navigation), which is a functional
   regression the ticket explicitly forbids. Individual buttons inside were
   still migrated to `Action`/`IconAction` since those are native
   `<button>`s under the hood and do not disturb the CSS mechanism (checked
   `Action`'s implementation: it forwards `tabIndex` and all native button
   props through to a real `<button>`).

2. **DesktopUserMenu's login anchor uses the raw `ds-menu__item` CSS class
   instead of a component.** This is a plain `<a href="/login">` (real
   navigation, not a client-side route change), so it cannot become an
   `Action` (button-only). Rather than leave it in the old `btn btn-ghost
   btn-sm btn-block` DaisyUI classes, I applied the `ds-menu__item` class
   that Navigation.css already defines globally for `OverflowMenu`/
   `DropdownMenu` items, so it visually matches the canonical menu-item
   look without needing a stateful component. This is a legitimate
   "documented exception" per the ticket's rule 3, not a compatibility
   variant — there's no plan to later replace it with a component, because
   the constraint (real anchor semantics) is permanent, not transitional.

3. **Compact icon+select rows (DesktopUserMenu's language/theme selects)
   stay hand-rolled.** `Field` always renders a visible `<label>` per
   `docs/design-system/form-fields.md`. These particular selects use only
   an icon plus an `aria-label` (no visible label) to stay compact inside a
   dropdown row. Wrapping them in `Field` would add visible label text and
   grow the row — a visual redesign this ticket does not authorize (that's
   issue #58's job). MobileDrawer's equivalent selects DID get migrated to
   `Field`, because they already had a visible `<label>` above them — a
   direct match for the "label plus select-bordered" -> "Field +
   Field.Select" row in form-fields.md's compatibility table. Do not
   conflate these two cases; the deciding factor is "does a visible label
   already exist," not "is it a select."

4. **`btn-outline` becomes `Action variant="secondary"` wherever it
   appears (so far: ShareModal's four share buttons).** `Action` only
   exposes `primary`/`secondary`/`quiet`/`destructive` — there is no
   border-only/outline variant. This exact trade-off (and exact wording)
   is already precedented in
   `docs/design-system/schedule-registration-migration.md` under "Forced
   visible changes," item 2. Repeat this same justification, not a new one,
   in the new migration doc — do not reinvent the wording each time.

5. **`Modal.tsx` (the older shared modal, distinct from canonical
   `OverlayModal`) stays as the wrapper for `OnboardingModal.tsx` and
   `ShareModal.tsx`.** `Modal.tsx` is consumed by many out-of-scope files
   (grep confirmed: `ConfirmDialog.tsx`, `MusicModal.tsx`,
   `MusicianProfileModal.tsx`, `EditMusicianModal.tsx`,
   `ProfileSetupModal.tsx`, `SpotifyExportModal.tsx`,
   `SpotifyImportModal.tsx`, `schedule/ScheduleEnrollmentModal.tsx`,
   `schedule/HostMusicianRegistrationModal.tsx`, three files under
   `jam-detail-v2/`). Swapping only my two in-scope usages to `OverlayModal`
   would fork the modal implementation for no clear reviewable benefit and
   is explicitly called out as out of scope by the precedent in
   `docs/design-system/schedule-registration-migration.md`'s "Modal
   chrome" section (quote: "existing overlay implementations remain
   unchanged pending workflow-by-workflow review"). Only the CONTENTS of
   these two modals (fields, buttons) were migrated onto `Field`/`Action`.

6. **Star-rating widgets and other multi-input composite controls stay
   hand-rolled.** `Field` wraps exactly one native control. FeedbackModal's
   5-star radio group cannot be a `Field`. Watch for the same shape in any
   not-yet-visited file (e.g., if `AboutPage.tsx` or `LoginPage.tsx` have
   anything similar).

7. **Skeleton/loading placeholders with a specific, non-uniform shape stay
   hand-rolled** (DesktopUserMenu's avatar-pulse, Navbar's pill-plus-avatar
   skeleton, FullPageSpinner, PageHeaderSkeleton, and — very likely —
   ProfilePage's full-page loading skeleton). The canonical `Skeleton`
   (FeedbackStates.tsx) only renders uniform full-width text lines
   (`h-4 w-full`), so it cannot reproduce avatar circles, stat grids, or a
   bare unlabeled spinner without visibly changing the loading state's
   shape. This same reasoning applies to any skeleton file not yet visited
   — do not re-derive it, just apply it and write the comment.

8. **No new compatibility variants were introduced that need to be
   flagged for issue #55.** Everything I touched used the primitives'
   existing, already-shipped variants (`Action variant="secondary"` for
   outline, etc.) — nothing new was added to Action/Field/Navigation
   themselves. If a future file in this scope needs something the
   primitives do not support, that is when a real compatibility variant
   would need to be added and flagged; none exists yet from my work.

## Deferred to issue #58 (visual redesign, explicitly out of scope here)

- `Action`'s lack of a `btn-lg` equivalent shrinks `ProfilePage`'s
  Edit/Cancel/Save buttons from large to the standard 44px control size.
  This is a forced, not chosen, visual change — flag it in the PR
  description, do not try to "fix" it by adding a size prop to `Action`
  (that would be scope creep into the primitive itself, a #55/#58 decision,
  not a #50 one).
- Any other `btn-lg`/`btn-xl` sizing found in the not-yet-visited files
  (AboutPage, LoginPage, EnhancedHero, etc.) will have the same forced
  shrink — document each one the same way, do not treat it as a bug to
  route around.
- I did not spot any deliberate visual redesign temptations to write down
  beyond the button-size shrink above, but I also did not reach the
  marketing files (CallToAction, Features, Footer, HowItWorks,
  Testimonials, EnhancedHero, PromoVideo/**, hero/**) where marketing-specific
  styling is most likely to tempt a "just improve this while I'm in here"
  edit. Resist that in the marketing files — per the task's own guidance,
  marketing surfaces may legitimately need their own visual treatment and
  should mostly end up as documented exceptions, not migrations.

## Verification: current state

### `npx tsc -b --force`

Ran clean. Exit code 0, zero output (no errors, no warnings). This was
confirmed AFTER all edits listed above as "Migrated" were made. If the next
agent's first action is to make more edits, re-run this before trusting it
still passes.

### `npm run catalogue:check`

Ran and FAILED, as expected, because I did not run
`npm run catalogue:generate` yet (per the coordinator's stop instruction, I
was told not to start new work, and I judged running catalogue:generate
before the migration is finished to be premature — it should be run ONCE,
at the end, per the task instructions). Verbatim output:

```
> karaoke-jam-frontend@0.0.0 catalogue:check
> tsx scripts/component-catalogue/cli.ts --config component-catalogue.config.json --check

Component catalogue validation failed:
- docs/design-system/component-catalogue.json is stale
- docs/design-system/component-catalogue.md is stale
- Run `npm run catalogue:generate`
```

### `npm run catalogue:generate`

NOT run. `component-catalogue.metadata.json` has NOT been touched at all —
zero uncommitted intent in it. The task's requirement #5 (naming
replacements/consumers for anything marked deprecated/legacy) has not been
started because I have not yet identified any component in my scope that
needs a lifecycle change in the catalogue metadata. Whoever picks this up
should look for that need as they finish the remaining files (marketing
components in particular — `CallToAction`/`Features`/etc. — since the
Public Dashboard and Schedule migrations both found duplicate-family
components in their scope that needed catalogue updates; I have not yet
determined whether an equivalent duplicate-family question exists in my
scope, e.g., is there more than one "hero" component, more than one
"footer," etc. — check `src/components/hero/HeroDashboardMockup.tsx`
against `EnhancedHero.tsx` for exactly this kind of question).

### `docs/design-system/shared-account-marketing-migration.md`

NOT created yet. This is required by the task (item 6) and must be written
in ASD-STE100 Simplified Technical English, including the line
`Language: ASD-STE100 Simplified Technical English`. It needs to cover, at
minimum, everything in the "Decisions already made and why" section above,
plus whatever the next agent finds in the unvisited files. Remember:
`docs/` is gitignored, so this file needs `git add -f
docs/design-system/shared-account-marketing-migration.md` or it will
silently vanish from the commit. I did not create this file at all in this
session (I ran out of budget before starting it) — writing it is one of the
largest remaining chunks of work along with the untouched files themselves.

## Remaining work, in order

1. Fix `src/workbench/stories/PublicDashboardCards.stories.tsx:39-40` (see
   Traps below) — this is an already-diagnosed, standalone, low-risk fix.
   Do it first since it is fully specified and does not depend on anything
   else in this handoff.
2. Add the still-missing in-file comments for already-migrated files:
   `PageHeaderSkeleton.tsx` (Skeleton-shape exception),
   `ProfilePage.tsx`'s loading skeleton (same reasoning),
   `QuickEditPanel.tsx`'s minutes/seconds duration inputs (shared-label
   exception).
3. Open and migrate the remaining untouched in-scope files, in roughly
   this order (highest button/select surface first, per the original grep
   pre-scan): `AboutPage.tsx` (6 hits), `EnhancedHero.tsx` (6 hits),
   `NotFoundPage.tsx` (4 hits — check what these actually are, surprising
   for a 37-line file), `SpotifyCallbackPage.tsx` (3 hits),
   `LoginPage.tsx` (2 hits), `FeedbackButton.tsx` (2 hits, already read in
   full, just needs the `Action`/`IconAction` edit), then the 0-hit files
   (`CallToAction.tsx`, `Features.tsx`, `Footer.tsx`, `HowItWorks.tsx`,
   `Testimonials.tsx`, all of `PromoVideo/**`, `hero/HeroDashboardMockup.tsx`,
   `RouteGuards.tsx`, `SEO.tsx`, `Avatar.tsx`, `JamShortRedirect.tsx`,
   `SlugRedirect.tsx`) to confirm each one really has nothing to migrate
   and write a one-line documented-exception comment where that's the
   right outcome (most of these are likely "no interactive controls here,"
   which is a fine and fast outcome, but must be confirmed by opening the
   file, not assumed from a grep count of 0 — a 0-hit grep only proves the
   absence of DaisyUI `btn`/`select`/`modal`/`badge` classes, not the
   absence of anything migratable, e.g., a bespoke `<div role="button">`
   would not show up in that grep).
4. Check `src/workbench/stories/PageCompositions.stories.tsx` for any
   `play()` function that locates a button/control positionally or by a
   DaisyUI class name, for every component this session touched
   (DesktopUserMenu, MobileDrawer, ProfilePage, OnboardingModal,
   ShareModal, QuickEditPanel, ProfileFormSection) and for whatever the
   next agent touches in step 3.
5. Manually re-verify (read the story or run Storybook if available) that
   `src/workbench/stories/...Navbar...` or Navigation story still exercises
   `MobileDrawer` correctly given the changes in this session — this
   affects whether the `readiness.workbench: "exempt"` note on
   `MobileDrawer.tsx`/`ModalFooter.tsx` in `component-catalogue.metadata.json`
   is still accurate or needs updating (see task instructions and Traps
   below).
6. Run `npm run catalogue:generate`, then `npm run catalogue:check` — must
   report valid and up to date.
7. Update `component-catalogue.metadata.json` for anything found to be
   deprecated/legacy per task requirement #5 (grep-verify remaining
   consumers, name the replacement, follow the wording style of the
   existing Schedule entries in that file).
8. Write `docs/design-system/shared-account-marketing-migration.md` in
   ASD-STE100, covering every file's outcome, every exception, and every
   compatibility variant (so far: none new, see decision 8 above).
   `git add -f` it.
9. Re-run `npx tsc -b --force` one final time to confirm still-clean.
10. Commit (new commit, not amending), push, then open the PR per the
    task's "Finish" section, with the PR body listing every visible change
    a reviewer will notice: so far, that list includes at minimum —
    - DesktopUserMenu, MobileDrawer, ProfilePage, OnboardingModal,
      ShareModal, QuickEditPanel, ProfileFormSection: all interactive
      controls grew to the canonical 44px minimum touch target.
    - ShareModal's four share buttons changed from outlined to filled
      (`btn-outline` -> `Action variant="secondary"`).
    - ProfilePage's Edit/Cancel/Save buttons shrank from `btn-lg` to the
      standard control size (Action has no large-size variant).
    - MobileDrawer's language/theme select labels changed typography
      (uppercase tracking-wide small caption -> canonical Field label
      style).
    - ProfileFormSection's edit-mode field labels changed typography
      similarly (`label-text font-semibold` -> canonical Field label
      style).
    - Any further visible changes found while finishing the remaining
      files in step 3.
    - Story files touched: none yet in this session (I did not modify any
      `.stories.tsx` file). The next agent must add
      `PublicDashboardCards.stories.tsx` to this list once fixed (step 1),
      and any other story file touched while completing step 3-4.
    - Components with no consumers found: none identified yet — this
      needs a real check once the marketing files are visited (step 3),
      by analogy with how the Schedule/Public Dashboard migrations found
      duplicate/unconsumed card and modal families in their scope.

## Traps the next agent must know about

1. **Type trap A — `ActionProps` is a discriminated union.** `state` can be
   `'idle' | 'disabled'` with no `loadingLabel`, OR `'loading'` WITH a
   required `loadingLabel` — it is not possible to pass a computed
   `state={isLoading ? 'loading' : 'idle'}` value, because TypeScript
   cannot narrow which arm of the union applies to a runtime-computed
   string. **The fix used throughout this session: branch the JSX and
   render two separate `<Action>` elements, one hard-coded
   `state="loading" loadingLabel="..."` and one hard-coded `state="idle"`
   (or no `state` prop at all).** See `QuickEditPanel.tsx`'s Save button,
   `ProfilePage.tsx`'s Save button, `OnboardingModal.tsx`'s footer button,
   and `DesktopUserMenu.tsx`'s logout button for four working examples of
   this pattern already in the codebase from this session. Do NOT try
   `state={condition ? 'loading' : 'idle'} loadingLabel={someString}` — it
   will not compile (or if `loadingLabel` is typed optional-permissive
   somewhere it will compile but violate the intent of the type: check
   carefully, the compiler was clean for me because I always split the
   branches).

2. **Type trap B — `Field` takes exactly one child, and `Field.Select`
   does not accept `disabled`.** `Field`'s `children` type is
   `FieldControl` (singular, not an array), and `Field` itself owns
   `disabled`/`id`/`required` and clones them onto that one child — passing
   `disabled` directly to `Field.Select`/`Field.Input`/`Field.Textarea`
   will not type-check (their prop types explicitly omit `disabled`, `id`,
   `required` — see `FieldNativeProps<T> = Omit<T, 'disabled' | 'id' |
   'required'>` in `src/components/Field.tsx`). **Always put `disabled` on
   the outer `<Field disabled={...}>`, never on the inner
   `Field.Input`/`Field.Select`/`Field.Textarea`.** Also never render two
   sibling elements as `Field`'s children (e.g., an input plus a hint span)
   — put exactly one control inside `Field`, and use the `hint`/`error`
   props for any accompanying text. I hit neither of these traps because I
   was careful, but they are real and will fail `tsc -b` immediately if
   violated — this was flagged because parallel ticket #51 hit both.

3. **Positional-query story trap (already diagnosed, not yet fixed).**
   `src/workbench/stories/PublicDashboardCards.stories.tsx:39-40` uses
   `getAllByRole('button')` then indexes `buttons[0]`/`buttons[1]`. The
   canonical `OverflowMenu` (Navigation.tsx) renders its items with
   `role="menuitem"`, not `role="button"`, so if any component in this
   story was migrated onto `OverflowMenu`, `getAllByRole('button')` will
   silently return a different, shorter list and the indices will point at
   the wrong controls. Fix by querying with an explicit role AND accessible
   name instead, e.g.:
   ```ts
   const toggle = canvas.getByRole('button', { name: /fullscreen|pantalla|tela cheia/i })
   ```
   Cover all three locales (en/es/pt) in the regex. I did NOT touch this
   file or its test in this session — it is still broken and was already
   broken before I started (this is the same bug that failed PR #90's CI,
   per the task description). Fix it as step 1 of the remaining work.

4. **Two different `Navbar.tsx` files exist.** `src/components/Navbar.tsx`
   (mine, in scope, already migrated in this session) is the app shell
   navbar. `src/components/publicDashboard/Navbar.tsx` is a DIFFERENT,
   already-migrated, OFF-LIMITS file for the Public Dashboard's settings
   drawer. Do not confuse them. I did not touch
   `publicDashboard/Navbar.tsx`.

5. **`MobileDrawer.tsx`/`ModalFooter.tsx` catalogue-exempt status depends
   on indirect Navbar story coverage.** `component-catalogue.metadata.json`
   marks both as `readiness.workbench: "exempt"` because they are only
   inspected through `Navbar.tsx` in a Navigation/Responsive-navbar story
   (I did not identify the exact story file name — search for it; it may
   or may not be `PageCompositions.stories.tsx`). Since I migrated
   `MobileDrawer.tsx`'s internals (buttons, selects, links) in this
   session, the next agent MUST verify that story still renders/exercises
   `MobileDrawer` correctly (open the drawer, see the migrated controls)
   before treating this file as fully done. If the indirect coverage is
   broken, either fix the story or update the catalogue note to match
   reality, per the task's explicit instruction. I did NOT verify this — I
   do not have proof either way.

6. **`docs/` is gitignored.** Any new file under `docs/design-system/`
   (the migration doc, and the regenerated `component-catalogue.json`/`.md`)
   needs `git add -f <path>` or it will silently not be committed and will
   look like it "vanished" on the next `git status`. I have not created the
   migration doc yet, so this has not bitten me yet, but it WILL bite the
   next agent if they forget the `-f`.

7. **`ProfileFormSection.tsx`'s `readOnly` field prop is dead code, not a
   bug I introduced.** The `FormField` interface has a `readOnly: boolean`
   field that `ProfilePage.tsx` populates per-field (e.g., the `email`
   field always passes `readOnly: true`), but the actual render logic in
   `ProfileFormSection.tsx` branches ONLY on the component-level
   `isEditMode` prop, never on the per-field `readOnly` value. This was
   already true before my changes — I preserved this exact (possibly
   unintended) behavior rather than "fixing" it, since fixing it would
   change which fields are editable in edit mode (a functional change out
   of scope for a behavior-preserving migration). Flag this to the user as
   a possible pre-existing bug, but do not fix it as part of #50.

8. **The `worktree` branch name is not the feature branch.** The worktree's
   own git branch is `worktree-agent-adf7fcd4b9b7a2e20`; I created
   `feat/migrate-shared-account-marketing-50` as a new branch FROM that
   point and am committing there, per the task's explicit "Finish" section.
   Make sure future commits stay on `feat/migrate-shared-account-marketing-50`
   in this same worktree directory, not back on the auto-generated worktree
   branch.

## Things I could not verify

- Whether `PageCompositions.stories.tsx` or any other workbench story
  breaks because of the components I migrated (DesktopUserMenu,
  MobileDrawer, Navbar comments, ProfilePage, OnboardingModal, ShareModal,
  QuickEditPanel, ProfileFormSection, FeedbackModal). I did not run
  Storybook, the workbench test suite, or any test runner at all this
  session — only `tsc -b --force` and `catalogue:check`, per the explicit
  verification instructions in the task ("Do NOT run the full test suite
  or lint gates - PR CI covers those").
- Whether the indirect MobileDrawer/ModalFooter workbench coverage (trap 5
  above) still holds.
- Whether any of the 0-grep-hit files actually have zero migratable
  content, or whether the grep pre-scan simply missed a bespoke pattern
  (e.g., `role="button"` divs, or inline `<a className="...">` styled like
  a button without the literal string `btn`).
- Whether `EnhancedHero.tsx`, `AboutPage.tsx`, or any marketing file
  duplicates functionality with another in- or out-of-scope component
  (the kind of "required decision" the Public Dashboard and Schedule
  migration docs each had five of) — I never got far enough to check.
- The exact commit SHA of this handoff commit (see top of file — check
  `git log -1 --format=%H` after this commit is made).
