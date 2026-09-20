import type { Preview } from '@storybook/react-vite'
import {useEffect, useLayoutEffect} from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import {useGlobals} from 'storybook/preview-api'
import { setupWorker } from 'msw/browser'
import { mswLoader } from 'msw-storybook-addon/csf3'
import { AuthContext } from '../src/contexts/AuthContext'
import i18n from '../src/i18n'
import {
  WORKBENCH_LOCALES,
  WORKBENCH_ROLES,
  WORKBENCH_ROUTES,
  WORKBENCH_VIEWPORTS,
} from '../src/workbench/config'
import { createAuthFixture, type WorkbenchAuthRole } from '../src/workbench/fixtures'
import { workbenchRequestHandlers } from '../src/workbench/mocks'
import { installReducedMotionPreference } from '../src/workbench/reducedMotion'
import { setSharedTheme, ThemeProvider, useTheme } from '../src/hooks'
import { resolveThemeName } from '../src/design-system/foundations'
import '../src/workbench/workbench.css'

interface ReviewViewportSyncProps {
  currentViewport: string
  defaultViewport: string
  reviewViewport: string
  updateGlobals: (newGlobals: Record<string, unknown>) => unknown
}

function ReviewViewportSync({currentViewport, defaultViewport, reviewViewport, updateGlobals}: ReviewViewportSyncProps) {
  useEffect(() => {
    const targetViewport = reviewViewport === 'story' ? defaultViewport : reviewViewport
    if (targetViewport === currentViewport) return
    updateGlobals({viewport: {value: targetViewport, isRotated: false}})
  }, [currentViewport, defaultViewport, reviewViewport, updateGlobals])

  return null
}

interface WorkbenchThemeSyncProps {
  theme: ReturnType<typeof resolveThemeName>
  reviewTheme: string
  updateGlobals: (newGlobals: Record<string, unknown>) => unknown
}

function WorkbenchThemeSync({ theme, reviewTheme, updateGlobals }: WorkbenchThemeSyncProps) {
  const [selectedTheme] = useTheme()

  useLayoutEffect(() => {
    setSharedTheme(theme, { persist: false })
  }, [theme])

  useEffect(() => {
    if (reviewTheme === 'story' && selectedTheme !== theme) {
      updateGlobals({ theme: selectedTheme })
    }
  }, [reviewTheme, selectedTheme, theme, updateGlobals])

  return null
}

const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Story theme preset',
    },
    reviewTheme: {
      description: 'Review theme',
      toolbar: {
        icon: 'paintbrush',
        dynamicTitle: true,
        items: [
          {value: 'story', title: 'Story default'},
          {value: 'jam-light', title: 'Jam Light'},
          {value: 'jam-dark', title: 'Jam Dark'},
        ],
      },
    },
    reviewViewport: {
      description: 'Review viewport',
      toolbar: {
        icon: 'mobile',
        dynamicTitle: true,
        items: [
          {value: 'story', title: 'Story default'},
          {value: 'phone', title: 'Mobile'},
          {value: 'desktop', title: 'Desktop'},
          {value: 'venue', title: 'Venue'},
        ],
      },
    },
    reviewDefaultViewport: {
      description: 'Story review viewport preset',
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
    theme: 'jam-light',
    reviewTheme: 'story',
    reviewViewport: 'story',
    reviewDefaultViewport: 'desktop',
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
      const [globals, updateGlobals] = useGlobals()
      const storyTheme = String(globals.theme || 'jam-light')
      const reviewTheme = String(globals.reviewTheme || 'story')
      const reviewViewport = String(globals.reviewViewport || 'story')
      const defaultViewport = String(globals.reviewDefaultViewport || 'desktop')
      const currentViewport = String(
        typeof globals.viewport === 'object' && globals.viewport && 'value' in globals.viewport
          ? globals.viewport.value
          : '',
      )
      const theme = resolveThemeName(reviewTheme === 'jam-light' || reviewTheme === 'jam-dark'
        ? reviewTheme
        : storyTheme)
      const locale = String(globals.locale || 'pt')
      const route = String(globals.route || '/')
      const authRole = String(globals.authRole || 'host') as WorkbenchAuthRole
      const storyI18n = i18n.cloneInstance({ lng: locale, initAsync: false })

      // Storybook globals are an external input. Seed the same shared store
      // production consumers read before rendering the story, rather than
      // letting the first paint use a previous story's theme snapshot.
      setSharedTheme(theme, { persist: false })
      document.documentElement.dataset.theme = theme
      installReducedMotionPreference(String(globals.reducedMotion) === 'true')

      return (
        <>
          <ReviewViewportSync
            currentViewport={currentViewport}
            defaultViewport={defaultViewport}
            reviewViewport={reviewViewport}
            updateGlobals={updateGlobals}
          />
          <ThemeProvider persist={false}>
            <WorkbenchThemeSync theme={theme} reviewTheme={reviewTheme} updateGlobals={updateGlobals} />
            <MemoryRouter initialEntries={[route]} key={route}>
              <I18nextProvider i18n={storyI18n}>
                <AuthContext.Provider value={createAuthFixture(authRole)}>
                  <div lang={locale} data-theme={theme} data-workbench-root className="min-h-screen bg-base-100 p-4 text-base-content">
                    <Story />
                  </div>
                </AuthContext.Provider>
              </I18nextProvider>
            </MemoryRouter>
          </ThemeProvider>
        </>
      )
    },
  ],
}

export default preview
