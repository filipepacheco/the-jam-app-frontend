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
})
