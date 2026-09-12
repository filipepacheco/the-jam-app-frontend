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
  'npx playwright install --with-deps chromium',
  'npm run workbench:test',
  'npm run visual:privacy',
  'npm run visual:compare',
  'npm run visual:progress:check',
  'npm run workbench:verify-build',
])
const REQUIRED_IGNORES = [
  'private-visual-baselines/actual/',
  'private-visual-baselines/diff/',
  'private-visual-baselines/failures/',
  'private-visual-baselines/.runtime/',
] as const

export interface PrivateVisualPolicyInput {
  packageJson: unknown
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

/** Static policy seam: private evidence stays in this repository and on the runner. */
export const validatePrivateVisualPolicy = ({ packageJson, workflow, gitignore }: PrivateVisualPolicyInput): string[] => {
  const diagnostics: string[] = []
  const scripts = scriptMap(packageJson)
  const allConfiguration = `${JSON.stringify(packageJson)}\n${workflow}`.toLowerCase()

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

  if (/(?:npm run visual:update|VISUAL_BASELINE_UPDATE|--update)/.test(workflow)) {
    diagnostics.push('private visual policy forbids baseline update mode in CI')
  }
  if (/(?:\b(?:upload|publish|deploy|release)\b|storybook-static|visual-baselines\/actual)/i.test(workflow)) {
    diagnostics.push('private visual policy forbids uploading visual artefacts')
  }

  const actions = [...workflow.matchAll(/^\s*uses:\s*([^\s#]+)/gm)].map((match) => match[1])
  for (const action of actions) {
    if (!/^actions\/(?:checkout|setup-node)@v\d+$/.test(action)) {
      diagnostics.push(`private visual policy forbids non-GitHub workflow action "${action}"`)
    }
  }
  const workflowCommands = [...workflow.matchAll(/^\s*run:\s*([^\n#]+)\s*$/gm)].map((match) => match[1].trim())
  for (const command of workflowCommands) {
    if (!APPROVED_WORKFLOW_COMMANDS.has(command)) {
      diagnostics.push(`private visual policy forbids unapproved workflow command "${command}"`)
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

  const ignoredPaths = new Set(gitignore.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))
  for (const required of REQUIRED_IGNORES) {
    if (!ignoredPaths.has(required)) diagnostics.push(`private visual policy requires ignored runner-local path "${required}"`)
  }
  return diagnostics
}
