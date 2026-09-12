# Private component workbench

The workbench is an internal-only Storybook environment for developing and reviewing Jam App UI in isolation. It is part of this repository, has no deployment target, and must never contain production credentials or be published as a CI artifact.

## Commands

- `npm run workbench` starts the private workbench locally.
- `npm run workbench:test` runs story interactions in headless Chromium.
- `npm run workbench:build` creates the ignored local `storybook-static/` build.
- `npm run workbench:verify-build` builds twice in temporary directories and requires byte-identical runtime output. It normalizes only Storybook's `generatedAt` and local `userSince` provenance timestamps in `project.json` before comparison.
- `npm run catalogue:baseline` verifies generated catalogue freshness and rejects active reusable visual components whose workbench readiness is still `unknown` or `needs-review`.
- `npm run visual:compare` compares only the explicitly enumerated private visual matrix. See [private visual regression](./private-visual-regression.md) for reference update and noise-control rules; regular workbench tests never write image baselines.

## Shared environment

The toolbar controls the same `data-theme` attribute used by the app, the production i18n instance in Portuguese, English, or Spanish, an initial router location, guest/viewer/musician/host authentication fixtures, responsive phone/tablet/desktop/venue viewports, and simulated reduced motion. Shared configuration lives in `.storybook/`; deterministic data and request handlers live in `src/workbench/`.

Stories must not call live services. Add fixed, typed data to `src/workbench/fixtures.ts` and MSW handlers to `src/workbench/mocks.ts`. Unhandled requests fail so accidental backend, Supabase, analytics, or other production traffic is visible immediately. Fixture identities use the reserved `example.test` domain and stable timestamps.

## Foundation standards

Use these before introducing a reusable visual decision:

- [Color and themes](./color-and-themes.md) defines semantic roles, the Jam reference themes, contrast expectations, and selectable-theme coverage.
- [Typography, spacing, sizing, and responsive foundations](./typography-spacing-responsive.md) defines the product scale and the phone, host-console, and shared-display contexts.
- [Interaction, motion, accessibility, and content standards](./interaction-motion-accessibility-content.md) defines feedback, keyboard and dialog behavior, reduced motion, and multilingual content.

The matching **Foundations** stories are the executable reference examples. Standards describe intent; the stories demonstrate and test representative states.

## Authoring conventions

1. Put durable catalogue stories under `src/workbench/stories/` and title them by design-system area, such as `Forms/Text input`. Phase 3 may colocate focused stories where that makes ownership clearer; update the catalogue ignore entry when adding a new story module.
2. Use typed CSF3 `Meta` and `StoryObj`. Prefer args for component inputs and shared fixtures for domain data.
3. Show meaningful default, empty, loading, error, disabled, overflow, and responsive states where they apply. Use toolbar globals instead of recreating theme, locale, router, authentication, or motion providers.
4. Add a `play` interaction for user-visible behavior. Query by accessible role or label and assert the outcome a user can observe.
5. Keep stories deterministic: no current dates, randomness, timers that cannot be controlled, production imports that perform requests, or environment secrets.
6. Keep accessibility feedback enabled. Existing violations may use `a11y.test: 'todo'`; new or changed components should use `a11y.test: 'error'` once their known violations are resolved.
7. Catalogue every new active reusable visual component in the same change. Mark it `ready` once its durable story and applicable interaction coverage exist, or `exempt` with a specific reason and removal condition. `unknown` and `needs-review` fail CI.

The generated JSON and Markdown calculate workbench coverage directly from component metadata. Do not maintain a second coverage count or checklist by hand.

## Exemptions

`!test` and `!autodocs` are forbidden by default. Record a temporary exemption in `component-catalogue.metadata.json` in the same change, including both the current technical reason and an exact removal condition. The generated catalogue is the authoritative exemption list; do not copy it into a hand-maintained table. A limitation in shared workbench infrastructure is not a valid permanent exemption and must be fixed at the shared seam.

CI runs browser interactions and a deterministic private static build, but neither uploads nor deploys the generated output.

## Isolation contract

- **TypeScript:** production compilation excludes `.storybook/`, `src/workbench/`, stories, and fixtures. `npm run workbench:typecheck`, the browser tests, and the deterministic workbench build own those files instead; catalogue discovery uses `tsconfig.catalogue.json`. Do not add Storybook ambient types to `tsconfig.app.json`.
- **Tailwind:** `src/index.css` lists the production source roots explicitly. Workbench composition markup is added only by `src/workbench/workbench.css`. When adding a new production UI source root, add it to the production list; never add `src/workbench` there.
- **Static assets:** application assets live in `public/`; workbench-only assets live in `.storybook/public/` and are served through Storybook's `staticDirs`. Never place the MSW service worker or other internal tooling assets in the application public root.
- **Dependencies:** Storybook, browser-test, Playwright, and mock-server packages remain in `devDependencies`. Production entry points must not import those packages, `.storybook/`, or `src/workbench/`.
- **Output:** `npm run build` runs the application TypeScript build, Vite build, prerendering, sitemap generation, and the production-isolation assertion. The resulting `dist/` must not contain the MSW worker, private-workbench artifacts, or workbench-only Tailwind utilities.

Before opening a pull request, run `npm run catalogue:check`, `npm run catalogue:baseline`, `npm run workbench:test`, `npm run workbench:verify-build`, `npm run build`, and `npm run test:run`. Catalogue, workbench, and production builds are independent CI checks. The aggregate stack also requires a green Vercel preview before merge.
