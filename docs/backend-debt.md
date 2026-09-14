# Backend and product debt

These items are deliberately outside the behavior-preserving frontend architecture program. They remain open until the backend contract supports the completion evidence below.

## `backend.guest-musicians` — Musicians without User accounts

- Current constraint: every Musician is backed by an authenticated User.
- Needed contract: create, identify, edit, merge, and remove a guest Musician without requiring a User record while preserving registrations and host permissions.
- Frontend boundary: continue treating Musician and User as different domain concepts; do not synthesize guest Users.
- Complete when: backend DTOs and authorization rules support guest Musicians, migration behavior is defined, and end-to-end registration tests cover both User-backed and guest Musicians.

## `backend.performance-language` — Schedule-to-Performance naming migration

- Current constraint: backend DTOs, fields, and endpoints expose individual Performances through `Schedule*` names.
- Needed contract: rename individual-item contracts to Performance terminology while reserving Schedule for the ordered collection of Performances in a Jam.
- Frontend boundary: adapters retain legacy `Schedule*` transport names and translate them to Performance language inside workflow modules.
- Complete when: the backend publishes migrated DTOs/endpoints, compatibility and data migration are complete, frontend adapters no longer consume legacy names, and contract tests pass on both sides.

## `backend.live-queue-revisions` — Atomic Live Queue updates

- Current constraint: queue fingerprints detect a changed poll but cannot close the race between the last comparison and a reorder request.
- Needed contract: return a revision token with Live Queue state and require the expected revision on reorder mutations using compare-and-swap semantics.
- Frontend boundary: keep current fingerprint conflict detection as best-effort and never describe it as atomic.
- Complete when: reorder accepts an expected revision, rejects stale writes deterministically, returns the new revision, and concurrent-client contract tests pass.

## `backend.music-server-filtering` — Server-wide Music filtering and sorting

- Current constraint: filters and sorting apply only to the loaded Music page while pagination totals describe the unfiltered server result.
- Needed contract: accept query, filter, and sort parameters server-side and return totals for the filtered result set.
- Frontend boundary: preserve current-page filtering semantics until that contract exists and remains represented explicitly in the Music library controller.
- Complete when: the backend supports the query contract, pagination metadata reflects filtered results, the frontend delegates filtering/sorting, and multi-page integration tests pass.
