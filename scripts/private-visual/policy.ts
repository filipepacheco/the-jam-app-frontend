const PUBLIC_VISUAL_SERVICES = ['chromatic', 'percy', 'argos', 'applitools', 'visual-regression.com'] as const
const PRIVATE_VISUAL_COMMANDS: Record<string, string> = {
  'visual:privacy': 'tsx scripts/private-visual/cli.ts --privacy',
  'visual:compare': 'tsx scripts/private-visual/cli.ts --compare',
  'visual:update': 'VISUAL_BASELINE_UPDATE=1 tsx scripts/private-visual/cli.ts --update',
  'visual:progress': 'tsx scripts/private-visual/cli.ts --progress',
  'visual:progress:check': 'tsx scripts/private-visual/cli.ts --progress --check',
}
const APPROVED_WORKFLOW_COMMANDS = new Set([
  'npm ci',
  'npm run workbench:test',
  'npm run visual:privacy',
  'npm run visual:compare',
  'npm run visual:progress:check',
  'npm run workbench:verify-build',
])
export const PRIVATE_VISUAL_RENDERER_IMAGE = 'mcr.microsoft.com/playwright:v1.55.1-noble'
export const PRIVATE_VISUAL_RENDERER_ID = 'playwright-v1.55.1-noble'
const REQUIRED_IGNORES = [
  'private-visual-baselines/actual/',
  'private-visual-baselines/diff/',
  'private-visual-baselines/failures/',
  'private-visual-baselines/.runtime/',
] as const

export interface PrivateVisualPolicyInput {
  packageJson: unknown
  workflows?: readonly { path: string; contents: string }[]
  /** The canonical private-workbench workflow, used for exact ordering checks. */
  workflow: string
  gitignore: string
}

const scriptMap = (packageJson: unknown): Record<string, string> => {
  if (typeof packageJson !== 'object' || packageJson === null) return {}
  const scripts = (packageJson as { scripts?: unknown }).scripts
  if (typeof scripts !== 'object' || scripts === null) return {}
  return Object.fromEntries(
    Object.entries(scripts).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  )
}

const workflowActions = (contents: string): string[] =>
  [...contents.matchAll(/^\s*uses:\s*([^\s#]+)/gm)].map((match) => match[1])

const workflowCommands = (contents: string): string[] =>
  [...contents.matchAll(/^\s*run:\s*([^\n#]+)\s*$/gm)].map((match) => match[1].trim())

const isVisualWorkflow = ({ path, contents }: { path: string; contents: string }): boolean =>
  /(?:visual|storybook)/i.test(path) ||
  /(?:visual:|storybook-static|private-visual-baselines|workbench:(?:test|build|verify))/i.test(contents)

/** Static policy seam: private evidence stays in this repository and on the runner. */
export const validatePrivateVisualPolicy = ({ packageJson, workflows, workflow, gitignore }: PrivateVisualPolicyInput): string[] => {
  const diagnostics: string[] = []
  const scripts = scriptMap(packageJson)
  const workflowSources = workflows ?? [{ path: '.github/workflows/private-workbench.yml', contents: workflow }]
  const allWorkflowContents = workflowSources.map(({ path: filename, contents }) => `${filename}\n${contents}`).join('\n')
  const allConfiguration = `${JSON.stringify(packageJson)}\n${allWorkflowContents}`.toLowerCase()

  for (const service of PUBLIC_VISUAL_SERVICES) {
    if (allConfiguration.includes(service)) {
      diagnostics.push(`private visual policy forbids public visual service reference "${service}"`)
    }
  }

  for (const [name, command] of Object.entries(PRIVATE_VISUAL_COMMANDS)) {
    if (!scripts[name]) {
      diagnostics.push(`private visual policy requires npm script "${name}"`)
    } else if (scripts[name] !== command) {
      diagnostics.push(`private visual policy requires "${name}" to use only the repository-local private visual CLI`)
    }
  }

  if (/(?:npm run visual:update|VISUAL_BASELINE_UPDATE|--update)/.test(allWorkflowContents)) {
    diagnostics.push('private visual policy forbids baseline update mode in CI')
  }
  const visualUploadPath = /(?:storybook-static|private-visual-baselines\/(?:actual|diff|failures)|visual-baselines\/actual)/i
  const visualPublication = /(?:actions\/upload-artifact|\b(?:upload|publish|deploy|release)\b)/i
  const hasVisualUpload = workflowSources.some(({ path: filename, contents }) =>
    visualPublication.test(contents) && (visualUploadPath.test(contents) || /(?:visual|storybook|workbench|baseline)/i.test(filename)),
  )
  if (hasVisualUpload) {
    diagnostics.push('private visual policy forbids uploading visual artefacts')
  }

  for (const source of workflowSources) {
    const primary = source.contents === workflow
    if (!primary && !isVisualWorkflow(source)) continue
    const sourceLabel = primary ? '' : ` in "${source.path}"`
    for (const action of workflowActions(source.contents)) {
      if (!/^actions\/(?:checkout|setup-node)@v\d+$/.test(action)) {
        diagnostics.push(`private visual policy forbids non-GitHub workflow action "${action}"${sourceLabel}`)
      }
    }
    for (const command of workflowCommands(source.contents)) {
      if (!APPROVED_WORKFLOW_COMMANDS.has(command)) {
        diagnostics.push(`private visual policy forbids unapproved workflow command "${command}"${sourceLabel}`)
      }
    }
  }

  const browserIndex = workflow.indexOf('npm run workbench:test')
  const privacyIndex = workflow.indexOf('npm run visual:privacy')
  const compareIndex = workflow.indexOf('npm run visual:compare')
  const progressIndex = workflow.indexOf('npm run visual:progress:check')
  const buildIndex = workflow.indexOf('npm run workbench:verify-build')
  if ([browserIndex, privacyIndex, compareIndex, progressIndex, buildIndex].some((index) => index === -1)) {
    diagnostics.push('private visual policy requires browser, privacy, comparison, progress, and deterministic-build CI steps')
  } else if (!(browserIndex < privacyIndex && privacyIndex < compareIndex && compareIndex < progressIndex && progressIndex < buildIndex)) {
    diagnostics.push('private visual policy requires comparison after browser tests and before deterministic build verification')
  }

  if (!workflow.includes(`image: ${PRIVATE_VISUAL_RENDERER_IMAGE}`)) {
    diagnostics.push(`private visual policy requires canonical renderer image "${PRIVATE_VISUAL_RENDERER_IMAGE}"`)
  }
  if (!workflow.includes('options: --ipc=host')) {
    diagnostics.push('private visual policy requires the canonical renderer IPC configuration')
  }
  if (!workflow.includes(`PRIVATE_VISUAL_RENDERER: ${PRIVATE_VISUAL_RENDERER_ID}`)) {
    diagnostics.push(`private visual policy requires renderer identity "${PRIVATE_VISUAL_RENDERER_ID}"`)
  }

  const ignoredPaths = new Set(gitignore.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))
  for (const required of REQUIRED_IGNORES) {
    if (!ignoredPaths.has(required)) diagnostics.push(`private visual policy requires ignored runner-local path "${required}"`)
  }
  return diagnostics
}
