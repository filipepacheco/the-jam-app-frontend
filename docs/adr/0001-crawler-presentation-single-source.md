# 0001: Single owning module for crawler-facing routes, metadata, and CSP hash

## Status

Accepted (2026-08-06)

## Context

Five files independently encoded overlapping "how this app presents itself to crawlers" logic: `middleware.ts` (own route table + own JSON-LD), `App.tsx` (own home JSON-LD), `BrowseJamsPage.tsx` (own browse JSON-LD), `AboutPage.tsx` (own about JSON-LD), `JamDetailPageV2.tsx` (own MusicEvent JSON-LD), `index.html` (static fallback), and `vercel.json` (own route table + a CSP script-src hash). This had already drifted — the middleware's home JSON-LD included fields App.tsx's copy didn't — and directly caused a shipped bug: `/about` was added to `App.tsx`'s routes but not to `middleware.ts`'s route table for three days, during which Googlebot indexed an empty shell. Separately, the CSP hash in `vercel.json` no longer matches the actual SHA-256 of `index.html`'s inline anti-FOUC script (verified by direct computation) — the script's text changed in a later commit, the hash never did.

The app runs three deliberately separate rendering systems (see `CONTEXT.md`): build-time Puppeteer prerendering, Vercel Edge Middleware, and the client SPA. Each exists for a real reason — middleware is a fail-safe since prerendering fails non-fatally, and it's the only system that can serve bots on dynamic per-jam routes.

## Decision

Keep all three rendering systems. Consolidate only the *data* they read — route patterns, JSON-LD structure, and the CSP hash — into one root-level, pure-TypeScript module (no DOM/React dependency), added to both `tsconfig.node.json` and `tsconfig.app.json` so it's importable from the browser bundle, the Edge Middleware, and the Node build scripts alike.

Human-readable metadata text stays split: PT-only for bots (existing behavior), i18n-translated for real users. Only structure unifies.

Route unification is a shared pattern list plus a build-time conformance check (does `App.tsx`'s `<Routes>` match the shared list?) — not full JSX generation. React Router's `<Route element={...}>` wiring isn't pure data and shouldn't be forced through a generated layer.

The CSP hash is computed by reading the actual built `index.html` (not a separately maintained string constant), written into `vercel.json` by a `sync:site-config` script, and verified — not silently regenerated — in CI.

## Consequences

- Route/metadata drift becomes a build-time failure instead of a silent production gap.
- The CSP hash can't diverge from the script it's meant to authorize, because it's derived from the built artifact, not hand-copied.
- A future replatform to a framework with built-in SSR/SSG (Next.js, Astro, Remix) would make most of this moot — deliberately out of scope for this decision, and not blocked by it.
