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

## `backend.automatic-registration-approval` — Jam-level automatic approval

- Tracking issue: [#153](https://github.com/filipepacheco/the-jam-app-frontend/issues/153).
- Current constraint: Jam read and update contracts do not expose an automatic-approval setting.
- Needed contract: persist the Jam setting, authorize host updates, define its default, and apply it when a Performance Registration is created.
- Frontend boundary: do not simulate this behavior with local state. Add the management control only after the API can return and update the authoritative value.
- Complete when: read, update, registration-creation, authorization, migration, and end-to-end contract tests pass.

## `backend.music-duplicate-identity` — Server-authoritative duplicate rejection

- Tracking issue: [#154](https://github.com/filipepacheco/the-jam-app-frontend/issues/154).
- Current constraint: a frontend check can inspect only loaded or paginated Music and cannot prevent concurrent duplicate creation.
- Needed contract: define normalized Music identity, reject duplicates atomically, and return a stable error code plus the existing Music identity when appropriate.
- Frontend boundary: a preflight check can improve feedback speed, but the create endpoint remains authoritative.
- Complete when: manual and Spotify identities, normalization edge cases, and concurrent create requests have contract tests and localized frontend recovery.

## `backend.music-album-artwork` — Persisted Music artwork

- Tracking issue: [#155](https://github.com/filipepacheco/the-jam-app-frontend/issues/155).
- Current constraint: Music and Performance responses do not contain persisted album artwork for Jam detail.
- Needed contract: persist an optional artwork URL and source, return it with Music, validate remote sources, and define unavailable-image behavior.
- Frontend boundary: retain the current media fallback; do not infer artwork from a Spotify link during Jam rendering.
- Complete when: imported and manual Music responses, image-source validation, fallback behavior, and Jam-detail integration tests pass.
