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
              storybookScript: `"${process.execPath}" node_modules/storybook/dist/bin/dispatcher.js dev -p 6006 --no-open --disable-telemetry`,
            }),
          ],
          test: {
            name: 'storybook',
            // Story files share the process-wide i18n singleton; run files
            // serially so locale setup cannot race across browser workers.
            fileParallelism: false,
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
