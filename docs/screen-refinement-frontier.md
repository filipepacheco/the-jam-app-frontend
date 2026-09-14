# Screen Refinement Frontier

Status: active; last audited 2026-09-14. This plan begins after the completed
architecture program in
[`architecture-improvement-plan.md`](./architecture-improvement-plan.md).

## Implementation status

This document is also the durable frontier ledger. A track is marked complete
only after its full checklist and integrated gate pass; landing an evidence
slice does not close the track.

| Track | State | Integrated evidence | Remaining gate |
| --- | --- | --- | --- |
| 0. Frontier foundation | Complete | Both private workflows recognize `screen-refinement-gate`; the repository policy tests that path; application tests run in production CI; the screen-refinement pull-request evidence template is added. [Parent #127](https://github.com/filipepacheco/the-jam-app-frontend/issues/127) links the eight critique issues below. Contracts 1–8 were accepted on 2026-09-14 and their implementation issues are linked in the decision record. | None. |
| 1. Live host control | In progress | [Critique #128](https://github.com/filipepacheco/the-jam-app-frontend/issues/128) anchors discovery. `Pages/Screen refinement/Live host control` composes the production management shell, DJ playback, and Live Queue for ready, no-current-Performance, saving, rollback, and post-save refresh-failure states. Inspection and reorder use distinct localized headings. Reorder save/cancel controls remain visible and safely disabled while saving; controller evidence covers stale-save conflict, polling reconciliation, rollback, pending-save rejection, and authoritative refresh. Focused tests, i18n smoke, workbench typecheck, progressive design-system enforcement, catalogue freshness, production build/isolation, and visual privacy pass. | **External:** run the canonical Linux interaction/accessibility/visual gate, record the visual decision on [#139](https://github.com/filipepacheco/the-jam-app-frontend/issues/139) and [#136](https://github.com/filipepacheco/the-jam-app-frontend/issues/136), then merge the final Track 1 PR. |
| 2. Schedule management | In progress | [Critique #129](https://github.com/filipepacheco/the-jam-app-frontend/issues/129) anchors discovery. `Pages/Screen refinement/Schedule management` directly covers active, upcoming, suggested, completed, small-schedule, empty, phone, and host-console compositions. The add-Music action remains reachable with one to three Performances, operational groups follow the live-state hierarchy, and mutation, refresh, and partial-bulk outcomes stay attached to affected rows. | **Repository:** dense-card refinement and remaining safety matrix. **External:** pass the track gate and merge the final PR. |
| 3. Music library | In progress | [Critique #130](https://github.com/filipepacheco/the-jam-app-frontend/issues/130) anchors discovery. `Pages/Screen refinement/Music library` directly covers viewer, host moderation, long content, pagination, empty-library, and recoverable query states. Approved, suggestion-count, and suggestion-list failures retain separate retry paths, and compact pagination controls have localized accessible names. | **Repository:** filtered-empty, loading, mutation/confirmation/refresh safety, and compatibility evidence. **External:** pass the track gate and merge the final PR. |
| 4. Host dashboard | In progress | [Critique #131](https://github.com/filipepacheco/the-jam-app-frontend/issues/131) anchors discovery. `Pages/Screen refinement/Host dashboard` directly covers operational, long-content, phone, desktop, reduced-motion, and first-Jam states. Live Jams and their explicit Manage actions lead portfolio totals; Create Jam remains primary outside the phone overflow menu. | **Repository:** loading/error/mutation safety and category-empty evidence. **External:** pass the track gate and merge the final PR. |
| 5. Jam detail | In progress | [Critique #132](https://github.com/filipepacheco/the-jam-app-frontend/issues/132) anchors discovery. `Pages/Screen refinement/Jam detail` covers the loaded participation hierarchy, no-Performances, recoverable error, and not-found states through a typed deterministic route-state seam. | **Repository:** long-content/location/share feedback, authentication and overlay transitions, timeline emphasis, and strict affected-story review. **External:** pass the track gate and merge the final PR. |
| 6. Public Dashboard transitions | In progress | [Critique #133](https://github.com/filipepacheco/the-jam-app-frontend/issues/133) anchors discovery. `Pages/Screen refinement/Public Dashboard transitions` directly covers loading, recoverable error, starting-soon, live, finished, classic, carousel, venue, and reduced-motion states. Loading is announced and full-page failure has an explicit retry path. | **Repository:** offline/stale reconciliation and transition-timing evidence. **External:** pass the track gate and merge the final PR. |
| 7. Browse Jams hierarchy | In progress | [Critique #134](https://github.com/filipepacheco/the-jam-app-frontend/issues/134) anchors discovery. `Pages/Screen refinement/Browse Jams hierarchy` directly covers discovery, first-use, filtered-empty, initial loading, refreshing/stale data, recoverable error, phone, and desktop states. Global empty guidance no longer competes with duplicate section empties, and stale results remain visible while refresh/retry feedback is announced. | **Repository:** alignment with the final Jam detail participation promise. **Dependency:** Track 5 must land first. **External:** pass the track gate and merge the final PR. |
| 8. Create Jam and Musicians | In progress | [Critique #135](https://github.com/filipepacheco/the-jam-app-frontend/issues/135) anchors discovery. `Pages/Screen refinement/Create Jam and Musicians` directly covers create/edit, validation focus, destructive confirmation, directory, pagination, distinct empty/filter states, query failure, phone, and desktop. Create Jam adopts canonical action and confirmation contracts; Musicians adds a deterministic data port, targeted retry, and localized pagination names. | **Repository:** submit/update pending/failure evidence and shared long-content review. **External:** pass the track gate and merge the final PR after shared host patterns land. |

Current integrated verification: catalogue freshness, workbench typecheck,
private visual privacy policy, progressive design-system enforcement, focused
screen tests, the serial application suite (51 files and 261 tests), and the
production-isolation build.
The local browser-backed workbench run still requires the canonical Linux
renderer; the final gate, rather than a dependency-symlinked macOS run, is the
authority for interaction, accessibility, and visual results.

### Current repository evidence index

This index is the starting point for the remaining repository gates. Story
names are stable workbench identifiers; linked tests are the narrow application
checks to run before paying for an integrated gate.

| Track | Direct composition | Focused application evidence |
| --- | --- | --- |
| 1. Live host control | [`Pages/Screen refinement/Live host control`](../src/workbench/stories/ScreenRefinementLiveHostControl.stories.tsx) | [`LiveJamControlPanel.test.tsx`](../src/__tests__/LiveJamControlPanel.test.tsx), [`liveQueueController.test.ts`](../src/__tests__/liveQueueController.test.ts), and [`liveQueueAdapters.test.ts`](../src/__tests__/liveQueueAdapters.test.ts) |
| 2. Schedule management | [`Pages/Screen refinement/Schedule management`](../src/workbench/stories/ScheduleManagementPage.stories.tsx) | [`ScheduleTab.test.tsx`](../src/__tests__/ScheduleTab.test.tsx), [`hostScheduleController.test.ts`](../src/__tests__/hostScheduleController.test.ts), and [`hostScheduleAdapters.test.ts`](../src/__tests__/hostScheduleAdapters.test.ts) |
| 3. Music library | [`Pages/Screen refinement/Music library`](../src/workbench/stories/MusicLibraryPage.stories.tsx) | [`MusicPage.test.tsx`](../src/__tests__/MusicPage.test.tsx), [`musicLibraryController.test.ts`](../src/__tests__/musicLibraryController.test.ts), and [`musicLibraryModeration.test.ts`](../src/__tests__/musicLibraryModeration.test.ts) |
| 4. Host dashboard | [`Pages/Screen refinement/Host dashboard`](../src/workbench/stories/HostDashboardPage.stories.tsx) | [`HostDashboardPage.test.tsx`](../src/__tests__/HostDashboardPage.test.tsx) |
| 5. Jam detail | [`Pages/Screen refinement/Jam detail`](../src/workbench/stories/JamDetailPage.stories.tsx) | [`jamParticipationController.test.ts`](../src/__tests__/jamParticipationController.test.ts) and the participation stories in [`ArchitectureCloseout.stories.tsx`](../src/workbench/stories/ArchitectureCloseout.stories.tsx) |
| 6. Public Dashboard transitions | [`Pages/Screen refinement/Public Dashboard transitions`](../src/workbench/stories/PublicDashboardPage.stories.tsx) | [`PublicDashboardPage.test.tsx`](../src/__tests__/PublicDashboardPage.test.tsx) and [`PublicDashboardCarousel.stories.tsx`](../src/workbench/stories/PublicDashboardCarousel.stories.tsx) |
| 7. Browse Jams hierarchy | [`Pages/Screen refinement/Browse Jams hierarchy`](../src/workbench/stories/BrowseJamsPage.stories.tsx) | [`BrowseJamsPage.test.tsx`](../src/__tests__/BrowseJamsPage.test.tsx) |
| 8. Create Jam and Musicians | [`Pages/Screen refinement/Create Jam and Musicians`](../src/workbench/stories/CreateJamMusiciansPage.stories.tsx) | [`CreateJamMusiciansPage.test.tsx`](../src/__tests__/CreateJamMusiciansPage.test.tsx) |

The index records where evidence lives, not that every matrix cell is already
closed. The implementation ledger above remains authoritative for gaps.

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

## Proposed target contracts

Status: accepted by the user on 2026-09-14. These contracts turn the hierarchy
targets below into explicit decision checkpoints. Acceptance authorized the
implementation issues linked below; it did not expand the frontier or waive its
evidence matrix.

| Contract | Critique issue | Decision owner | Acceptance evidence | Implementation issues |
| --- | --- | --- | --- | --- |
| 1. Live host control | [#128](https://github.com/filipepacheco/the-jam-app-frontend/issues/128) | User | [Accepted 2026-09-14](https://github.com/filipepacheco/the-jam-app-frontend/issues/128#issuecomment-5658713925) | [#139](https://github.com/filipepacheco/the-jam-app-frontend/issues/139), [#136](https://github.com/filipepacheco/the-jam-app-frontend/issues/136) |
| 2. Schedule management | [#129](https://github.com/filipepacheco/the-jam-app-frontend/issues/129) | User | [Accepted 2026-09-14](https://github.com/filipepacheco/the-jam-app-frontend/issues/129#issuecomment-5658714863) | [#138](https://github.com/filipepacheco/the-jam-app-frontend/issues/138), [#137](https://github.com/filipepacheco/the-jam-app-frontend/issues/137) |
| 3. Music library | [#130](https://github.com/filipepacheco/the-jam-app-frontend/issues/130) | User | [Accepted 2026-09-14](https://github.com/filipepacheco/the-jam-app-frontend/issues/130#issuecomment-5658715617) | [#141](https://github.com/filipepacheco/the-jam-app-frontend/issues/141), [#142](https://github.com/filipepacheco/the-jam-app-frontend/issues/142) |
| 4. Host dashboard | [#131](https://github.com/filipepacheco/the-jam-app-frontend/issues/131) | User | [Accepted 2026-09-14](https://github.com/filipepacheco/the-jam-app-frontend/issues/131#issuecomment-5658716269) | [#140](https://github.com/filipepacheco/the-jam-app-frontend/issues/140), [#143](https://github.com/filipepacheco/the-jam-app-frontend/issues/143) |
| 5. Jam detail | [#132](https://github.com/filipepacheco/the-jam-app-frontend/issues/132) | User | [Accepted 2026-09-14](https://github.com/filipepacheco/the-jam-app-frontend/issues/132#issuecomment-5658717096) | [#144](https://github.com/filipepacheco/the-jam-app-frontend/issues/144), [#145](https://github.com/filipepacheco/the-jam-app-frontend/issues/145) |
| 6. Public Dashboard transitions | [#133](https://github.com/filipepacheco/the-jam-app-frontend/issues/133) | User | [Accepted 2026-09-14](https://github.com/filipepacheco/the-jam-app-frontend/issues/133#issuecomment-5658717975) | [#147](https://github.com/filipepacheco/the-jam-app-frontend/issues/147), [#146](https://github.com/filipepacheco/the-jam-app-frontend/issues/146) |
| 7. Browse Jams hierarchy | [#134](https://github.com/filipepacheco/the-jam-app-frontend/issues/134) | User | [Accepted 2026-09-14](https://github.com/filipepacheco/the-jam-app-frontend/issues/134#issuecomment-5658718718) | [#149](https://github.com/filipepacheco/the-jam-app-frontend/issues/149), [#151](https://github.com/filipepacheco/the-jam-app-frontend/issues/151) |
| 8. Create Jam and Musicians | [#135](https://github.com/filipepacheco/the-jam-app-frontend/issues/135) | User | [Accepted 2026-09-14](https://github.com/filipepacheco/the-jam-app-frontend/issues/135#issuecomment-5658719426) | [#150](https://github.com/filipepacheco/the-jam-app-frontend/issues/150), [#148](https://github.com/filipepacheco/the-jam-app-frontend/issues/148) |

Numbered merge order and cross-track dependencies still apply. Close a critique
only after its implementation issues and track gate are complete.

### Contract 1: Live host control

- **Hierarchy and action order:** Now Playing, queue authority, and the next
  consequential playback action lead; queue inspection and reorder are
  secondary modes; destructive playback changes remain confirmed and visually
  separated.
- **Above the fold:** phone and desktop both retain the current Performance,
  next Performance, primary playback control, and authoritative/draft state;
  desktop may expose more queue context without changing priority.
- **Transitions and feedback:** pending controls disable safely; draft, saving,
  conflict, rollback, persistence failure, and polling reconciliation remain
  attached to the queue until the host can understand the authoritative result.
- **Preserve / exclude:** preserve Live Queue controller sessions, keyboard and
  touch reorder, playback behavior, and polling contracts; exclude backend
  revision tokens and new DJ capabilities.
- **Assertable acceptance:** the named Live host control stories and focused
  controller/page tests prove that the current/next hierarchy and save/cancel
  path survive ready, no-current, saving, conflict, failure, and rollback states.

### Contract 2: Schedule management

- **Hierarchy and action order:** Now Playing and scheduled Performances lead,
  suggested and completed work follow, and the action that fills or resolves a
  gap stays with its Performance; destructive removal remains secondary and
  confirmed.
- **Above the fold:** phone retains the active group and an Add Music path;
  desktop adds dense operational context without moving the active group below
  portfolio information.
- **Transitions and feedback:** per-row pending, mutation, refresh, partial-bulk,
  and destructive outcomes remain attached to the affected Performance.
- **Preserve / exclude:** preserve the Host Schedule controller, registration
  semantics, partial outcomes, notes, and Music selection; exclude backend
  contract changes and server-side filtering.
- **Assertable acceptance:** the named Schedule management stories and focused
  tests prove operational group order, the one-to-three-Performance Add Music
  path, actionable gaps, and row-local safety feedback.

### Contract 3: Music library

- **Hierarchy and action order:** Music title and artist lead; search/filter/sort
  support discovery; Suggest is the viewer action; Add, edit, approve/reject,
  and remove appear only with host context and never overpower Music identity.
- **Above the fold:** phone retains the page promise, primary role-appropriate
  action, search, and first results; desktop may add filters, counts, and
  pagination without separating them from the result set.
- **Transitions and feedback:** approved-list, suggestion-count, and suggestion-
  list failures keep distinct retry paths; mutation, confirmation, and refresh
  outcomes identify the affected Music.
- **Preserve / exclude:** preserve the Music controller, pagination, long content,
  requirements, and Spotify links; the Jam-specific Music route receives only a
  language/destination compatibility audit.
- **Assertable acceptance:** the named Music library stories and controller/page
  tests prove viewer/host hierarchy, pagination access, distinct empty states,
  targeted query recovery, and mutation safety.

### Contract 4: Host dashboard

- **Hierarchy and action order:** a LIVE or active Jam and its Manage action lead;
  Create Jam is the persistent secondary portfolio action; import and feedback
  are tertiary; destructive deletion stays in Jam-local overflow and confirmation.
- **Above the fold:** phone retains the urgent Jam, Manage, and Create Jam outside
  overflow; desktop adds planned inventory and portfolio totals after live work.
- **Transitions and feedback:** initial loading, retryable query error, deletion
  confirmation, pending deletion, and success/failure remain visible without
  displacing the Jam being operated.
- **Preserve / exclude:** preserve host authorization, navigation, Jam status,
  import, and delete service behavior; exclude analytics or new portfolio
  capabilities.
- **Assertable acceptance:** the named Host dashboard stories and page tests prove
  live-before-totals order, explicit Manage actions, long-content resilience,
  phone overflow behavior, and constructive first-Jam onboarding.

### Contract 5: Jam detail

- **Hierarchy and action order:** Jam identity and date/location establish
  context, the relevant participation action follows, and the active/upcoming
  timeline leads secondary description, sharing, and suggestion actions.
- **Above the fold:** phone retains Jam identity, participation state, and the
  first relevant Performance without covering timeline content; desktop adds
  summary detail while preserving that order.
- **Transitions and feedback:** authentication, Performance selection,
  enrollment, suggestion, sharing, loading, retry, and not-found transitions
  preserve focus and keep outcomes near the initiating context.
- **Preserve / exclude:** preserve eligibility and overlay controller contracts,
  authentication redirects, and route behavior; exclude guest-musician support
  and Performance terminology migration.
- **Assertable acceptance:** the named Jam detail stories plus participation
  controller evidence prove loaded, no-Performance, error, not-found, long-
  content, timeline, and overlay states.

### Contract 6: Public Dashboard transitions

- **Hierarchy and action order:** Jam state, current Music, and Up Next dominate;
  QR and passive join guidance follow; controls and fullscreen stay subordinate
  until intentionally opened.
- **Above the fold:** the 1920×1080 venue view retains state, current/starting
  Music, and next information at distance; the phone fallback retains the same
  meaning with reduced density.
- **Transitions and feedback:** loading, starting, song change, no-next, finished,
  offline/stale, and retry transitions use one state language; reduced motion
  communicates every transition without movement.
- **Preserve / exclude:** preserve polling, classic/carousel choice, QR,
  fullscreen, and cached-data behavior; exclude a dashboard replatform or new
  audience interactions.
- **Assertable acceptance:** the named full-page transition stories and focused
  tests prove classic/carousel parity, venue legibility, announced loading,
  retry, and starting/live/finished state changes.

### Contract 7: Browse Jams hierarchy

- **Hierarchy and action order:** the browsing promise and current Jams lead;
  search, sort, and status navigation refine results; past Jams are disclosed
  secondarily; Clear Filters is primary only when filters caused the empty state.
- **Above the fold:** phone retains the promise, filters, count, and first current
  Jam or constructive empty action; desktop adds columns without promoting past
  inventory over current results.
- **Transitions and feedback:** initial loading replaces results, refreshing keeps
  stale results visible, recoverable error pairs stale data with retry, and first-
  use, section-empty, and filtered-empty states never compete.
- **Preserve / exclude:** preserve client search/sort, section counts, past
  disclosure, route links, and JamCard behavior; implementation remains blocked
  from merge until the Jam detail promise is aligned.
- **Assertable acceptance:** the named Browse Jams stories and page tests prove
  distinct empties, keyboard/phone filtering, stale refresh/error behavior, long
  content, and navigation into the refined Jam detail destination.

### Contract 8: Create Jam and Musicians consistency

- **Hierarchy and action order:** both host pages use one header/section rhythm;
  Create/Update or Edit is primary, Cancel is quiet, and Delete is destructive
  and confirmed; Spotify import remains an alternate creation path.
- **Above the fold:** phone retains page identity, the first required fields or
  directory search, and the primary action; desktop adds table density and
  secondary controls without changing action priority.
- **Transitions and feedback:** validation focuses the first invalid field;
  create/update/delete and musician-edit pending, failure, and success states
  remain visible; directory query failure has targeted retry.
- **Preserve / exclude:** preserve authentication, Jam payloads, Spotify import,
  musician update, pagination, and desktop/mobile representations; exclude new
  administration capabilities and backend DTO changes.
- **Assertable acceptance:** the named Create Jam and Musicians stories and
  focused tests prove create/edit distinction, validation focus, destructive
  confirmation, pagination access, distinct directory empties, and query retry.

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

Direct composition evidence now available:
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

Direct composition evidence now available:
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

Direct composition evidence now available:
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

Direct composition evidence now available:
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

Direct composition evidence now available:
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

Direct composition evidence now available:
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

Direct composition evidence now available:
`Pages/Screen refinement/Browse Jams hierarchy`, covering results, first-use, and
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

Direct composition evidence now available:
`Pages/Screen refinement/Create Jam and Musicians`, with distinct create/edit
Jam and Musicians-directory states.

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
