# Shared, account and marketing migration

Language: ASD-STE100 Simplified Technical English

Exempt from the language rule: code blocks, inline code, file paths,
identifiers and table cells that quote a class name or a prop name.

This is the decision record for issue #50. The issue moves the shared
chrome, the account screens, the static pages and the marketing sections
onto the canonical design-system families. The work is incremental. To keep
a hand-rolled pattern is a correct result when a canonical primitive cannot
hold the same behaviour or the same shape.

## Definitions and abbreviations

| Term | Meaning |
| --- | --- |
| Canonical family | The design-system components in `Action.tsx`, `Field.tsx`, `Navigation.tsx`, `FeedbackStates.tsx`, `data-display/` and `overlays/`. |
| Forced visible change | A change in look that the canonical primitive causes. The team did not choose it. |
| Documented exception | A file that keeps a hand-rolled pattern. The file holds a comment with the reason. |
| Legacy modal | `src/components/Modal.tsx`, the older overlay, not the canonical `OverlayModal`. |

## What moved

| File | Legacy pattern | Canonical replacement |
| --- | --- | --- |
| `Navbar.tsx` | Already canonical before this issue | No code change. Three exception comments added |
| `CallToAction.tsx`, `EnhancedHero.tsx` | Router `Link` elements with legacy button classes | `NavigationLink` with the opt-in `primary`/`secondary` destination variants and router-preserving click handling |
| `MobileDrawer.tsx` | `btn btn-ghost` close button; `btn btn-primary` register anchor; `menu` links; two `label` plus `select select-bordered` rows; logout `btn` | `IconAction`; `Action variant="primary"`; `NavigationLink`; `Field` plus `Field.Select`; `Action variant="quiet"` |
| `DesktopUserMenu.tsx` | `btn btn-ghost` trigger, profile and logout buttons | `Action variant="quiet"` |
| `QuickEditPanel.tsx` | `input input-bordered` and `textarea` fields; `select select-bordered` genre; `btn` steppers; cancel and save `btn` | `Field` plus `Field.Input`, `Field.Textarea` and `Field.Select`; `IconAction variant="quiet"`; `Action` |
| `ProfileFormSection.tsx` | Edit-mode `label` plus control pairs | `Field` plus `Field.Select`, `Field.Textarea` and `Field.Input` |
| `OnboardingModal.tsx` | Four `label` plus control pairs; `btn btn-primary` submit | `Field` plus `Field.Input` and `Field.Select`; `Action variant="primary"` |
| `ShareModal.tsx` | Four `btn btn-outline` share buttons; `alert alert-success` and `alert-info` toast | `Action variant="secondary"`; `Status` with `tone="success"` and `tone="info"` |
| `FeedbackModal.tsx` | Comment `textarea` | `Field` plus `Field.Textarea`, with `hint` wired to the character count |
| `FeedbackButton.tsx` | One `btn btn-ghost` with a conditional label | `IconAction variant="quiet"` when `iconOnly` is true, `Action variant="quiet"` when it is false |
| `Footer.tsx` | Five `link link-hover` router links | `NavigationLink` inside the same `nav` element |
| `LoginPage.tsx` | One `link link-hover text-primary` back-to-home anchor | `NavigationLink` |
| `ProfilePage.tsx` | Edit, cancel and save `btn btn-lg` | `Action` with `primary` and `quiet` variants |
| `SpotifyCallbackPage.tsx` | `card` error panel plus `btn btn-primary` retry; `loading loading-spinner loading-lg` plus caption | `ErrorState` with a recovery `action`; `LoadingState` |
| `PublicDashboardCards.stories.tsx` | `getAllByRole('button')` with index `0` and `1` | `getByRole('button', { name })` with an en, es and pt regular expression |

Every `onClick` handler, every disabled guard and every loading guard stays
the same. Every visible string keeps its existing `t(...)` key. The
migration adds no locale key.

## Forced visible changes

A reviewer sees these changes. The canonical primitives cause them.

1. All migrated controls grow to the canonical 44px minimum touch target.
   This applies to `DesktopUserMenu`, `MobileDrawer`, `ProfilePage`,
   `OnboardingModal`, `ShareModal`, `QuickEditPanel`, `ProfileFormSection`
   and `FeedbackButton`.
2. The four `ShareModal` share buttons change from an outline to a filled
   look. `Action` has `primary`, `secondary`, `quiet` and `destructive`
   only. It has no border-only variant. This is the same trade-off that
   `docs/design-system/schedule-registration-migration.md` records for
   `RegistrationList` and `HostMusicianRegistrationModal`.
3. The `ProfilePage` edit, cancel and save buttons become smaller. They
   lose the `btn-lg` size, because `Action` has no size variant. To add a
   size prop to `Action` is a design-system change. It belongs to issue
   #55 or issue #58.
4. The `MobileDrawer` language and theme labels change their typography.
   They move from a small uppercase caption with wide letter spacing to the
   canonical `Field` label style.
5. The `ProfileFormSection` edit-mode labels change their typography in the
   same way. They move from `label-text font-semibold` to the canonical
   `Field` label style.
6. The five `Footer` links become taller. `NavigationLink` keeps a 44px
   touch target and shows a tinted background on hover. The old links were
   small text with an underline on hover. The footer row now wraps at a
   smaller width on a phone.
7. The `LoginPage` back-to-home link changes in the same way as the footer
   links.
8. The `SpotifyCallbackPage` error panel loses its `card` container. The
   canonical `ErrorState` shows a marker glyph, a title, a description and
   the recovery button in one panel. The heading is no longer a `card-title`
   in the error colour.
9. The `SpotifyCallbackPage` progress view changes from a large spinner
   above a caption to the canonical inline row. The spinner also loses the
   `loading-lg` size.
10. The `FeedbackButton` icon-only form becomes a square icon control.
    `IconAction` applies the `ds-action--icon-only` shape.
11. The active marketing CTAs keep native anchor semantics and modifier-click
    behavior while adopting the design-system primary/secondary destination
    emphasis. They no longer depend on legacy DaisyUI button classes.

## Documented exceptions

Each file below holds a comment with this reason.

### Anchors that must stay anchors

`Action` renders a `button` element only. It cannot hold a destination.
`NavigationLink` renders an anchor and now has opt-in `primary` and
`secondary` destination variants. These variants keep the native `href`,
modifier-click behavior, and browser context-menu affordances while applying
semantic destination emphasis, so the active marketing CTAs moved to the
canonical primitive in issue #58.

| File | Control |
| --- | --- |
| `Navbar.tsx` | The logo anchor and the register anchor |
| `NotFoundPage.tsx` | The go-home and browse-jams pair |
| `AboutPage.tsx` | The `mailto:` contact anchor and the two page-end links |
| `DesktopUserMenu.tsx` | The login anchor, which uses the `ds-menu__item` class from `Navigation.css` |

A quiet text link is a different case. `Footer.tsx` and `LoginPage.tsx` use
quiet links that are destinations, so they moved to `NavigationLink`. A
destination with call-to-action emphasis now also uses `NavigationLink` with
an explicit variant; the remaining anchors in the table have mailto or
page-specific behavior that is outside the shared navigation migration.

### Placeholders with a specific shape

The canonical `Skeleton` primitive renders uniform full-width lines. It
cannot reproduce a circle, a stats grid, a label-and-control pair or a tall
content block. To substitute it changes the loading silhouette, so these
placeholders stay hand-rolled:

- `Navbar.tsx`, the pill and avatar row
- `DesktopUserMenu.tsx`, the avatar pulse
- `PageHeaderSkeleton.tsx`, the full header
- `ProfilePage.tsx`, the full page
- `LoginPage.tsx`, the full form
- `RouteGuards.tsx`, the page-shaped block
- `JamShortRedirect.tsx` and `SlugRedirect.tsx`, the circle and bar

`FullPageSpinner.tsx` stays hand-rolled for a different reason.
`LoadingState` needs a label and always renders a live region. The
`FullPageSpinner` label is optional, and `src/App.tsx` renders it with no
label during the first application boot.

### Controls that `Field` cannot hold

`Field` renders one visible label and wraps exactly one control.

- `DesktopUserMenu.tsx`: the language and theme selects show an icon and an
  `aria-label` only. A `Field` adds visible label text and makes the
  compact row taller.
- `QuickEditPanel.tsx`: one visible "Duration" label is shared by the
  minutes input and the seconds input. Each input keeps its own
  `aria-label`.
- `FeedbackModal.tsx`: the rating is five radio inputs that form one
  widget.
- `ProfileFormSection.tsx`: the view mode shows a static value. It has no
  editable control.

### Legacy modal chrome

`OnboardingModal.tsx` and `ShareModal.tsx` keep `src/components/Modal.tsx`
as the wrapper. Many files outside this issue use `Modal.tsx`, for example
`ConfirmDialog.tsx`, `MusicModal.tsx`, `MusicianProfileModal.tsx`,
`EditMusicianModal.tsx`, `ProfileSetupModal.tsx`, `SpotifyExportModal.tsx`,
`SpotifyImportModal.tsx`, `schedule/ScheduleEnrollmentModal.tsx`,
`schedule/HostMusicianRegistrationModal.tsx` and three files in
`jam-detail-v2/`. To move two of these usages to `OverlayModal` forks the
overlay implementation. The precedent in
`docs/design-system/schedule-registration-migration.md`, section "Modal
chrome", keeps the existing overlays until a workflow-by-workflow review.
Only the contents of the two modals moved.

### Files with no control to migrate

Each file below was opened and read. None holds a button, a link or a form
control, so no canonical family applies. A grep count of zero was not
enough evidence, so each file carries a short comment with the result.

- `SEO.tsx`: `Helmet` document metadata only
- `HowItWorks.tsx`: headings, numbered step cards and icons
- `Testimonials.tsx`: static quotations and attributions
- `hero/HeroDashboardMockup.tsx`: a decorative illustration
- `Features.tsx`: three static feature cards
- `Avatar.tsx`: a circle with initials or an image
- `PageAlerts.tsx`: a thin wrapper around `Alert.tsx`, which is outside this
  issue

`Avatar.tsx` is itself a primitive. The data-display family has `Badge`,
`StatusIndicator`, `DataCard`, `ListRow` and `CompactMetadata`, but it has
no avatar primitive. So there is nothing canonical to move onto.

## Lifecycle results

Issue #27 asks each sibling migration to resolve the duplicate and
unconsumed candidates in its own scope. These are the results. Each count
comes from a grep across `src/`.

| Component | Old lifecycle | New lifecycle | Reason |
| --- | --- | --- | --- |
| `Features.tsx` | `uncertain` | `legacy` | Zero consumers. `HowItWorks.tsx` carries the landing-page feature presentation that `src/App.tsx` renders |
| `RouteGuards.tsx` | `uncertain` | `uncertain` | The audit is complete: no route uses a guard. Nothing supersedes the family, so it is not deprecated |
| `PageHeaderSkeleton.tsx` | `uncertain` | `uncertain` | Only `src/components/index.ts` re-exports it. Nothing supersedes it, because `Skeleton` cannot hold the shape |
| `PromoVideo/**` | Ignored | Ignored | Seven files, six of them empty. Zero consumers. The catalogue already lists all seven under `ignored`. Replacement: `hero/HeroDashboardMockup.tsx` |

`src/components/MobileDrawer.tsx` and `src/components/ModalFooter.tsx` keep
`readiness.workbench: "exempt"`. The `MobileDrawer` note named the wrong
story, so the note now names the real one: story
`MobileHostKeyboardDismissal` in
`src/workbench/stories/Navigation/Navbar.stories.tsx`, title
`Navigation/Application navigation`. That story opens the drawer, reads the
dialog role and name, and waits for focus on the close control. The
migrated close control is an `IconAction` that keeps the `nav.close_menu`
accessible name and receives the forwarded `ref`, so the indirect coverage
still holds.

## Compatibility variants

Issue #50 added no compatibility variant. Issue #58 adds the opt-in
`primary`/`secondary` destination variants to `NavigationLink`; these are
visual-only and do not change its native anchor behavior. `Action.tsx`,
`Field.tsx` and `FeedbackStates.tsx` remain unchanged.

## Story queries

`src/workbench/stories/PublicDashboardCards.stories.tsx` used
`getAllByRole('button')` and then read index `0` and index `1`. Canonical
navigation primitives can render `role="menuitem"` instead of
`role="button"`. A positional query then points at the wrong control
without an error. The story now queries by role and accessible name, with a
regular expression that covers the en, es and pt labels. This defect broke
continuous integration on pull request #90.

The other stories that render the migrated files were read and need no
change:

- `PageCompositions.stories.tsx` and `Marketing.stories.tsx` have no
  `play()` function.
- `RemainingUI.stories.tsx` reads the feedback control by accessible name.
  The migrated `Action` keeps the same `aria-label`.
- `Navigation/Navbar.stories.tsx` reads every control by accessible name.

## Known defect, not fixed here

`ProfileFormSection.tsx` declares a per-field `readOnly` flag. The render
logic reads the component-level `isEditMode` prop only, so the per-field
flag has no effect. `ProfilePage.tsx` sets `readOnly: true` for the email
field, and that field stays editable in edit mode. This defect is older
than this issue. To correct it changes which fields a user can edit, so it
is outside a behaviour-preserving migration. Report it as a separate issue.
