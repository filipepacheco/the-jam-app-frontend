import { describe, expect, it } from 'vitest'

import { validatePrivateVisualPolicy } from '../../scripts/private-visual/policy.ts'

const privateWorkflow = `
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
})
