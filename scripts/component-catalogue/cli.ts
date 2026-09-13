#!/usr/bin/env node

import {readFile, mkdir, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {analyseCatalogue} from './analyse.ts'
import {
  readyComponentsWithoutStories,
  unreasonedWorkbenchExemptions,
  unresolvedWorkbenchComponents,
} from './coverage.ts'
import {renderManifest, renderMarkdown} from './render.ts'
import {isRecord, isSafeRelativePath, throwDiagnostics, validateInputs} from './validate.ts'
import type {CatalogueConfig, CatalogueMetadataConfig} from '../../src/types/componentCatalogue.types.ts'

interface CatalogueArguments {
  configPath: string
  check: boolean
  requireReviewedWorkbench: boolean
}

const parseArguments = (args: string[]): CatalogueArguments => {
  const index = args.indexOf('--config')
  if (index === -1 || !args[index + 1]) {
    throw new Error('Usage: component-catalogue --config <path> [--check] [--require-reviewed-workbench]')
  }
  const supported = new Set(['--config', args[index + 1], '--check', '--require-reviewed-workbench'])
  const unknown = args.filter((argument) => !supported.has(argument))
  if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown[0]}`)
  const check = args.includes('--check')
  const requireReviewedWorkbench = args.includes('--require-reviewed-workbench')
  if (requireReviewedWorkbench && !check) {
    throw new Error('--require-reviewed-workbench requires --check')
  }
  return {configPath: args[index + 1], check, requireReviewedWorkbench}
}

export const runCatalogueCommand = async (args: string[], cwd = process.cwd()): Promise<void> => {
  const {configPath: configuredPath, check, requireReviewedWorkbench} = parseArguments(args)
  const configPath = path.resolve(cwd, configuredPath)
  const root = path.dirname(configPath)
  const config = JSON.parse(await readFile(configPath, 'utf8')) as CatalogueConfig
  if (!isSafeRelativePath(config.metadata)) {
    throwDiagnostics(['metadata: path must be normalized and stay inside the catalogue root'])
  }
  const metadata = JSON.parse(
    await readFile(path.resolve(root, config.metadata), 'utf8'),
  ) as CatalogueMetadataConfig
  const diagnostics = validateInputs(config, metadata)
  const inlinePatternGovernance = metadata.inlinePatternGovernance
  const canAnalyse = isSafeRelativePath(config.project) &&
    Array.isArray(config.include) && config.include.every(isSafeRelativePath) &&
    Array.isArray(config.ignore) && config.ignore.every(isRecord) &&
    Array.isArray(metadata.candidateFamilies) &&
    Array.isArray(metadata.rules) && metadata.rules.every(isRecord) &&
    Array.isArray(metadata.components) && metadata.components.every(isRecord) &&
    Array.isArray(metadata.retiredComponents) && metadata.retiredComponents.every(isRecord) &&
    isRecord(inlinePatternGovernance) &&
    Array.isArray(inlinePatternGovernance.scopes) && inlinePatternGovernance.scopes.every(isRecord) &&
    Array.isArray(inlinePatternGovernance.candidates) && inlinePatternGovernance.candidates.every(isRecord)
  if (!canAnalyse) throwDiagnostics(diagnostics)
  const catalogue = analyseCatalogue({
    root,
    project: config.project,
    include: config.include,
    ignore: config.ignore,
    metadata,
    diagnostics,
  })
  throwDiagnostics(diagnostics)
  if (requireReviewedWorkbench) {
    const unresolved = unresolvedWorkbenchComponents(catalogue.components)
    const unreasonedExemptions = unreasonedWorkbenchExemptions(catalogue.components)
    const readyWithoutStories = readyComponentsWithoutStories(catalogue.components)
    const baselineDiagnostics = [
      ...(unresolved.length > 0 ? [
        `active reusable visual components are not reviewed: ${unresolved.map(
          (component) => `${component.id} (${component.metadata.readiness.workbench})`,
        ).join(', ')}`,
      ] : []),
      ...(unreasonedExemptions.length > 0 ? [
        `active reusable visual component workbench exemptions require a reason: ${unreasonedExemptions.map(
          (component) => component.id,
        ).join(', ')}`,
      ] : []),
      ...(readyWithoutStories.length > 0 ? [
        `active reusable visual components are marked ready without a reachable Storybook story: ${readyWithoutStories.map(
          (component) => component.id,
        ).join(', ')}`,
      ] : []),
    ]
    throwDiagnostics(baselineDiagnostics)
  }
  const outputs = [
    {label: config.output.json, path: path.resolve(root, config.output.json), expected: renderManifest(catalogue)},
    {label: config.output.markdown, path: path.resolve(root, config.output.markdown), expected: renderMarkdown(catalogue)},
  ]

  if (check) {
    for (const output of outputs) {
      if (!isSafeRelativePath(output.label)) continue
      try {
        const actual = await readFile(output.path, 'utf8')
        if (actual !== output.expected) diagnostics.push(`${output.label} is stale`)
      } catch (error: unknown) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          diagnostics.push(`${output.label} is missing`)
        } else throw error
      }
    }
    if (diagnostics.length > 0) {
      diagnostics.push('Run `npm run catalogue:generate`')
      throwDiagnostics(diagnostics)
    }
    process.stdout.write(
      requireReviewedWorkbench
        ? 'Component catalogue is valid and up to date; the reviewed workbench baseline is complete.\n'
        : 'Component catalogue is valid and up to date.\n',
    )
    return
  }

  await Promise.all([
    ...outputs.map((output) => mkdir(path.dirname(output.path), {recursive: true})),
  ])
  await Promise.all(outputs.map((output) => writeFile(output.path, output.expected)))
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  runCatalogueCommand(process.argv.slice(2)).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`${message}\n`)
    process.exitCode = 1
  })
}
