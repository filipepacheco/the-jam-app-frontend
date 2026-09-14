import type { Preview } from '@storybook/react-vite'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { setupWorker } from 'msw/browser'
import { mswLoader } from 'msw-storybook-addon/csf3'
import { AuthContext } from '../src/contexts/AuthContext'
import i18n from '../src/i18n'
import {
  WORKBENCH_LOCALES,
  WORKBENCH_ROLES,
  WORKBENCH_ROUTES,
  WORKBENCH_THEMES,
  WORKBENCH_VIEWPORTS,
} from '../src/workbench/config'
import { createAuthFixture, type WorkbenchAuthRole } from '../src/workbench/fixtures'
import { workbenchRequestHandlers } from '../src/workbench/mocks'
import { installReducedMotionPreference } from '../src/workbench/reducedMotion'
import '../src/workbench/workbench.css'

const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'DaisyUI theme',
      toolbar: {
        icon: 'paintbrush',
        items: WORKBENCH_THEMES.map((theme) => ({ value: theme, title: theme })),
      },
    },
    locale: {
      description: 'Interface locale',
      toolbar: { icon: 'globe', items: [...WORKBENCH_LOCALES] },
    },
    route: {
      description: 'Initial router location',
      toolbar: { icon: 'location', items: [...WORKBENCH_ROUTES] },
    },
    authRole: {
      description: 'Authentication role fixture',
      toolbar: { icon: 'user', items: [...WORKBENCH_ROLES] },
    },
    reducedMotion: {
      description: 'Simulated motion preference',
      toolbar: {
        icon: 'accessibility',
        items: [
          { value: 'false', title: 'Full motion' },
          { value: 'true', title: 'Reduced motion' },
        ],
      },
    },
  },
  initialGlobals: {
    theme: 'light',
    locale: 'pt',
    route: '/',
    authRole: 'host',
    reducedMotion: 'false',
  },
  parameters: {
    layout: 'padded',
    viewport: { options: WORKBENCH_VIEWPORTS },
    a11y: { test: 'todo' },
    controls: { expanded: true },
    msw: { handlers: workbenchRequestHandlers },
  },
  loaders: [
    mswLoader(async () => {
      const worker = setupWorker()
      await worker.start({ onUnhandledRequest: 'error' })
      return worker
    }),
    async (context) => {
      const locale = String(context.globals.locale || 'pt')
      document.documentElement.lang = locale
      return {}
    },
  ],
  decorators: [
    (Story, context) => {
      const theme = String(context.globals.theme || 'light')
      const locale = String(context.globals.locale || 'pt')
      const route = String(context.globals.route || '/')
      const authRole = String(context.globals.authRole || 'host') as WorkbenchAuthRole
      const storyI18n = i18n.cloneInstance({ lng: locale, initAsync: false })

      document.documentElement.dataset.theme = theme
      installReducedMotionPreference(String(context.globals.reducedMotion) === 'true')

      return (
        <MemoryRouter initialEntries={[route]} key={route}>
          <I18nextProvider i18n={storyI18n}>
            <AuthContext.Provider value={createAuthFixture(authRole)}>
              <div lang={locale} data-theme={theme} data-workbench-root className="min-h-screen bg-base-100 p-4 text-base-content">
                <Story />
              </div>
            </AuthContext.Provider>
          </I18nextProvider>
        </MemoryRouter>
      )
    },
  ],
}

export default preview
