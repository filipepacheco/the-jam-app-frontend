import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { afterEach, describe, expect, it } from 'vitest'

const verifier = resolve('scripts/verify-production-isolation.mjs')
const temporaryRoots: string[] = []

function createProductionFixture() {
  const root = mkdtempSync(join(tmpdir(), 'jamapp-production-isolation-'))
  temporaryRoots.push(root)
  mkdirSync(join(root, 'dist', 'assets'), { recursive: true })
  mkdirSync(join(root, 'src'), { recursive: true })
  writeFileSync(join(root, 'dist', 'index.html'), '<main>Jam App</main>')
  writeFileSync(join(root, 'dist', 'assets', 'app.css'), '.bg-primary{color:red}')
  writeFileSync(join(root, 'src', 'main.tsx'), "import './App'\n")
  writeFileSync(join(root, 'src', 'App.tsx'), 'export function App() { return null }\n')
  return root
}

function verify(root: string) {
  return spawnSync(process.execPath, [verifier, '--root', root], { encoding: 'utf8' })
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('production isolation verification', () => {
  it('accepts a production build containing only application code and assets', () => {
    const result = verify(createProductionFixture())

    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).toContain('Production build is isolated from the private workbench')
  })

  it('rejects workbench-only assets in production output', () => {
    const root = createProductionFixture()
    writeFileSync(join(root, 'dist', 'mockServiceWorker.js'), '/* mock worker */')

    const result = verify(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('mockServiceWorker.js')
  })

  it('rejects production imports that can reach private workbench modules', () => {
    const root = createProductionFixture()
    mkdirSync(join(root, 'src', 'workbench'))
    writeFileSync(join(root, 'src', 'App.tsx'), "import './workbench/fixtures'\n")
    writeFileSync(join(root, 'src', 'workbench', 'fixtures.ts'), 'export const fixture = true\n')

    const result = verify(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('src/workbench/fixtures.ts')
  })

  it('rejects workbench-only Tailwind utilities in production CSS', () => {
    const root = createProductionFixture()
    writeFileSync(
      join(root, 'dist', 'assets', 'app.css'),
      '.outline-\\[--jamapp-workbench-sentinel\\]{outline-width:var(--jamapp-workbench-sentinel)}',
    )

    const result = verify(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('--jamapp-workbench-sentinel')
  })
})
