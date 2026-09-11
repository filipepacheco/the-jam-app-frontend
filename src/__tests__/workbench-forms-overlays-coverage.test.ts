import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const scope = [
  'ui.0009', 'ui.0018', 'ui.0024', 'ui.0026', 'ui.0027', 'ui.0028', 'ui.0029',
  'ui.0040', 'ui.0041', 'ui.0042', 'ui.0054', 'ui.0055', 'ui.0056', 'ui.0060',
  'ui.0061', 'ui.0062', 'ui.0063', 'ui.0068', 'ui.0071', 'ui.0073', 'ui.0093',
  'ui.0094', 'ui.0101', 'ui.0109', 'ui.0117', 'ui.0125', 'ui.0127', 'ui.0128',
] as const

describe('forms and overlays workbench coverage', () => {
  it('records every active scoped component as ready or explicitly exempt', () => {
    const catalogue = JSON.parse(readFileSync(resolve('docs/design-system/component-catalogue.json'), 'utf8')) as {
      components: Array<{ id: string; source: string; name: string; metadata: { readiness: { workbench: string }; notes: string[] } }>
    }
    const storyText = readdirSync(resolve('src/workbench/stories'))
      .filter((file) => file.endsWith('.stories.tsx'))
      .map((file) => readFileSync(resolve('src/workbench/stories', file), 'utf8'))
      .join('\n')

    expect(scope).toHaveLength(28)
    for (const id of scope) {
      const component = catalogue.components.find((entry) => entry.id === id)
      expect(component, id).toBeDefined()
      expect(['ready', 'exempt'], id).toContain(component?.metadata.readiness.workbench)
      if (component?.metadata.readiness.workbench === 'ready') {
        expect(storyText, `${id} ${component.name}`).toContain(component.source.replace('src/', '../../').replace('.tsx', ''))
      } else {
        expect(component?.metadata.notes.join(' '), id).toMatch(/Phase 3 exemption.*remove when/i)
      }
    }
  })
})
