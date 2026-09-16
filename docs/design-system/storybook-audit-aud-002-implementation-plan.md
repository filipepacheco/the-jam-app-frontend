# AUD-002 implementation plan — Schedule enrollment content resilience

Status: implemented and verified on 2026-09-16.

## Accepted correction

Finding `AUD-002` was accepted by the thread owner with the instruction to fix
all non-accessibility audit work and defer accessibility findings. Replace the
single-line truncation of the sole song title and artist in
`ScheduleDetailsCard` with the existing `.ds-wrap-user-content` contract.

## Owners and consumers

- Source owner: `src/components/schedule/ScheduleDetailsCard.tsx` (`ui.0115`).
- Direct consumers: `ScheduleEnrollmentModal` and
  `HostMusicianRegistrationModal`.
- Product path: musician self-enrollment from `JamDetailPageV2`, plus the host
  musician-registration workflow.
- Executable evidence: `Architecture/Closeout workflows/Performance
  enrollment` at the phone viewport with the long music fixture.

## Preserved behavior and non-goals

- Preserve the Schedule-specific card, spacing, typography, duration display,
  enrollment state, and instrument selection behavior.
- Reuse `.ds-wrap-user-content`; do not introduce a new primitive or merge the
  card with another component family.
- Do not change translations, modal behavior, visual baselines, or any deferred
  accessibility finding.

## Story and application verification

- Assert that the complete long song title and artist render with
  `.ds-wrap-user-content` in the phone enrollment composition.
- Preserve the selected guitar instrument and successful enrollment callback.
- Browser-check 390×844: title and artist wrap to multiple lines and the
  document has no horizontal overflow.
- No new catalogue or inline-pattern disposition is required. Regenerate the
  already-stale catalogue so its checked-in outputs match current source.
- The private visual matrix has no `ScheduleDetailsCard` enrollment cell, so no
  reviewed PNG baseline update is expected or permitted.

## Completion evidence

- `npm run catalogue:check`
- `npm run catalogue:baseline`
- `npm run workbench:typecheck`
- Storybook MCP full interaction run with accessibility disabled: 203/203 pass
- `npm run workbench:verify-build`
- `npm run build`
- `npm run test:run`
- ESLint over every changed source and story file
- Pinned Linux visual comparison: 25 pass / 7 pre-existing changes, identical
  to an untouched `HEAD` control run; no new visual drift and no baseline update
- 390×844 browser measurement: 390px viewport, 375px document width, no
  horizontal overflow; title height 40px and artist height 32px

Complete when all evidence above remains green and no accessibility-only audit
item is included in this change.
