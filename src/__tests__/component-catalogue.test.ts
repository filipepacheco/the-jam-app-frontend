import {cp, mkdtemp, readFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'

import {describe, expect, it} from 'vitest'

import type {ComponentCatalogue} from '../types/componentCatalogue.types.ts'

const repositoryRoot = path.resolve(import.meta.dirname, '../..')
const fixtureRoot = path.join(import.meta.dirname, 'fixtures/component-catalogue')
const cliPath = path.join(repositoryRoot, 'scripts/component-catalogue/cli.ts')
const tsxLoaderPath = path.join(repositoryRoot, 'node_modules/tsx/dist/loader.mjs')

const generate = async (): Promise<{
  root: string
  json: string
  markdown: string
  catalogue: ComponentCatalogue
}> => {
  const root = await mkdtemp(path.join(tmpdir(), 'jamapp-catalogue-'))
  await cp(fixtureRoot, root, {recursive: true})
  const result = spawnSync(
    process.execPath,
    ['--import', tsxLoaderPath, cliPath, '--config', 'catalogue.config.json'],
    {cwd: root, encoding: 'utf8'},
  )
  if (result.status !== 0) throw new Error(result.stderr || result.stdout)
  const json = await readFile(path.join(root, 'generated/catalogue.json'), 'utf8')
  const markdown = await readFile(path.join(root, 'generated/catalogue.md'), 'utf8')
  return {root, json, markdown, catalogue: JSON.parse(json) as ComponentCatalogue}
}

describe('component catalogue command', () => {
  it('discovers named, default, local, and re-exported React components', async () => {
    const {catalogue} = await generate()

    expect(catalogue.components.map((component) => component.name)).toEqual([
      'AnonymousFunction',
      'AnonymousView',
      'CataloguePage',
      'DefaultPanel',
      'DynamicDefault',
      'DynamicUnused',
      'InlinePatterns',
      'LocalBadge',
      'NamedWidget',
      'UnusedCard',
      'WrappedForwardRef',
      'WrappedMemo',
    ])
    expect(catalogue.components.find((component) => component.name === 'LocalBadge')).toMatchObject({
      visibility: 'local',
      exports: [],
    })
    expect(catalogue.components.find((component) => component.name === 'DefaultPanel')?.exports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({kind: 'default', name: 'default'}),
        expect.objectContaining({kind: 're-export', name: 'DefaultPanel', module: 'src/public.ts'}),
      ]),
    )
    expect(catalogue.components.find((component) => component.name === 'NamedWidget')?.exports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({kind: 'named', name: 'NamedWidget'}),
        expect.objectContaining({kind: 're-export', name: 'ReExportedWidget'}),
      ]),
    )
    for (const name of [
      'AnonymousFunction',
      'AnonymousView',
      'WrappedForwardRef',
      'WrappedMemo',
    ]) {
      expect(catalogue.components.find((component) => component.name === name)).toMatchObject({
        declaration: 'function',
        visibility: 'exported',
        exports: [expect.objectContaining({kind: 'default', name: 'default'})],
      })
    }
  })

  it('represents every eligible source or records an explicit ignore reason', async () => {
    const {catalogue, markdown} = await generate()

    expect(catalogue.coverage).toEqual({eligibleSources: 11, representedSources: 10, ignoredSources: 1})
    expect(catalogue.ignored).toEqual([
      {
        source: 'src/IgnoredScene.tsx',
        reason: 'Empty retired promotional scene retained during cleanup.',
      },
    ])
    expect(catalogue.components.find((component) => component.name === 'CataloguePage')).toMatchObject({
      id: 'ui.fixture.catalogue-page',
      metadata: {
        category: 'page-composition',
        layer: 'page-composition',
        lifecycle: 'active',
        productArea: 'jam',
        viewportContexts: ['mobile', 'desktop'],
      },
    })
    expect(catalogue.components.find((component) => component.name === 'UnusedCard')).toMatchObject({
      metadata: {
        lifecycle: 'uncertain',
        productArea: 'uncertain',
        readiness: {
          workbench: 'needs-review',
          accessibility: 'unknown',
          internationalization: 'unknown',
          theme: 'unknown',
        },
      },
    })
    expect(markdown).toContain('## Explicitly ignored sources')
    expect(markdown).toContain('requires human review')
  })

  it('reports repeated inline UI families as unreviewed candidates', async () => {
    const {catalogue, markdown} = await generate()

    expect(catalogue.reviewCandidates.map((candidate) => candidate.family)).toEqual([
      'action',
      'badge',
      'card',
      'drawer',
      'field',
      'menu',
      'modal',
    ])
    for (const candidate of catalogue.reviewCandidates) {
      expect(candidate).toMatchObject({assessment: 'review-candidate', equivalence: 'unreviewed'})
      expect(candidate.occurrences.length).toBeGreaterThanOrEqual(2)
    }
    expect(
      catalogue.reviewCandidates
        .find((candidate) => candidate.family === 'action')
        ?.occurrences.some((occurrence) => occurrence.dynamicClasses),
    ).toBe(true)
    expect(markdown).toContain('Similarity is not equivalence')
    expect(markdown).toMatch(/`src\/InlinePatterns\.tsx:\d+:\d+`/)
    expect(markdown).toContain('owner `ui.fixture.inline-patterns`')
    expect(markdown).toContain('equivalence: unreviewed')
  })

  it('reports consumers and context dependencies in both outputs', async () => {
    const {catalogue, markdown} = await generate()
    const widget = catalogue.components.find((component) => component.name === 'NamedWidget')
    const page = catalogue.components.find((component) => component.name === 'CataloguePage')
    const localBadge = catalogue.components.find((component) => component.name === 'LocalBadge')
    const defaultPanel = catalogue.components.find((component) => component.name === 'DefaultPanel')
    const dynamicDefault = catalogue.components.find((component) => component.name === 'DynamicDefault')
    const dynamicUnused = catalogue.components.find((component) => component.name === 'DynamicUnused')
    const unusedCard = catalogue.components.find((component) => component.name === 'UnusedCard')

    expect(widget?.consumers).toEqual([
      'src/CataloguePage.tsx',
      'src/DefaultPanel.tsx',
      'src/NamedWidget.tsx',
    ])
    expect(widget?.dependencies.contexts).toContain('internationalization')
    expect(widget?.dependencies.internal).toContain('src/Styled.css')
    expect(page?.dependencies.contexts).toEqual(['routing'])
    expect(localBadge).toMatchObject({
      consumers: ['src/CataloguePage.tsx'],
      dependencies: {internal: [], external: ['react'], contexts: ['browser']},
    })
    expect(defaultPanel?.consumers).toEqual(['src/CataloguePage.tsx'])
    expect(dynamicDefault?.consumers).toEqual(['src/CataloguePage.tsx'])
    expect(dynamicUnused?.consumers).toEqual([])
    expect(unusedCard?.consumers).toEqual([])
    expect(markdown).toContain('| NamedWidget | `src/NamedWidget.tsx`')
    expect(markdown).toContain('`src/CataloguePage.tsx`')
    expect(markdown).toContain('internationalization')
  })

  it('generates byte-identical outputs across runs and filesystem roots', async () => {
    const first = await generate()
    const second = await generate()

    expect(second.json).toBe(first.json)
    expect(second.markdown).toBe(first.markdown)
  })
})
