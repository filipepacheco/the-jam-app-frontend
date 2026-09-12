#!/usr/bin/env node

import {fileURLToPath} from 'node:url'

import {formatResult, parseArguments, runDesignSystemCheck} from './check.ts'

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]

if (isMain) {
  const args = process.argv.slice(2)
  const warningOnly = args.includes('--warning')
  runDesignSystemCheck(args).then((result) => {
    const formatted = formatResult(result, warningOnly)
    if (!warningOnly && result.failures.length > 0) {
      const lines = formatted.trimEnd().split('\n')
      process.stdout.write(`${lines.filter((line) => !line.startsWith('error ')).join('\n')}\n`)
      process.stderr.write(`${lines.filter((line) => line.startsWith('error ')).join('\n')}\n`)
      process.exitCode = 1
      return
    }
    process.stdout.write(formatted)
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`${message}\n`)
    process.exitCode = 1
  })
}
