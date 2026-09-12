# DJ control migration and reconciliation

This records the structural migration of the DJ control consumers onto the
canonical design-system primitives (issue #53), and the explicit decisions
required by that ticket. It does not change DJ control visual design; it
reconciles legacy DaisyUI classes onto `Action`, `IconAction`, `DataCard`,
`Badge`, `StatusIndicator`, and `ErrorState`.

## What moved

| File | Legacy pattern | Canonical replacement |
| --- | --- | --- |
| `PlaybackControls.tsx` | `btn btn-sm`/`btn-md`, `btn-success`/`btn-warning`/`btn-secondary`/`btn-primary` transport buttons; `Alert` with `alert-sm` | `Action` (`primary`/`secondary` variants); `ErrorState` with a quiet dismiss action |
| `QueueStats.tsx` | `card`/`card-body`; `badge badge-lg badge-primary`; five `btn-xs sm:btn-sm` buttons; `Alert` with `alert-sm` | `DataCard`; `Badge`; `Action` (`primary`/`secondary`/`destructive`); `ErrorState` |
| `NowPlayingBar.tsx` | `badge badge-xs badge-success/warning/neutral` carrying status through color | `StatusIndicator` with `live`/`pending`/`offline` convenience tones, required visible label |
| `SongQueueTimeline.tsx` (`SongRow`) | `btn btn-xs btn-success` (approve); `btn btn-xs btn-ghost` (remove, icon-only) | `Action` (`primary`) for approve; `IconAction` (`quiet`) for remove, with the accessible name moved from `title` into `label` |
| `TimelineSongItem.tsx` | `btn btn-xs btn-ghost btn-outline text-error` (remove, with visible text) | `Action` (`quiet`) |
| `CompactStats.tsx` | Plain divs | Kept as plain divs; see decision 4 |

Every `onClick`, `disabled`/busy guard, loading flag, and rapid-operation guard
(the `actionLoading` state that blocks a second submit while a request is in
flight) is unchanged. Every user-visible string keeps its existing `t(...)`
key and fallback; no new copy was introduced.

## Forced visible changes

The canonical `Action` family exposes only `primary`/`secondary`/`quiet`/
`destructive` and a fixed 44px touch target. The following changes are a
direct, unavoidable consequence of adopting it, not an intentional redesign:

1. **Touch target size.** Every migrated button (`btn-xs`, `btn-sm`, `btn-md`)
   now renders at the canonical 44px minimum height. Several buttons already
   had manual `min-h-[44px]` overrides for this reason; those are now
   redundant and covered by the primitive itself.
2. **Color semantics beyond primary/secondary/destructive.** The legacy
   `btn-success` (start, resume, approve) and `btn-warning` (pause) tones have
   no canonical equivalent. They now render as `primary` (start, resume,
   approve) or `secondary` (pause). The stop action's `btn-error` maps
   cleanly onto `destructive`.
3. **Remove-button color.** `TimelineSongItem` and the timeline's `SongRow`
   used a transparent, red-tinted "ghost" remove button
   (`btn-ghost btn-outline text-error` / `btn-ghost text-error/50`). The
   canonical family only contrasts a fully transparent `quiet` variant
   against a solid, filled `destructive` variant; there is no quiet-but-tinted
   destructive option. `quiet` was chosen to preserve the transparent,
   low-emphasis footprint (closer to the original silhouette than a solid red
   button would be), at the cost of the red warning tint on that control.
4. **Status dot color mapping.** `NowPlayingBar` maps `PLAYING`/`PAUSED`/
   `STOPPED` onto the convenience tones `live`/`pending`/`offline`. The exact
   hue may differ slightly from the previous `badge-success`/`badge-warning`/
   `badge-neutral`, though the semantic traffic-light ordering is preserved
   and the visible text label (already present before this migration) is now
   a required, non-optional part of the primitive's contract.

No layout, spacing, or copy changes were made beyond what the primitives
require to render.

## Required decisions

### 1. `QueueStats` vs `CompactStats`

**Decision: keep both, with distinct, documented roles.** They are not full
duplicates.

- `QueueStats` (consumed only by the legacy `DJControlTab`) is a single
  monolithic sidebar widget: it owns the song/duration statistics **and**
  the embedded start/stop/previous/next controls, plus the "add songs"
  shortcut. It is already marked `lifecycle: legacy` in
  `component-catalogue.metadata.json`.
- `CompactStats` (consumed only by `DJControlTabV2`) is presentation-only: a
  single-line "N/M played - remaining time" strip. In the V2 layout, controls
  are deliberately factored out into the separate `NowPlayingBar` and
  `PlaybackControls` components (see the V2 file header comment: "Layout:
  NowPlayingBar -> PlaybackControls -> CompactStats -> Timeline").

Converging them would mean either bolting the embedded playback actions back
onto `CompactStats` (undoing the V2 separation of concerns) or stripping
actions out of `QueueStats` and rewriting the legacy tab's layout, which is a
larger, behavior-risking change than this ticket's scope. Both stay, each
documented with its owning tab.

### 2. `DJControlTab` (legacy) vs `DJControlTabV2`

**Decision: keep both, with `DJControlTabV2` as the confirmed production
default.** They are both live code paths, mounted from
`src/pages/host/JamManagementPage.tsx` (around line 271) behind the
`?useLegacyDJ=true` URL query flag. This was **not** changed or removed as
part of this migration.

`component-catalogue.metadata.json` already recorded this split before this
ticket (`DJControlTabV2`: "Production-default DJ control tab."; `DJControlTab`:
"Legacy DJ control tab retained alongside its V2 design iteration."). This
migration keeps that split and brings both onto canonical primitives so
neither path regresses. Deleting the legacy tab is a product decision outside
this ticket's scope (per the parent design-system ticket #27, incremental
convergence is acceptable); flagging loudly here per the issue instructions:
**`DJControlTab.tsx` is still reachable in production via the URL flag and
was not deleted.**

### 3. `AGENTS.md` stale `dj-control-v2/` reference

**Decision: corrected.** `AGENTS.md` claimed a `src/components/dj-control-v2/`
directory. It does not exist; `DJControlTabV2` lives at
`src/pages/tabs/DJControlTabV2.tsx` and consumes the same
`src/components/dj-control/` primitives as the legacy tab. The project
structure listing in `AGENTS.md` was updated to describe
`src/components/dj-control/` as shared by both tabs.

### 4. `TimelineSongItem` vs `SongQueueTimeline`'s internal `SongRow` (bonus)

Not one of the three required decisions, but a duplicate/legacy candidate
surfaced by this migration and worth recording. `TimelineSongItem.tsx` has no
consumers anywhere in the app (it is exported from
`src/components/dj-control/index.ts` but never imported); `SongQueueTimeline`'s
private `SongRow` renders the same song data plus status icons, position,
and an approve action, and is the version actually in use.
`component-catalogue.metadata.json` already flagged this
("No current consumers; review whether this DJ timeline item is retained or
deprecated.").

**Decision: keep, marked legacy, not deleted in this ticket.** It was still
migrated onto the canonical `Action` primitive because it is explicitly listed
in this ticket's file scope, so it does not regress if something is
reinstated to use it later. Deleting an unreferenced file is a safe, separate
cleanup outside a migration ticket whose focus is behavior preservation during
a live Jam; recommend a follow-up ticket to remove it once confirmed
unnecessary.

## Catalogue and stories

- `npm run catalogue:generate` was run after the code changes; the generated
  `docs/design-system/component-catalogue.json` and `.md` reflect the new
  primitive usage (dependencies on `../Action`, `../FeedbackStates`, and
  `../data-display` instead of raw DaisyUI classes).
- `src/workbench/stories/DJControl.stories.tsx` already exercises playback,
  queue, ordering, rapid-operation-disabled, and action-error states through
  `PlaybackControls` and `SongQueueTimeline`; those stories continue to pass
  because `Action`/`IconAction` render a native `<button>` with the same
  accessible name and `disabled` semantics the stories assert against.
