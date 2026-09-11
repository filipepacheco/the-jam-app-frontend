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
}

export interface CatalogueComponent {
  id: string
  name: string
  source: string
  declaration: ComponentDeclarationKind
  visibility: 'exported' | 'local'
  exports: ComponentExport[]
  consumers: string[]
  dependencies: ComponentDependencies
  metadata: ComponentMetadata
}

export interface IgnoredCatalogueSource {
  source: string
  reason: string
}

export type InlinePatternFamily = 'action' | 'field' | 'card' | 'badge' | 'menu' | 'modal' | 'drawer'

export interface InlinePatternOccurrence {
  id: string
  source: string
  line: number
  column: number
  ownerComponentId: string
  tag: string
  staticClassTokens: string[]
  dynamicClasses: boolean
}

export interface InlinePatternCandidate {
  family: InlinePatternFamily
  assessment: 'review-candidate'
  equivalence: 'unreviewed'
  occurrences: InlinePatternOccurrence[]
}

export interface ComponentCatalogue {
  schemaVersion: 2
  components: CatalogueComponent[]
  ignored: IgnoredCatalogueSource[]
  coverage: {
    eligibleSources: number
    representedSources: number
    ignoredSources: number
  }
  reviewCandidates: InlinePatternCandidate[]
}

export interface CatalogueMetadataConfig {
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
