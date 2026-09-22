# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Jam App serves three primary user contexts:

- Musicians join Jams and manage their participation, usually one-handed on a phone in an active, noisy venue.
- Hosts create and schedule Jams, manage musicians and Music, and make fast, consequential decisions while running a live event from a phone or desktop console.
- Audiences follow the current and upcoming Performances through a shared Public Dashboard viewed at a distance.

Developers and maintainers also rely on the private component workbench and catalogue to keep those experiences coherent as the product evolves.

## Product Purpose

Jam App coordinates the complete karaoke Jam workflow: discovery and registration, Music and musician management, scheduling, live queue operation, and audience-facing venue display. Success means each participant can understand the current state and take the next useful action without interrupting the live event.

## Positioning

Jam App connects participant registration, host scheduling, live operational control, and a venue-ready public display in one shared Jam state. The same Music, Performance, and queue information moves through the musician, host, and audience experiences instead of being managed in separate tools.

## Operating Context

- Musicians use the product in crowded, time-sensitive venue conditions where reachability, concise feedback, and resilient mobile layouts matter.
- Hosts use it before and during live events, including loading, refresh, stale-data, offline or reconnect, destructive, rollback, and conflict states.
- Audiences consume the Public Dashboard passively on large displays, where distance legibility and persistent current-state communication take priority over control density.
- Portuguese is the reference language. English and Spanish are supported, including expansion from long labels, names, and song titles.
- The product supports exactly two selectable themes, `jam-light` and `jam-dark`, and must communicate state equivalently when reduced motion is requested.

## Capabilities and Constraints

- Hosts can create and manage Jams, schedules, Music, musicians, and live Performance queues.
- Musicians can browse Jams, register, and select instruments or participation details.
- Public venue dashboards show current and upcoming Performance information and support live updates.
- Spotify integration supports playlist workflows through the existing authentication and API contracts.
- The frontend is a React and TypeScript web application backed by Supabase authentication and a separate API with JWT authorization.
- Existing Jam, Performance, Schedule, Live Queue, Music, and Musician terminology and behavior are product contracts. Presentation refinement must not silently change them.
- Offline actions, reconnection, polling, and stale-data behavior remain explicit parts of supported workflows.
- The private Storybook workbench, component catalogue, and private visual evidence are development infrastructure and must not enter the production bundle or public deployment.

## Brand Commitments

The product name is Jam App. Its established voice is energetic, social, welcoming, and music-native while remaining precise during live operations. Existing identity assets, factual product copy, supported locales, and semantic theme behavior must be preserved unless separately approved.

## Evidence on Hand

- Production routes and components under `src/` implement the musician, host, and audience workflows.
- Deterministic stories under `src/workbench/stories/` document component and page states.
- `component-catalogue.metadata.json` and the generated catalogue record canonical components and consumers.
- `docs/screen-refinement-frontier.md` records accepted surface contracts and their implementation evidence.
- The repository contains tests for application behavior, localization, workbench interaction, production isolation, and private visual regression.
- No additional customer claims, testimonials, benchmarks, pricing commitments, or external proof should be invented from this record.

## Product Principles

1. Put the current Music and the next useful action first.
2. Adapt the interaction density to the real context: touch-first for musicians, precise for hosts, and glanceable for audiences.
3. Keep live, pending, stale, failure, recovery, and destructive states unmistakable without hiding the underlying Jam state.
4. Preserve shared domain truth across registration, scheduling, live control, and public display.
5. Improve canonical components and foundations before applying repeated local fixes.

## Accessibility & Inclusion

Preserve the repository's established keyboard, focus, naming, live-feedback, contrast, target-size, localization, and reduced-motion behavior. The Impeccable workbench review program does not expand accessibility scope; any newly discovered prerequisite that blocks a component change is recorded separately rather than absorbed into the visual review.
