import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {createInstance} from 'i18next'
import ts from 'typescript'
import {assembleResources, collectCatalogueKeys, validateCatalogue} from '../../src/locales/catalogue/index.ts'
import {catalogue, type TranslationKey} from '../../src/locales/catalogue/catalogue.ts'
import {
  APP_LOCALES,
  LEGACY_LOCALE_ALIASES,
  normalizeLocale,
  resolveLocalePreference,
} from '../../src/lib/i18n/applicationLocale.ts'
import {DYNAMIC_TRANSLATION_FAMILIES} from '../../src/lib/i18n/translationKeys.ts'

const MIGRATION_BASELINE_HASHES = {
  'pt-BR': 'f7e28e25648fd7e4880d045a37990b37f725d02d3addc10220b07cdded07ae25',
  en: '41d99db001c92708a846ad5423aca5b460a79849d9dca8ba17460a46d479dc04',
  es: 'bec1e027faa45d4858bf8509d731035fb6e60942c4bbded8dcdc0eebe3560d0f',
} as const

function flatten(
  node: Record<string, unknown>,
  prefix = '',
  result: Record<string, string> = {},
): Record<string, string> {
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

    function visit(node: ts.Node): void {
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
const knownKeys = new Set<TranslationKey>(collectCatalogueKeys(catalogue))
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
const verificationI18n = createInstance()
await verificationI18n.init({
  lng: 'pt-BR',
  fallbackLng: {pt: ['pt-BR'], default: ['pt-BR']},
  supportedLngs: [...APP_LOCALES, ...LEGACY_LOCALE_ALIASES],
  load: 'currentOnly',
  returnObjects: false,
  resources,
})
const fallbackProbeKey: TranslationKey = 'common.loading'
const fallbackProbe = resources['pt-BR'].translation.common
if (
  typeof fallbackProbe !== 'object'
  || verificationI18n.t(fallbackProbeKey, {lng: 'pt'}) !== fallbackProbe.loading
  || verificationI18n.t(fallbackProbeKey, {lng: 'fr'}) !== fallbackProbe.loading
) {
  issues.push('i18next fallback: pt alias and unsupported locales must resolve through pt-BR')
}
if (verificationI18n.options.returnObjects !== false) {
  issues.push('i18next safety: object-valued translation returns must remain disabled')
}

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
