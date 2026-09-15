# Impeccable Workbench Review

## Baseline

- Plan: `docs/design-system/impeccable-workbench-review-plan.md`
- Status: Phase 1 complete and integration-ready; backend contract work deferred
- Comparison base: `88adf2925087e81641e14b234602ebe097798312`
- Base source: `origin/main`
- Base verified: 2026-09-15
- Base subject: `Screen refinement frontier integration (#152)`

All `design-system:warn` and `design-system:check` runs for this review use the full comparison-base SHA above. The SHA is intentionally fixed even if `origin/main` advances during the review.

## Working-state note

The review began in the existing `codex/screen-refinement-frontier-3` worktree, which already contained staged and unstaged Phase 0 visual-regression work. Because `origin/main` contains the squash integration of the branch's committed frontier work, branch history was not rewritten while the index was dirty. Existing changes are preserved and the fixed base above is the authority for review comparisons.

## Phase 0 checklist

- [x] Fetch and verify the latest `origin/main`.
- [x] Record an immutable comparison base.
- [x] Install the checksum-verified Impeccable `0.1.5` engine in the standard user cache.
- [x] Run `impeccable context`.
- [x] Create and confirm `PRODUCT.md` from accepted product context.
- [x] Generate and review `DESIGN.md` and `.impeccable/design.json` from the incumbent system.
- [x] Run and classify the catalogue, workbench, privacy, and visual baseline gates.
- [x] Record the Phase 0 baseline decision.

## Baseline results

| Gate | Result | Classification |
| --- | --- | --- |
| `npm run catalogue:check` | Pass after regeneration | The in-progress `canonicalAdoption` merge always emitted an undefined field. The merge was corrected to omit absent metadata, then the generated JSON and Markdown catalogue were refreshed. |
| `npm run workbench:typecheck` | Pass | Baseline is type-correct. |
| `npm run workbench:test` | 176 passed, 24 failed across 9 of 36 story files | Inherited baseline debt. The failing story sources and their production consumers do not differ from the fixed `origin/main` base. Failures are concentrated in locale-sensitive interaction assertions and Public Dashboard/carousel expectations already described by the screen-refinement ledger. |
| `npm run visual:privacy` | Pass | Private visual policy remains enforced. |
| `npm run visual:compare` | 6 passed, 26 changed, 0 missing, 0 unexpected | Baseline render drift. No reference was updated; human review and a design reason are required before any update. |
| `npm run visual:progress:check` | Command passes with an incomplete-evidence notice | 90 strict accessibility reports are present where 114 are expected. Accessibility expansion is outside this review and remains separately tracked. |

### Inherited workbench failures

- `ArchitectureCloseout.stories.tsx`: 1
- `BrowseJamsPage.stories.tsx`: 3
- `CreateJamMusiciansPage.stories.tsx`: 3
- `HostDashboardPage.stories.tsx`: 1
- `JamDetailPage.stories.tsx`: 5
- `MusicLibraryPage.stories.tsx`: 2
- `PublicDashboardCarousel.stories.tsx`: 2
- `PublicDashboardPage.stories.tsx`: 6
- `ScheduleManagementPage.stories.tsx`: 1

### Phase 0 decision

Phase 0 has a fixed comparison base, durable product and design context, a current catalogue, passing type and privacy checks, and explicitly classified inherited browser/visual debt. No visual reference was changed to manufacture a passing baseline. The pilot may proceed using the failure inventory above to distinguish existing debt from new findings.

## Phase 1 pilot

### Scope and method

- Primary target: `Foundations/Action controls`
- Representative composition: `Domain/Jam/Summary and actions`
- Assessment method: two independent agents; design review completed before detector evidence entered synthesis.
- Visual contexts: `jam-light` desktop, `jam-dark` phone, Jam summary desktop and phone.
- Accessibility: explicitly excluded from findings and remediation per the plan.
- Detector: one invocation across both story sources; 0 findings. Direct browser evidence exposed implementation imported behind the story that the source-only detector did not inspect.

### Scores

- Design critique: **24/40 — Acceptable**
- Scoped technical audit: **10/16 — Acceptable** (performance 3/4, theming 3/4, responsive design 2/4, implementation integrity 2/4; accessibility not scored)
- Cognitive load: **moderate**, with 2 of 8 checks failing; no decision point exceeds four visible options.

### Findings

| Severity | Finding | Durable owner | Disposition proposal | Command | Estimate |
| --- | --- | --- | --- | --- | --- |
| P1 | Primary, secondary, and destructive filled actions compete instead of preserving one spotlight. | Canonical Action usage contract and `ActionControls` evidence | Add an action-group decision grammar; keep one filled primary and defer danger emphasis until destructive context. | `$impeccable quieter` | 0.5–1 day |
| P1 | Four controls wrap into an accidental 1–2–1 mobile ladder, creating unintended grouping and danger emphasis. | New canonical action-group recipe | Define responsive primary, secondary/escape, overflow, and danger placement. | `$impeccable adapt` | 0.5–1 day |
| P1 | Loading and disabled share `opacity: 0.58`, so active progress looks unavailable. | `Action.css` state contract | Preserve loading presence; reserve strong fading for disabled state. | `$impeccable clarify` | 0.25–0.5 day |
| P1 | `JamCard` bypasses the canonical action family and its Spanish story exposes the Portuguese `Dashboard ao vivo` fallback. | `JamCard` plus all locale files | Adopt the canonical destination-action treatment and add the locale key in English, Spanish, and Portuguese. | `$impeccable harden` | 0.5 day |
| P2 | Canonical Action stories use only fixed English specimen copy and do not prove expansion at phone width. | `ActionControls.stories.tsx` | Add deterministic localized long-label and loading-footprint evidence. | `$impeccable harden` | 0.25–0.5 day |
| P2 | The desktop Jam summary stretches to roughly 1201×324px, leaving a dead center and detached bottom-right action; its resting shadow also conflicts with the documented layered-by-default system. | `JamCard` composition | Constrain its reading measure and group the action with related context; use tonal layering before shadow. | `$impeccable layout` | 0.5 day |

### Positive evidence

- Canonical controls maintain a stable 44px height and clear focus treatment.
- Light and dark themes preserve equivalent semantic order without overflow.
- Long Jam content remains contained and readable at phone width.
- Music-specific verbs make operations recognizable without relying on icons.

### Pilot exit estimate

The accepted pilot can be implemented in approximately **2–3 engineering days plus one bounded desktop/mobile inspection and human Storybook approval**. The work should land as a focused canonical Action/action-group batch with the JamCard integration included as proof, not as a page redesign.

### Phase 1 implementation

- [x] Added a canonical `ActionGroup` contract with stable primary, supporting/overflow, and danger slots.
- [x] Established deliberate desktop grouping and a full-width phone hierarchy with separated danger treatment.
- [x] Kept loading actions visually present and reserved reduced opacity for disabled actions.
- [x] Migrated the JamCard dashboard destination to the canonical navigation-link treatment.
- [x] Added `jams.live_dashboard` in English, Spanish, and Portuguese.
- [x] Constrained JamCard reading width, replaced the resting shadow with tonal layering, and grouped date, location, song count, and registration count as discovery facts.
- [x] Added an explicit primary Jam-detail destination while keeping the live dashboard as a distinct supporting action.
- [x] Added localized phone action evidence and explicit desktop/phone JamCard evidence.
- [x] Regenerated and validated catalogue metadata, including stable `ActionGroup` identity.
- [x] Verified the six affected stories through the Storybook MCP and inspected the five review stories at desktop and phone widths.
- [x] Human Storybook approval.

### Human review round 1

Portuguese feedback was captured on 2026-09-15 and will continue to be discussed in English. The feedback is routed into bounded screen batches so each correction can be inspected before visual references are accepted.

| Batch | Requested correction | Disposition |
| --- | --- | --- |
| Browse Jams hierarchy | Add location; group song count with date and location; add registered-musician count; add a clear Jam-detail CTA beside the live-dashboard CTA. | Implemented and approved after the Phase 1 correction rounds. |
| Create Jam and musicians | Automatically import a supplied Spotify playlist after Jam creation; require date and time; expose host name and contact. | Implemented and approved after the Create Jam correction rounds. |
| Create Jam and musicians | Allow the host to choose automatic registration approval. | Backend contract dependency: no Jam field for this preference exists in the current Swagger schema or frontend DTOs. |
| Host dashboard | Put “View public page” beside Manage; omit public-page actions for planned and past Jams. | Implemented and approved after the Host dashboard correction round. |
| Jam detail | Align the title/action row; move description first; integrate the Jam Spotify action; simplify the location popover; strengthen Share; move “How it works” into an explanatory modal; reduce filter size; align per-song Spotify actions. | Implemented and approved after the Jam detail correction rounds. |
| Jam detail | Render persisted album artwork for each song. | Backend contract dependency: Spotify lookup returns `albumImageUrl`, but the current create/response music DTOs do not store or return it. |
| Schedule management | Make the small add path choose Spotify import or manual entry; Spotify URL submission should advance to a prefilled details step requiring only genre, description, and instruments. | Implemented and approved after applying the existing two-mode interaction model to library creation. |

The Phase 1 correction uses `_count.registrations` because that is the aggregate currently returned by the Jam list contract. If the product requires a distinct-person count rather than registration records, the API must expose that aggregate explicitly.

### Human review round 2

The Browse Jams correction received a second Portuguese review on 2026-09-15. The follow-up correction keeps long venues to one visual line with an ellipsis, stacks the page heading and subtitle at every viewport, compacts the supporting Spotify link, and places the live-dashboard destination at the left with the primary Jam destination at the right on desktop. The phone composition keeps the primary Jam destination first. The corrected phone, long-content, and desktop compositions pass their Storybook interactions, were visually inspected together, and are approved.

### Human review round 3

The result count previously occupied its own row whose height increased when the conditional clear-filter action appeared, changing the vertical rhythm between filtered and unfiltered results. The count badge now stays at the left of the horizontally scrollable status filter, and the optional clear action shares that same control-height row, so filtering changes horizontal capacity rather than vertical spacing.

### Human review round 4

The Create Jam correction removes the separate Spotify-import entry point from the form. Date and time are now required, host name and contact are visible and prefilled from the signed-in host, and a supplied playlist URL triggers import only after the Jam has been created. A failed import never rolls back or duplicates the Jam: the form locks and offers a focused retry of the import or a route to the host dashboard without importing. The phone validation and desktop partial-success states pass their focused Storybook interactions and accessibility checks and are approved. Automatic registration approval is deferred until the backend preference field documented above exists.

### Human review round 5

The Host dashboard now presents “View public page” as a visible supporting action beside the primary Manage action for active and live Jams. Planned and finished Jams have no public-page action in either the card action group or overflow menu. The operational desktop and phone compositions pass focused Storybook interaction and accessibility checks and are approved.

### Human review round 6

The Jam detail identity area now aligns the title and Jam-level actions, places the description first, integrates the playlist link into the action group, and gives Share a labelled secondary treatment. The location popover no longer repeats its accessible label as a visual heading. Participation guidance is available through a focused explanatory modal, instrument filters use a quieter compact visual treatment while retaining accessible targets, and each track's Spotify action sits beside its artist. Moving that track action also exposed and corrected a nested-interactive accessibility defect in completed Performance cards by giving disclosure its own control. The focused phone/desktop stories pass interaction and strict accessibility checks. Persisted album artwork is deferred until the documented response-contract dependency exists.

### Human review round 7

The schedule's small add path now opens library creation with an explicit manual-or-Spotify choice. Spotify mode initially asks only for a track URL; a successful lookup advances in the same modal to editable title, artist, link, and duration values, with genre, description, and instrument needs available for completion. The focused Storybook flow covers the real metadata request and prefilled transition, passes strict accessibility checks, was visually inspected in its completed state, and is approved.

### Human review round 8

The Create Jam page now uses a tighter header-to-form rhythm, and its recoverable Spotify state presents one compact warning instead of stacking success and warning alerts. Shared alerts keep their message and actions in distinct responsive rows. The Jam guidance and enrollment dialogs use bounded phone-height sheets, render instrument identity and availability as one compact option, and stay above floating page actions. The location popover uses a quiet copy action sized to its content. Live-host transport controls use three anchored, equal columns so Previous no longer escapes the control row. These six states were checked at a 390×844 viewport; focused interaction, type, lint, and catalogue verification is recorded below.

### Human review round 9

The Spotify recovery alert now uses concise recovery copy, a smaller icon and line-height, no action-column indent, and a short retry label. Create Jam field groups use a 12px phone rhythm with compact card padding while preserving the roomier desktop composition. The address popover's copy action is now intrinsically sized and underlined instead of filling the popover width. These three corrected phone states are included in the approval below.

### Human Storybook approval

- Reviewer: product owner
- Date: 2026-09-15
- Scope: all corrections recorded in human review rounds 1–9, across Browse Jams, Create Jam and musicians, Host dashboard, Jam detail, schedule management, enrollment, location, alerts, and live-host playback controls.
- Decision: approved. The reviewed implementations and their desktop/phone compositions are accepted for integration.
- Remaining dependencies: automatic registration approval and persisted album artwork still require the backend contract fields documented in round 1.

### Phase 1 verification

| Gate | Result | Classification |
| --- | --- | --- |
| Storybook MCP focused `test-run` | 6 passed | All affected Action and Jam summary stories pass. Accessibility execution was disabled because it is outside this review plan. |
| Storybook MCP correction `test-run` | 3 passed | The corrected Jam summary stories and Browse Jams hierarchy story pass. Accessibility execution remained disabled per review scope. |
| Focused unit tests | 9 passed | `Action.test.tsx` and `JamCard.test.tsx`. |
| Focused JamCard correction test | 2 passed | Jam discovery facts and both destination actions are covered. |
| `npm run test:i18n` | 4 passed | All locale files retain matching structure. |
| `npm run catalogue:check` / `catalogue:baseline` | Pass | Generated catalogue is current and the reviewed baseline is complete. |
| `npm run workbench:typecheck` | Pass | Workbench sources are type-correct. |
| `npm run workbench:verify-build` | Pass | 229-file build is deterministic after normalizing the MCP addon's volatile component-manifest fields. |
| `npm run visual:privacy` | Pass | Visual evidence remains private. |
| `design-system:warn` / `design-system:check` against fixed base | Pass with reviewed-debt warnings | No new enforcement failure. |
| `npm run build` | Pass | Production build, five-route prerender, sitemap, and production-isolation checks pass. |
| Human review round 8 focused stories | 6 passed | Create validation/recovery, Jam guidance/enrollment/location, and playback transport checks pass after the phone-width correction. |
| Human review round 8 focused source checks | Pass | TypeScript build, lint for all touched sources, 12 focused unit tests, and catalogue validation pass. |
| Human review round 9 focused checks | Pass | Two corrected Storybook interactions, 12 focused unit tests, the 4-test locale smoke suite, TypeScript, touched-source lint, catalogue freshness, and production-workbench isolation pass. The final production build subsequently completed all five prerender routes. |
| Full `npm run workbench:test` | 183 passed, 19 failed | The same 9 inherited story files remain the only failures. The progress reducer now records this incomplete evidence instead of aborting. |
| Full unit suite | 287 passed | The 268 host-runnable tests pass. The remaining 19 Git-dependent design-system tests pass in Linux; split execution avoids the host's unaccepted Xcode license without changing test semantics. |
| `npm run lint` | 6 errors, 107 warnings | Six parser errors come from nested `.claude/worktrees`; the pilot's touched source/config files have no lint errors. |
| `npm run visual:update` | Pass | In the pinned `mcr.microsoft.com/playwright:v1.55.1-noble` renderer, 27 byte-changed cells were accepted after product-owner approval; no cells were added or removed. |
| `npm run visual:compare` | 32 passed, 0 changed, 0 missing, 0 unexpected | The refreshed references are stable in the canonical renderer. |
| `npm run visual:progress:check` | Pass | The deterministic report records 110 interaction passes, 19 inherited failures, 97 of 116 strict accessibility reports, 19 missing reports, and 32 visual passes. |
| Impeccable detector | 0 findings | All changed production UI targets pass the final mechanical detector. |

### Phase 1 decision

The pilot implementation and all subsequent correction rounds have received human Storybook approval. The approved visual references were refreshed in the canonical Linux renderer and compare cleanly across all 32 cells. Affected tests, catalogue gates, type checks, deterministic workbench build, design-system enforcement, localization smoke tests, production build, prerender, sitemap, production isolation, and the Impeccable detector pass. Phase 1 is integration-ready against the fixed `origin/main` comparison SHA; automatic registration approval and persisted album artwork are explicitly deferred until their backend contract fields exist.
