import { describe, expect, it } from 'vitest'

import { validatePrivateVisualPolicy } from '../../scripts/private-visual/policy.ts'

const privateWorkflow = `
if: github.event_name == 'workflow_dispatch' || contains(github.event.pull_request.labels.*.name, 'architecture-track-gate') || contains(github.event.pull_request.labels.*.name, 'screen-refinement-gate')
container:
  image: mcr.microsoft.com/playwright:v1.55.1-noble
  options: --ipc=host
env:
  PRIVATE_VISUAL_RENDERER: playwright-v1.55.1-noble
- name: Run workbench browser tests
  run: npm run workbench:test
- name: Enforce private visual policy
  run: npm run visual:privacy
- name: Compare private visual baselines
  run: npm run visual:compare
- name: Check deterministic workbench progress
  run: npm run visual:progress:check
- name: Verify deterministic static build
  run: npm run workbench:verify-build
`

const componentCatalogueWorkflow = `
if: github.event_name == 'workflow_dispatch' || contains(github.event.pull_request.labels.*.name, 'architecture-track-gate') || contains(github.event.pull_request.labels.*.name, 'screen-refinement-gate')
`

const privateScripts = {
  'visual:privacy': 'tsx scripts/private-visual/cli.ts --privacy',
  'visual:compare': 'tsx scripts/private-visual/cli.ts --compare',
  'visual:update': 'VISUAL_BASELINE_UPDATE=1 tsx scripts/private-visual/cli.ts --update',
  'visual:progress': 'tsx scripts/private-visual/cli.ts --progress',
  'visual:progress:check': 'tsx scripts/private-visual/cli.ts --progress --check',
}

describe('private visual policy', () => {
  it('accepts a private, ordered CI path with ignored runner output', () => {
    expect(validatePrivateVisualPolicy({
      packageJson: { scripts: privateScripts },
      workflow: privateWorkflow,
      gitignore: 'private-visual-baselines/actual/\nprivate-visual-baselines/diff/\nprivate-visual-baselines/failures/\nprivate-visual-baselines/.runtime/\n',
    })).toEqual([])
  })

  it('requires the screen refinement gate in the catalogue and private workbench workflows', () => {
    const workflows = [
      { path: '.github/workflows/private-workbench.yml', contents: privateWorkflow },
      { path: '.github/workflows/component-catalogue.yml', contents: componentCatalogueWorkflow },
    ]

    expect(validatePrivateVisualPolicy({
      packageJson: { scripts: privateScripts },
      workflow: privateWorkflow,
      workflows,
      gitignore: 'private-visual-baselines/actual/\nprivate-visual-baselines/diff/\nprivate-visual-baselines/failures/\nprivate-visual-baselines/.runtime/\n',
    })).toEqual([])

    const withoutScreenRefinementGate = (workflow: string) =>
      workflow.replace(" || contains(github.event.pull_request.labels.*.name, 'screen-refinement-gate')", '')

    const diagnostics = validatePrivateVisualPolicy({
      packageJson: { scripts: privateScripts },
      workflow: withoutScreenRefinementGate(privateWorkflow),
      workflows: [
        {
          path: '.github/workflows/private-workbench.yml',
          contents: withoutScreenRefinementGate(privateWorkflow),
        },
        {
          path: '.github/workflows/component-catalogue.yml',
          contents: withoutScreenRefinementGate(componentCatalogueWorkflow),
        },
      ],
      gitignore: 'private-visual-baselines/actual/\nprivate-visual-baselines/diff/\nprivate-visual-baselines/failures/\nprivate-visual-baselines/.runtime/\n',
    })

    expect(diagnostics).toEqual(expect.arrayContaining([
      'screen refinement gate requires "screen-refinement-gate" in ".github/workflows/private-workbench.yml"',
      'screen refinement gate requires "screen-refinement-gate" in ".github/workflows/component-catalogue.yml"',
    ]))
  })

  it('rejects public visual services, update mode in CI, upload steps, and unignored evidence', () => {
    const diagnostics = validatePrivateVisualPolicy({
      packageJson: { scripts: { ...privateScripts, 'visual:compare': 'chromatic --project-token=$TOKEN' } },
      workflow: `${privateWorkflow}\nrun: npm run visual:update\nuses: actions/upload-artifact@v4`,
      gitignore: 'private-visual-baselines/actual/\n',
    })

    expect(diagnostics).toEqual(expect.arrayContaining([
      'private visual policy forbids public visual service reference "chromatic"',
      'private visual policy forbids baseline update mode in CI',
      'private visual policy forbids uploading visual artefacts',
      'private visual policy requires ignored runner-local path "private-visual-baselines/diff/"',
    ]))
  })

  it('rejects unlisted visual integrations and workflow actions before they can publish evidence', () => {
    const diagnostics = validatePrivateVisualPolicy({
      packageJson: { scripts: { ...privateScripts, 'visual:compare': 'unknown-visual-cloud compare --upload' } },
      workflow: `${privateWorkflow}\nuses: visual-cloud/example@v1\nrun: npx unknown-visual-cloud publish`,
      gitignore: 'private-visual-baselines/actual/\nprivate-visual-baselines/diff/\nprivate-visual-baselines/failures/\nprivate-visual-baselines/.runtime/\n',
    })

    expect(diagnostics).toEqual(expect.arrayContaining([
      'private visual policy requires "visual:compare" to use only the repository-local private visual CLI',
      'private visual policy forbids non-GitHub workflow action "visual-cloud/example@v1"',
      'private visual policy forbids unapproved workflow command "npx unknown-visual-cloud publish"',
    ]))
  })

  it('scans every workflow for visual publication and baseline update paths', () => {
    const diagnostics = validatePrivateVisualPolicy({
      packageJson: { scripts: privateScripts },
      workflow: privateWorkflow,
      workflows: [
        { path: '.github/workflows/private-workbench.yml', contents: privateWorkflow },
        {
          path: '.github/workflows/ci.yml',
          contents: 'run: npm run visual:update\nuses: actions/upload-artifact@v4\nwith:\n  path: private-visual-baselines/actual/\n',
        },
      ],
      gitignore: 'private-visual-baselines/actual/\nprivate-visual-baselines/diff/\nprivate-visual-baselines/failures/\nprivate-visual-baselines/.runtime/\n',
    })

    expect(diagnostics).toEqual(expect.arrayContaining([
      'private visual policy forbids baseline update mode in CI',
      'private visual policy forbids uploading visual artefacts',
    ]))
  })

  it('rejects unapproved visual integrations in a non-primary workflow', () => {
    const diagnostics = validatePrivateVisualPolicy({
      packageJson: { scripts: privateScripts },
      workflow: privateWorkflow,
      workflows: [
        { path: '.github/workflows/private-workbench.yml', contents: privateWorkflow },
        { path: '.github/workflows/visual-release.yml', contents: 'uses: visual-cloud/example@v1\nrun: npx visual-cloud publish' },
      ],
      gitignore: 'private-visual-baselines/actual/\nprivate-visual-baselines/diff/\nprivate-visual-baselines/failures/\nprivate-visual-baselines/.runtime/\n',
    })

    expect(diagnostics).toEqual(expect.arrayContaining([
      'private visual policy forbids non-GitHub workflow action "visual-cloud/example@v1" in ".github/workflows/visual-release.yml"',
      'private visual policy forbids unapproved workflow command "npx visual-cloud publish" in ".github/workflows/visual-release.yml"',
    ]))
  })

  it('rejects an unpinned or unidentified renderer environment', () => {
    const workflow = privateWorkflow
      .replace('mcr.microsoft.com/playwright:v1.55.1-noble', 'ubuntu:latest')
      .replace('playwright-v1.55.1-noble', 'host-dependent')
      .replace('options: --ipc=host\n', '')

    expect(validatePrivateVisualPolicy({
      packageJson: { scripts: privateScripts },
      workflow,
      gitignore: 'private-visual-baselines/actual/\nprivate-visual-baselines/diff/\nprivate-visual-baselines/failures/\nprivate-visual-baselines/.runtime/\n',
    })).toEqual(expect.arrayContaining([
      'private visual policy requires canonical renderer image "mcr.microsoft.com/playwright:v1.55.1-noble"',
      'private visual policy requires the canonical renderer IPC configuration',
      'private visual policy requires renderer identity "playwright-v1.55.1-noble"',
    ]))
  })
})
