import type {
  CatalogueComponent,
  ComponentCatalogue,
} from '../../src/types/componentCatalogue.types.ts'

export const isActiveReusableVisualComponent = (component: CatalogueComponent): boolean =>
  component.metadata.lifecycle === 'active' &&
  (component.metadata.category === 'product-ui' || component.metadata.category === 'marketing')

export const activeReusableVisualComponents = (
  components: CatalogueComponent[],
): CatalogueComponent[] => components.filter(isActiveReusableVisualComponent)

export const deriveWorkbenchStorySources = (
  components: CatalogueComponent[],
  component: CatalogueComponent,
): string[] => {
  const componentsBySource = new Map<string, CatalogueComponent[]>()
  for (const candidate of components) {
    const owners = componentsBySource.get(candidate.source) ?? []
    owners.push(candidate)
    componentsBySource.set(candidate.source, owners)
  }

  const stories = new Set<string>()
  const visitedComponents = new Set<string>()
  const queue = [component]
  while (queue.length > 0) {
    const current = queue.shift()!
    if (visitedComponents.has(current.id)) continue
    visitedComponents.add(current.id)
    for (const consumer of current.consumers) {
      if (consumer.endsWith('.stories.tsx')) stories.add(consumer)
      else queue.push(...(componentsBySource.get(consumer) ?? []))
    }
  }
  return [...stories].sort()
}

export const deriveWorkbenchCoverage = (
  components: CatalogueComponent[],
): ComponentCatalogue['coverage']['workbench'] => {
  const eligible = activeReusableVisualComponents(components)

  return {
    activeReusableVisualComponents: eligible.length,
    ready: eligible.filter((component) => component.metadata.readiness.workbench === 'ready').length,
    exempt: eligible.filter((component) => component.metadata.readiness.workbench === 'exempt').length,
    needsReview: eligible.filter((component) => component.metadata.readiness.workbench === 'needs-review').length,
    unknown: eligible.filter((component) => component.metadata.readiness.workbench === 'unknown').length,
    readyWithoutStory: eligible.filter(
      (component) => component.metadata.readiness.workbench === 'ready' && component.workbenchStories.length === 0,
    ).length,
  }
}

export const unresolvedWorkbenchComponents = (
  components: CatalogueComponent[],
): CatalogueComponent[] => activeReusableVisualComponents(components).filter(
  (component) => component.metadata.readiness.workbench === 'needs-review' ||
    component.metadata.readiness.workbench === 'unknown',
)

export const unreasonedWorkbenchExemptions = (
  components: CatalogueComponent[],
): CatalogueComponent[] => activeReusableVisualComponents(components).filter(
  (component) => component.metadata.readiness.workbench === 'exempt' &&
    !component.metadata.notes.some((note) => note.trim().length > 0),
)

export const readyComponentsWithoutStories = (
  components: CatalogueComponent[],
): CatalogueComponent[] => activeReusableVisualComponents(components).filter(
  (component) => component.metadata.readiness.workbench === 'ready' && component.workbenchStories.length === 0,
)
