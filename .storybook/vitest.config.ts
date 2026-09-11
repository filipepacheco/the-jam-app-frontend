import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { defineConfig, mergeConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import workbenchViteConfig from './vite.config'

const configDirectory = dirname(fileURLToPath(import.meta.url))

export default mergeConfig(
  workbenchViteConfig,
  defineConfig({
    test: {
      projects: [
        {
          plugins: [
            storybookTest({
              configDir: configDirectory,
              storybookScript: 'npm run workbench:spike',
            }),
          ],
          test: {
            name: 'storybook',
            browser: {
              enabled: true,
              provider: playwright({}),
              headless: true,
              instances: [{ browser: 'chromium' }],
            },
          },
        },
      ],
    },
  }),
)
