# Domain Glossary — the-jam-app-frontend

Terms below were pinned down during the 2026-08-06 architecture review and its follow-up grilling sessions. See `docs/adr/` for the reasoning behind the more consequential calls.

## site config module

`site.config.ts` at the repo root: pure TypeScript, no DOM/React/Node dependency, included by both `tsconfig.app.json` and `tsconfig.node.json`. It owns the app's route pattern list (`ROUTES`), the bot-facing route classifier (`matchRoute`), and the JSON-LD structure builders (`buildHomeJsonLd`, `buildBrowseJsonLd`, `buildAboutJsonLd`, `buildJamJsonLd`). Imported by every runtime that needs to know "what pages exist and how they present themselves to crawlers": the browser bundle (`App.tsx`, `BrowseJamsPage.tsx`, `AboutPage.tsx`, `JamDetailPageV2.tsx`), the Vercel Edge Middleware (`middleware.ts`), and the Node build scripts (`scripts/prerender.ts`, `scripts/generate-sitemap.ts`).

Before this module existed, five files each maintained an independent copy of this information, which had already drifted (see ADR: crawler presentation ownership).

Human-readable **text** is not shared — `middleware.ts` deliberately serves Portuguese-only text to all bots regardless of locale, while the client serves i18n-translated text to real users. Only the JSON-LD *structure* (schema types, field shape, URLs) is unified. Every piece of display text the structure needs — descriptions, feature lists, breadcrumb labels, page language — is a **parameter** on the builder, never hardcoded inside it. That distinction is the whole reason the module is safe to share: hardcoding a breadcrumb label would silently ship English to Portuguese bot traffic.

The CSP script hash and route↔rewrite coverage are kept honest by `scripts/sync-site-config.ts` (`npm run sync:site-config` to regenerate, `npm run check:site-config` to verify — the latter runs as the last step of `npm run build`). It hashes only *executable* inline scripts: `application/ld+json` blocks are data, are not gated by `script-src`, and vary per page, so hashing them would cause permanent false drift.

## unwrapResponse adapter

The single function every service method in `src/services/` returns through: calls the backend, throws on `ApiResponse.success === false`, and returns the unwrapped `T` directly (no `{data, status}` wrapper). Supersedes `withLegacyResponse` — despite the old name, this pattern (not the raw-envelope pattern) is the one every service should use. Has a paginated sibling for `findAll`-style methods.

Before unification, six of the app's eight services returned the raw `ApiResponse<T>` envelope unchecked, leaving `success` verification up to each call site — inconsistently applied, and the direct cause of at least two shipped bugs (a false "success" toast in `MusiciansPage`, silently swallowed errors in `HostJamSongsPage`).

## Role authority: `role` over `isHost`

`AuthUser` carries both a derived `role: UserRole` field and a legacy `isHost: boolean` field from the backend. When they could disagree, `role` is authoritative — `deriveRole()` already checks it first. The `isHost()` context helper (added this session) is `role`-based, not a raw proxy of `user.isHost`. Code should never read `user.isHost` directly; if a divergent `{role: 'user', isHost: true}` pair is possible server-side, that's a backend-contract question outside this frontend's scope.

## Prerendering, Edge Middleware, and the client SPA are three deliberately separate systems

Not a duplication to collapse into one. `scripts/prerender.ts` (build-time headless Chrome) produces real React-rendered static HTML for a handful of purely static routes; `middleware.ts` (Vercel Edge, per-request) is the only thing that can serve bots the dynamic, per-jam routes, and doubles as a fail-safe for the static routes since prerendering fails non-fatally; the client SPA is what real browsers execute. All three stay — only the data they read (routes, metadata, CSP hash) gets unified via the site config module.
