# Architecture Improvement Plan

Status: complete. Decisions are recorded in `CONTEXT.md`, `docs/adr/`, and `docs/architecture-improvement-spec.md`; implementation and closeout are tracked by GitHub issues #101–#113 and PR #126.

This plan captures the architecture work identified after the complete UI catalogue review. It deliberately separates behavior-preserving architecture work from later screen refinement.

## Outcome

Finish five architecture tracks, merge and verify all of them, then begin the screen-improvement program.

Architecture completion means:

- Live Queue behavior is concentrated behind one small interface.
- Host Schedule behavior is concentrated behind one small interface.
- Music library behavior is concentrated behind one small interface.
- Jam participation transitions are concentrated behind one small interface.
- Every repeated UI-family candidate has an explicit disposition.
- Relevant tests exercise the same interfaces used by production callers.
- Catalogue, workbench, visual, and production-isolation checks pass on the merged stack.

## Guardrails

- Preserve product behavior during this program, except for documented bug corrections in the accepted specification.
- Keep deliberate visual redesign for the later screen phase.
- Treat existing visual baselines as behavior evidence; change them only for a documented bug correction.
- Update catalogue metadata, isolated states, tests, and architecture documentation in the ticket that changes them.
- Treat the Component catalogue and Private component workbench CI workflows as milestone gates during this program: ordinary pull requests receive a fast deferred result, while the full workflows run manually or with the `architecture-track-gate` label at the end of each of the five tracks. Production build and test checks remain per-pull-request gates.
- Preserve meaningful Jam, Music, Schedule, registration, DJ control, and Public Dashboard differences instead of merging by appearance alone.
- Use a fresh worktree from current `main` for every implementation ticket. The checkout in which this plan was written contains unrelated work in progress.

## Architecture Tracks

### 1. Canonical-family governance

Deepen the catalogue so it governs duplication rather than only detecting repeated syntax.

Required dispositions:

- adopted
- intentionally distinct, with rationale
- migration debt, with replacement and completion condition
- deletion debt, with verification condition

Known review targets include the two Jam summary implementations, the application navigation and Public Dashboard controls modules, repeated Jam status mappings, repeated inline action/card/field/badge/menu/modal patterns, and unused Music table code.

Completion criterion: every candidate in scope has a validated disposition, and new unexplained candidates fail the catalogue check according to the agreed progressive-enforcement policy.

### 2. Host Schedule management

Concentrate Schedule projection, filtering, order rules, host commands, loading, partial outcomes, refresh, and feedback behind a deep module.

Completion criterion: the Schedule screen renders state and invokes commands through one interface; deterministic tests cover success, failure, partial failure, ordering, and refresh behavior through that interface.

### 3. Live Queue interaction

Concentrate queue ordering, mouse/touch/keyboard interaction, polling reconciliation, persistence, rollback, and cleanup behind a deep module. Use production and deterministic adapters at the seam.

Completion criterion: the live host screen no longer coordinates input modes and persistence directly; tests cover interaction and reconciliation through the same interface used by the screen.

### 4. Music library workflow

Concentrate Music queries, pagination, filtering, host moderation, confirmation, refresh, and explicit failure outcomes behind a deep module.

Completion criterion: the Music screen consumes one coherent state-and-command interface; no query failure is silently discarded; deterministic tests cover viewer and host workflows.

### 5. Jam participation

Concentrate enrollment, suggestion, new-Music creation, performance selection, sharing, overlay transitions, refresh timing, and feedback behind a Jam participation module.

Completion criterion: participant intent and transitions are explicit and deterministically tested; touched workbench exemptions are removed or retain a concrete, reviewed reason.

## Dependency Order

```text
Canonical-family governance
        |
        +-- Jam summary disposition
        +-- Public Dashboard controls naming decision
        +-- dead Music table verification/removal
        |
        +-----------------------------+
                                      |
Host Schedule management --> Live Queue interaction
                                      |
Music library workflow ---------------+--> Jam participation
                                      |
All tracks ----------------------------+--> Architecture closeout
```

Music library work may be developed alongside Schedule work, but merges should follow the dependency edges and be reconciled on current `main` before the next dependent ticket starts.

## Delivery Flow

### Phase 1: sharpen decisions

Status: complete.

Resolved terminology, ownership, seam placement, compatibility requirements, governance enforcement, deletion conditions, partial outcomes, queue conflict handling, and deferred backend capabilities. Stable terms live in `CONTEXT.md`; hard-to-reverse decisions live in ADRs.

### Phase 2: write the specification

Status: complete.

The accepted specification is `docs/architecture-improvement-spec.md`.

### Phase 3: create tracer-bullet tickets

Status: complete.

Create one parent GitHub issue and approximately 10–14 self-contained child tickets. Encode blocking edges with GitHub issue dependencies. Tickets created from the specification are agent-ready and do not need triage.

Completion criterion: every ticket produces a thin, testable end-to-end improvement, declares its blockers, and can be implemented without recovering missing decisions from this plan.

### Phase 4: implement and merge

Status: complete.

For each unblocked ticket:

1. Start a fresh worktree from current `main`.
2. Drive test-first one behavior slice at a time.
3. Update the catalogue and supporting evidence within the same ticket.
4. Run the Standards and Spec reviews against the fixed merge base.
5. Open a focused pull request.
6. Merge only after the per-pull-request checks and both review axes pass.
7. Begin the next ticket in a fresh context.

At each architecture-track boundary, run both milestone workflows against the integrated branch and resolve their findings before starting the next track. This cadence is temporary; restore catalogue and workbench enforcement on every pull request during architecture closeout.

Completion criterion: the ticket is merged, its child issue is closed, and dependent tickets see its final interface on current `main`.

### Phase 5: architecture closeout

Status: complete.

Verify the merged stack, not isolated branches.

Required closeout evidence:

- Every repeated-family candidate has a disposition.
- Jam summary implementations are consolidated or intentionally separated.
- Public Dashboard controls have accurate naming or documented separation.
- Verified dead Music table code is removed.
- Schedule, Live Queue, Music library, and Jam participation tests cross their production interfaces.
- Relevant workbench exemptions are reduced or explicitly justified.
- Catalogue freshness, workbench, interaction, accessibility, visual, privacy, and production-isolation checks pass.

Completion criterion: the parent architecture issue contains the evidence above and every child ticket is closed.

Closeout evidence was verified on PR #126:

- Production build and isolation: [Build and verify production output](https://github.com/filipepacheco/the-jam-app-frontend/actions/runs/34793680087/job/103822570917).
- Catalogue freshness and reviewed baseline: [Check catalogue](https://github.com/filipepacheco/the-jam-app-frontend/actions/runs/34793680057/job/103822570850).
- Interactions, strict accessibility, 32 canonical visual baselines, privacy, and deterministic workbench build: [Test and build privately](https://github.com/filipepacheco/the-jam-app-frontend/actions/runs/34793680081/job/103822570896).
- Deferred backend contracts are recorded in `docs/backend-debt.md`.

## Planned Merge Sequence

1. Canonical-family governance schema and checks.
2. Verified dead-code removal and naming corrections.
3. Host Schedule-management module.
4. Live Queue interaction module.
5. Music-library workflow module.
6. Jam-participation module.
7. Remaining repeated-family dispositions and migrations.
8. Merged-stack architecture closeout.

## Screen Phase Handoff

Screen work begins only after architecture closeout. The detailed program is
[`screen-refinement-frontier.md`](./screen-refinement-frontier.md). Start with:

1. Live host control.
2. Schedule management.
3. Music library.
4. Host dashboard.
5. Jam detail.
6. Public Dashboard full-page transitions.
7. Browse Jams empty-state hierarchy.
8. Create Jam and Musicians consistency.

Use the design critique workflow for each screen, apply the smallest relevant design workflow, and finish with a polish pass. Preserve the design intent recorded in `.impeccable.md`.

## Reference Evidence

- `docs/design-system/component-catalogue.md`
- `docs/design-system/workbench-progress.md`
- `component-catalogue.metadata.json`
- `.impeccable.md`

The architecture observations were captured against `origin/main` on 2026-09-12 and revalidated against `main` at program start.
