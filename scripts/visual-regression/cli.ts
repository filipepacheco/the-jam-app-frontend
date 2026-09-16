#!/usr/bin/env node

import {runVisualRegression} from './runner.ts'
import {runPrivacyChecks} from './privacy.ts'
import {runProgressCommand} from './progress.ts'

const usage = 'Usage: visual-regression <compare|update|progress|privacy> [options]'

const valueAfter = (args: string[], name: string): string | undefined => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

const run = async (): Promise<void> => {
  const [command, ...args] = process.argv.slice(2)
  if (!command) throw new Error(usage)
  if (command === 'privacy') {
    const result = await runPrivacyChecks(process.cwd())
    process.stdout.write(`${result.message}\n`)
    return
  }
  if (command === 'progress') {
    const check = args.includes('--check')
    const result = await runProgressCommand({cwd: process.cwd(), check})
    process.stdout.write(`${result.message}\n`)
    return
  }
  if (command !== 'compare' && command !== 'update') throw new Error(usage)

  const result = await runVisualRegression({
    mode: command,
    issue: valueAfter(args, '--issue'),
    reason: valueAfter(args, '--reason'),
    reviewer: valueAfter(args, '--reviewer'),
    storybookUrl: valueAfter(args, '--storybook-url'),
  })
  const changed = result.cells.filter((cell) => ['change', 'missing', 'failure', 'updated'].includes(cell.status))
  for (const cell of changed) {
    process.stdout.write(`${cell.status}: ${cell.key}${cell.message ? ` — ${cell.message}` : ''}\n`)
  }
  process.stdout.write(`Visual ${command}: ${JSON.stringify(result.summary)}\n`)
  if (command === 'compare' && (result.summary.change > 0 || result.summary.missing > 0 || result.summary.failure > 0)) {
    throw new Error('Visual comparison failed; inspect runner-local tests/visual/.artifacts and use the documented update protocol for intentional changes')
  }
}

run().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
