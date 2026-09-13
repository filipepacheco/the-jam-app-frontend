import path from 'node:path'
import ts from 'typescript'

import {globPattern, matchesAny, metadataFor} from './metadata.ts'
import {inlinePatternCandidates} from './patterns.ts'
import {applyInlinePatternGovernance} from './governance.ts'
import {deriveWorkbenchCoverage, deriveWorkbenchStorySources} from './coverage.ts'
import {isExactSource, isSafeRelativePath, validateResolvedMetadata} from './validate.ts'

import type {
  CatalogueComponent,
  CatalogueMetadataConfig,
  ComponentContext,
  ComponentCatalogue,
  ComponentDeclarationKind,
  ComponentExport,
  IgnoredCatalogueSource,
} from '../../src/types/componentCatalogue.types.ts'

interface DiscoveredComponent {
  key: string
  name: string
  source: string
  declaration: ComponentDeclarationKind
  sourceFile: ts.SourceFile
  node: ts.Node
  anonymousDefault: boolean
}

interface ExportTarget {
  componentKey: string
  direct: boolean
}

type ModuleExports = Map<string, ExportTarget>

const toPosix = (value: string): string => value.split(path.sep).join('/')

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0

const isDynamicImport = (node: ts.Node): node is ts.CallExpression =>
  ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword

const isComponentWrapper = (expression: ts.LeftHandSideExpression): boolean =>
  (ts.isIdentifier(expression) && ['memo', 'forwardRef'].includes(expression.text)) ||
  (ts.isPropertyAccessExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === 'React' &&
    ['memo', 'forwardRef'].includes(expression.name.text))

const isWrappedAnonymousComponent = (node: ts.Node): node is ts.CallExpression =>
  ts.isCallExpression(node) &&
  isComponentWrapper(node.expression) &&
  node.arguments.some(
    (argument) =>
      (ts.isArrowFunction(argument) || ts.isFunctionExpression(argument)) && hasJsx(argument),
  )

const relativePath = (root: string, absolutePath: string): string =>
  toPosix(path.relative(root, absolutePath))

const isUppercaseName = (name: string): boolean => /^[A-Z][A-Za-z0-9_$]*$/.test(name)

const hasJsx = (node: ts.Node): boolean => {
  let found = false
  const visit = (child: ts.Node): void => {
    if (
      ts.isJsxElement(child) ||
      ts.isJsxSelfClosingElement(child) ||
      ts.isJsxFragment(child)
    ) {
      found = true
      return
    }
    if (!found) ts.forEachChild(child, visit)
  }
  ts.forEachChild(node, visit)
  return found
}

const hasModifier = (node: ts.Node, kind: ts.SyntaxKind): boolean =>
  ts.canHaveModifiers(node) &&
  Boolean(ts.getModifiers(node)?.some((modifier) => modifier.kind === kind))

const variableContainsComponent = (declaration: ts.VariableDeclaration): boolean => {
  if (!declaration.initializer) return false
  if (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer)) {
    return hasJsx(declaration.initializer)
  }
  if (ts.isCallExpression(declaration.initializer)) {
    return declaration.initializer.arguments.some(
      (argument) =>
        (ts.isArrowFunction(argument) || ts.isFunctionExpression(argument)) && hasJsx(argument),
    )
  }
  return false
}

const classContainsComponent = (declaration: ts.ClassDeclaration): boolean =>
  declaration.members.some(
    (member) =>
      ts.isMethodDeclaration(member) &&
      ((ts.isIdentifier(member.name) && member.name.text === 'render') ||
        (ts.isStringLiteral(member.name) && member.name.text === 'render')) &&
      hasJsx(member),
  )

const discoverComponents = (
  sourceFiles: ts.SourceFile[],
  root: string,
): Map<string, DiscoveredComponent> => {
  const components = new Map<string, DiscoveredComponent>()

  for (const sourceFile of sourceFiles) {
    const source = relativePath(root, sourceFile.fileName)
    const add = (
      name: string,
      declaration: ComponentDeclarationKind,
      node: ts.Node,
      anonymousDefault = false,
    ): void => {
      const key = `${source}#${name}`
      components.set(key, {key, name, source, declaration, sourceFile, node, anonymousDefault})
    }

    const visit = (node: ts.Node): void => {
      if (
        ts.isFunctionDeclaration(node) &&
        ((node.name && isUppercaseName(node.name.text)) ||
          (!node.name && hasModifier(node, ts.SyntaxKind.DefaultKeyword))) &&
        hasJsx(node)
      ) {
        add(node.name?.text ?? path.basename(sourceFile.fileName, path.extname(sourceFile.fileName)), 'function', node, !node.name)
      } else if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        isUppercaseName(node.name.text) &&
        variableContainsComponent(node)
      ) {
        add(node.name.text, 'variable', node)
      } else if (
        ts.isClassDeclaration(node) &&
        node.name &&
        isUppercaseName(node.name.text) &&
        classContainsComponent(node)
      ) {
        add(node.name.text, 'class', node)
      } else if (
        ts.isExportAssignment(node) &&
        (((ts.isArrowFunction(node.expression) || ts.isFunctionExpression(node.expression)) &&
          hasJsx(node.expression)) ||
          isWrappedAnonymousComponent(node.expression))
      ) {
        add(
          path.basename(sourceFile.fileName, path.extname(sourceFile.fileName)),
          'function',
          node.expression,
          true,
        )
      }
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
  }

  return components
}

const resolveModule = (
  specifier: string,
  containingFile: string,
  compilerOptions: ts.CompilerOptions,
): string | undefined => {
  const result = ts.resolveModuleName(specifier, containingFile, compilerOptions, ts.sys)
  const resolved = result.resolvedModule?.resolvedFileName
  return resolved && !resolved.includes('/node_modules/') ? path.resolve(resolved) : undefined
}

const declarationExportNames = (
  component: DiscoveredComponent,
): Array<{name: string; direct: boolean}> => {
  const declaration = component.node
  const statement = component.sourceFile.statements.find((candidate) =>
    candidate === declaration ||
    (ts.isVariableStatement(candidate) &&
      candidate.declarationList.declarations.some((item) => item === declaration)),
  )
  const result: Array<{name: string; direct: boolean}> = []

  if (component.anonymousDefault) {
    return [{name: 'default', direct: true}]
  }

  if (statement && hasModifier(statement, ts.SyntaxKind.ExportKeyword)) {
    result.push({
      name: hasModifier(statement, ts.SyntaxKind.DefaultKeyword) ? 'default' : component.name,
      direct: true,
    })
  }
  return result
}

const buildExportGraph = (
  sourceFiles: ts.SourceFile[],
  components: Map<string, DiscoveredComponent>,
  root: string,
  compilerOptions: ts.CompilerOptions,
): Map<string, ModuleExports> => {
  const bySourceAndName = new Map(
    [...components.values()].map((component) => [`${component.source}#${component.name}`, component.key]),
  )
  const graph = new Map<string, ModuleExports>()

  for (const sourceFile of sourceFiles) {
    const source = relativePath(root, sourceFile.fileName)
    const exports = new Map<string, ExportTarget>()
    graph.set(path.resolve(sourceFile.fileName), exports)

    for (const component of components.values()) {
      if (component.source !== source) continue
      for (const item of declarationExportNames(component)) {
        exports.set(item.name, {componentKey: component.key, direct: item.direct})
      }
    }

    for (const statement of sourceFile.statements) {
      if (ts.isExportAssignment(statement) && ts.isIdentifier(statement.expression)) {
        const key = bySourceAndName.get(`${source}#${statement.expression.text}`)
        if (key) exports.set('default', {componentKey: key, direct: true})
      }
      if (
        ts.isExportDeclaration(statement) &&
        !statement.moduleSpecifier &&
        statement.exportClause &&
        ts.isNamedExports(statement.exportClause)
      ) {
        for (const element of statement.exportClause.elements) {
          const localName = element.propertyName?.text ?? element.name.text
          const key = bySourceAndName.get(`${source}#${localName}`)
          if (key) exports.set(element.name.text, {componentKey: key, direct: true})
        }
      }
    }
  }

  let changed = true
  while (changed) {
    changed = false
    for (const sourceFile of sourceFiles) {
      const exports = graph.get(path.resolve(sourceFile.fileName))!
      for (const statement of sourceFile.statements) {
        if (
          !ts.isExportDeclaration(statement) ||
          !statement.moduleSpecifier ||
          !ts.isStringLiteral(statement.moduleSpecifier)
        ) continue
        const targetFile = resolveModule(
          statement.moduleSpecifier.text,
          sourceFile.fileName,
          compilerOptions,
        )
        const targetExports = targetFile ? graph.get(targetFile) : undefined
        if (!targetExports) continue

        if (!statement.exportClause) {
          for (const [name, target] of targetExports) {
            if (name === 'default' || exports.has(name)) continue
            exports.set(name, {componentKey: target.componentKey, direct: false})
            changed = true
          }
        } else if (ts.isNamedExports(statement.exportClause)) {
          for (const element of statement.exportClause.elements) {
            const importedName = element.propertyName?.text ?? element.name.text
            const target = targetExports.get(importedName)
            if (!target || exports.has(element.name.text)) continue
            exports.set(element.name.text, {componentKey: target.componentKey, direct: false})
            changed = true
          }
        }
      }
    }
  }

  return graph
}

const packageName = (specifier: string): string => {
  const segments = specifier.split('/')
  return specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0]
}

const componentDependencies = (
  component: DiscoveredComponent,
  componentNodes: Set<ts.Node>,
  root: string,
  compilerOptions: ts.CompilerOptions,
): CatalogueComponent['dependencies'] => {
  const internal = new Set<string>()
  const external = new Set<string>()
  const contexts = new Set<ComponentContext>()
  const importedBindings = new Map<string, string>()

  const classify = (specifier: string): void => {
    const resolved = resolveModule(specifier, component.sourceFile.fileName, compilerOptions)
    if (resolved) internal.add(relativePath(root, resolved))
    else if (specifier.startsWith('.') || specifier.startsWith('/')) {
      internal.add(relativePath(root, path.resolve(path.dirname(component.sourceFile.fileName), specifier)))
    } else external.add(packageName(specifier))

    if (specifier === 'react-router-dom' || specifier.includes('/router')) contexts.add('routing')
    if (specifier === 'react-i18next' || specifier === 'i18next') contexts.add('internationalization')
    if (specifier === 'framer-motion') contexts.add('animation')
    if (specifier === 'swr' || specifier === 'axios' || /(?:^|\/)(?:api|services)(?:\/|$)/.test(specifier)) contexts.add('api')
    if (specifier.includes('AuthContext') || /(?:^|\/)auth(?:\/|$)/.test(specifier) || specifier.startsWith('@supabase/')) contexts.add('authentication')
  }

  for (const statement of component.sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
    const specifier = statement.moduleSpecifier.text
    const clause = statement.importClause
    if (!clause) {
      classify(specifier)
      continue
    }
    if (clause?.name) importedBindings.set(clause.name.text, specifier)
    if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const element of clause.namedBindings.elements) importedBindings.set(element.name.text, specifier)
    } else if (clause?.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
      importedBindings.set(clause.namedBindings.name.text, specifier)
    }
  }

  const visit = (node: ts.Node): void => {
    if (node !== component.node && componentNodes.has(node)) return
    if (ts.isIdentifier(node)) {
      const specifier = importedBindings.get(node.text)
      if (specifier) classify(specifier)
    }
    if (isDynamicImport(node) && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
      classify(node.arguments[0].text)
    }
    if (
      ts.isIdentifier(node) &&
      ['window', 'document', 'navigator', 'localStorage', 'sessionStorage'].includes(node.text)
    ) contexts.add('browser')
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      /(?:data-theme|theme-controller)/.test(node.text)
    ) contexts.add('theme')
    ts.forEachChild(node, visit)
  }
  visit(component.node)

  return {
    internal: [...internal].sort(compareText),
    external: [...external].sort(compareText),
    contexts: [...contexts].sort(compareText),
  }
}

const collectConsumers = (
  sourceFiles: ts.SourceFile[],
  components: Map<string, DiscoveredComponent>,
  graph: Map<string, ModuleExports>,
  root: string,
  compilerOptions: ts.CompilerOptions,
): Map<string, Set<string>> => {
  const consumers = new Map<string, Set<string>>()
  const add = (componentKey: string, sourceFile: ts.SourceFile): void => {
    const source = relativePath(root, sourceFile.fileName)
    const values = consumers.get(componentKey) ?? new Set<string>()
    values.add(source)
    consumers.set(componentKey, values)
  }

  for (const sourceFile of sourceFiles) {
    const bindings = new Map<string, ExportTarget>()
    const namespaces = new Map<string, ModuleExports>()
    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
      const targetFile = resolveModule(statement.moduleSpecifier.text, sourceFile.fileName, compilerOptions)
      const targetExports = targetFile ? graph.get(targetFile) : undefined
      if (!targetExports || !statement.importClause) continue
      if (statement.importClause.name) {
        const target = targetExports.get('default')
        if (target) bindings.set(statement.importClause.name.text, target)
      }
      const namedBindings = statement.importClause.namedBindings
      if (namedBindings && ts.isNamedImports(namedBindings)) {
        for (const element of namedBindings.elements) {
          const importedName = element.propertyName?.text ?? element.name.text
          const target = targetExports.get(importedName)
          if (target) bindings.set(element.name.text, target)
        }
      } else if (namedBindings && ts.isNamespaceImport(namedBindings)) {
        namespaces.set(namedBindings.name.text, targetExports)
      }
    }

    const localComponents = [...components.values()].filter((component) => component.sourceFile === sourceFile)
    const componentNodes = new Set(localComponents.map((component) => component.node))
    const visit = (node: ts.Node, owner?: DiscoveredComponent, ancestors: ts.Node[] = []): void => {
      const nextOwner = componentNodes.has(node)
        ? localComponents.find((component) => component.node === node)
        : owner
      if (ts.isIdentifier(node)) {
        const target = bindings.get(node.text)
        if (target) add(target.componentKey, sourceFile)
        for (const local of localComponents) {
          if ((!nextOwner || local.key !== nextOwner.key) && local.name === node.text) {
            add(local.key, sourceFile)
          }
        }
      }
      if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
        const target = namespaces.get(node.expression.text)?.get(node.name.text)
        if (target) add(target.componentKey, sourceFile)
      }
      if (isDynamicImport(node) && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
        const targetFile = resolveModule(node.arguments[0].text, sourceFile.fileName, compilerOptions)
        const targetExports = targetFile ? graph.get(targetFile) : undefined
        const usedByLazy = ancestors.some(
          (ancestor) =>
            ts.isCallExpression(ancestor) &&
            ts.isIdentifier(ancestor.expression) &&
            ancestor.expression.text === 'lazy',
        )
        if (usedByLazy) {
          const target = targetExports?.get('default')
          if (target) add(target.componentKey, sourceFile)
        }
      }
      if (
        ts.isImportDeclaration(node) ||
        ts.isExportDeclaration(node) ||
        ts.isExportAssignment(node)
      ) return
      ts.forEachChild(node, (child) => visit(child, nextOwner, [...ancestors, node]))
    }
    visit(sourceFile)
  }
  return consumers
}

export interface AnalyseCatalogueOptions {
  root: string
  project: string
  include: string[]
  ignore: IgnoredCatalogueSource[]
  metadata: CatalogueMetadataConfig
  diagnostics?: string[]
}

export const analyseCatalogue = ({root, project, include, ignore, metadata, diagnostics = []}: AnalyseCatalogueOptions): ComponentCatalogue => {
  const configPath = path.resolve(root, project)
  const config = ts.readConfigFile(configPath, ts.sys.readFile)
  if (config.error) {
    throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'))
  }
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath))
  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.map((error) => ts.flattenDiagnosticMessageText(error.messageText, '\n')).join('\n'))
  }
  const program = ts.createProgram({rootNames: parsed.fileNames, options: parsed.options})
  const sourceFiles = program.getSourceFiles().filter(
    (sourceFile) =>
      !sourceFile.isDeclarationFile &&
      !sourceFile.fileName.includes('/node_modules/') &&
      path.resolve(sourceFile.fileName).startsWith(`${path.resolve(root)}${path.sep}`),
  )
  const components = discoverComponents(sourceFiles, root)
  const graph = buildExportGraph(sourceFiles, components, root, parsed.options)
  const consumers = collectConsumers(sourceFiles, components, graph, root, parsed.options)
  const eligibleSources = sourceFiles
    .map((sourceFile) => relativePath(root, sourceFile.fileName))
    .filter((source) => matchesAny(source, include))
    .sort(compareText)
  const includedSources = new Set(eligibleSources)
  const ignoredBySource = new Map<string, IgnoredCatalogueSource>()
  for (const [index, item] of ignore.entries()) {
    if (!isSafeRelativePath(item.source) || typeof item.reason !== 'string' || !item.reason.trim()) continue
    const source = toPosix(item.source)
    if (ignoredBySource.has(source)) {
      diagnostics.push(`duplicate ignore source "${source}"`)
      continue
    }
    if (!includedSources.has(source)) {
      diagnostics.push(`ignore[${index}]: source "${source}" is not eligible`)
      continue
    }
    const isPrivateStory = source.startsWith('src/workbench/stories/') && source.endsWith('.stories.tsx')
    if (!isPrivateStory && [...components.values()].some((component) => component.source === source)) {
      diagnostics.push(`ignore[${index}]: source is not eligible for ignoring because it declares React components`)
      continue
    }
    ignoredBySource.set(source, {source, reason: item.reason})
  }
  const componentNodes = new Set([...components.values()].map((component) => component.node))

  const exportsByComponent = new Map<string, ComponentExport[]>()
  for (const [absoluteModule, exports] of graph) {
    for (const [name, target] of exports) {
      const values = exportsByComponent.get(target.componentKey) ?? []
      values.push({
        kind: target.direct ? (name === 'default' ? 'default' : 'named') : 're-export',
        name,
        module: relativePath(root, absoluteModule),
      })
      exportsByComponent.set(target.componentKey, values)
    }
  }

  const includedComponents = [...components.values()]
    .filter((component) => includedSources.has(component.source) && !ignoredBySource.has(component.source))
  const identities = new Map<string, string>()
  const identityIds = new Set<string>()
  for (const [index, identity] of metadata.components.entries()) {
    if (!isSafeRelativePath(identity.source) || typeof identity.name !== 'string' || !identity.name.trim()) continue
    const key = `${toPosix(identity.source)}#${identity.name}`
    if (identities.has(key)) {
      diagnostics.push(`duplicate component selector "${key}"`)
      continue
    }
    if (identityIds.has(identity.id)) {
      diagnostics.push(`components[${index}].id: duplicate stable identifier "${identity.id}"`)
      continue
    }
    identities.set(key, identity.id)
    identityIds.add(identity.id)
  }
  const includedKeys = new Set(includedComponents.map((component) => component.key))
  const staleIdentities = [...identities.keys()].filter((key) => !includedKeys.has(key))
  for (const key of staleIdentities) diagnostics.push(`component selector "${key}" does not resolve`)
  const missingIdentities = includedComponents.filter((component) => !identities.has(component.key))
  for (const component of missingIdentities) {
    diagnostics.push(`component "${component.key}" requires a curated stable identifier`)
    identities.set(component.key, `missing.${component.key.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`)
  }

  for (const [index, rule] of metadata.rules.entries()) {
    if (!isSafeRelativePath(rule.source)) continue
    const exact = isExactSource(rule.source)
    if (rule.component && !exact) {
      diagnostics.push(`rules[${index}]: component-scoped rules require an exact source path`)
      continue
    }
    const matchingComponents = includedComponents.filter(
      (component) => globPattern(rule.source).test(component.source) &&
        (!rule.component || component.name === rule.component),
    )
    if (matchingComponents.length === 0) {
      if (rule.component) {
        diagnostics.push(`rules[${index}]: component selector "${rule.source}#${rule.component}" does not resolve`)
      } else if (exact) {
        diagnostics.push(`rules[${index}]: exact source "${rule.source}" does not resolve`)
      } else {
        diagnostics.push(`rules[${index}]: source pattern "${rule.source}" is stale`)
      }
    }
  }
  const representedSources = new Set(includedComponents.map((component) => component.source))
  const missingSources = eligibleSources.filter(
    (source) => !representedSources.has(source) && !ignoredBySource.has(source),
  )
  for (const source of missingSources) {
    diagnostics.push(`eligible source "${source}" contains no discovered component and requires an explicit ignore reason`)
  }

  const normalized: CatalogueComponent[] = includedComponents
    .map((component) => {
      const exports = (exportsByComponent.get(component.key) ?? []).sort(
        (left, right) =>
          compareText(left.module, right.module) ||
          compareText(left.name, right.name) ||
          compareText(left.kind, right.kind),
      )
      const visibility: CatalogueComponent['visibility'] = exports.length > 0 ? 'exported' : 'local'
      const curatedMetadata = metadataFor(component, metadata)
      validateResolvedMetadata(curatedMetadata, component.key, metadata.candidateFamilies, diagnostics)
      return {
        id: identities.get(component.key)!,
        name: component.name,
        source: component.source,
        declaration: component.declaration,
        visibility,
        exports,
        consumers: [...(consumers.get(component.key) ?? [])].sort(compareText),
        workbenchStories: [],
        dependencies: componentDependencies(component, componentNodes, root, parsed.options),
        metadata: curatedMetadata,
      }
    })
    .sort((left, right) => compareText(left.id, right.id))
  const withWorkbenchStories = normalized.map((component) => ({
    ...component,
    workbenchStories: deriveWorkbenchStorySources(normalized, component),
  }))
  const reviewCandidates = applyInlinePatternGovernance(
    inlinePatternCandidates(includedComponents, componentNodes, identities),
    metadata.inlinePatternGovernance,
    diagnostics,
  )

  return {
    schemaVersion: 3,
    components: withWorkbenchStories,
    ignored: [...ignoredBySource.values()].sort((left, right) => compareText(left.source, right.source)),
    coverage: {
      eligibleSources: eligibleSources.length,
      representedSources: representedSources.size,
      ignoredSources: ignoredBySource.size,
      workbench: deriveWorkbenchCoverage(withWorkbenchStories),
    },
    reviewCandidates,
  }
}
