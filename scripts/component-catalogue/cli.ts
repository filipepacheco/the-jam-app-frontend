#!/usr/bin/env node

import {readFile, mkdir, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {analyseCatalogue} from './analyse.ts'
import {renderManifest, renderMarkdown} from './render.ts'
import type {CatalogueConfig, CatalogueMetadataConfig} from '../../src/types/componentCatalogue.types.ts'

const parseConfigPath = (args: string[]): string => {
  const index = args.indexOf('--config')
  if (index === -1 || !args[index + 1]) {
    throw new Error('Usage: component-catalogue --config <path>')
  }
  return args[index + 1]
}

export const runCatalogueCommand = async (args: string[], cwd = process.cwd()): Promise<void> => {
  const configPath = path.resolve(cwd, parseConfigPath(args))
  const root = path.dirname(configPath)
  const config = JSON.parse(await readFile(configPath, 'utf8')) as CatalogueConfig
  const metadata = JSON.parse(
    await readFile(path.resolve(root, config.metadata), 'utf8'),
  ) as CatalogueMetadataConfig
  const catalogue = analyseCatalogue({
    root,
    project: config.project,
    include: config.include,
    ignore: config.ignore,
    metadata,
  })
  const jsonPath = path.resolve(root, config.output.json)
  const markdownPath = path.resolve(root, config.output.markdown)

  await Promise.all([
    mkdir(path.dirname(jsonPath), {recursive: true}),
    mkdir(path.dirname(markdownPath), {recursive: true}),
  ])
  await Promise.all([
    writeFile(jsonPath, renderManifest(catalogue)),
    writeFile(markdownPath, renderMarkdown(catalogue)),
  ])
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  runCatalogueCommand(process.argv.slice(2)).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`${message}\n`)
    process.exitCode = 1
  })
}
