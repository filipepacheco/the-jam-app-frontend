export type ComponentDeclarationKind = 'function' | 'variable' | 'class'

export type ComponentExportKind = 'named' | 'default' | 're-export'

export type ComponentContext =
  | 'animation'
  | 'api'
  | 'authentication'
  | 'browser'
  | 'internationalization'
  | 'routing'
  | 'theme'

export interface ComponentExport {
  kind: ComponentExportKind
  name: string
  module: string
}

export interface ComponentDependencies {
  internal: string[]
  external: string[]
  contexts: ComponentContext[]
}

export const CATALOGUE_CATEGORIES = ['product-ui', 'page-composition', 'marketing', 'infrastructure', 'legacy-experimental'] as const
export type CatalogueCategory = typeof CATALOGUE_CATEGORIES[number]

export const CATALOGUE_LAYERS = ['foundation', 'primitive', 'pattern', 'domain-component', 'page-composition', 'infrastructure'] as const
export type CatalogueLayer = typeof CATALOGUE_LAYERS[number]

export const COMPONENT_LIFECYCLES = ['active', 'legacy', 'experimental', 'uncertain'] as const
export type ComponentLifecycle = typeof COMPONENT_LIFECYCLES[number]

export const PRODUCT_AREAS = ['shared', 'app-shell', 'account', 'jam', 'music', 'schedule', 'registration', 'dj-control', 'public-dashboard', 'feedback', 'spotify', 'marketing', 'uncertain'] as const
export type ProductArea = typeof PRODUCT_AREAS[number]

export const VIEWPORT_CONTEXTS = ['mobile', 'desktop', 'shared-screen', 'uncertain'] as const
export type ViewportContext = typeof VIEWPORT_CONTEXTS[number]

export const AUDIT_STATUSES = ['unknown', 'not-applicable', 'needs-review', 'verified'] as const
export type AuditStatus = typeof AUDIT_STATUSES[number]

export const WORKBENCH_READINESS = ['unknown', 'needs-review', 'ready', 'exempt'] as const
export type WorkbenchReadiness = typeof WORKBENCH_READINESS[number]

/** Recorded migration decision; absence means the catalogue does not claim adoption. */
export const CANONICAL_ADOPTION_STATUSES = [
  'adopted',
  'documented-exception',
  'unreviewed',
  'not-applicable',
] as const
export type CanonicalAdoptionStatus = typeof CANONICAL_ADOPTION_STATUSES[number]

export interface CanonicalAdoption {
  status: CanonicalAdoptionStatus
  family?: string
  /** Stable IDs of every canonical component that replaces a retained legacy composite. */
  replacements?: string[]
  note?: string
}

/** Machine-readable companion to the human migration and contraction records. */
export interface DeprecationRecord {
  replacement: string | null
  removalCondition: string
}

export interface ComponentReadiness {
  workbench: WorkbenchReadiness
  accessibility: AuditStatus
  internationalization: AuditStatus
  theme: AuditStatus
}

export interface ComponentMetadata {
  category: CatalogueCategory
  layer: CatalogueLayer
  lifecycle: ComponentLifecycle
  productArea: ProductArea
  viewportContexts: ViewportContext[]
  readiness: ComponentReadiness
  uiStates: string[]
  candidateFamily: string | null
  notes: string[]
  canonicalAdoption?: CanonicalAdoption
  deprecation?: DeprecationRecord
}

export interface CatalogueComponent {
  id: string
  name: string
  source: string
  declaration: ComponentDeclarationKind
  visibility: 'exported' | 'local'
  exports: ComponentExport[]
  consumers: string[]
  workbenchStories: string[]
  dependencies: ComponentDependencies
  metadata: ComponentMetadata
}

export interface IgnoredCatalogueSource {
  source: string
  reason: string
}

export const INLINE_PATTERN_FAMILIES = ['action', 'field', 'card', 'badge', 'menu', 'modal', 'drawer'] as const
export type InlinePatternFamily = typeof INLINE_PATTERN_FAMILIES[number]

export const INLINE_PATTERN_DISPOSITIONS = [
  'adopted',
  'intentionally-distinct',
  'migration-debt',
  'deletion-debt',
] as const
export type InlinePatternDispositionStatus = typeof INLINE_PATTERN_DISPOSITIONS[number]

export type InlinePatternDisposition =
  | {status: 'adopted'; canonicalFamily: string}
  | {status: 'intentionally-distinct'; rationale: string}
  | {status: 'migration-debt'; replacement: string; completionCondition: string}
  | {status: 'deletion-debt'; verificationCondition: string}

export interface InlinePatternGovernanceScope {
  source: string
  families: InlinePatternFamily[]
}

export interface GovernedInlinePatternCandidate {
  id: string
  disposition: InlinePatternDisposition
}

export interface InlinePatternGovernance {
  scopes: InlinePatternGovernanceScope[]
  candidates: GovernedInlinePatternCandidate[]
}

export interface InlinePatternOccurrence {
  id: string
  source: string
  line: number
  column: number
  ownerComponentId: string
  tag: string
  staticClassTokens: string[]
  dynamicClasses: boolean
  disposition?: InlinePatternDisposition
}

export interface InlinePatternCandidate {
  family: InlinePatternFamily
  occurrences: InlinePatternOccurrence[]
}

export interface ComponentCatalogue {
  schemaVersion: 3
  components: CatalogueComponent[]
  ignored: IgnoredCatalogueSource[]
  coverage: {
    eligibleSources: number
    representedSources: number
    ignoredSources: number
    workbench: {
      activeReusableVisualComponents: number
      ready: number
      exempt: number
      needsReview: number
      unknown: number
      readyWithoutStory: number
    }
  }
  reviewCandidates: InlinePatternCandidate[]
}

export interface CatalogueMetadataConfig {
  candidateFamilies: string[]
  inlinePatternGovernance: InlinePatternGovernance
  defaults: ComponentMetadata
  rules: Array<{
    source: string
    component?: string
    metadata: Partial<Omit<ComponentMetadata, 'readiness'>> & {
      readiness?: Partial<ComponentReadiness>
    }
  }>
  components: Array<{
    id: string
    source: string
    name: string
  }>
}

export interface CatalogueConfig {
  project: string
  include: string[]
  metadata: string
  ignore: IgnoredCatalogueSource[]
  output: {
    json: string
    markdown: string
  }
}
