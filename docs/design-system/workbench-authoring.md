# Private component workbench

The workbench is an internal-only Storybook environment for developing and reviewing Jam App UI in isolation. It is part of this repository, has no deployment target, and must never contain production credentials or be published as a CI artifact.

## Commands

- `npm run workbench` starts the private workbench locally.
- `npm run workbench:test` runs story interactions in headless Chromium.
- `npm run workbench:build` creates the ignored local `storybook-static/` build.
- `npm run workbench:verify-build` builds twice in temporary directories and requires byte-identical runtime output. It normalizes only Storybook's `generatedAt` and local `userSince` provenance timestamps in `project.json` before comparison.

## Shared environment

The toolbar controls the same `data-theme` attribute used by the app, the production i18n instance in Portuguese, English, or Spanish, an initial router location, guest/viewer/musician/host authentication fixtures, responsive phone/tablet/desktop/venue viewports, and simulated reduced motion. Shared configuration lives in `.storybook/`; deterministic data and request handlers live in `src/workbench/`.

Stories must not call live services. Add fixed, typed data to `src/workbench/fixtures.ts` and MSW handlers to `src/workbench/mocks.ts`. Unhandled requests fail so accidental backend, Supabase, analytics, or other production traffic is visible immediately. Fixture identities use the reserved `example.test` domain and stable timestamps.

## Authoring conventions

1. Put durable catalogue stories under `src/workbench/stories/` and title them by design-system area, such as `Forms/Text input`. Phase 3 may colocate focused stories where that makes ownership clearer; update the catalogue ignore entry when adding a new story module.
2. Use typed CSF3 `Meta` and `StoryObj`. Prefer args for component inputs and shared fixtures for domain data.
3. Show meaningful default, empty, loading, error, disabled, overflow, and responsive states where they apply. Use toolbar globals instead of recreating theme, locale, router, authentication, or motion providers.
4. Add a `play` interaction for user-visible behavior. Query by accessible role or label and assert the outcome a user can observe.
5. Keep stories deterministic: no current dates, randomness, timers that cannot be controlled, production imports that perform requests, or environment secrets.
6. Keep accessibility feedback enabled. Existing violations may use `a11y.test: 'todo'`; new or changed components should use `a11y.test: 'error'` once their known violations are resolved.

## Exemptions

`!test` and `!autodocs` are forbidden by default. A temporary exemption must be recorded in the table below in the same change, with its story, owner ticket, reason, and exact removal condition. A limitation in shared workbench infrastructure is not a valid permanent exemption and must be fixed at the shared seam.

| Story | Owner ticket | Reason | Removal condition |
| --- | --- | --- | --- |
| `SuggestNewSongModal` | #33 | Cross-service Spotify, music, and schedule orchestration | Add injected adapters or complete request scenarios in #35 |
| `SuggestSongModal` | #33 | Schedule-domain request orchestration | Add Jam request scenarios in #35 |
| `MusicianProfileModal` | #33 | Fetches its profile internally | Add a typed profile request scenario in #36 |
| `MusicModal` | #33 | Create/edit submit behavior belongs to the Music slice | Add create/edit scenarios in #35 |
| `OnboardingModal` | #33 | Mutates authenticated profile state | Add deterministic auth mutation fixtures in #39 |
| `ProfileSetupModal` | #33 | Mutates authenticated profile state | Add deterministic auth mutation fixtures in #39 |
| `HostMusicianRegistrationModal` | #33 | Multi-registration queue orchestration | Add queue scenarios in #36 |
| `ScheduleEnrollmentModal` | #33 | Enrollment mutation belongs to the Schedule slice | Add enrollment scenarios in #36 |
| `ShareModal` | #33 | Clipboard and native-share capability branches | Add controlled browser capability fixtures in #39 |
| `SpotifyExportModal` | #33 | Integration is currently hidden in product UI | Re-enable the integration and add scenarios in #35 |
| `SpotifyImportModal` | #33 | Multi-mode Spotify and Jam orchestration | Add the integration request matrix in #35 |

CI runs browser interactions and a deterministic private static build, but neither uploads nor deploys the generated output.
