import {readFile, readdir} from 'node:fs/promises'
import path from 'node:path'

import {validateVisualMatrix} from './matrix.ts'
import {VISUAL_MATRIX} from '../../src/workbench/visualMatrix.ts'

export interface PrivacyResult {
  passed: boolean
  message: string
  checks: string[]
}

const read = async (cwd: string, filename: string): Promise<string> => readFile(path.join(cwd, filename), 'utf8')

const listFiles = async (directory: string): Promise<string[]> => {
  const output: string[] = []
  const visit = async (current: string): Promise<void> => {
    for (const entry of await readdir(current, {withFileTypes: true})) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'storybook-static') continue
      const filename = path.join(current, entry.name)
      if (entry.isDirectory()) await visit(filename)
      else if (entry.isFile()) output.push(filename)
    }
  }
  await visit(directory)
  return output.sort()
}

/** Static gate for the private-only contract; it never contacts a remote service. */
export const runPrivacyChecks = async (cwd = process.cwd()): Promise<PrivacyResult> => {
  const diagnostics: string[] = []
  const packageJson = JSON.parse(await read(cwd, 'package.json')) as {scripts?: Record<string, string>}
  const scripts = packageJson.scripts ?? {}
  for (const command of ['visual:compare', 'visual:update', 'visual:progress', 'visual:progress:check', 'visual:privacy']) {
    if (!scripts[command]) diagnostics.push(`package.json is missing ${command}`)
  }

  const workflowDirectory = path.join(cwd, '.github/workflows')
  const workflowFiles = await listFiles(workflowDirectory)
  for (const filename of workflowFiles.filter((candidate) => candidate.endsWith('.yml') || candidate.endsWith('.yaml'))) {
    const source = await readFile(filename, 'utf8')
    const relative = path.relative(cwd, filename).replaceAll(path.sep, '/')
    if (/chromatic|percy|applitools|sauce visual|upload-artifact|publish-storybook/i.test(source)) diagnostics.push(`${relative} references a public visual service or artifact upload`)
    if (/visual:update|VISUAL_UPDATE\s*=\s*1/i.test(source)) diagnostics.push(`${relative} enables visual baseline updates in CI`)
  }

  const visualFiles = (await listFiles(path.join(cwd, 'scripts/visual-regression'))).filter((filename) => filename.endsWith('.ts'))
  for (const filename of visualFiles) {
    const source = await readFile(filename, 'utf8')
    const relative = path.relative(cwd, filename).replaceAll(path.sep, '/')
    if (/chromatic|percy|applitools|upload-artifact|publish-storybook/i.test(source)) diagnostics.push(`${relative} references a public visual service or artifact upload`)
  }

  try {
    validateVisualMatrix(VISUAL_MATRIX)
  } catch (error: unknown) {
    diagnostics.push(error instanceof Error ? error.message : String(error))
  }

  const config = await read(cwd, 'visual-regression.config.json')
  if (!/"baselines"\s*:\s*"tests\/visual\/baselines"/.test(config)) diagnostics.push('visual baselines must remain in the private repository')
  if (!/"artifacts"\s*:\s*"tests\/visual\/\.artifacts"/.test(config)) diagnostics.push('visual artifacts must remain runner-local')

  if (diagnostics.length > 0) {
    throw new Error(`Private visual privacy checks failed:\n- ${diagnostics.join('\n- ')}`)
  }
  return {
    passed: true,
    message: 'Private visual privacy checks passed; no public visual service, publication, upload, or CI update mode is configured.',
    checks: ['local Storybook only', 'source-controlled baselines only', 'runner-local artifacts', 'CI update mode disabled', 'bounded explicit matrix'],
  }
}
