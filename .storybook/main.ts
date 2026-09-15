import {realpathSync} from 'node:fs'
import type { StorybookConfig } from '@storybook/react-vite'

const dependencyRoot = realpathSync(new URL('../node_modules', import.meta.url))
const storySourceRoot = realpathSync(new URL('../src', import.meta.url))

const config: StorybookConfig = {
  stories: ['../src/workbench/stories/**/*.stories.@(ts|tsx)'],
  staticDirs: ['./public'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-themes', '@storybook/addon-vitest', 'msw-storybook-addon'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    builder: {
      name: '@storybook/builder-vite',
      options: {
        viteConfigPath: new URL('./vite.config.ts', import.meta.url).pathname,
      },
    },
  },
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    server: {
      ...viteConfig.server,
      host: '127.0.0.1',
      fs: {
        ...viteConfig.server?.fs,
        allow: [...new Set([...(viteConfig.server?.fs?.allow ?? []), storySourceRoot, dependencyRoot])],
      },
    },
  }),
}

export default config
