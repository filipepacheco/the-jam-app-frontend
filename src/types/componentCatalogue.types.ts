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

export interface CatalogueComponent {
  id: string
  name: string
  source: string
  declaration: ComponentDeclarationKind
  visibility: 'exported' | 'local'
  exports: ComponentExport[]
  consumers: string[]
  dependencies: ComponentDependencies
}

export interface ComponentCatalogue {
  schemaVersion: 1
  components: CatalogueComponent[]
}

export interface CatalogueConfig {
  project: string
  include: string[]
  output: {
    json: string
    markdown: string
  }
}
