import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import {assembleResources, validateCatalogue, type CatalogueLeaf} from '../../src/locales/catalogue/index.ts'
import {catalogue, type TranslationKey} from '../../src/locales/catalogue/catalogue.ts'
import {normalizeLocale, resolveLocalePreference} from '../../src/lib/i18n/applicationLocale.ts'
import {DYNAMIC_TRANSLATION_FAMILIES} from '../../src/lib/i18n/translationKeys.ts'

const MIGRATION_BASELINE_HASHES = {
  'pt-BR': 'a936db8a40779913ccdad854b974cf03fd0928be98895c054254f0b71d9b6cd3',
  en: '28ce64dffb6b9b4f890354e89cdb147085a167d02711fde61bf5b9b87d3973a1',
  es: 'd4a864a252cc5adebc8bc969fad72f3f90b579b50dfd652bb91e98bb84b7477e',
} as const

function collectCatalogueKeys(node: object, prefix = '', result = new Set<TranslationKey>()) {
  for (const [key, value] of Object.entries(node)) {
    const current = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && 'kind' in value) {
      result.add(current as TranslationKey)
    } else if (value && typeof value === 'object') {
      collectCatalogueKeys(value, current, result)
    }
  }
  return result
}

function flatten(node: Record<string, unknown>, prefix = '', result: Record<string, string> = {}) {
  for (const [key, value] of Object.entries(node)) {
    const current = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') result[current] = value
    else if (value && typeof value === 'object') flatten(value as Record<string, unknown>, current, result)
  }
  return result
}

function resourceHash(resource: Record<string, unknown>): string {
  const stableEntries = Object.entries(flatten(resource)).sort(([left], [right]) => left.localeCompare(right))
  return crypto.createHash('sha256').update(JSON.stringify(stableEntries)).digest('hex')
}

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(entryPath)
    return entry.isFile() && /\.tsx?$/.test(entry.name) ? [entryPath] : []
  })
}

function verifyConsumers(knownKeys: ReadonlySet<TranslationKey>): string[] {
  const issues: string[] = []
  const files = sourceFiles(path.resolve('src')).filter((file) =>
    !file.includes(`${path.sep}__tests__${path.sep}`)
    && !file.includes(`${path.sep}locales${path.sep}catalogue${path.sep}`)
  )

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8')
    const sourceFile = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    )

    function visit(node: ts.Node) {
      if (ts.isCallExpression(node)) {
        const isTranslationCall = ts.isIdentifier(node.expression) && node.expression.text === 't'
          || ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 't'

        if (isTranslationCall) {
          const [key, options] = node.arguments
          const location = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
          const label = `${path.relative(process.cwd(), file)}:${location.line + 1}`

          if (key && ts.isStringLiteral(key) && !knownKeys.has(key.text as TranslationKey)) {
            issues.push(`${label}: unknown translation key ${key.text}`)
          }
          if (key && ts.isTemplateExpression(key)) {
            issues.push(`${label}: dynamic translation must use a declared translationKey() family`)
          }
          if (options && (ts.isStringLiteral(options) || ts.isNoSubstitutionTemplateLiteral(options))) {
            issues.push(`${label}: static call-site translation fallback is not allowed`)
          }
          if (options && ts.isObjectLiteralExpression(options) && options.properties.some((property) =>
            ts.isPropertyAssignment(property) && property.name.getText(sourceFile).replaceAll(/['"]/g, '') === 'defaultValue'
          )) {
            issues.push(`${label}: defaultValue translation fallback is not allowed`)
          }
        }
      }
      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
  }

  return issues
}

const issues = validateCatalogue(catalogue)
const knownKeys = collectCatalogueKeys(catalogue)
issues.push(...verifyConsumers(knownKeys))

for (const family of DYNAMIC_TRANSLATION_FAMILIES) {
  if (![...knownKeys].some((key) => key.startsWith(`${family}.`))) {
    issues.push(`${family}: declared dynamic family has no catalogue entries`)
  }
}

if (normalizeLocale('pt') !== 'pt-BR' || normalizeLocale('pt-PT') !== undefined) {
  issues.push('locale aliases: pt must alias pt-BR and pt-PT must remain unsupported')
}
const precedence = resolveLocalePreference({search: '?lng=es', persisted: 'en'})
if (precedence.locale !== 'es' || precedence.source !== 'query' || !precedence.shouldPersist) {
  issues.push('locale precedence: a valid URL locale must replace the persisted locale')
}

const resources = assembleResources(catalogue)
for (const [locale, expectedHash] of Object.entries(MIGRATION_BASELINE_HASHES)) {
  const actualHash = resourceHash(resources[locale as keyof typeof resources].translation)
  if (actualHash !== expectedHash) {
    issues.push(`${locale}: migration-equivalence hash changed (${actualHash})`)
  }
}

if (issues.length > 0) {
  console.error(`Locale verification failed with ${issues.length} issue(s):`)
  for (const issue of issues) console.error(`- ${issue}`)
  process.exitCode = 1
} else {
  console.log(`Locale verification passed: ${knownKeys.size} keys across pt-BR, en, and es.`)
}
