# Architecture Improvement Specification

Status: accepted for implementation.

This specification turns the architecture improvement plan into observable, behavior-preserving delivery requirements. Domain language is defined in `CONTEXT.md`; architectural choices are recorded in `docs/adr/`.

## Program outcome

Complete five architecture tracks and verify them on one merged stack before visual screen redesign begins:

1. canonical-family governance;
2. Host Schedule management;
3. Live Queue interaction;
4. Music library workflow;
5. Jam participation.

Each workflow presents one small state-and-command interface. Production screens and deterministic tests use that same interface.

## Program-wide requirements

- Preserve successful-path behavior and existing visual baselines unless a ticket documents a bug correction.
- Normalize thrown errors and resolved `{ success: false }` responses into explicit typed outcomes.
- Represent partial success explicitly and refresh authoritative state after any remote mutation that may have succeeded.
- Return semantic outcome codes and structured details from workflow controllers. Screens translate and render them.
- Keep destructive confirmation presentation in screens. Controllers expose pending intent and consequence data, then accept confirmed commands.
- Lock commands per affected entity or workflow. Reject duplicate commands for the same entity while pending.
- Keep backend `Schedule*` transport names inside adapters; use Performance domain language within new modules.
- Update catalogue metadata, workbench evidence, tests, and architecture documentation in the ticket that changes them.

## Compatibility exclusions and debt

- Do not redesign screens during this program.
- Do not rename backend `Schedule*` DTOs, fields, or endpoints. A backend contract migration to Performance terminology is recorded debt.
- Do not add guest Musicians. Every Musician remains User-backed; guest Musician support is recorded product and backend debt.
- Do not change Music filtering from current-page filtering to server-wide filtering. Record this as migration debt because pagination totals currently describe the server result while filters apply to the loaded page.
- Do not claim atomic Live Queue conflict prevention. The backend exposes no revision token; strict compare-and-swap persistence is backend contract debt.

## Architecture shape

Each workflow consists of:

- a framework-neutral controller owning state transitions and orchestration;
- a small public state-and-command interface;
- a thin React hook responsible only for subscription and lifecycle;
- production transport adapters;
- deterministic in-memory adapters and controllable clock/scheduler adapters where time affects behavior.

Adapters translate legacy backend Schedule data into Performance domain data. Internal seams are not exposed merely for testing.

## Track 1: canonical-family governance

### Behavior

- Give every governed repeated-family candidate a stable ID that survives line movement and ordinary regeneration.
- Store exactly one disposition for each governed candidate:
  - `adopted`, naming the canonical family;
  - `intentionally-distinct`, with rationale;
  - `migration-debt`, with replacement and completion condition;
  - `deletion-debt`, with verification condition.
- Validate the evidence required by each disposition.
- Fail catalogue checks for a new unexplained candidate inside a governed scope.
- Permit legacy candidates only through an explicit baseline disposition; do not fail all raw syntax candidates at once.

### Initial dispositions

- Keep browse `JamCard` and the host summary intentionally distinct; rename the host implementation to remove false equivalence.
- Rename the Public Dashboard `Navbar` to a controls/settings panel and mark it intentionally distinct from application navigation.
- Centralize duplicated Jam status tone projection.
- Remove the unreachable Music table row and its private action implementation after verifying no consumers. Retain or relocate `MusiciansBadges`.

### Verification

- Schema tests cover every disposition and required evidence field.
- Fixture tests prove stable IDs and progressive enforcement.
- Catalogue freshness and reviewed-baseline checks pass.

## Track 2: Host Schedule management

### State

Expose ordered Performances, suggested and active projections, filtered projections, counts, available Music, pending entity IDs, pending confirmation, and the latest semantic outcome.

### Commands

Support search/filter changes, Music catalogue loading, notes updates, status transitions, Performance creation/removal, registration approval/removal, bulk registration approval, and authoritative refresh.

### Rules

- Approving a Suggestion appends it after the last active Performance.
- Search and completeness counts retain current observable semantics.
- Bulk operations keep successful writes, report failed registrations, refresh authoritative state, and permit retry of failures.
- Batch host registration keeps failed entries visible after partial success.
- Resolved failure responses never produce success feedback.

### Verification

Deterministic tests cover projection/order, success, resolved failure, thrown failure, partial failure, duplicate-command rejection, and refresh failure through the controller interface.

## Track 3: Live Queue interaction

### State and commands

Expose canonical server state, editable draft order, reorder-session state, input-mode state, persistence state, conflict state, and semantic outcomes. Support beginning, changing, saving, and canceling a reorder plus mouse, touch, and keyboard intents.

### Rules

- A reorder session snapshots the starting server order.
- Polling never silently overwrites an active draft.
- Before save, compare the most recently polled queue fingerprint with the starting fingerprint. On mismatch, reject the save and require reload/reapply.
- On persistence failure, restore the starting server snapshot rather than the edited draft.
- Polling after a successful save reconciles to authoritative server state.
- Cancel all timers, animation frames, listeners, and pending callbacks on cleanup.
- Document the race that remains without backend revision-token support.

### Verification

Deterministic tests cover mouse, touch, keyboard, polling during edits, conflict, save, rollback, server reconciliation, debounce, and cleanup through the production controller interface.

## Track 4: Music library workflow

### State and commands

Expose approved-page query state, current-page filtering/sorting, pagination, suggested count/list state, per-entity moderation state, pending confirmation, modal intent, and semantic outcomes. Support query, page/filter/sort changes, create/edit/suggest completion, approve, reject, delete, and refresh.

### Rules

- Every main, count, suggested-list, and post-mutation refresh failure is observable.
- Preserve current-page filtering and existing mutation refresh semantics unless a documented failure requires authoritative reconciliation.
- Confirmation callbacks are represented as typed intent, not mutable function refs.
- Unrelated entity actions remain available while one entity mutation is pending.

### Verification

Deterministic tests cover viewer and host queries, pagination, filtering, sorting, moderation success/failure, confirmation, refresh failure, and concurrent entity actions.

## Track 5: Jam participation

### State and commands

Expose eligible Performances, selected Performance, active overlay, pending operation, share capability state, and semantic outcomes. Support choosing a Performance, registration, suggesting existing Music, creating-and-suggesting new Music, sharing, overlay transitions, and refresh.

### Rules

- A Performance is enrollment-eligible only when it is non-suggested, otherwise enrollable, and the Musician is not already registered.
- The single-Performance shortcut and multi-Performance picker use the same eligibility projection.
- Resolved registration/suggestion failures never trigger success or refresh behavior.
- If Music creation succeeds and Performance linking fails, keep the Music, return a structured partial outcome, and retry linking with that Music rather than creating a duplicate.
- Feedback expiry begins after authoritative refresh completes and uses an injectable clock.

### Verification

Deterministic tests cover eligibility, overlay transitions, registration and suggestion outcomes, create-link partial failure/retry, refresh timing, and share capability outcomes.

## Delivery constraints

- Implement through vertical test-driven tracer bullets: one failing interface-level behavior, minimal implementation, then the next behavior.
- Use a fresh worktree from current `main` for every implementation ticket.
- Review each ticket against its fixed merge base for repository standards and this specification.
- Merge only when required checks and both review axes pass.

## Closeout evidence

- Every governed repeated-family candidate has a valid disposition.
- Jam summary and Public Dashboard naming decisions are reflected in code and catalogue metadata.
- Dead Music table implementation is removed without removing live badge behavior.
- All four workflow test suites cross the same interfaces used by production screens.
- Touched workbench exemptions are removed or retain a specific reviewed reason.
- Catalogue freshness, workbench, interaction, accessibility, visual, privacy, production-isolation, lint, typecheck, and relevant tests pass on the merged stack.
