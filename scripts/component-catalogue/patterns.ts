import ts from 'typescript'

import type {
  InlinePatternCandidate,
  InlinePatternFamily,
  InlinePatternOccurrence,
} from '../../src/types/componentCatalogue.types.ts'

export interface PatternComponent {
  key: string
  source: string
  sourceFile: ts.SourceFile
  node: ts.Node
}

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0

const jsxClassValue = (attribute: ts.JsxAttribute): {tokens: string[]; dynamic: boolean} => {
  const initializer = attribute.initializer
  if (!initializer) return {tokens: [], dynamic: false}
  if (ts.isStringLiteral(initializer)) {
    return {tokens: initializer.text.split(/\s+/).filter(Boolean), dynamic: false}
  }
  if (!ts.isJsxExpression(initializer) || !initializer.expression) {
    return {tokens: [], dynamic: true}
  }
  const expression = initializer.expression
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return {tokens: expression.text.split(/\s+/).filter(Boolean), dynamic: false}
  }
  if (ts.isTemplateExpression(expression)) {
    const text = [expression.head.text, ...expression.templateSpans.map((span) => span.literal.text)].join(' ')
    return {tokens: text.split(/\s+/).filter(Boolean), dynamic: true}
  }
  const text: string[] = []
  const collectStaticSegments = (node: ts.Node): void => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) text.push(node.text)
    else ts.forEachChild(node, collectStaticSegments)
  }
  collectStaticSegments(expression)
  return {tokens: text.flatMap((value) => value.split(/\s+/)).filter(Boolean), dynamic: true}
}

const patternFamilies = (tag: string, tokens: string[]): InlinePatternFamily[] => {
  const tokenSet = new Set(tokens)
  const families = new Set<InlinePatternFamily>()
  if (tag === 'button' || tokenSet.has('btn')) families.add('action')
  if (['input', 'select', 'textarea'].includes(tag) || ['input', 'select', 'textarea'].some((token) => tokenSet.has(token))) families.add('field')
  if (tokenSet.has('card')) families.add('card')
  if (tokenSet.has('badge')) families.add('badge')
  if (tokenSet.has('menu') || tokenSet.has('dropdown')) families.add('menu')
  if (tag === 'dialog' || tokenSet.has('modal')) families.add('modal')
  if (tokenSet.has('drawer')) families.add('drawer')
  return [...families].sort(compareText)
}

export const inlinePatternCandidates = (
  components: PatternComponent[],
  allComponentNodes: Set<ts.Node>,
  ids: Map<string, string>,
): InlinePatternCandidate[] => {
  const occurrences = new Map<InlinePatternFamily, InlinePatternOccurrence[]>()
  for (const component of components) {
    const ownerComponentId = ids.get(component.key)
    if (!ownerComponentId) throw new Error(`${component.key}: missing curated stable identifier`)
    const visit = (node: ts.Node): void => {
      if (node !== component.node && allComponentNodes.has(node)) return
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(component.sourceFile)
        const classAttribute = node.attributes.properties.find(
          (property): property is ts.JsxAttribute =>
            ts.isJsxAttribute(property) && property.name.getText(component.sourceFile) === 'className',
        )
        const classes = classAttribute ? jsxClassValue(classAttribute) : {tokens: [], dynamic: false}
        const location = component.sourceFile.getLineAndCharacterOfPosition(node.getStart(component.sourceFile))
        for (const family of patternFamilies(tag, classes.tokens)) {
          const values = occurrences.get(family) ?? []
          values.push({
            id: `${component.source}:${location.line + 1}:${location.character + 1}:${family}`,
            source: component.source,
            line: location.line + 1,
            column: location.character + 1,
            ownerComponentId,
            tag,
            staticClassTokens: [...new Set(classes.tokens)].sort(compareText),
            dynamicClasses: classes.dynamic,
          })
          occurrences.set(family, values)
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(component.node)
  }
  return [...occurrences.entries()]
    .filter(([, values]) => values.length > 1)
    .map(([family, values]) => ({
      family,
      assessment: 'review-candidate' as const,
      equivalence: 'unreviewed' as const,
      occurrences: values.sort((left, right) => compareText(left.id, right.id)),
    }))
    .sort((left, right) => compareText(left.family, right.family))
}
