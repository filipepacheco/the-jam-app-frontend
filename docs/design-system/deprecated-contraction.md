# Deprecated implementation contraction

Issue #55 removes implementations that the #50–#54 migration reviews proved
were replaced and unused. It does not make visual changes or reconsider the
reviews' keep-separate decisions.

## Removed

- Marketing: `Features` and the retired `PromoVideo` directory. `HowItWorks`
  and `hero/HeroDashboardMockup` remain the production replacements. The
  unused Remotion development dependencies were removed with the retired
  video sources.
- Jam and Music: the V1 timeline showcase and item, the two superseded floating
  buttons, `CanvasWaveform`, and `CollapsibleSidebar`. Their story-only and
  barrel consumers were removed; the waveform V2 pair, `DualActionFAB`, and
  `CollapsibleSection` remain active.
- Schedule: `ScheduleCardManagement` and `ScheduleDisplayItem`, including the
  legacy workbench composition. `ScheduleCollapsibleCard` remains the
  production card.
- DJ control: the unconsumed `TimelineSongItem`. `SongQueueTimeline` remains
  the production queue implementation.

The source files, barrel exports, curated metadata, retired catalogue ignores,
and generated catalogue entries were removed together. Stable catalogue IDs
were not reassigned.

## Deliberately retained

- `RouteGuards`, `PageHeaderSkeleton`, `ScheduleCompactCard`, and the other
  uncertain zero-consumer entries have no approved replacement or still need a
  product decision.
- `DJControlTab` and `QueueStats` remain reachable through
  `?useLegacyDJ=true`.
- Public Dashboard classic and carousel components remain separate because
  they serve different layouts and interaction contracts.
- Existing workflow-specific overlays and compatibility guidance remain until
  their consumers are migrated and protected at their public behavior seams.

These retained implementations do not satisfy issue #55's zero-consumer plus
approved-replacement removal gate.
