import { existsSync, statSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'

const FORBIDDEN_RUNTIME_PACKAGES = [
  '@storybook/',
  '@vitest/browser',
  'msw',
  'msw-storybook-addon',
  'playwright',
  'storybook',
]
const WORKBENCH_CSS_SENTINEL = '--jamapp-workbench-sentinel'
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']
const IMPORT_PATTERN = /(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g

function parseRootArgument() {
  const rootIndex = process.argv.indexOf('--root')
  if (rootIndex === -1) return resolve(import.meta.dirname, '..')
  const value = process.argv[rootIndex + 1]
  if (!value) throw new Error('--root requires a directory')
  return resolve(value)
}

async function listFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await listFiles(path))
    if (entry.isFile()) files.push(path)
  }
  return files
}

function resolveLocalImport(importer, specifier) {
  const base = specifier.startsWith('@/')
    ? join(repositoryRoot, 'src', specifier.slice(2))
    : resolve(dirname(importer), specifier)
  const candidates = [
    base,
    ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...SOURCE_EXTENSIONS.map((extension) => join(base, `index${extension}`)),
  ]
  return candidates.find((candidate) => existsSync(candidate) && statSyncFile(candidate))
}

function statSyncFile(path) {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

function isPrivateWorkbenchPath(path) {
  const normalized = relative(repositoryRoot, path).split(sep).join('/')
  return normalized === '.storybook' || normalized.startsWith('.storybook/') || normalized.startsWith('src/workbench/')
}

function isForbiddenPackage(specifier) {
  return FORBIDDEN_RUNTIME_PACKAGES.some((name) => specifier === name || specifier.startsWith(name))
}

async function inspectProductionImports(entry) {
  const violations = []
  const pending = [entry]
  const visited = new Set()

  while (pending.length > 0) {
    const current = pending.pop()
    if (!current || visited.has(current)) continue
    visited.add(current)

    const source = await readFile(current, 'utf8')
    for (const match of source.matchAll(IMPORT_PATTERN)) {
      const specifier = match[1] ?? match[2]
      if (!specifier) continue

      if (specifier.startsWith('.') || specifier.startsWith('@/')) {
        const resolvedImport = resolveLocalImport(current, specifier)
        if (!resolvedImport) continue
        if (isPrivateWorkbenchPath(resolvedImport)) {
          violations.push(relative(repositoryRoot, resolvedImport).split(sep).join('/'))
        } else if (SOURCE_EXTENSIONS.includes(extname(resolvedImport))) {
          pending.push(resolvedImport)
        }
      } else if (isForbiddenPackage(specifier)) {
        violations.push(`${relative(repositoryRoot, current).split(sep).join('/')} imports ${specifier}`)
      }
    }
  }

  return violations
}

async function inspectProductionOutput(distDirectory) {
  const violations = []
  const files = await listFiles(distDirectory)

  for (const file of files) {
    const outputPath = relative(distDirectory, file).split(sep).join('/')
    if (/mockServiceWorker\.js$/i.test(outputPath) || /(^|\/)(storybook|workbench)(\/|[-.])/i.test(outputPath)) {
      violations.push(`workbench-only output: ${outputPath}`)
    }

    const extension = extname(file)
    if (['.css', '.html', '.js', '.mjs'].includes(extension)) {
      const contents = await readFile(file, 'utf8')
      if (contents.includes(WORKBENCH_CSS_SENTINEL)) {
        violations.push(`workbench-only CSS marker ${WORKBENCH_CSS_SENTINEL} in ${outputPath}`)
      }
    }
  }

  return violations
}

const repositoryRoot = parseRootArgument()
const distDirectory = join(repositoryRoot, 'dist')
const entry = join(repositoryRoot, 'src', 'main.tsx')

try {
  if (!existsSync(distDirectory)) throw new Error(`Production output does not exist: ${distDirectory}`)
  if (!existsSync(entry)) throw new Error(`Production entry point does not exist: ${entry}`)

  const violations = [
    ...await inspectProductionImports(entry),
    ...await inspectProductionOutput(distDirectory),
  ]

  if (violations.length > 0) {
    throw new Error(`Production isolation failed:\n${[...new Set(violations)].map((value) => `- ${value}`).join('\n')}`)
  }

  console.log('Production build is isolated from the private workbench.')
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
