import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const storyPath = 'src/workbench/stories/Foundations/ColorAndThemes.stories.tsx'

describe('color and theme foundation guidance', () => {
  it('renders every selectable theme through the private workbench smoke story', () => {
    const story = readFileSync(resolve(storyPath), 'utf8')

    expect(story).toContain("import { SELECTABLE_THEMES")
    expect(story).toContain('SELECTABLE_THEMES.map')
    expect(story).toContain("title: 'Foundations/Color and themes'")
    expect(story).toContain('button.ds-focusable')
    expect(story).toContain('[data-status]')
    expect(story).toContain('data-status={state}')
    expect(story).toContain('panel.style.background')
    expect(story).toContain('panel.style.color')
    expect(story).toContain('await userEvent.tab()')
    expect(story).toContain("matches(':focus-visible')")
  })

  it('keeps the foundation story outside the production component catalogue', () => {
    const config = JSON.parse(readFileSync(resolve('component-catalogue.config.json'), 'utf8')) as {
      ignore: Array<{ source: string; reason: string }>
    }

    expect(config.ignore).toContainEqual({
      source: storyPath,
      reason: 'Private Storybook reference for color and theme foundations; not product UI.',
    })
  })

  it('documents theme expectations and semantic-token usage', () => {
    const guide = readFileSync(resolve('docs/design-system/color-and-themes.md'), 'utf8')

    expect(guide).toContain('## Semantic roles')
    expect(guide).toContain('## Selectable-theme contract')
    expect(guide).toContain('var(--ds-action-primary)')
  })
})
