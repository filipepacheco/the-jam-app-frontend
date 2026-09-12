# Handoff: issue #51 "Migrate and reconcile Jam and Music UI"

Language: ASD-STE100 Simplified Technical English

Branch: `feat/migrate-jam-music-51`
Worktree: `.claude/worktrees/agent-a8b265f0ec8203f54`

This file was the resume point for a second session. That session completed the
migration. This version records the final state. Code blocks, file paths, and
identifiers are exempt from the language rule.

## State: complete

All items in the previous checklist are done. Both verification gates pass:

- `npx tsc -b --force` exits 0 with no output.
- `npm run catalogue:generate`, then `npm run catalogue:check` reports
  `Component catalogue is valid and up to date.`

The full decision record is `docs/design-system/jam-music-migration.md`. That
file is the reference for each migration, each exception, and each duplicate
decision. The `docs/` directory is in `.gitignore`, so the file was staged with
`git add -f`.

## Work done in session 1 (commit `bdd1210`)

`MusicCard.tsx`, `MusicTable.tsx`, `MusicFilters.tsx`, `MusicModal.tsx`,
`MusicModalFormFields.tsx`, `MusicEmptyState.tsx`, `MusicianProfileModal.tsx`,
`EditMusicianModal.tsx`, `SpotifyExportModal.tsx`, `SpotifyImportModal.tsx`.

## Work done in session 2 (uncommitted or in the new commit)

| File | Change |
| --- | --- |
| `src/components/JamCard.tsx` | Status badge to `Badge` with a local tone map; anchor-exception comment |
| `src/components/JamContextDisplay.tsx` | Status badge to `Badge`; raw status value replaced by `getJamStatusLabel` |
| `src/components/MusicCard.tsx` | Genre badge to `Badge` |
| `src/components/MusicTable.tsx` | Genre badge to `Badge` |
| `src/components/SpotifyPreview.tsx` | Anchor-exception comments only |
| `src/pages/JamRegisterPage.tsx` | Two buttons to `Action` |
| `src/pages/BrowseJamsPage.tsx` | Search and sort to `Field`; tab strip to `NavigationTabs`; clear filters to `Action`; three badges to `Badge` |
| `src/pages/MusicPage.tsx` | Header buttons to `Action`; bespoke `<dialog>` to `OverlayModal`; review-modal controls to `Action`, `Badge`, `LoadingState`, `EmptyState` |
| `src/pages/tabs/JamDetailPageV2.tsx` | Sticky banners to `Status`; back and share to `IconAction`; location popover to `DropdownMenu`; two buttons to `Action` |
| `src/components/jam-detail-v2/PerformanceSelectionModal.tsx` | Footer to `Action`; badges to `Badge`; empty block to `CanonicalEmptyState` |
| `src/components/jam-detail-v2/SuggestSongModal.tsx` | Spinner to `LoadingState`; one button to `Action` |
| `src/components/jam-detail-v2/SuggestNewSongModal.tsx` | Footer and import buttons to `Action` pairs; Spotify URL to `Field`; success text to `FormSubmissionFeedback` |
| `src/components/jam-detail-v2/TimelineItem.tsx` | Badges to `Badge`; register button to `Action` |
| `src/components/jam-detail-v2/TimelineShowcase.tsx` | Empty state to `CanonicalEmptyState` |
| `src/components/jam-detail-v2/TimelineItemV2Waveform.tsx` | Three register buttons to `Action`; card exception comment |
| `src/components/jam-detail-v2/TimelineShowcaseV2Waveform.tsx` | Filter pills to `Action` with `aria-pressed`; empty state to `CanonicalEmptyState` |
| `src/components/jam-detail-v2/CollapsibleSection.tsx` | Count badge to `Badge` only |
| `component-catalogue.metadata.json` | Legacy lifecycle entries for six components |
| `src/workbench/jamMusicFixtures.ts` | Dropped the `ui.0043` coverage record |
| `src/workbench/stories/JamTimeline.stories.tsx` | Replaced a `btn-primary` class assertion |
| `src/locales/{en,pt,es}.json` | Added the `musician_profile.loading` key |
| `docs/design-system/jam-music-migration.md` | New decision record |

## Files kept unmigrated on purpose

`DualActionFAB.tsx`, `FloatingRegisterButton.tsx`, `FloatingSuggestButton.tsx`,
`CanvasWaveform.tsx`, `CollapsibleSidebar.tsx`, `JamCardSkeleton.tsx`,
`JamDetailLoadingSkeleton.tsx`, the `MusicPage.tsx` pagination controls, and the
`CollapsibleSection.tsx` toggle. Each reason is in the migration document.

## Traps that stay true

1. `ActionProps` is a discriminated union. A loading button and an idle button
   must be two separate `<Action>` elements.
2. `Field` wraps exactly one control and always renders a label element. Use an
   `sr-only` span inside the label when the design has no visible label.
3. `docs/` is in `.gitignore`. New files there need `git add -f`.
4. Story `play()` functions must not query controls by position or by DaisyUI
   class. `JamTimeline.stories.tsx` failed on `toHaveClass('btn-primary')`
   after the filter pills moved to `Action`; it now asserts `aria-pressed` and
   `data-action-variant`. The `buttons.at(-2)` query in
   `JamComponents.stories.tsx` is still valid only because `DualActionFAB` is
   unchanged.

## Not verified in this environment

- Storybook interaction tests did not run. Each story-safety statement comes
  from source reading. The one story assertion that was certain to fail was
  found and fixed.
- The full test suite and the lint gates did not run. The user limited
  verification to `tsc` and the catalogue check. PR CI covers the rest.
- The visual result of each forced visible change was not seen in a browser.
