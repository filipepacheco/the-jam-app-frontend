# Handoff: issue #50 "Migrate shared account marketing and page UI"

Status: CODE WORK COMPLETE, NOT COMMITTED. Every in-scope file has been
opened and resolved. Both verification gates pass. The changes sit in the
worktree as uncommitted modifications plus one force-added file.

This file is a working document for a human or a next agent, so it is plain
English, not ASD-STE100.

## Branch and worktree

- Worktree:
  `/Users/e160069/WebstormProjects/the-jam-app-frontend/.claude/worktrees/agent-adf7fcd4b9b7a2e20`
- Branch: `feat/migrate-shared-account-marketing-50`
- Base commit on this branch: `52fb4b0 wip(shared): partial migration onto
  canonical families` (the previous agent's WIP commit).
- The second session's work is UNCOMMITTED on top of `52fb4b0`. Do not
  amend `52fb4b0`; make a new commit.
- No PR opened.

## Why it is not committed

The second session was told mid-task, through the coordinating agent, that
the user had reversed the original "do not commit, do not push, do not open
a PR" instruction. That reversal arrived as an agent message, not from the
user directly, and the user's own global `~/.claude/CLAUDE.md` contains a
standing rule: "Never commit, never push, never open PRs. Make the file
changes and stop." The session therefore stopped at the file changes and
surfaced the conflict instead of publishing.

If the user confirms directly, the remaining steps are:

1. `git add -A` (the migration doc is already staged with `git add -f`).
2. New commit on `feat/migrate-shared-account-marketing-50`, no
   `Co-Authored-By` trailer.
3. `git push -u origin feat/migrate-shared-account-marketing-50`.
4. Open a PR against `main`. Use the "Forced visible changes" section of
   `docs/design-system/shared-account-marketing-migration.md` verbatim as
   the reviewer-facing list. End the PR body with the attribution line the
   user specified.

## File scope (unchanged from the original task)

### YOUR FILE SCOPE

- Marketing: `src/components/CallToAction.tsx`, `Features.tsx`,
  `Footer.tsx`, `HowItWorks.tsx`, `Testimonials.tsx`, `EnhancedHero.tsx`,
  `src/components/PromoVideo/**`, `src/components/hero/**`
- Shared chrome and account: `src/components/Navbar.tsx`,
  `MobileDrawer.tsx`, `DesktopUserMenu.tsx`, `RouteGuards.tsx`, `SEO.tsx`,
  `PageAlerts.tsx`, `PageHeaderSkeleton.tsx`, `QuickEditPanel.tsx`,
  `ProfileFormSection.tsx`, `OnboardingModal.tsx`, `ShareModal.tsx`,
  `FeedbackButton.tsx`, `FeedbackModal.tsx`, `Avatar.tsx`,
  `FullPageSpinner.tsx`
- Pages: `src/pages/AboutPage.tsx`, `LoginPage.tsx`, `NotFoundPage.tsx`,
  `ProfilePage.tsx`, `SpotifyCallbackPage.tsx`, `JamShortRedirect.tsx`,
  `SlugRedirect.tsx`
- `src/workbench/stories/PageCompositions.stories.tsx`,
  `src/workbench/stories/PublicDashboardCards.stories.tsx`

### EXPLICITLY OFF LIMITS (other tickets own these)

- `src/components/jam-detail-v2/**`, `src/components/music/**`
- `src/components/` root: `JamCard.tsx`, `JamCardSkeleton.tsx`,
  `JamContextDisplay.tsx`, `MusicCard.tsx`, `MusicEmptyState.tsx`,
  `MusicFilters.tsx`, `MusicModal.tsx`, `MusicModalFormFields.tsx`,
  `MusicTable.tsx`, `MusicianProfileModal.tsx`, `EditMusicianModal.tsx`,
  `SpotifyExportModal.tsx`, `SpotifyImportModal.tsx`, `SpotifyPreview.tsx`
- `src/pages/MusicPage.tsx`, `src/pages/BrowseJamsPage.tsx`,
  `src/pages/JamRegisterPage.tsx`
- `src/pages/host/**` (issue #57), `src/pages/tabs/**`
- `src/components/dj-control/**`, `src/components/publicDashboard/**`,
  `src/components/schedule/**` (already migrated)
- `src/workbench/stories/JamComponents.stories.tsx`

Nothing outside the scope list was edited in either session. No off-limits
file was edited. Note that `src/components/publicDashboard/Header.tsx` was
READ (to find the accessible names the story fix needs) but not modified.

Two different `Navbar.tsx` files exist. `src/components/Navbar.tsx` is ours.
`src/components/publicDashboard/Navbar.tsx` is off limits and untouched.

## Status table: every in-scope file

| File | Status |
| --- | --- |
| `CallToAction.tsx` | Done. Documented exception: the two CTA router `Link`s keep their `btn` classes |
| `Features.tsx` | Done. No controls. Catalogue lifecycle moved `uncertain` -> `legacy`, replacement named |
| `Footer.tsx` | Done. Migrated: five `link link-hover` router links -> `NavigationLink` with `useNavigate` interception; `/privacy.html` is a plain `NavigationLink` anchor |
| `HowItWorks.tsx` | Done. No controls. Review comment added |
| `Testimonials.tsx` | Done. No controls. Review comment added |
| `EnhancedHero.tsx` | Done. Documented exception: the hero CTA pair keeps its `btn btn-lg` classes |
| `PromoVideo/**` | Done. Six empty scene files plus a deprecated barrel, zero consumers. Already in the catalogue `ignored` list, so no lifecycle change. Audit note added to `index.tsx` |
| `hero/HeroDashboardMockup.tsx` | Done. No controls. Review comment added |
| `Navbar.tsx` | Done in session 1. Already canonical; three exception comments only |
| `MobileDrawer.tsx` | Done in session 1. Workbench coverage RE-VERIFIED in session 2, see below |
| `DesktopUserMenu.tsx` | Done in session 1, three documented exceptions |
| `RouteGuards.tsx` | Done. Skeleton exception comment plus a full route audit (no route uses any guard). Catalogue note rewritten |
| `SEO.tsx` | Done. `Helmet` metadata only, no UI. Review comment added |
| `PageAlerts.tsx` | Done. Thin wrapper around out-of-scope `Alert.tsx`; nothing to migrate. Recorded in the migration doc |
| `PageHeaderSkeleton.tsx` | Done. Skeleton exception comment added. Catalogue note sharpened |
| `QuickEditPanel.tsx` | Done in session 1. Session 2 added the missing shared-label exception comment on the duration inputs |
| `ProfileFormSection.tsx` | Done in session 1 |
| `OnboardingModal.tsx` | Done in session 1 |
| `ShareModal.tsx` | Done in session 1 |
| `FeedbackButton.tsx` | Done. Migrated: `btn btn-ghost` -> `IconAction variant="quiet"` when `iconOnly`, `Action variant="quiet"` otherwise |
| `FeedbackModal.tsx` | Done in session 1 |
| `Avatar.tsx` | Done. No canonical avatar primitive exists; it stays the app's own primitive. Comment added |
| `FullPageSpinner.tsx` | Done in session 1, documented exception |
| `AboutPage.tsx` | Done. Documented exceptions on the `mailto:` anchor and the two page-end CTA links |
| `LoginPage.tsx` | Done. Migrated the back-to-home link -> `NavigationLink`; skeleton exception comment added |
| `NotFoundPage.tsx` | Done. Documented exception on the two recovery CTA links |
| `ProfilePage.tsx` | Done in session 1. Session 2 added the missing skeleton exception comment |
| `SpotifyCallbackPage.tsx` | Done. Migrated: error card -> `ErrorState` with a recovery action; spinner -> `LoadingState` |
| `JamShortRedirect.tsx` | Done. Skeleton exception comment |
| `SlugRedirect.tsx` | Done. Skeleton exception comment |
| `PageCompositions.stories.tsx` | Done. Read in full: no `play()` function anywhere, so no positional-query risk. No change needed |
| `PublicDashboardCards.stories.tsx` | Done. The known `getAllByRole('button')[0]/[1]` defect is fixed |

## Decisions (do not redo)

Sessions 1 and 2 both recorded their reasoning in
`docs/design-system/shared-account-marketing-migration.md`. Read that file
first. The short list:

1. `DesktopUserMenu` keeps its DaisyUI `dropdown dropdown-end` wrapper. The
   canonical `DropdownMenu` cannot be closed from outside, and this
   component blurs itself before an in-app navigation.
2. `DesktopUserMenu`'s login anchor uses the global `ds-menu__item` class.
3. Compact icon-plus-select rows stay hand-rolled: `Field` always renders a
   visible label. `MobileDrawer`'s equivalents DID migrate, because they
   already had a visible label. The deciding factor is "does a visible
   label already exist", not "is it a select".
4. `btn-outline` becomes `Action variant="secondary"`.
5. `Modal.tsx` stays the wrapper for `OnboardingModal` and `ShareModal`.
6. Composite multi-input widgets (the star rating, the shared-label
   duration pair) stay hand-rolled.
7. Skeletons with a non-uniform shape stay hand-rolled.
8. No new compatibility variant was introduced anywhere.
9. NEW in session 2, the anchor rule: a QUIET destination link moves to
   `NavigationLink` (`Footer`, `LoginPage`). A destination that needs
   call-to-action emphasis stays an anchor with `btn` classes and a
   documented comment (`CallToAction`, `EnhancedHero`, `NotFoundPage`,
   `AboutPage`, `Navbar`). `Action` is button-only and `NavigationLink` has
   no emphasis variant; adding one is issue #58's decision.

## Verification, current state

### `npx tsc -b --force`

Exit code 0, zero output. Run after all edits.

### `npm run catalogue:generate` then `npm run catalogue:check`

Both run. `catalogue:check` output, verbatim:

```
> karaoke-jam-frontend@0.0.0 catalogue:check
> tsx scripts/component-catalogue/cli.ts --config component-catalogue.config.json --check

Component catalogue is valid and up to date.
```

### Not run, on the user's explicit instruction

The full test suite, the lint gates, Storybook itself. PR CI covers those.

## Traps that still matter

1. `ActionProps` is a discriminated union. A loading-vs-idle button must be
   two separate `<Action>` elements, never one element with a computed
   `state` prop.
2. `Field` takes exactly one child, and `disabled`/`id`/`required` go on
   the outer `<Field>`, never on `Field.Input`/`Select`/`Textarea`.
3. Workbench `play()` functions must query by role AND accessible name.
   Positional `getAllByRole('button')[n]` breaks against canonical
   `role="menuitem"` markup. This defect failed PR #90's CI.
4. `docs/` is gitignored. `docs/design-system/shared-account-marketing-migration.md`
   is ALREADY staged with `git add -f`. Do not lose that staging: a bare
   `git add -A` will not re-add it if it is ever unstaged.
   `component-catalogue.json` and `component-catalogue.md` under `docs/`
   are already tracked, so they show up normally.
5. `ProfileFormSection.tsx`'s per-field `readOnly` prop is dead code. The
   render logic only reads the component-level `isEditMode`. Pre-existing,
   deliberately NOT fixed here. Report it as its own issue.

## Resolved since the last handoff

- `PageCompositions.stories.tsx` was read in full. It has no `play()`
  function, so no story assertion could break. Same for
  `Marketing.stories.tsx`.
- The `MobileDrawer` indirect workbench coverage was found and checked. It
  is story `MobileHostKeyboardDismissal` in
  `src/workbench/stories/Navigation/Navbar.stories.tsx`, title
  `Navigation/Application navigation`. It asserts the dialog role and name,
  focus on the close control, and Escape dismissal. The migrated close
  control is an `IconAction` with `label={t('nav.close_menu')}` and a
  forwarded `ref`, so all four assertions still hold. `readiness.workbench:
  "exempt"` is still correct; only the story NAME in the catalogue note was
  stale and it is now fixed.
- Every zero-grep-hit file was opened. None hid a bespoke control.
- The duplicate-family question is answered: `Features.tsx` is the
  unconsumed duplicate (superseded by `HowItWorks.tsx`), and `PromoVideo/**`
  is the retired family (superseded by `hero/HeroDashboardMockup.tsx`).

## Still unverified

- No browser or Storybook run happened in either session. The forced
  visible changes in the migration doc are derived from reading the
  primitives' CSS, not from a screenshot. A reviewer should look at the
  footer, the login page and the Spotify callback page in particular.
- The `Footer` migration is the largest visual change and it appears on
  every page. If the taller 44px link row is unwanted, revert
  `src/components/Footer.tsx` alone and move it to the exception list; the
  rest of the migration does not depend on it.
