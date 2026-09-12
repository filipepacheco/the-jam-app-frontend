# Schedule and DJ host normalization

Issue #57 applies the approved foundations to the host-facing Schedule and DJ
surfaces. It is a presentation and accessibility normalization only: request
ordering, mutation guards, confirmations, callbacks, routing, polling, and
localized copy remain owned by their existing workflows.

## Host-console decisions

- `JamManagementPage` uses `NavigationTabs` for the related management panels.
  It keeps the existing active-tab and refresh behavior while adding roving
  keyboard navigation, correct tab/panel association, horizontal overflow, and
  the shared focus treatment. The Jam status uses `Badge` with an explicit
  status-tone map instead of a local DaisyUI class map.
- `ScheduleTab` uses `Field` for the search control and `Action`/`IconAction`
  for filtering, clearing, adding, empty-state recovery, and creating Music.
  The selected filter is communicated by its pressed state as well as its
  primary action treatment. The existing add-schedule loading guard now shows
  the existing localized progress label through the action contract.
- `ScheduleCollapsibleCard` is a `DataCard` with a native expansion button.
  This preserves its compact information density, suggested-song approval and
  rejection controls, and Framer Motion behavior while replacing the former
  hand-rolled button role with native keyboard behavior and a programmatic
  details relationship. Current Schedule status still uses the established
  `StatusDot` and helper-driven status family; see the documented density
  exception in `schedule-registration-migration.md`.
- `NowPlayingBar` uses `DataCard` and continues to pair a visible playback
  label with `StatusIndicator`. Current song and artist content now wraps
  rather than truncating the only displayed occurrence.
- `PlaybackControls` identifies the transport operation in flight and renders
  its existing localized update label through `Action state="loading"`. All
  other transport controls retain the existing single-request guard.
- `LiveJamControlPanel` uses `DataCard` for its loading, empty, and queue
  regions, and `Action` for reorder mode, cancellation, and saving. The drag,
  touch, keyboard reorder, rollback, and request sequencing logic is unchanged.

## Review evidence

- **Desktop host console:** `ScheduleRegistration/HostCardExpanded` and
  `DJ Control/QueueTimeline` run with Portuguese, `jam-dark`, and the desktop
  viewport.
- **Mobile host:** `DJ Control/PendingPlaybackAction` runs at the phone
  viewport and verifies a pending transport action announces progress and
  disables the entire transport row. `ScheduleRegistration/PendingAndEmptySlots`
  continues to cover the compact Schedule registration action at phone width.
- **Keyboard production seam:** `JamManagementPage.test.tsx` verifies a host can
  move between management tabs with Arrow keys. Existing Schedule/DJ workbench
  stories retain their expansion, approval, destructive, error, and
  reduced-motion states.

The workbench toolbar continues to exercise Portuguese, English, Spanish,
selectable themes, and reduced motion. No locale keys were added; every changed
control uses an existing translation key.

## Retained compatibility paths

- `ScheduleCompactCard` remains unadopted pending the product decision already
  recorded in `schedule-registration-migration.md`.
- The reachable legacy `DJControlTab` and `QueueStats` remain available through
  `?useLegacyDJ=true`; `DJControlTabV2` remains the default.
- Existing Schedule registration and add-entry modal wrappers remain on the
  shared compatibility modal until a workflow-by-workflow overlay review can
  preserve their focus and mutation contracts.
