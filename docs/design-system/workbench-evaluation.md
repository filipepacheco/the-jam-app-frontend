# Private component workbench evaluation

Status: **Adopt Storybook 10.6**

Ticket #31 was a bounded prototype. Ticket #32 replaced the spike with the durable private workbench under `src/workbench/`; the evidence below records the original selection decision. The static output is ignored by Git, has no deployment workflow, and must not be published.

## Decision

Storybook is the selected workbench. It passed the compatibility, isolation, interaction, accessibility-feedback, and private-build gates with React 19, TypeScript 5.9, Vitest 4, the repository's Vite 7 Rolldown alias, Tailwind CSS 4, and DaisyUI 5.

Ladle was not implemented because Storybook passed after one bounded configuration repair. Ladle 5 would provide a lighter runtime, but its lack of third-party add-ons would require separate solutions for accessibility feedback, request mocking, and browser interaction testing. If Storybook later fails the same gates after an upgrade, Ladle must be evaluated against this complete matrix rather than against a reduced scope.

## Evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Representative UI | Pass | Seven portable CSF3 stories cover an alert, portal overlay, form, theme-sensitive dashboard card, auth-backed navigation, request-mocked feedback overlay, and Schedule management. |
| Themes | Pass | The toolbar exposes all 29 values from the app's `THEMES` constant and applies `data-theme` to `document.documentElement`, including portal content. |
| Locales | Pass | Portuguese, English, and Spanish use the production i18n instance and await language changes before rendering. |
| Responsive canvases | Pass | Fixed phone (390×844), tablet (768×1024), desktop (1440×900), and venue (1920×1080) canvases are available. |
| Reduced motion | Pass | A toolbar control changes the `prefers-reduced-motion: reduce` media query observed by components. |
| Stable application context | Pass | Router and i18n decorators plus typed auth, Jam, dashboard, and Schedule fixtures avoid production authentication and services. |
| Stable network mocks | Pass with follow-up | MSW rejects unhandled requests and supplies the Feedback POST response. The story works in the interactive/static workbench; its play test is excluded because the production Modal portals to `document.body`, outside the transformed test iframe. #32 must provide an injectable portal root before enabling this browser test. |
| Interaction tests | Pass | Six CI-eligible stories passed in headless Chromium. The latest cold run took 13.26 seconds end to end after dependency optimization; story execution took 0.92 seconds. Tests exercise dismissal, Escape handling, form submission, authenticated navigation, and Schedule actions. |
| Accessibility feedback | Pass with findings | The a11y add-on runs in `todo` mode so existing violations remain visible. Findings: Modal lacks native `open`/heading association and robust focus behavior; registration labels are not associated with selects; the closed mobile drawer remains in the accessibility tree. These are product defects to catalogue, not reasons to hide feedback. |
| Development startup | Pass | Smoke startup succeeded; Storybook reported roughly 139 ms for the manager and 374 ms for the preview after dependencies were warm. |
| Static build | Pass | Two consecutive `npm run workbench:spike:build` runs completed in 13.4 and 12.1 seconds (Vite compilation: 3.04 and 2.83 seconds). Both produced byte-identical `index.json` and `index.html` hashes. A dedicated Vite configuration keeps production visualizer/chunk settings out of the workbench. |
| Private build | Pass | `storybook-static/` is ignored, no deploy workflow references it, and stories use fixed non-secret data. |
| App isolation | Pass with inherited issue | The app Vitest configuration is unchanged. The repository typecheck retains its pre-existing unused `@ts-expect-error` failure in `src/hooks/useQueueReorder.ts`; the spike introduced no app type error. |

The first two static-build attempts exposed an `msw-storybook-addon` v3 loader API mismatch. Switching to the add-on's supported CSF3 loader resolved it; no application component needed modification.

## Configuration and maintenance assessment

- Configuration is bounded to four `.storybook` files and a clearly marked spike directory.
- Stories use CSF3 `Meta`/`StoryObj`, serializable args, decorators, loaders, and `play` functions from `storybook/test`. These conventions are portable to Storybook's test tooling and avoid Vitest-only mocks in story files.
- A dedicated Vite configuration is necessary because the application config contains production-only bundle analysis and chunking.
- Browser tests require installed Chromium and a supported Node runtime. CI should use Node 22 and cache npm dependencies.
- The shared environment in #32 should split decorators, typed fixtures, and request handlers into focused modules; prohibit live Supabase/backend access; fail unhandled requests; and document temporary a11y/test exemptions with reasons.
- Storybook packages must remain on one pinned major/minor version to avoid add-on protocol drift.

## Adoption gates for future upgrades

Re-evaluate the decision if, after one bounded repair attempt, Storybook cannot build with the Vite alias, compile all DaisyUI themes, run deterministic Chromium stories, isolate portals/router/auth/MSW without production changes, or stay within 15 seconds warm startup, 120 seconds static build, and five minutes for the browser-test job.

## Primary sources

- [React Vite framework](https://storybook.js.org/docs/get-started/frameworks/react-vite)
- [Vite builder configuration](https://storybook.js.org/docs/builders/vite)
- [Themes with data attributes](https://storybook.js.org/docs/essentials/themes)
- [Toolbars and globals](https://storybook.js.org/docs/essentials/toolbars-and-globals)
- [Viewport configuration](https://storybook.js.org/docs/essentials/viewport)
- [Vitest add-on](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)
- [Interaction testing](https://storybook.js.org/docs/writing-tests/interaction-testing)
- [Accessibility testing](https://storybook.js.org/docs/writing-tests/accessibility-testing)
- [Mock Service Worker integration](https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-network-requests)
- [Static builds and publication considerations](https://storybook.js.org/docs/sharing/publish-storybook)
- [Component Story Format](https://storybook.js.org/docs/api/csf)
- [Ladle add-on limitations](https://ladle.dev/docs/addons/)
