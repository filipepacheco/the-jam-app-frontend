import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
import {describe, expect, it} from 'vitest'

const html = readFileSync('index.html', 'utf8')
const bootstrap = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? ''

describe('theme before React loads', () => {
  it.each([
    [null, null, 'jam-light'],
    ['jam-dark', null, 'jam-dark'],
    ['jam-light', 'dark', 'jam-light'],
    [null, 'dark', 'jam-dark'],
    [null, 'light', 'jam-light'],
    ['retired-theme', null, 'jam-light'],
  ])('resolves saved %s and legacy %s to %s', (saved, legacy, expected) => {
    let applied: string | undefined
    runInNewContext(bootstrap, {
      localStorage: {getItem: (key: string) => key === 'jam-app.theme' ? saved : legacy},
      document: {documentElement: {setAttribute: (_: string, value: string) => { applied = value }}},
    })
    expect(applied).toBe(expected)
  })

  it('is permitted by the deployed Content Security Policy', () => {
    const hash = createHash('sha256').update(bootstrap).digest('base64')
    expect(readFileSync('vercel.json', 'utf8')).toContain(`'sha256-${hash}'`)
    expect(html).toContain('<html lang="pt-BR" data-theme="jam-light">')
  })
})
