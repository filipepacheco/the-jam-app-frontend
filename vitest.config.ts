import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { defineConfig } from 'vitest/config'

const projectRoot = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'happy-dom',
          globals: true,
          setupFiles: ['./src/__tests__/setup.ts'],
          coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            exclude: [
              'node_modules/',
              'src/__tests__/',
              '**/*.d.ts',
              '**/*.config.*',
              '**/mockData',
              'dist/',
            ],
            thresholds: {
              lines: 70,
              functions: 70,
              branches: 70,
              statements: 70,
            },
          },
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: resolve(projectRoot, '.storybook'),
            storybookScript: `"${process.execPath}" node_modules/storybook/dist/bin/dispatcher.js dev -p 6006 --no-open --disable-telemetry`,
            storybookUrl: 'http://localhost:6006',
          }),
        ],
        test: {
          name: 'storybook',
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
  resolve: {
    alias: {
      '@': resolve(projectRoot, './src'),
    },
  },
})
