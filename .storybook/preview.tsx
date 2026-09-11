import type { Preview } from '@storybook/react-vite'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { setupWorker } from 'msw/browser'
import { mswLoader } from 'msw-storybook-addon/csf3'
import { withThemeByDataAttribute } from '@storybook/addon-themes'
import i18n from '../src/i18n'
import { THEMES } from '../src/lib/uiConstants'
import '../src/index.css'

const JAM_VIEWPORTS = {
  phone: { name: 'Phone', styles: { width: '390px', height: '844px' }, type: 'mobile' },
  tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' }, type: 'tablet' },
  desktop: { name: 'Desktop', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
  venue: { name: 'Venue display', styles: { width: '1920px', height: '1080px' }, type: 'desktop' },
} as const

const reducedMotionMedia = '(prefers-reduced-motion: reduce)'
const nativeMatchMedia = window.matchMedia.bind(window)
const motionListeners = new Set<(event: MediaQueryListEvent) => void>()
let reducedMotion = nativeMatchMedia(reducedMotionMedia).matches

const simulatedMotionQuery: MediaQueryList = {
  get matches() { return reducedMotion },
  media: reducedMotionMedia,
  onchange: null,
  addListener: (listener) => motionListeners.add(listener),
  removeListener: (listener) => motionListeners.delete(listener),
  addEventListener: (_type, listener) => {
    if (typeof listener === 'function') {
      motionListeners.add(listener as (event: MediaQueryListEvent) => void)
    }
  },
  removeEventListener: (_type, listener) => {
    if (typeof listener === 'function') {
      motionListeners.delete(listener as (event: MediaQueryListEvent) => void)
    }
  },
  dispatchEvent: (event) => {
    motionListeners.forEach((listener) => listener(event as MediaQueryListEvent))
    return true
  },
}

window.matchMedia = (query: string): MediaQueryList =>
  query === reducedMotionMedia ? simulatedMotionQuery : nativeMatchMedia(query)

function installMotionPreference(nextValue: boolean) {
  if (nextValue === reducedMotion) return
  reducedMotion = nextValue

  const event = new Event('change') as MediaQueryListEvent
  Object.defineProperties(event, {
    matches: { value: reducedMotion },
    media: { value: reducedMotionMedia },
  })
  simulatedMotionQuery.dispatchEvent(event)
  simulatedMotionQuery.onchange?.call(simulatedMotionQuery, event)
}

const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'DaisyUI theme',
      toolbar: {
        icon: 'paintbrush',
        items: THEMES.map((theme) => ({ value: theme, title: theme })),
      },
    },
    locale: {
      description: 'Interface locale',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'pt', title: 'Português' },
          { value: 'en', title: 'English' },
          { value: 'es', title: 'Español' },
        ],
      },
    },
    reducedMotion: {
      description: 'Simulated motion preference',
      toolbar: {
        icon: 'accessibility',
        items: [
          { value: false, title: 'Full motion' },
          { value: true, title: 'Reduced motion' },
        ],
      },
    },
  },
  initialGlobals: {
    theme: 'light',
    locale: 'pt',
    reducedMotion: false,
  },
  parameters: {
    layout: 'padded',
    viewport: { options: JAM_VIEWPORTS },
    a11y: { test: 'todo' },
    controls: { expanded: true },
  },
  loaders: [
    mswLoader(async () => {
      const worker = setupWorker()
      await worker.start({ onUnhandledRequest: 'error' })
      return worker
    }),
    async (context) => {
      await i18n.changeLanguage(String(context.globals.locale || 'pt'))
      return {}
    },
  ],
  decorators: [
    withThemeByDataAttribute({
      themes: [...THEMES],
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),
    (Story, context) => {
      const theme = String(context.globals.theme || 'light')
      const locale = String(context.globals.locale || 'pt')
      const reducedMotion = Boolean(context.globals.reducedMotion)

      document.documentElement.dataset.theme = theme
      installMotionPreference(reducedMotion)

      return (
        <MemoryRouter initialEntries={['/workbench-spike']}>
          <I18nextProvider i18n={i18n}>
            <main data-theme={theme} className="min-h-screen bg-base-100 p-4 text-base-content">
              <Story />
            </main>
          </I18nextProvider>
        </MemoryRouter>
      )
    },
  ],
}

export default preview
