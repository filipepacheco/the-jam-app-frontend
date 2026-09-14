# Screen Refinement Frontier

Status: active. This plan begins after the completed architecture program in
[`architecture-improvement-plan.md`](./architecture-improvement-plan.md).

## Implementation status

This document is also the durable frontier ledger. A track is marked complete
only after its full checklist and integrated gate pass; landing an evidence
slice does not close the track.

| Track | State | Integrated evidence | Remaining gate |
| --- | --- | --- | --- |
| 0. Frontier foundation | Complete | Both private workflows recognize `screen-refinement-gate`; the repository policy tests that path; application tests run in production CI; the screen-refinement pull-request evidence template is added. [Parent #127](https://github.com/filipepacheco/the-jam-app-frontend/issues/127) links the eight critique issues below. | None; begin each target from its critique issue and accept its contract before creating implementation issues. |
| 1. Live host control | In progress | `Pages/Screen refinement/Live host control` composes the production management shell, DJ playback, and Live Queue for ready, no-current-Performance, saving, and rollback states. Reorder save/cancel controls remain visible and safely disabled while saving; success, conflict, rollback, refresh, and polling feedback stays attached to the queue. | Complete the remaining state matrix, strict affected-story review, and canonical visual decision. |
| 2. Schedule management | In progress | `Pages/Screen refinement/Schedule management` directly covers active, upcoming, suggested, completed, small-schedule, empty, phone, and host-console compositions. The add-Music action remains reachable with one to three Performances, operational groups follow the live-state hierarchy, and mutation, refresh, and partial-bulk outcomes stay attached to affected rows. | Finish dense-card refinement and the remaining safety matrix, then run the track gate. |
| 3. Music library | In progress | [Critique #130](https://github.com/filipepacheco/the-jam-app-frontend/issues/130) anchors discovery. `Pages/Screen refinement/Music library` directly covers viewer, host moderation, long content, pagination, empty-library, and recoverable query states. Approved, suggestion-count, and suggestion-list failures retain separate retry paths, and compact pagination controls have localized accessible names. | Finish filtered-empty, loading, mutation/confirmation/refresh safety, and compatibility evidence; accept the contract and run the track gate. |
| 4. Host dashboard | In progress | [Critique #131](https://github.com/filipepacheco/the-jam-app-frontend/issues/131) anchors discovery. `Pages/Screen refinement/Host dashboard` directly covers operational, long-content, phone, desktop, reduced-motion, and first-Jam states. Live Jams and their explicit Manage actions lead portfolio totals; Create Jam remains primary outside the phone overflow menu. | Finish loading/error/mutation safety and category-empty evidence, accept the contract, then run the track gate. |
| 5. Jam detail | In progress | `Pages/Screen refinement/Jam detail` covers the loaded participation hierarchy, no-Performances, recoverable error, and not-found states through a typed deterministic route-state seam. | Complete long-content/location/share feedback, authentication and overlay transitions, timeline emphasis, strict affected-story review, and canonical visual decision. |
| 6. Public Dashboard transitions | In progress | [Critique #133](https://github.com/filipepacheco/the-jam-app-frontend/issues/133) anchors discovery. `Pages/Screen refinement/Public Dashboard transitions` directly covers loading, recoverable error, starting-soon, live, finished, classic, carousel, venue, and reduced-motion states. Loading is announced and full-page failure has an explicit retry path. | Finish offline/stale reconciliation and transition timing evidence, accept the contract, then run the track gate. |
| 7. Browse Jams hierarchy | Not started | Existing Jam and canonical empty-state evidence is listed below. | Critique, contract, implementation, and track gate after Track 5. |
| 8. Create Jam and Musicians | Not started | Existing form, overlay, and page-test evidence is listed below. | Critique, contract, implementation, and track gate after the shared host patterns land. |

Current integrated verification: catalogue freshness, workbench typecheck,
private visual privacy policy, progressive design-system enforcement, focused
Live Queue tests, the application suite, and the production-isolation build.
The local browser-backed workbench run still requires the canonical Linux
renderer; the final gate, rather than a dependency-symlinked macOS run, is the
authority for interaction, accessibility, and visual results.

## Destination

Refine the eight priority product surfaces so that the Jam App feels energetic,
social, and music-native while remaining precise during live operations. The
result must work as one product across three contexts:

- musicians participate one-handed from phones in noisy venues;
- hosts make fast, consequential decisions from phones and desktop consoles;
- audiences read the Public Dashboard from shared screens at a distance.

The frontier is complete when every target surface has an approved visual and
interaction hierarchy, direct deterministic workbench evidence, strict
accessibility coverage for changed states, and passing production and private
visual gates on the integrated stack.

## Design direction

- Put the current music and the next useful action first.
- Use the purple/violet brand anchor and semantic status color with restraint.
- Prefer strong hierarchy, rhythm, and legibility over generic card grids.
- Reveal operational complexity progressively and keep live feedback visible.
- Adapt control density to context: touch-first on phones, compact and precise
  for host consoles, large and glanceable for venue displays.
- Treat Portuguese as the reference language and keep English and Spanish
  robust under expansion.
- Preserve both `jam-light` and `jam-dark`; smoke-test the other selectable
  themes without designing separately for all of them.
- Use motion to explain state changes. Reduced motion must communicate the same
  state without depending on animation.

## Scope

The ordered targets are:

1. Live host control.
2. Schedule management.
3. Music library.
4. Host dashboard.
5. Jam detail.
6. Public Dashboard full-page transitions.
7. Browse Jams empty-state hierarchy.
8. Create Jam and Musicians consistency.

Shared primitives may change when a target proves that their interface is too
shallow. Such a change belongs to the target that needs it and must update every
affected consumer and workbench story in the same ticket.

### Outside this frontier

- New product capabilities or backend contracts.
- Guest-musician support, Performance terminology migration, Live Queue
  revision tokens, and server-side Music filtering; these remain in
  [`backend-debt.md`](./backend-debt.md).
- Replacing the controller seams completed by the architecture program.
- A framework, routing, data-fetching, or design-system replatform.
- Marketing, authentication, Profile, About, and Feedback redesign, except for
  a shared-shell regression caused by an in-scope change.
- Decorative brand work that does not improve hierarchy, comprehension,
  feedback, or context-specific usability.

## Unit of work: a surface contract

Each target runs as a small flow rather than one large redesign ticket.

### 1. Critique

Inspect the production route and deterministic states at the target viewports.
Record:

- the primary user job and the first action the screen should make obvious;
- hierarchy, information architecture, cognitive load, and emotional tone;
- failures in phone reachability, host-console density, or venue legibility;
- accessibility, localization, theme, long-content, and motion risks;
- behavior and controller contracts that the refinement must preserve.

Complete when the critique names evidence for every applicable state in the
target matrix and separates defects from preferences.

### 2. Target contract

Turn the critique into a short, reviewable contract containing:

- one hierarchy statement;
- the primary, secondary, and destructive action order;
- the information retained above the fold at each primary viewport;
- the state-transition and feedback rules;
- explicit non-goals and preserved behaviors;
- before/after acceptance criteria that can be asserted in stories or tests.

Complete when the user accepts the contract. If the visual or state answer
cannot be settled in prose, use a bounded workbench prototype before approval.

### 3. Tracer-bullet implementation

Split the accepted contract into one to three independently mergeable tickets.
Each ticket must cross the production component seam, add or update its
deterministic evidence, and leave the screen usable. Use the smallest matching
design workflow—normally `arrange`, `clarify`, `adapt`, `distill`, `animate`, or
`harden`—then finish the track with `polish`.

Complete when the track contract is satisfied on the production route and no
temporary prototype code remains in production.

### 4. Review and merge

Run the two-axis code review against the fixed merge base:

- **Standards:** repository conventions, design foundations, accessibility,
  localization, responsive behavior, and test quality.
- **Spec:** the accepted target contract and preserved behaviors.

Complete when both axes pass, the track gate is green, the final pull request is
merged, and the next target starts from current `main` in a fresh worktree.

## Evidence matrix

Every critique marks each cell as required, not applicable with a reason, or
covered by named existing evidence.

| Dimension | Required coverage |
| --- | --- |
| Viewport | 390×844 phone; 1440×900 host desktop; 1920×1080 venue where applicable |
| Theme | `jam-light`; `jam-dark`; selectable-theme smoke test for shared primitives |
| Language | Portuguese reference; long English or Spanish; unbroken user content |
| Input | Touch, mouse, and keyboard for every supported interactive operation; passive states record a rationale |
| Motion | Normal and reduced motion with equivalent state communication |
| Data | Default, long content, dense content, and the domain-specific empty state |
| Async | Initial loading, refresh, success, recoverable error, and stale/offline where applicable |
| Safety | Disabled, pending, confirmation, partial failure, rollback, or conflict where applicable |
| Access | Correct headings and landmarks, focus order/restoration, names, live feedback, contrast, and target size |

Static stories must state why interaction is not applicable. Changed stories
must use `a11y.test: 'error'`; inherited `todo` coverage is not an acceptable
waiver for a touched surface.

## Frontier map

```text
Frontier foundation
        |
        v
Live host control -------> Public Dashboard transitions
        |
        v
Schedule management -----> Create Jam + Musicians consistency
        |
        v
Music library -----------> Host dashboard
        |
        v
Jam detail <.. discovery .. Browse Jams hierarchy
        |
        v
Integrated frontier closeout
```

The numbered merge order is the merge order. Public Dashboard discovery may run
after Live host control because both share live-state language. Browse Jams
discovery may run before Jam detail, as shown by the dotted relationship, but
its implementation is blocked from merge until Jam detail lands so the browsing
promise matches its destination.

## Tracks

### 0. Frontier foundation

Purpose: make every later screen decision reviewable without repeating setup.

GitHub coordination:

- [Parent frontier issue #127](https://github.com/filipepacheco/the-jam-app-frontend/issues/127)
- [Live host control critique #128](https://github.com/filipepacheco/the-jam-app-frontend/issues/128)
- [Schedule management critique #129](https://github.com/filipepacheco/the-jam-app-frontend/issues/129)
- [Music library critique #130](https://github.com/filipepacheco/the-jam-app-frontend/issues/130)
- [Host dashboard critique #131](https://github.com/filipepacheco/the-jam-app-frontend/issues/131)
- [Jam detail critique #132](https://github.com/filipepacheco/the-jam-app-frontend/issues/132)
- [Public Dashboard transitions critique #133](https://github.com/filipepacheco/the-jam-app-frontend/issues/133)
- [Browse Jams hierarchy critique #134](https://github.com/filipepacheco/the-jam-app-frontend/issues/134)
- [Create Jam and Musicians critique #135](https://github.com/filipepacheco/the-jam-app-frontend/issues/135)

Deliverables:

- Create the parent frontier issue and one critique issue per target. The issue
  flow is: parent → critique → accepted target contract → one to three
  implementation issues → track closeout. Implementation issues do not exist
  before their contract is accepted.
- Add a `screen-refinement-gate` path for the catalogue and private workbench
  workflows; this is new setup work, not an existing capability. Verify it with
  the private-visual policy tests and `npm run visual:privacy`. Keep fast
  production checks on every pull request and run the full private gate on the
  final pull request of each target.
- Adopt a pull-request evidence template naming the target contract, affected
  states, workbench stories, intentional baseline changes, and both review axes.
- Ensure the design direction in this plan is reachable from every frontier
  ticket by linking its exact track and evidence-matrix sections plus the
  applicable committed design-system sources. Do not depend on an untracked
  local file.

Completion criterion: a new target can begin from a fresh worktree with its
route, evidence, gates, and decision checkpoint discoverable from its issue.

### 1. Live host control

Surface: `/host/jams/:id/manage`, the management shell, `DJControlTabV2`, and
`LiveJamControlPanel`. Schedule content is refined in Track 2.

Hierarchy target: the host can identify the current Performance, the next
consequential action, and whether the displayed queue is authoritative within
one glance.

Required outcomes:

- Separate playback, queue inspection, and reorder modes without hiding their
  relationship.
- Make Now Playing and the next Performance dominate the operational hierarchy.
- Make playback controls unmistakable, reachable, and safely disabled while an
  operation is pending.
- Make draft, saving, conflict, rollback, and refreshed-authoritative states
  visually distinct and persistent long enough to understand.
- Keep save/cancel reachable during touch reorder and make readiness and
  musician gaps scannable.
- Tune the management tabs and alert region so live feedback does not displace
  the controls the host is operating.

Evidence starting points:

- `Architecture/Closeout workflows/Live Queue Keyboard Reorder`.
- `Domain/DJ Control/Playback and queue`.
- `LiveJamControlPanel.test.tsx` and `liveQueueController.test.ts`.

Direct composition evidence to add:
`Pages/Screen refinement/Live host control`, covering the management shell,
DJ playback, and Live Queue modes through deterministic adapters.

Primary contexts: 390×844 host phone and 1440×900 host desktop. Required safety
states: loading, no current Performance, ready/partial/empty lineup, reorder
draft, saving, conflict, persistence failure, rollback, and polling
reconciliation.

### 2. Schedule management

Surface: the `schedule` tab in `/host/jams/:id/manage` through `ScheduleTab` and
`useHostScheduleController`.

Hierarchy target: the host can distinguish what is ready, what needs musicians,
what awaits approval, and what action resolves each gap without opening every
Performance.

Required outcomes:

- Establish clear active/upcoming/suggested grouping and status language aligned
  with Live host control.
- Reduce nested-card density while retaining Performance, Music, registration,
  instrument, notes, and action context.
- Make empty slots, pending registrations, and partial bulk outcomes actionable.
- Clarify add-existing-Music versus create-new-Music paths.
- Keep destructive confirmations and refresh failures attached to the affected
  Performance rather than relying only on transient page alerts.

Evidence starting points:

- `Domain/Schedule/Primitives and actions`.
- `Domain/Schedule/Registration and cards`.
- Host Schedule adapter/controller tests and `JamManagementPage.test.tsx`.

Direct composition evidence to add:
`Pages/Screen refinement/Schedule management`, using the production controller
interface with deterministic adapters.

Primary contexts: 390×844 host phone and 1440×900 host desktop. Required states:
loading, empty, filtered empty, suggested, pending approval, partially filled,
complete, per-row pending, partial bulk failure, removal confirmation, and
refresh failure.

### 3. Music library

Surface: `/music` through `MusicPage` and the Music library controller. The
jam-specific `/host/jams/:id/songs` route receives a compatibility audit only
for add/remove language and destination links. Visual changes to that route are
outside this track unless the critique proves it is a primary user path and the
user explicitly expands the accepted target contract.

Hierarchy target: users can discover Music quickly, while hosts can moderate
suggestions without confusing catalogue status, Jam inclusion, or destructive
actions.

Required outcomes:

- Balance search, filters, sort, counts, and results at phone and desktop widths.
- Make approved and suggested status clear without allowing moderation controls
  to overpower title and artist.
- Clarify add existing, suggest new, edit, approve/reject, and remove semantics.
- Improve filtered-empty versus empty-library guidance.
- Preserve long titles, artists, instrument requirements, Spotify links,
  pagination, and explicit query/mutation/refresh errors.

Evidence starting points:

- `Domain/Music/Library`.
- `Architecture/Closeout workflows/Existing Music Suggestion` and `New Music Suggestion`.
- `musicLibraryController.test.ts`.

Direct composition evidence to add:
`Pages/Screen refinement/Music library`, covering viewer and host modes.

Primary contexts: 390×844 musician/host phone and 1440×900 host desktop.
Required states: viewer/host, approved/suggested, long content,
requirements/no requirements, filtered empty, empty library, loading, query
failure, mutation failure, confirmation, and refresh failure.

### 4. Host dashboard

Surface: `/host/dashboard` through `HostDashboardPage`.

Hierarchy target: the host sees the Jam requiring attention now, then the most
useful next action, before portfolio statistics or historical Jams.

Required outcomes:

- Promote LIVE/in-progress Jams and their manage action above planned and past
  inventory.
- Make create/import paths clear without competing equally with operational work.
- Give statistics an actionable purpose or reduce their prominence.
- Improve first-Jam onboarding and empty category treatment.
- Normalize summary-card action hierarchy, overflow behavior, and mobile density.

Evidence starting points:

- `HostDashboardPage.test.tsx`, `JamCard` stories, host navigation stories, and
  canonical Empty State stories.

Direct composition evidence to add:
`Pages/Screen refinement/Host dashboard`, including first-use and mixed-status
portfolio states.

Primary contexts: 390×844 host phone and 1440×900 host desktop. Required states:
auth loading, API loading/error/retry, no Jams, live only, mixed
planned/live/past, long Jam names, delete confirmation, and success/error
feedback.

### 5. Jam detail

Surface: `/jams/:jamId` through `JamDetailPageV2`, Jam summary components, the
Performance timeline, and participation overlays.

Hierarchy target: a musician understands the Jam, sees the next relevant
Performance, and can participate without losing schedule context.

Required outcomes:

- Order Jam identity, date/location, participation action, timeline, and
  secondary description deliberately.
- Keep phone participation actions reachable without covering timeline content.
- Make the active/upcoming Performance and registration opportunity obvious.
- Align collapsed/expanded descriptions, suggested Music, sharing, and location
  feedback with the canonical disclosure and overlay language.
- Preserve authentication redirects and controller-owned overlay transitions.

Evidence starting points:

- `Domain/Jam/Summary and actions`.
- `Domain/Jam/Performance timeline`.
- Jam Detail loading stories and Architecture closeout participation stories.

Direct composition evidence to add:
`Pages/Screen refinement/Jam detail`, including the loaded participation path
and the no-Performances state.

Primary contexts: 390×844 musician phone and 1440×900 desktop viewer. Required
states: loading, not found/error, no Performances, long description,
active/upcoming/completed timeline, unauthenticated action, existing/new Music
suggestion, Performance selection, enrollment, sharing, and feedback.

### 6. Public Dashboard full-page transitions

Surface: `/jams/:jamId/dashboard` through `PublicDashboardPage`,
`CarouselDashboard`, classic layout, header, cards, QR, controls, fullscreen,
offline banner, and completion effects.

Hierarchy target: an audience member can read the Jam state, current Music, and
what happens next from across the venue without host controls competing for
attention.

Required outcomes:

- Define a coherent transition language for starting, Now Playing, Up Next, and
  finished states.
- Tune timing and movement for anticipation while preserving a complete reduced-
  motion experience.
- Guarantee distance legibility for long titles, artists, musician lineups, and
  empty-next states.
- Keep controls, QR, offline status, and fullscreen affordances subordinate until
  intentionally opened.
- Reconcile carousel and classic layouts so they communicate the same state even
  when their compositions remain distinct.

Evidence starting points:

- `Domain/Public Dashboard/Carousel and controls`.
- Public Dashboard card stories and venue foundation stories.
- Dashboard layout and polling tests.

Direct composition evidence to add:
`Pages/Screen refinement/Public Dashboard transitions`, with deterministic
clock/state adapters for the complete starting-to-finished sequence.

Primary context: 1920×1080 venue display; 390×844 phone is a control/fallback
check. Required states: loading, error, offline cached data, ACTIVE/starting,
LIVE with current and next, no next, song transition, FINISHED, controls open,
QR expanded, fullscreen, normal motion, and reduced motion.

### 7. Browse Jams empty-state hierarchy

Surface: `/jams` through `BrowseJamsPage`, `JamCard`, search/sort controls,
status navigation, sections, and canonical empty/error/loading states.

Hierarchy target: visitors understand what Jams are available and, when none
match, whether they should clear filters, return later, or take another action.

Required outcomes:

- Order page promise, search/sort, status navigation, counts, current Jams, and
  past disclosure without making filters the hero.
- Distinguish first-use/no-Jams, current-section empty, and filtered-empty copy
  and actions.
- Keep filter clearing and past disclosure usable on phones and keyboards.
- Preserve meaningful section counts, sorting, long Jam content, and error retry.

Evidence starting points:

- Canonical Empty State and actionable-empty-state stories.
- Jam summary/card stories and Browse page tests.

Direct composition evidence to add:
`Pages/Screen refinement/Browse Jams`, covering results, first-use, and
filtered-empty hierarchy.

Primary contexts: 390×844 guest/musician phone and 1440×900 desktop. Required
states: loading, API error/retry, current and past results, no Jams, no current
Jams, filtered empty, search, sorting, collapsed/expanded past section, and long
localized copy.

### 8. Create Jam and Musicians consistency

Surfaces: `/host/create-jam`, `/host/jams/:id/edit`, and `/musicians` through
`CreateJamPage`, `MusiciansPage`, and their forms, directory, pagination, alerts,
and overlays.

Hierarchy target: host administration feels like one system: consistent headers,
field rhythm, filter/result structure, feedback placement, and safe actions.

Required outcomes:

- Define one host page header and section rhythm across both surfaces.
- Normalize labels, descriptions, validation, request errors, success feedback,
  primary/secondary/destructive actions, and pending states.
- Align Musicians search/filter/results/empty hierarchy with Browse and Music
  without forcing identical density.
- Keep create versus edit consequences clear, including Spotify import and Jam
  deletion.
- Keep the musician table efficient on desktop and convert it to a legible action
  list on phones without hiding pagination or edit state.

Evidence starting points:

- `Forms/Current components`, `Overlays/Jam forms`, Music empty states,
  registration stories, and Create Jam/Musicians page tests.

Direct composition evidence to add:
`Pages/Screen refinement/Create and edit Jam` and
`Pages/Screen refinement/Musicians directory`.

Primary contexts: 390×844 host phone and 1440×900 host desktop. Required states:
auth loading, create/edit loading, field validation, save/delete pending and
failure, success, Spotify overlay, directory loading/error, empty/filtered
empty, pagination, long musician data, and edit overlay.

## Milestones and gate cadence

To keep the slower pipelines useful without paying their full cost on every
intermediate slice:

- Every pull request keeps the production build as a CI gate and records the
  focused application and workbench tests run for its affected behavior.
- The final pull request of each numbered track runs the full catalogue and
  private workbench workflows with the screen-refinement gate.
- Tracks 1–4 form the **host operations milestone**.
- Tracks 5–8 form the **participant and venue milestone**.
- Each milestone reruns the full suite on current `main`; the frontier closeout
  reruns it on the complete integrated stack.

Visual baselines remain private and use the pinned Linux renderer. A baseline
changes only after the target contract explains the intended visual difference;
local macOS comparison output is diagnostic, not update authority.

## Track completion checklist

- The critique and accepted target contract are linked from the issue.
- The production route satisfies the hierarchy and action-order statements.
- Every applicable evidence-matrix cell has a named story or test.
- The page has direct deterministic composition evidence; component-only stories
  are insufficient for the final track gate.
- Changed behavior has interaction assertions; static stories have a rationale.
- Changed stories run strict accessibility with zero new violations.
- All new copy exists in `en`, `es`, and `pt`.
- Both reference themes, long content, and primary responsive contexts pass.
- Catalogue metadata and generated progress are current.
- Intentional visual changes have approved canonical baselines.
- Standards and Spec reviews pass against the fixed merge base.
- The final track pull request is green and merged before the dependent track.

## Frontier closeout

After Track 8, verify the integrated product rather than the final branch alone.

Required evidence:

- All eight target contracts are satisfied on current `main`.
- Each target route has deterministic page-composition coverage.
- No changed target story or directly affected shared story remains on
  accessibility `todo` without a new, component-specific reviewed debt record
  and reopening condition. Unaffected inherited stories do not block the
  frontier.
- Cross-screen status terms, action hierarchy, host headers, empty states,
  feedback placement, and responsive spacing are consistent where the user job
  is the same and intentionally distinct where the context differs.
- Live host changes remain readable on the Public Dashboard and participation
  promises made by Browse Jams remain true on Jam detail.
- Catalogue, design-system enforcement, application tests, production isolation,
  private workbench interactions/accessibility, canonical visual comparison,
  privacy, and deterministic build all pass.
- The parent frontier issue contains links to every critique, contract, merged
  pull request, intentional baseline decision, and final CI run.

Completion criterion: every child issue is closed, the parent issue carries the
evidence above, and the next product initiative can start without recovering
design decisions from chat history.

## Sources of truth

- [`architecture-improvement-plan.md`](./architecture-improvement-plan.md) —
  completed architecture and original screen order.
- [`design-system/contributor-workflow.md`](./design-system/contributor-workflow.md)
  — catalogue, workbench, and progressive-governance procedure.
- [`design-system/typography-spacing-responsive.md`](./design-system/typography-spacing-responsive.md)
  — type, spacing, sizing, and viewport foundations.
- [`design-system/interaction-motion-accessibility-content.md`](./design-system/interaction-motion-accessibility-content.md)
  — interaction, motion, accessibility, and content standards.
- [`design-system/color-and-themes.md`](./design-system/color-and-themes.md) —
  semantic color and reference-theme contract.
- [`design-system/workbench-progress.md`](./design-system/workbench-progress.md) —
  current deterministic evidence baseline.
- [`backend-debt.md`](./backend-debt.md) — deferred contracts outside this
  frontend refinement frontier.
