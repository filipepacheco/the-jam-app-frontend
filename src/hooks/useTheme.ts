import { type ReactNode, useEffect, useLayoutEffect, useSyncExternalStore } from 'react'
import { DEFAULT_THEME, resolveThemeName, type ThemeName } from '../design-system/foundations'

const THEME_KEY = 'jam-app.theme'
const LEGACY_THEME_KEY = 'theme'

type ThemeListener = () => void

let currentTheme: ThemeName | undefined
const subscribers = new Set<ThemeListener>()
let isListeningForStorage = false

function readStoredTheme(): ThemeName {
  try {
    const storedTheme = window.localStorage.getItem(THEME_KEY)
    if (storedTheme !== null) return resolveThemeName(storedTheme)

    const legacyTheme = window.localStorage.getItem(LEGACY_THEME_KEY)
    const resolvedTheme = resolveThemeName(legacyTheme)
    if (legacyTheme !== null) window.localStorage.setItem(THEME_KEY, resolvedTheme)
    return resolvedTheme
  } catch {
    return DEFAULT_THEME
  }
}

function getThemeSnapshot(): ThemeName {
  currentTheme ??= readStoredTheme()
  return currentTheme
}

function applyTheme(theme: ThemeName): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme
  }
}

function notifyThemeSubscribers(): void {
  subscribers.forEach((subscriber) => subscriber())
}

function onStorage(event: StorageEvent): void {
  if (event.key === THEME_KEY && event.newValue !== null) {
    setSharedTheme(resolveThemeName(event.newValue), { persist: false })
  }
}

function subscribeToTheme(listener: ThemeListener): () => void {
  subscribers.add(listener)

  if (!isListeningForStorage && typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage)
    isListeningForStorage = true
  }

  return () => {
    subscribers.delete(listener)
    if (subscribers.size === 0 && isListeningForStorage && typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage)
      isListeningForStorage = false
    }
  }
}

interface SetSharedThemeOptions {
  readonly persist?: boolean
}

/**
 * The application and workbench both change the product theme through this
 * same typed state seam. Workbench controls intentionally opt out of storage
 * persistence so review globals never modify a developer's saved preference.
 */
export function setSharedTheme(theme: ThemeName, { persist = true }: SetSharedThemeOptions = {}): void {
  const changed = currentTheme !== theme
  currentTheme = theme
  applyTheme(theme)

  if (persist) {
    try {
      window.localStorage.setItem(THEME_KEY, theme)
    } catch {
      // Ignore quota and privacy-mode failures while keeping this tab usable.
    }
  }

  if (changed) notifyThemeSubscribers()
}

export function useTheme(): readonly [ThemeName, (theme: ThemeName) => void] {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => DEFAULT_THEME)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return [theme, setSharedTheme]
}

interface ThemeProviderProps {
  readonly children: ReactNode
  readonly theme?: ThemeName
  readonly persist?: boolean
}

/** Keeps a product root or Storybook preview synchronized with shared theme state. */
export function ThemeProvider({ children, theme, persist = true }: ThemeProviderProps) {
  const [current] = useTheme()

  useLayoutEffect(() => {
    setSharedTheme(theme ?? current, { persist })
  }, [current, persist, theme])

  return children
}
