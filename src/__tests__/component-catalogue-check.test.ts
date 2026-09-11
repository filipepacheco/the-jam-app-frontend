import {cp, mkdtemp, readFile, readdir, rm, stat, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'

import {describe, expect, it} from 'vitest'

const repositoryRoot = path.resolve(import.meta.dirname, '../..')
const fixtureRoot = path.join(import.meta.dirname, 'fixtures/component-catalogue')
const cliPath = path.join(repositoryRoot, 'scripts/component-catalogue/cli.ts')
const tsxLoaderPath = path.join(repositoryRoot, 'node_modules/tsx/dist/loader.mjs')

interface CommandResult {
  status: number | null
  stdout: string
  stderr: string
}

interface FixtureConfig {
  ignore: Array<{source: string; reason: string}>
  output: {json: string; markdown: string}
}

interface FixtureMetadata {
  defaults: Record<string, unknown>
  rules: Array<{source: string; component?: string; metadata: Record<string, unknown>}>
  components: Array<{id: string; source: string; name: string}>
}

const createFixture = async (): Promise<string> => {
  const root = await mkdtemp(path.join(tmpdir(), 'jamapp-catalogue-check-'))
  await cp(fixtureRoot, root, {recursive: true})
  return root
}

const run = (root: string, ...args: string[]): CommandResult =>
  spawnSync(
    process.execPath,
    ['--import', tsxLoaderPath, cliPath, '--config', 'catalogue.config.json', ...args],
    {cwd: root, encoding: 'utf8'},
  )

const readJson = async <T,>(filename: string): Promise<T> =>
  JSON.parse(await readFile(filename, 'utf8')) as T

const writeJson = async (filename: string, value: unknown): Promise<void> => {
  await writeFile(filename, `${JSON.stringify(value, null, 2)}\n`)
}

const snapshotTree = async (root: string): Promise<Record<string, string>> => {
  const snapshot: Record<string, string> = {}
  const visit = async (directory: string): Promise<void> => {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const absolute = path.join(directory, entry.name)
      const relative = path.relative(root, absolute).replaceAll(path.sep, '/')
      if (entry.isDirectory()) {
        snapshot[`${relative}/`] = 'directory'
        await visit(absolute)
      } else {
        const details = await stat(absolute)
        snapshot[relative] = `${details.mode}:${details.size}:${details.mtimeMs}:${await readFile(absolute, 'base64')}`
      }
    }
  }
  await visit(root)
  return snapshot
}

describe('component catalogue check command', () => {
  it('accepts a generated baseline without changing any file', async () => {
    const root = await createFixture()
    expect(run(root).status).toBe(0)
    const before = await snapshotTree(root)

    const result = run(root, '--check')

    expect(result).toMatchObject({status: 0, stderr: ''})
    expect(result.stdout).toContain('Component catalogue is valid and up to date.')
    expect(await snapshotTree(root)).toEqual(before)
  })

  it.each([
    ['JSON', 'generated/catalogue.json'],
    ['Markdown', 'generated/catalogue.md'],
  ])('reports stale %s output and leaves the fixture byte-identical', async (_label, output) => {
    const root = await createFixture()
    expect(run(root).status).toBe(0)
    await writeFile(path.join(root, output), 'stale\n')
    const before = await snapshotTree(root)

    const result = run(root, '--check')

    expect(result.status).toBe(1)
    expect(result.stderr).toContain(`${output} is stale`)
    expect(result.stderr).toContain('Run `npm run catalogue:generate`')
    expect(await snapshotTree(root)).toEqual(before)
  })

  it('aggregates missing outputs and never creates their parent directory', async () => {
    const root = await createFixture()
    await rm(path.join(root, 'generated'), {recursive: true, force: true})
    const before = await snapshotTree(root)

    const result = run(root, '--check')

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('generated/catalogue.json is missing')
    expect(result.stderr).toContain('generated/catalogue.md is missing')
    expect(await snapshotTree(root)).toEqual(before)
  })

  it('aggregates actionable identifier, taxonomy, family, and uncertain-note errors', async () => {
    const root = await createFixture()
    const metadataPath = path.join(root, 'catalogue.metadata.json')
    const metadata = await readJson<FixtureMetadata>(metadataPath)
    metadata.components[0].id = '../Bad ID'
    metadata.components[1].id = '../Bad ID'
    metadata.defaults.category = 'widget'
    metadata.defaults.candidateFamily = 'toast'
    metadata.defaults.notes = []
    await writeJson(metadataPath, metadata)
    const before = await snapshotTree(root)

    const result = run(root, '--check')

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('components[0].id: invalid stable identifier')
    expect(result.stderr).toContain('duplicate stable identifier "../Bad ID"')
    expect(result.stderr).toContain('defaults.category: invalid value "widget"')
    expect(result.stderr).toContain('defaults.candidateFamily: unknown candidate family "toast"')
    expect(result.stderr).toContain('defaults: uncertain classifications require a non-blank note')
    expect(await snapshotTree(root)).toEqual(before)
  })

  it('reports selector, ignore, and metadata rule problems together', async () => {
    const root = await createFixture()
    const configPath = path.join(root, 'catalogue.config.json')
    const metadataPath = path.join(root, 'catalogue.metadata.json')
    const config = await readJson<FixtureConfig>(configPath)
    const metadata = await readJson<FixtureMetadata>(metadataPath)
    config.ignore.push(
      {source: 'src/IgnoredScene.tsx', reason: 'duplicate'},
      {source: '../outside.tsx', reason: ''},
      {source: 'src/NamedWidget.tsx', reason: 'This source actually declares a component.'},
    )
    metadata.components.push(
      {id: 'ui.fixture.missing', source: 'src/Missing.tsx', name: 'Missing'},
      {id: 'ui.fixture.duplicate-selector', source: 'src/NamedWidget.tsx', name: 'NamedWidget'},
    )
    metadata.rules.push(
      {source: 'src/Missing.tsx', metadata: {productArea: 'jam'}},
      {source: 'src/*.tsx', component: 'NamedWidget', metadata: {productArea: 'jam'}},
      {source: 'src/NamedWidget.tsx', component: 'Missing', metadata: {productArea: 'jam'}},
    )
    await Promise.all([writeJson(configPath, config), writeJson(metadataPath, metadata)])
    const before = await snapshotTree(root)

    const result = run(root, '--check')

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('duplicate ignore source "src/IgnoredScene.tsx"')
    expect(result.stderr).toContain('ignore[2].source: path must be normalized and stay inside the catalogue root')
    expect(result.stderr).toContain('ignore[2].reason: reason must be non-blank')
    expect(result.stderr).toContain('ignore[3]: source is not eligible for ignoring because it declares React components')
    expect(result.stderr).toContain('duplicate component selector "src/NamedWidget.tsx#NamedWidget"')
    expect(result.stderr).toContain('component selector "src/Missing.tsx#Missing" does not resolve')
    expect(result.stderr).toContain('rules[1]: exact source "src/Missing.tsx" does not resolve')
    expect(result.stderr).toContain('rules[2]: component-scoped rules require an exact source path')
    expect(result.stderr).toContain('rules[3]: component selector "src/NamedWidget.tsx#Missing" does not resolve')
    expect(await snapshotTree(root)).toEqual(before)
  })

  it('validates complete metadata arrays and safe distinct output paths', async () => {
    const root = await createFixture()
    const configPath = path.join(root, 'catalogue.config.json')
    const metadataPath = path.join(root, 'catalogue.metadata.json')
    const config = await readJson<FixtureConfig>(configPath)
    const metadata = await readJson<FixtureMetadata>(metadataPath)
    config.output.json = '../catalogue.json'
    config.output.markdown = '../catalogue.json'
    metadata.defaults.viewportContexts = 'mobile'
    metadata.defaults.uiStates = [1, '']
    metadata.defaults.readiness = {workbench: 'ready'}
    metadata.rules.push({source: 'src/NoMatch*.tsx', metadata: {notes: []}})
    await Promise.all([writeJson(configPath, config), writeJson(metadataPath, metadata)])
    const before = await snapshotTree(root)

    const result = run(root, '--check')

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('output.json: path must be normalized and stay inside the catalogue root')
    expect(result.stderr).toContain('output.json and output.markdown must be distinct')
    expect(result.stderr).toContain('defaults.viewportContexts: expected an array')
    expect(result.stderr).toContain('defaults.uiStates[0]: expected a string')
    expect(result.stderr).toContain('defaults.uiStates[1]: value must be non-blank')
    expect(result.stderr).toContain('defaults.readiness.accessibility: expected a string')
    expect(result.stderr).toContain('rules[1]: source pattern "src/NoMatch*.tsx" is stale')
    expect(await snapshotTree(root)).toEqual(before)
  })

  it('turns malformed metadata rules into field-level diagnostics instead of runtime errors', async () => {
    const root = await createFixture()
    const metadataPath = path.join(root, 'catalogue.metadata.json')
    const metadata = await readJson<FixtureMetadata>(metadataPath)
    const rules = metadata.rules as unknown[]
    rules.push(
      {source: 42, metadata: {productArea: 'jam'}},
      {source: 'src/NamedWidget.tsx', metadata: null},
    )
    await writeJson(metadataPath, metadata)
    const before = await snapshotTree(root)

    const result = run(root, '--check')

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('rules[1].source: path must be normalized and stay inside the catalogue root')
    expect(result.stderr).toContain('rules[2].metadata: expected an object')
    expect(result.stderr).not.toContain('TypeError')
    expect(await snapshotTree(root)).toEqual(before)
  })
})
