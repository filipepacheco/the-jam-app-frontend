# Storybook component audit report

Status: non-accessibility implementation complete; accessibility findings
deferred by the thread owner on 2026-09-16.

## Audit anchor

- Date: 2026-09-16
- Branch: `codex/ui-theme-and-feedback-polish`
- Commit: `36603a4b4c09d254590a830aa3a126e5925a92e4`
- Audit plan: `docs/design-system/storybook-component-audit-plan.md`
- Scope: documentation-only audit. No production component, story, fixture,
  visual baseline, generated catalogue, or catalogue metadata was changed.
- Follow-up scope: the thread owner subsequently accepted `AUD-002` and
  `TF-001`, asked for all non-accessibility work to be fixed, and explicitly
  deferred accessibility work. The implementation changes are recorded below.
- Pre-existing work preserved: untracked `.agents/` and `skills-lock.json`.
- Storybook: reachable on port 6006; its MCP enumerated 203 stories and ran
  story tests.

## Executive summary

The active component inventory is completely classified in the checked-in
catalogue: 134 active reusable visual components, 123 workbench-ready and 11
explicitly exempt, with no `needs-review`, `unknown`, or ready-without-story
records. The catalogue has 184 total records and 177 eligible source files.

Five root design findings passed the contract/runtime/correction evidence gate:
one P1 and four P2. No P0 or P3 finding survived falsification. A separate P1
technical follow-up records the stale generated catalogue and currently broken
workbench verification; it is outside the design finding count as required by
the audit plan.

The system is coherent overall. Foundation examples, semantic DaisyUI color
usage, the canonical control families, and the retained Jam/Music/DJ variants
give the product a recognizable, non-generic character. The highest-leverage
correction is Public Dashboard text contrast in selectable themes.

### Audit health score

| Category | Score | Evidence summary |
| --- | ---: | --- |
| Accessibility | 2/4 | Strong names and controls, but verified contrast and heading-order failures remain. |
| Performance | 3/4 | No audit-visible systemic issue; animation-state tests expose deterministic reduced-motion gaps. |
| Responsive design | 3/4 | Phone, host-console, and venue compositions are broadly resilient; one sole-song summary truncates content. |
| Theming | 2/4 | Reference themes are coherent; selectable `night` fails contrast in a distance-display family. |
| Anti-patterns | 4/4 | Semantic color roles and existing primitives dominate; no new abstraction is supported by the evidence. |
| **Total** | **14/20 — Good** | Solid system with a short, evidence-backed correction backlog. |

## Wave 0 — baseline and inventory

### Command outcomes

| Command | Result | Classification |
| --- | --- | --- |
| `npm run catalogue:check` | Failed | Generated `component-catalogue.json` and `docs/design-system/component-catalogue.md` are stale. Technical baseline debt; do not regenerate during this audit. |
| `npm run catalogue:baseline` | Failed | Same generated-catalogue drift. Technical baseline debt. |
| `npm run workbench:typecheck` | Failed | `PublicDashboardCarousel.stories.tsx:57` and `:66` pass legacy `pt`; the supported type is `pt-BR \| en \| es`. |
| `npm run workbench:test` | Blocked | Script stops at the typecheck failure. Live MCP testing was run separately. |
| `npm run visual:privacy` | Passed | No privacy-policy violation. |
| `npm run visual:compare` | Diagnostic only | Host renderer: 6 passed, 26 changed, 0 missing, 0 unexpected. Repository policy makes macOS pixels non-blocking; canonical conclusions require the pinned Linux renderer. |
| `npm run visual:progress` | Passed | Host diagnostic produced reports, which were restored because audit output must not rewrite generated progress records. |
| `npm run visual:progress:check` | Passed | Report consistency passed before the host-derived reports were restored. |
| `npm run workbench:verify-build` | Failed | Same two locale type errors. |

The Storybook MCP full run reported 20 story-test errors. Focused runs separated
three causes: stale localized accessible-name assertions, reduced-motion tests
that inspect an initial invisible animation state, and current axe violations.
These failures are tracked in `TF-001` or the relevant design finding rather
than treated as 20 independent design defects.

### Accessibility debt classification

Fourteen story modules contain `a11y.test: 'todo'`:

| Classification | Modules | Disposition |
| --- | --- | --- |
| Active debt | `PublicDashboardCards` | Keep `todo` until `AUD-001` is corrected and the selectable-theme matrix passes. |
| Candidate for strict checking | `DJControl`; `Feedback/Alerts`; `Feedback/ErrorBoundary`; `Forms`; `Foundations/ColorAndThemes`; `JamTimeline`; `MusicLibrary`; `Navigation/CanonicalNavigation`; `RemainingUI`; `SchedulePrimitives`; `ScheduleRegistration`; `States/EmptyState`; `States/Loading` | Live axe did not reproduce component-specific debt. Promote to `a11y.test: 'error'` together as `AUD-005`, then verify. |
| Legacy-only evidence | None | No module qualified as legacy-only. |

Static counts at the audit anchor are 36 story modules, 14 modules containing a
`todo` scope, and 23 containing an `error` scope. A module may contain both.

### Wave 0 record

- Reviewed: repository state, generated catalogue coverage, all required
  verification commands, Storybook reachability, story enumeration, and the
  complete static accessibility-policy inventory.
- Skipped: no required baseline step. Canonical pixel acceptance was unavailable
  because this host is not the pinned Linux renderer.
- Positive patterns: every active reusable visual component has either ready
  story evidence or an explicit exemption; there are no ready-without-story
  records.
- Rejected candidates: host-native pixel changes were not promoted to findings
  because repository policy classifies them as diagnostic.
- Tooling gap: stale generated catalogue data and the two story type errors
  prevent a clean scripted baseline; see `TF-001`.
- First recommendation: restore `TF-001` only in a later implementation change;
  the audit itself must remain documentation-only.

## Findings backlog

### AUD-001 — Public Dashboard text contrast in selectable themes

| Field | Required content |
| --- | --- |
| ID | `AUD-001` |
| Wave/family | Wave 3 — Public Dashboard cards and display |
| Story and context | `Domain/Public Dashboard/Cards and display/Current and next`; selectable `night` theme, English, desktop/shared-screen canvas, static state. Reference `jam-light` and `jam-dark` were also reviewed. |
| Production owner | Catalogue `ui.0082` `CurrentSongCard` and `ui.0087` `NextSongCard`; both are rendered by `src/pages/PublicDashboardPage.tsx`. |
| Category | Accessibility; theme; visual |
| Severity | P1 major |
| Problem and impact | Axe reports serious text-contrast failures in the current/next-song cards under the supported selectable `night` theme. Measured ratios included 4.41:1 and 1.87:1. This weakens performer and song legibility on a distance display, the family's primary context. |
| Contract evidence | `color-and-themes.md` requires readable semantic content roles across selectable themes; `interaction-motion-accessibility-content.md` requires WCAG contrast. The Public Dashboard migration record treats distance legibility as a core contract. |
| Runtime evidence | Live Storybook axe identified the failing card text. Catalogue tracing maps both ready components to `PublicDashboardPage`, which renders `CurrentSongCard` and `NextSongCard` for the live venue route. A 1920×1080 composition check confirmed the cards are visible in the production composition; this is not a wrapper-only artifact. |
| Correction | Map distance-read text to the existing dashboard content roles (`--ds-content-primary` and `--ds-content-secondary`) for every selectable theme. Reserve accent roles for borders, indicators, and other non-body-text emphasis. Verify `night`, `jam-light`, and `jam-dark` in the same story before promoting its a11y policy. |
| Confidence | Medium — axe and runtime reach are direct; the exact visual role assignment needs human review because it changes the venue palette. |
| Pattern disposition | Existing public-dashboard domain components; no new primitive. |
| Human decision | Deferred — thread owner, 2026-09-16; accessibility work explicitly postponed. |

Highest-leverage action for this family: correct the shared distance-text role
mapping once, then verify every dashboard card and full-page state against it.

### AUD-002 — Schedule enrollment summary truncates sole song content

| Field | Required content |
| --- | --- |
| ID | `AUD-002` |
| Wave/family | Wave 3 — Schedule primitives and registration |
| Story and context | `Architecture/Closeout workflows/Performance enrollment`; 390×844 phone risk, long-content schedule fixture, musician enrollment modal, Portuguese reference and longest representative content. |
| Production owner | Catalogue `ui.0115` `ScheduleDetailsCard`; consumed by `ScheduleEnrollmentModal` and `HostMusicianRegistrationModal`, with the self-enrollment path reached from `JamDetailPageV2`. |
| Category | Responsive; localization; content |
| Severity | P2 minor |
| Problem and impact | `ScheduleDetailsCard` applies single-line `truncate` to both the only song title and artist. Long or translated content is discarded precisely where a musician is deciding whether to enroll in that performance. |
| Contract evidence | `interaction-motion-accessibility-content.md` forbids truncating sole song-title occurrences; `typography-spacing-responsive.md` requires user and translated content to wrap at narrow widths. The Schedule migration record keeps this card intentionally distinct, so the correction belongs to the card rather than a cross-family abstraction. |
| Runtime evidence | Before correction, `ScheduleDetailsCard.tsx` applied `truncate` to the title and artist. Import tracing proves both enrollment modal consumers; the live Architecture story visibly clipped the long fixture. After correction, a 390×844 browser measurement reports no horizontal overflow and multi-line title/artist heights of 40px/32px. |
| Correction | Replace the two single-line truncation classes with the existing `ds-wrap-user-content` behavior, preserving the current card and metadata layout. Add a 390px long-content assertion that the full accessible strings remain present without horizontal overflow. |
| Confidence | High |
| Pattern disposition | Intentionally distinct Schedule card; correct its existing contract, do not merge it into another summary component. |
| Human decision | Accepted and implemented — thread owner, 2026-09-16; explicit instruction to fix all non-accessibility items. Plan: `docs/design-system/storybook-audit-aud-002-implementation-plan.md`. |

Highest-leverage action for this family: make the enrollment decision summary
content-complete at phone width while preserving the Schedule-specific card.

### AUD-003 — Shared feedback and confirmation headings can skip levels

| Field | Required content |
| --- | --- |
| ID | `AUD-003` |
| Wave/family | Waves 2 and 4 — Feedback, overlays, and refined page compositions |
| Story and context | `Human review/Screen refinement/Create Jam and musicians/Edit delete confirmation` and `Recoverable musician error`; jam-light, English, desktop page composition, keyboard-capable state. |
| Production owner | Catalogue `ui.0006` `Alert`, `ui.0009` `ConfirmDialog`, and shared `Modal`; confirmed consumers include `CreateJamPage`, `MusiciansPage`, `MusicPage`, and `ScheduleTab`. |
| Category | Accessibility; implementation integrity |
| Severity | P2 minor |
| Problem and impact | Axe reports heading-order failures: the Delete Jam confirmation and recoverable error introduce `h3` after a page `h1`, skipping `h2`. Screen-reader heading navigation no longer represents the visible hierarchy. |
| Contract evidence | `interaction-motion-accessibility-content.md` requires semantic structure and navigable headings. The canonical overlay contract already exposes `Modal.headingLevel`; the accepted screen-refinement composition remains authoritative except where a current accessibility regression is proven. |
| Runtime evidence | Live axe reproduces both violations. `Modal.tsx` defaults its heading to `h3`; `ConfirmDialog` does not pass a level. `Alert.tsx` hard-codes `h3`. Catalogue consumer traces prove broad production reach. |
| Correction | Pass `headingLevel="h2"` from page-level `ConfirmDialog` flows using the existing `Modal` API. Add a typed heading-level prop to `Alert`, defaulting compatibly, and pass `h2` only where the alert is a page section directly beneath `h1`. Add heading-order assertions to the two composition stories. |
| Confidence | High |
| Pattern disposition | Existing canonical feedback and overlay families; no new primitive. |
| Human decision | Deferred — thread owner, 2026-09-16; accessibility work explicitly postponed. |

Highest-leverage action for these shared families: make heading level an owned,
explicit composition decision without changing the visual typography.

### AUD-004 — Reduced-motion dashboard states initially render invisible

| Field | Required content |
| --- | --- |
| ID | `AUD-004` |
| Wave/family | Wave 3 — Public Dashboard carousel, controls, and status |
| Story and context | `Domain/Public Dashboard/Carousel and controls/Controls panel`, `Expandable QR`, and `Pages/Public Dashboard/Stale data`; reduced motion, English, desktop/shared-screen canvas. |
| Production owner | Catalogue `ui.0086` `DashboardControlsPanel`, `ui.0090` `QRCodeCorner`, and `ui.0088` `OfflineBanner`; all are rendered by `PublicDashboardPage`. |
| Category | Accessibility; motion; implementation integrity |
| Severity | P2 minor |
| Problem and impact | With reduced motion enabled, tests that inspect the newly visible state encounter opacity 0 for the panel close control, QR dialog, or stale/offline banner. Users requesting less motion can receive a transiently hidden state instead of an immediate state change. |
| Contract evidence | `interaction-motion-accessibility-content.md` requires reduced motion to remove nonessential transitions without hiding information. Existing dashboard cards provide the local exemplar by skipping their initial animation in reduced-motion mode. |
| Runtime evidence | Focused Storybook tests reproduce immediate-visibility failures. `DashboardControlsPanel` always initializes the backdrop at opacity 0 and initializes the panel below full opacity even when transition duration is zero. `OfflineBanner` starts below full opacity when duration is zero. `QRCodeCorner` already attempts `initial={false}` for reduced motion, so its failing story/test must be stabilized against the same immediate-state contract rather than assigned a new animation design. |
| Correction | For every affected motion node, use the existing dashboard-card pattern: when reduced motion is active, skip the initial variant (`initial={false}`) and render the final visible state synchronously. Keep current normal-motion transitions. Update the stories to wait only for semantic state changes, not animation frames. |
| Confidence | High |
| Pattern disposition | Existing Public Dashboard domain components; reuse the established reduced-motion pattern. |
| Human decision | Deferred — thread owner, 2026-09-16; accessibility and reduced-motion work explicitly postponed. Story assertions now wait for settled visual state, but the production motion behavior is unchanged. |

Highest-leverage action for this family: centralize the already-used immediate
reduced-motion behavior across every dashboard entrance/overlay state.

### AUD-005 — Clean accessibility scopes remain marked `todo`

| Field | Required content |
| --- | --- |
| ID | `AUD-005` |
| Wave/family | Waves 1–3 — cross-product workbench governance |
| Story and context | Thirteen modules listed in Wave 0; both reference themes where applicable, their authored locale and viewport states, static and interactive stories. |
| Production owner | Catalogue-backed ready components represented by the thirteen modules. `PublicDashboardCards` is excluded until `AUD-001` is resolved. |
| Category | Accessibility; implementation integrity |
| Severity | P2 minor |
| Problem and impact | The workbench treats reviewed, currently clean component scopes as known accessibility debt. Future violations in these scopes will not fail the suite, reducing the value of the private workbench as a regression gate. |
| Contract evidence | `workbench-authoring.md` requires ready components without documented component-specific debt to use strict `a11y.test: 'error'`. The audit plan explicitly names stale `todo` scopes as a governance smell. |
| Runtime evidence | Live MCP axe runs did not reproduce component-specific violations in the thirteen listed modules. The full run did identify Public Dashboard card debt, which is deliberately excluded and proves the classification is not a blanket mechanical promotion. |
| Correction | Change only the thirteen clean module-level policies from `todo` to `error`; run every affected story, and revert any scope that reveals documented component-specific debt instead of suppressing it. Promote `PublicDashboardCards` only after `AUD-001` passes. |
| Confidence | High |
| Pattern disposition | Catalogue-backed governance correction; no product primitive change. |
| Human decision | Deferred — thread owner, 2026-09-16; accessibility governance work explicitly postponed. |

Highest-leverage action for workbench governance: turn already-reviewed clean
coverage into an enforcing regression boundary.

## Technical follow-up outside the design finding count

### TF-001 — Restore the workbench verification baseline

Severity: P1. Status: non-accessibility portion completed on 2026-09-16.

The two legacy `pt` fixtures now use `pt-BR`. Obsolete localized queries,
portal-scoping mistakes, duplicated responsive controls, animation-frame races,
and reused mock state were corrected in their owning stories. The Storybook MCP
interaction run passes all 203 stories with accessibility disabled, as requested
by the thread owner. The generated catalogue is current and both catalogue
checks pass.

The remaining failures from the normal accessibility-enabled runner correspond
to deferred `AUD-001`, `AUD-003`, and `AUD-004` work. They are not interaction
baseline failures and were not suppressed or reclassified.

The pinned Linux renderer found all 32 cells and reported 25 pass / 7 changed,
with no missing or unexpected cells. The same seven changes reproduce from an
untouched archive of the audit anchor (`HEAD`), so this implementation introduced
no new canonical visual drift. The host macOS run remains diagnostic only (6
pass / 26 changed), and no image baseline was updated.

This follow-up is functional/tooling integrity, not a sixth visual-design
finding.

## Wave records

### Wave 1 — Foundations

- Reviewed: all six required Foundation groups: color/themes; typography,
  spacing, and responsive; action controls; field controls; data display; and
  interaction, accessibility, and content.
- Skipped: no required group. Unsupported exhaustive theme/locale products were
  intentionally omitted per the risk matrix.
- Positive patterns: semantic DaisyUI roles are consistently demonstrated;
  action and field sizing is coherent; the two Jam reference themes have clear
  hierarchy and recognizable music-stage character.
- Rejected candidates: the phone foundation exemplar truncates an intentionally
  extreme story-only current-song string, but runtime tracing found no
  production owner for that exact exemplar. It is an evidence gap, not a
  production finding.
- Tooling gap: canonical Linux pixels were unavailable; macOS renders were used
  only as diagnostics.
- First recommendation: No supported product recommendation from Foundations;
  preserve the exemplars and use them to judge later families.

### Wave 2 — Shared primitives and cross-product patterns

- Reviewed: Forms/current components; alerts, notifications, and error boundary;
  empty/loading states; canonical and Jam overlays; canonical and application
  navigation; remaining reusable UI.
- Skipped: no required group.
- Positive patterns: canonical actions, fields, overlays, and navigation expose
  stable semantic variants; long feedback copy wraps; focusable controls use
  named accessible labels and consistent target sizing.
- Rejected candidates: differing Jam overlay and generic modal treatments match
  their recorded migration/keep-separate decisions; they are not duplicate
  primitive evidence. Localized application-navigation test failures render
  valid current accessible names and are assertion drift, not copy defects.
- Tooling gap: typecheck failure blocks the scripted workbench test entry point;
  MCP testing supplied runtime evidence.
- First recommendation: `AUD-003`, because one composition-owned heading choice
  corrects shared feedback/confirmation semantics without visual redesign.

### Wave 3 — Domain families

| Family | Reviewed evidence | Positive pattern to preserve | Similarity disposition | First recommendation |
| --- | --- | --- | --- | --- |
| Jam | Summary/actions, timeline, overlays, long translated phone composition | Titles, descriptions, and actions wrap with 44px touch targets | Retained V2/Jam variants are canonical or recorded migration evidence | No supported recommendation |
| Music | Library cards, viewer/host variants, long user content | Song, artist, and notes wrap without losing the primary task | Viewer and host variants are intentionally distinct | No supported recommendation |
| Schedule | Primitives, actions, registration, enrollment composition | Compact metadata and action ownership remain clear | Schedule cards are intentionally distinct, not missing abstractions | `AUD-002` |
| DJ Control | Playback, statistics, queue rows, long host-control composition | Dense host-console controls remain legible and operational | Legacy/V2 evidence follows the recorded migration | No supported recommendation |
| Public Dashboard | Cards, display states, carousel, controls, full venue composition at 1920×1080 | Strong stage hierarchy; next performer remained visible at the target venue viewport | Domain display components are canonical; control panel is intentionally not application navigation | `AUD-001`, then `AUD-004` |

Rejected domain candidates: the 1920×1080 Live Classic composition is taller
than the viewport because of Storybook's outer padding, but the next performer
measured at 1058–1074px and remained visible inside the 1080px venue viewport.
The plan explicitly forbids attributing the decorator's outer 16px to the
component, so no off-screen-performer finding was kept.

### Wave 4 — Composition validation

- Reviewed: stable page compositions, current marketing sections, completed
  screen-refinement groups, and Architecture closeout workflows that exercise
  audited owners.
- Skipped: compositions unrelated to a surviving component candidate.
- Confirmed: `AUD-002` in performance enrollment; `AUD-003` in the accepted
  Create Jam/musicians refinements; `AUD-004` in Public Dashboard stale/overlay
  states; `AUD-001` in the live dashboard owner path.
- Positive patterns: accepted screen-refinement layouts remain coherent; Jam,
  Music, and DJ long-content compositions preserved their primary tasks.
- Rejected candidates: stale Browse Jams, Live Host, and navigation assertions
  conflict with the currently rendered localized copy but do not prove a visual
  contract failure. They remain in `TF-001`.
- Tooling gap: no blocking pixel conclusion is possible without the canonical
  private Linux renderer.
- First recommendation: correct root owners rather than patching page-specific
  symptoms.

### Wave 5 — Synthesis and human decision

- Duplicate symptoms were merged into five root findings.
- Design findings and the technical follow-up are separated.
- Priority order: `AUD-001`, `TF-001`, `AUD-003`, `AUD-004`, `AUD-002`,
  `AUD-005`.
- `AUD-002` was accepted, planned, implemented, and verified.
- `TF-001`'s non-accessibility work is complete.
- `AUD-001`, `AUD-003`, `AUD-004`, and `AUD-005` are explicitly deferred by the
  thread owner because accessibility is out of the current implementation scope.

## Human review checklist

The reviewer should inspect the exact stories named in each finding and record
one disposition per ID:

| ID | Proposed status | Reviewer | Date | Rationale needed |
| --- | --- | --- | --- | --- |
| `AUD-001` | Deferred | Thread owner | 2026-09-16 | Accessibility work postponed. |
| `AUD-002` | Accepted / implemented | Thread owner | 2026-09-16 | Full song and artist content now wraps in enrollment summaries. |
| `AUD-003` | Deferred | Thread owner | 2026-09-16 | Accessibility work postponed. |
| `AUD-004` | Deferred | Thread owner | 2026-09-16 | Accessibility and reduced-motion implementation postponed. |
| `AUD-005` | Deferred | Thread owner | 2026-09-16 | Accessibility governance work postponed. |

## Implementation outcome

- `ScheduleDetailsCard` now uses `.ds-wrap-user-content` for the sole title and
  artist instead of single-line truncation.
- The phone enrollment story asserts complete long content and preserves the
  selected instrument/submission behavior.
- All 20 stale interaction failures were repaired at the story contract: current
  localized names, correct portal scope, stable per-story mocks, visible
  responsive controls, and settled animated state.
- The generated catalogue is current. No catalogue metadata, a11y policy, visual
  PNG baseline, or deferred production accessibility owner was changed.
- Canonical Linux comparison reports 25 pass / 7 pre-existing changes; a control
  run from untouched `HEAD` reports the identical seven cells.

If accessibility work is resumed, use `/colorize` for `AUD-001`, `/harden` for
`AUD-003` and `AUD-004`, then re-run `/audit`. Use `/polish` only after those
accepted fixes pass rather than reopening the settled product direction.
