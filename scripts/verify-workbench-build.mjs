import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const storybookCli = resolve(repositoryRoot, 'node_modules/storybook/dist/bin/dispatcher.js')

async function snapshotTree(root) {
  const entries = []

  async function visit(directory) {
    const children = await readdir(directory, { withFileTypes: true })
    children.sort((left, right) => left.name.localeCompare(right.name))

    for (const child of children) {
      const absolutePath = join(directory, child.name)
      if (child.isDirectory()) {
        await visit(absolutePath)
      } else if (child.isFile()) {
        let contents = await readFile(absolutePath)
        const outputPath = relative(root, absolutePath)
        if (outputPath === 'project.json') {
          const projectMetadata = JSON.parse(contents.toString())
          delete projectMetadata.generatedAt
          delete projectMetadata.userSince
          contents = Buffer.from(JSON.stringify(projectMetadata))
        }
        entries.push({
          path: outputPath,
          sha256: createHash('sha256').update(contents).digest('hex'),
        })
      }
    }
  }

  await visit(root)
  return entries
}

function build(outputDirectory) {
  const result = spawnSync(
    process.execPath,
    [storybookCli, 'build', '--output-dir', outputDirectory, '--disable-telemetry', '--quiet'],
    { cwd: repositoryRoot, encoding: 'utf8' },
  )

  if (result.status !== 0) {
    throw new Error(`Storybook build failed.\n${result.stdout}${result.stderr}`)
  }
}

const temporaryRoot = await mkdtemp(join(tmpdir(), 'jamapp-workbench-'))
const firstBuild = join(temporaryRoot, 'first')
const secondBuild = join(temporaryRoot, 'second')

try {
  build(firstBuild)
  build(secondBuild)

  const firstSnapshot = await snapshotTree(firstBuild)
  const secondSnapshot = await snapshotTree(secondBuild)

  if (JSON.stringify(firstSnapshot) !== JSON.stringify(secondSnapshot)) {
    console.error('Private workbench builds are not byte-for-byte deterministic.')
    const firstByPath = new Map(firstSnapshot.map((entry) => [entry.path, entry.sha256]))
    const secondByPath = new Map(secondSnapshot.map((entry) => [entry.path, entry.sha256]))
    const changedPaths = [...new Set([...firstByPath.keys(), ...secondByPath.keys()])]
      .filter((path) => firstByPath.get(path) !== secondByPath.get(path))
      .sort()
    console.error(changedPaths.slice(0, 20).join('\n'))
    process.exitCode = 1
  } else {
    console.log(`Private workbench runtime build is deterministic (${firstSnapshot.length} files; volatile Storybook provenance timestamps normalized).`)
  }
} finally {
  await rm(temporaryRoot, { recursive: true, force: true })
}
