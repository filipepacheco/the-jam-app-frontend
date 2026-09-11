# 0002: Every service call goes through one response-envelope adapter

## Status

Accepted (2026-08-06)

## Context

The backend's `ApiResponse<T>` envelope (`{data, success, message?, error?}`) was handled three different ways across the frontend: `jamService`/`jamControlService` used `withLegacyResponse` (throws on `!success`, unwraps `data`); the other six services returned the raw envelope and left the `success` check to each call site, which about half of them skipped; and `App.tsx`'s `swrFetcher` reimplemented the check a third time for call sites that bypassed the service layer entirely with a bare `useSWR(url)`. This directly caused shipped bugs: `MusiciansPage` shows a success toast even when the backend returns `success: false`, and `HostJamSongsPage`'s remove/reorder handlers have empty catch blocks that silently no-op on failure.

## Decision

Every service method returns through one adapter (renamed from `withLegacyResponse`, since despite its name it was the correct pattern, not the legacy one). It returns `T` directly — not `{data, status}`; nothing reads `status`. It has a paginated sibling for `findAll`-style methods. On failure it throws a plain `Error`, defaulting to the existing `generic_error` i18n key when no call-site-specific message is given. Bare `useSWR(url)` call sites that bypass the service layer get routed through real, named service methods instead.

Rollout is phased: the adapter itself lands first with unit tests and zero behavior change (only the two services already using it are affected), then each of the remaining six services migrates as its own commit, fixing the confirmed-broken call sites in the same commit as the service they belong to.

## Consequences

- One place decides what "the API call succeeded" means; a call site can no longer silently skip the check.
- The migration touches ~16 calling files across six services — real but bounded, tracked as separate commits rather than one large change.
- `jamControlService.reorderQueue` was found, while grilling a separate candidate, to read `response.success` manually in `useQueueReorder.ts` rather than going through the adapter despite `jamControlService` being one of the two services assumed already-compliant — the service needs a full audit, not just the six services originally scoped as non-compliant.
