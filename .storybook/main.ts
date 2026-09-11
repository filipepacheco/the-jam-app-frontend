import type { StorybookConfig } from '@storybook/react-vite'

/** PROTOTYPE: ticket #31 evaluates Storybook; ticket #32 owns the durable setup. */
const config: StorybookConfig = {
  stories: ['../src/workbench-spike/**/*.stories.@(ts|tsx)'],
  staticDirs: ['../public'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-themes', '@storybook/addon-vitest', 'msw-storybook-addon'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  core: {
    builder: {
      name: '@storybook/builder-vite',
      options: {
        viteConfigPath: new URL('./vite.config.ts', import.meta.url).pathname,
      },
    },
  },
}

export default config
