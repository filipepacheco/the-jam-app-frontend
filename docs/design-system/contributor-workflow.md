# Design-system contribution workflow

Use this workflow before changing a Jam App UI component or pattern. It is the
entry point for Jam, Music, Schedule, registration, DJ control, and Public
Dashboard work. Detailed contracts remain in the linked sources.

## Know the three sources

- The [component catalogue](./component-catalogue.md) is the inventory: use it
  to find an existing component, its owner, lifecycle, workbench readiness,
  and story evidence. It is generated from
  [`component-catalogue.metadata.json`](../../component-catalogue.metadata.json)
  and source analysis; never edit it by hand.
- The [private component workbench](./workbench-authoring.md) is the
  executable review environment: stories show a component with deterministic
  Jam App fixtures, and their interactions test behavior a contributor can
  observe. It is private and has no production deployment target.
- The foundation standards—[color and themes](./color-and-themes.md),
  [typography, spacing, sizing, and responsive foundations](./typography-spacing-responsive.md),
  and [interaction, motion, accessibility, and content standards](./interaction-motion-accessibility-content.md)—
  are the product rules for color, layout, interaction, accessibility, motion,
  and content. They decide how a component behaves across themes, locales, and
  display contexts.

## Contribution path

1. **Find the canonical component.** Search the catalogue by component, product
   area, or candidate family, then read the linked source and story evidence.
   Reuse the canonical component when its contract fits the Jam App task.
   **Complete when:** the changed source names the chosen canonical component,
   or a migration/design-system record explains why no catalogue entry applies.

2. **Choose the smallest durable change.** Add a new component only when no
   canonical component or documented domain wrapper can own the behavior. Add
   a variant only when the behavior belongs to the component's existing
   semantic contract; otherwise propose a new canonical component. Record the
   resulting active reusable visual component in
   [`component-catalogue.metadata.json`](../../component-catalogue.metadata.json),
   regenerate with `npm run catalogue:generate`, and let the generated
   catalogue remain the inventory. **Complete when:**
   `npm run catalogue:check` reports that the catalogue is current.

3. **Author the workbench evidence.** Follow
   [workbench authoring](./workbench-authoring.md): put durable CSF3 stories
   under `src/workbench/stories/`, use typed and deterministic fixtures from
   `src/workbench/`, and add MSW handlers instead of calling a live service.
   Show applicable default, empty, loading, error, disabled, overflow, and
   responsive states. Add a `play` interaction for user-observable behavior.
   **Complete when:** the story is reachable, `npm run workbench:typecheck`
   passes, and the component is `ready` with story evidence or has a reasoned
   temporary `exempt` entry with a removal condition.

4. **Apply foundations.** Use [color and themes](./color-and-themes.md),
   [typography, spacing, sizing, and responsive foundations](./typography-spacing-responsive.md),
   and [interaction, motion, accessibility, and content standards](./interaction-motion-accessibility-content.md).
   Review phone, host-console, or shared Public Dashboard contexts as the
   feature needs. Check keyboard operation, focus, target size, labels,
   status feedback, reduced motion, Portuguese/English/Spanish expansion, and
   the selectable themes. **Complete when:** the relevant Foundations story
   and component story are reviewed with those globals, and new or changed
   accessibility checks use `a11y.test: 'error'` after known violations are
   resolved.

5. **Run the private checks.** The commands and configuration, rather than
   this document, are authoritative. Run `npm run catalogue:baseline`,
   `npm run workbench:test`, and `npm run workbench:verify-build` when the
   change affects their surfaces. Finish with the application checks required
   by the change, including `npm run build` and `npm run test:run` before
   review. **Complete when:** each applicable command exits successfully and
   no private workbench asset or dependency reaches the production build.

## Exceptions and keep-separate decisions

An **exception** keeps a hand-rolled pattern because a canonical component
would lose necessary Jam App behavior, accessibility, density, or
Public Dashboard distance legibility. A **keep-separate decision** retains
two similar components because their workflows or display contracts differ.

Before either decision, inspect the candidate components, their actual
consumers, and their workbench states. Write the decision in the relevant
migration or design-system record: name the alternatives, the real constraint,
the owner or consumer of each retained implementation, and the condition that
would reopen the decision. Use the existing [Jam and Music](./jam-music-migration.md),
[Schedule and registration](./schedule-registration-migration.md),
[DJ control](./dj-control-migration.md), and
[Public Dashboard](./public-dashboard-migration.md) records as examples.
**Complete when:** that record names the alternatives, constraint, owning
consumer of each retained implementation, and reopening condition.

## Deprecation and migration

Migrate a consumer incrementally: preserve its behavior and its public
accessibility contract while moving it to the canonical component. Update the
catalogue metadata and workbench evidence with the migration. Do not remove a
legacy component until it has an approved replacement **and** a verified
zero-consumer gate: search production source, exports, stories, and catalogue
metadata; confirm every consumer has migrated; then remove the implementation,
exports, metadata, ignores, and generated catalogue entries together.

Record what was removed and intentionally retained in
[deprecated implementation contraction](./deprecated-contraction.md).
**Complete when:** the replacement is documented, the zero-consumer evidence
is reproducible, `npm run catalogue:check` passes after regeneration, and the
affected workbench and application checks pass.
