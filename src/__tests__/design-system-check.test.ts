import {cp, mkdtemp, readFile, readdir, stat, writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {tmpdir} from 'node:os'
import path from 'node:path'

import {describe, expect, it} from 'vitest'

const repositoryRoot = path.resolve(import.meta.dirname, '../..')
const fixtureRoot = path.join(import.meta.dirname, 'fixtures/component-catalogue')
const cliPath = path.join(repositoryRoot, 'scripts/design-system-check/cli.ts')
const catalogueCliPath = path.join(repositoryRoot, 'scripts/component-catalogue/cli.ts')
const tsxLoaderPath = path.join(repositoryRoot, 'node_modules/tsx/dist/loader.mjs')

interface CommandResult {
  status: number | null
  stdout: string
  stderr: string
}

interface FixtureMetadata {
  components: Array<{id: string; source: string; name: string}>
  rules: Array<{source: string; metadata: Record<string, unknown>}>
}

interface GovernanceBaseline {
  schemaVersion: number
  reviewedDebt: Array<Record<string, unknown>>
}

const reviewedDebt = (id: string, kind: string): Record<string, unknown> => ({
  id,
  kind,
  scope: 'unchanged-at-base',
  reason: 'Existing fixture workbench evidence is intentionally introduced before progressive enforcement.',
  owner: 'fixture-owner',
  record: 'issue #60 fixture governance record',
  removeWhen: 'The affected story is changed and has strict evidence.',
})

const run = (root: string, ...args: string[]): CommandResult =>
  spawnSync(
    process.execPath,
    ['--import', tsxLoaderPath, cliPath, '--config', 'design-system-check.config.json', ...args],
    {cwd: root, encoding: 'utf8'},
  )

const runCatalogue = (root: string): CommandResult =>
  spawnSync(
    process.execPath,
    ['--import', tsxLoaderPath, catalogueCliPath, '--config', 'catalogue.config.json'],
    {cwd: root, encoding: 'utf8'},
  )

const git = (root: string, ...args: string[]): CommandResult =>
  spawnSync('git', args, {cwd: root, encoding: 'utf8'})

const commit = (root: string, message: string): string => {
  expect(git(root, 'add', '.').status).toBe(0)
  expect(git(root, 'commit', '-m', message).status).toBe(0)
  const result = git(root, 'rev-parse', 'HEAD')
  expect(result.status).toBe(0)
  return result.stdout.trim()
}

const readJson = async <T,>(filename: string): Promise<T> =>
  JSON.parse(await readFile(filename, 'utf8')) as T

const writeJson = async (filename: string, value: unknown): Promise<void> => {
  await writeFile(filename, `${JSON.stringify(value, null, 2)}\n`)
}

const snapshotTree = async (root: string): Promise<Record<string, string>> => {
  const snapshot: Record<string, string> = {}
  const visit = async (directory: string): Promise<void> => {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      if (entry.name === '.git') continue
      const absolute = path.join(directory, entry.name)
      const relative = path.relative(root, absolute).replaceAll(path.sep, '/')
      if (entry.isDirectory()) {
        snapshot[`${relative}/`] = 'directory'
        await visit(absolute)
      } else {
        const details = await stat(absolute)
        snapshot[relative] = `${details.mode}:${details.size}:${await readFile(absolute, 'base64')}`
      }
    }
  }
  await visit(root)
  return snapshot
}

const writeStrictStory = async (root: string, interaction: string): Promise<void> => {
  await writeFile(
    path.join(root, 'stories/NamedWidget.stories.tsx'),
    `import {NamedWidget} from '../src/NamedWidget'\n\nexport const Primary = {\n  render: () => <NamedWidget />,\n  parameters: {\n    a11y: {test: 'error'},\n    designSystem: {interaction: ${interaction}},\n  },\n}\n`,
  )
}

const createFixture = async (): Promise<{root: string; base: string}> => {
  const root = await mkdtemp(path.join(tmpdir(), 'jamapp-design-system-check-'))
  await cp(fixtureRoot, root, {recursive: true})
  await writeJson(path.join(root, 'design-system-check.config.json'), {
    catalogueConfig: 'catalogue.config.json',
    catalogueOutput: 'generated/catalogue.json',
    stories: ['stories/**/*.stories.tsx'],
    baseline: 'design-system-baseline.json',
  })
  await writeJson(path.join(root, 'design-system-baseline.json'), {
    schemaVersion: 1,
    reviewedDebt: [
      reviewedDebt('debt.fixture.component-exemption', 'component-exemption'),
      reviewedDebt('debt.fixture.story-accessibility', 'story-accessibility'),
      reviewedDebt('debt.fixture.story-interaction', 'story-interaction'),
    ],
  })
  expect(runCatalogue(root).status).toBe(0)
  expect(git(root, 'init').status).toBe(0)
  expect(git(root, 'config', 'user.email', 'test@example.com').status).toBe(0)
  expect(git(root, 'config', 'user.name', 'Fixture Test').status).toBe(0)
  const base = commit(root, 'fixture baseline')
  return {root, base}
}

describe('design-system check command', () => {
  it('reports reviewed unchanged debt as warnings without blocking the check', async () => {
    const {root, base} = await createFixture()

    const result = run(root, '--base', base)

    expect(result).toMatchObject({status: 0, stderr: ''})
    expect(result.stdout).toContain('warning [debt.fixture.story-accessibility]')
    expect(result.stdout).toContain('warning [debt.fixture.story-interaction]')
    expect(result.stdout).toContain(`Compared against base ${base}`)
  })

  it('fails a newly added reusable component that has no catalogue metadata', async () => {
    const {root, base} = await createFixture()
    await writeFile(path.join(root, 'src/NewCard.tsx'), 'export const NewCard = () => <section>New</section>\n')
    commit(root, 'add untracked component metadata')

    const result = run(root, '--base', base)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('component "src/NewCard.tsx#NewCard" requires a curated stable identifier')
  })

  it('fails a new ready reusable component without a meaningful reachable story', async () => {
    const {root, base} = await createFixture()
    await writeFile(path.join(root, 'src/NewCard.tsx'), 'export const NewCard = () => <section>New</section>\n')
    const metadataPath = path.join(root, 'catalogue.metadata.json')
    const metadata = await readJson<FixtureMetadata>(metadataPath)
    metadata.components.push({id: 'ui.fixture.new-card', source: 'src/NewCard.tsx', name: 'NewCard'})
    metadata.rules.push({
      source: 'src/NewCard.tsx',
      metadata: {lifecycle: 'active', readiness: {workbench: 'ready'}},
    })
    await writeJson(metadataPath, metadata)
    expect(runCatalogue(root).status).toBe(0)
    commit(root, 'add catalogued component without story')

    const result = run(root, '--base', base)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('ui.fixture.new-card is missing a meaningful reachable story')
  })

  it('does not treat a Storybook module without a named story as meaningful evidence', async () => {
    const {root, base} = await createFixture()
    await writeFile(path.join(root, 'src/NewCard.tsx'), 'export const NewCard = () => <section>New</section>\n')
    await writeFile(
      path.join(root, 'stories/NewCard.stories.tsx'),
      `import {NewCard} from '../src/NewCard'\n\nexport default {component: NewCard}\n`,
    )
    const metadataPath = path.join(root, 'catalogue.metadata.json')
    const metadata = await readJson<FixtureMetadata>(metadataPath)
    metadata.components.push({id: 'ui.fixture.new-card', source: 'src/NewCard.tsx', name: 'NewCard'})
    metadata.rules.push({
      source: 'src/NewCard.tsx',
      metadata: {lifecycle: 'active', readiness: {workbench: 'ready'}},
    })
    await writeJson(metadataPath, metadata)
    expect(runCatalogue(root).status).toBe(0)
    commit(root, 'add a story module without a story export')

    const result = run(root, '--base', base)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('ui.fixture.new-card is missing a meaningful reachable story')
  })

  it('requires interaction evidence for changed eligible stories but accepts a reasoned static classification', async () => {
    const {root, base} = await createFixture()
    await writeStrictStory(root, "{status: 'required'}")
    commit(root, 'make story strict without interaction evidence')

    const failure = run(root, '--base', base)

    expect(failure.status).toBe(1)
    expect(failure.stderr).toContain('stories/NamedWidget.stories.tsx#Primary requires a callable play function')

    await writeStrictStory(root, "{status: 'not-applicable', rationale: 'The widget is static text with no user-operated behavior.'}")
    commit(root, 'classify static story')

    const passing = run(root, '--base', base)

    expect(passing).toMatchObject({status: 0, stderr: ''})
  })

  it('fails a changed story that keeps an accessibility check in todo mode', async () => {
    const {root, base} = await createFixture()
    await writeFile(
      path.join(root, 'stories/NamedWidget.stories.tsx'),
      `import {NamedWidget} from '../src/NamedWidget'\n\nexport const Primary = {\n  render: () => <NamedWidget />,\n  parameters: {\n    a11y: {test: 'todo'},\n    designSystem: {interaction: {status: 'not-applicable', rationale: 'The widget is static text.'}},\n  },\n}\n`,
    )
    commit(root, 'change story without strict accessibility')

    const result = run(root, '--base', base)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('stories/NamedWidget.stories.tsx#Primary requires a11y.test: error')
  })

  it('enforces an aliased named CSF export instead of only direct export declarations', async () => {
    const {root, base} = await createFixture()
    await writeFile(
      path.join(root, 'stories/NamedWidget.stories.tsx'),
      `import {NamedWidget} from '../src/NamedWidget'\n\nconst NamedPrimary = {\n  render: () => <NamedWidget />,\n  parameters: {\n    a11y: {test: 'todo'},\n    designSystem: {interaction: {status: 'not-applicable', rationale: 'The widget is static text.'}},\n  },\n}\n\nexport {NamedPrimary as Primary}\n`,
    )
    commit(root, 'export a story through a named alias')

    const result = run(root, '--base', base)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('stories/NamedWidget.stories.tsx#Primary requires a11y.test: error')
  })

  it('rejects a non-callable play value as interaction evidence', async () => {
    const {root, base} = await createFixture()
    await writeFile(
      path.join(root, 'stories/NamedWidget.stories.tsx'),
      `import {NamedWidget} from '../src/NamedWidget'\n\nexport const Primary = {\n  render: () => <NamedWidget />,\n  play: undefined,\n  parameters: {a11y: {test: 'error'}},\n}\n`,
    )
    commit(root, 'add an empty play value')

    const result = run(root, '--base', base)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('stories/NamedWidget.stories.tsx#Primary requires a callable play function')
  })

  it('requires a user-observable assertion in a callable play function', async () => {
    const {root, base} = await createFixture()
    await writeFile(
      path.join(root, 'stories/NamedWidget.stories.tsx'),
      `import {NamedWidget} from '../src/NamedWidget'\n\nexport const Primary = {\n  render: () => <NamedWidget />,\n  play: async () => {},\n  parameters: {a11y: {test: 'error'}},\n}\n`,
    )
    commit(root, 'add a play callback without an assertion')

    const result = run(root, '--base', base)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('stories/NamedWidget.stories.tsx#Primary requires a user-observable assertion')
  })

  it('requires a play assertion to query an accessible role or label', async () => {
    const {root, base} = await createFixture()
    await writeFile(
      path.join(root, 'stories/NamedWidget.stories.tsx'),
      `import {NamedWidget} from '../src/NamedWidget'\n\nexport const Primary = {\n  render: () => <NamedWidget />,\n  play: async () => { expect(true).toBe(true) },\n  parameters: {a11y: {test: 'error'}},\n}\n`,
    )
    commit(root, 'assert an implementation detail without querying the story')

    const result = run(root, '--base', base)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('stories/NamedWidget.stories.tsx#Primary requires an accessible role or label query')
  })

  it('accepts a play assertion that queries an accessible role', async () => {
    const {root, base} = await createFixture()
    await writeFile(
      path.join(root, 'stories/NamedWidget.stories.tsx'),
      `import {NamedWidget} from '../src/NamedWidget'\n\nexport const Primary = {\n  render: () => <NamedWidget />,\n  play: async ({canvas}: {canvas: {getByRole: (role: string) => unknown}}) => {\n    expect(canvas.getByRole('paragraph')).toBeDefined()\n  },\n  parameters: {a11y: {test: 'error'}},\n}\n`,
    )
    commit(root, 'query an accessible story outcome')

    const result = run(root, '--base', base)

    expect(result).toMatchObject({status: 0, stderr: ''})
  })

  it('requires a static exemption rationale to identify the lack of user-operated behavior', async () => {
    const {root, base} = await createFixture()
    await writeStrictStory(root, "{status: 'not-applicable', rationale: 'Not needed.'}")
    commit(root, 'add an unreasoned static classification')

    const result = run(root, '--base', base)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('stories/NamedWidget.stories.tsx#Primary requires a rationale explaining why the story is static')
  })

  it.each(['reason', 'owner', 'record', 'removeWhen'])('rejects an exception missing %s', async (field) => {
    const {root, base} = await createFixture()
    const baselinePath = path.join(root, 'design-system-baseline.json')
    const baseline = await readJson<GovernanceBaseline>(baselinePath)
    delete baseline.reviewedDebt[0][field]
    await writeJson(baselinePath, baseline)
    commit(root, `remove ${field} from baseline debt`)

    const result = run(root, '--base', base)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain(`reviewedDebt[0].${field} must be a non-blank string`)
  })

  it('maps a changed component source to its reachable stories', async () => {
    const {root, base} = await createFixture()
    await writeFile(
      path.join(root, 'src/NamedWidget.tsx'),
      `import {useTranslation} from 'react-i18next'\nimport type {JSX} from 'react'\nimport './Styled.css'\n\nexport function NamedWidget(): JSX.Element {\n  const {t} = useTranslation()\n  return <p aria-live="polite">{t('widget.label')}</p>\n}\n`,
    )
    expect(runCatalogue(root).status).toBe(0)
    commit(root, 'change component source')

    const result = run(root, '--base', base)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('is impacted by changed component source src/NamedWidget.tsx')
  })

  it('uses the supplied base SHA instead of guessing a repository branch', async () => {
    const {root, base} = await createFixture()
    await writeStrictStory(root, "{status: 'not-applicable', rationale: 'The widget is static text with no user-operated behavior.'}")
    const head = commit(root, 'make strict static story')

    const result = run(root, '--base', base)

    expect(result).toMatchObject({status: 0, stderr: ''})
    expect(result.stdout).toContain(`Compared against base ${base}`)
    expect(result.stdout).not.toContain(head)
  })

  it('keeps catalogue freshness checking non-mutating', async () => {
    const {root, base} = await createFixture()
    await writeFile(path.join(root, 'generated/catalogue.json'), 'stale\n')
    const before = await snapshotTree(root)

    const result = run(root, '--base', base)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('generated/catalogue.json is stale')
    expect(await snapshotTree(root)).toEqual(before)
  })
})
