---
status: accepted
---

# Author translations in a key-first locale catalogue

Jam App will replace its separate locale-first JSON files with feature-split, key-first TypeScript catalogue modules. Each existing top-level translation section owns one module; explicit `message()` and `plural()` leaves contain complete `pt-BR`, `en`, and `es` values. A pure in-memory adapter assembles the existing dotted `translation` namespace for i18next, preserving `t('section.key')` call sites and eager loading while making missing locales, incompatible placeholders, and invalid plural forms verification failures.

Brazilian Portuguese is the reference and default locale. `pt-BR` is canonical, legacy `pt` input aliases to it, and `pt-PT` is not advertised without a distinct catalogue. One application locale boundary owns normalization, persistence, URL override precedence, `Intl` formatting, document language, and SEO metadata. A valid `?lng=` value overrides and replaces a persisted choice; otherwise the persisted choice wins before the `pt-BR` default.

The catalogue contains plain strings only. Static translated copy belongs in the catalogue rather than call-site defaults; literal keys are typed, dynamic key families are declared, global object returns are disabled, and manual translation-object handling is removed. Runtime fallback remains defensive, but focused verification runs as a production-build gate and checks catalogue completeness, consumer references, interpolation variables, plurals, aliases, fallback behavior, and migration equivalence.

## Considered options

- A single key-first JSON file colocates languages but creates a large merge-conflict hotspot and cannot provide the same authoring types.
- Separate locale-first JSON files fit i18next directly but make cross-language completeness and review difficult.
- Committed generated JSON duplicates the source of truth and can become stale, so resources are assembled in memory instead.
- i18next namespaces and lazy loading remain possible later, but changing runtime loading during the representation migration would widen the behavioral risk.

## Consequences

The source-of-truth cutover is atomic and preserves existing keys and wording except for missing, empty, or structurally broken translations. The catalogue transformation remains pure so a future translation-service exporter can reuse it, but no speculative import/export CLI is part of this decision.
