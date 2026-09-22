import { useEffect, useState, useCallback } from 'react'
import { DEFAULT_THEME, resolveThemeName, type ThemeName } from '../design-system/foundations'

const THEME_KEY = 'jam-app.theme'
const LEGACY_THEME_KEY = 'theme'

const resolveStoredTheme = (value: unknown): ThemeName => (
  value === 'light' ? 'jam-light' : resolveThemeName(value)
)

const readStoredTheme = (): ThemeName => {
  try {
    const storedTheme = localStorage.getItem(THEME_KEY)
    if (storedTheme !== null) {
      const resolvedTheme = resolveStoredTheme(storedTheme)
      if (storedTheme !== resolvedTheme) localStorage.setItem(THEME_KEY, resolvedTheme)
      return resolvedTheme
    }

    const legacyTheme = localStorage.getItem(LEGACY_THEME_KEY)
    const resolvedTheme = resolveStoredTheme(legacyTheme)
    if (legacyTheme !== null) localStorage.setItem(THEME_KEY, resolvedTheme)
    return resolvedTheme
  } catch {
    return DEFAULT_THEME
  }
}

const subscribers = new Set<(theme: ThemeName) => void>()

export function useTheme(): [ThemeName, (theme: string) => void] {
  const [theme, setThemeState] = useState<ThemeName>(readStoredTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    subscribers.add(setThemeState)
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY && e.newValue) setThemeState(resolveStoredTheme(e.newValue))
    }
    window.addEventListener('storage', onStorage)
    return () => {
      subscribers.delete(setThemeState)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const setTheme = useCallback((next: string) => {
    const resolvedTheme = resolveStoredTheme(next)
    try {
      localStorage.setItem(THEME_KEY, resolvedTheme)
    } catch {
      // ignore quota / privacy-mode failures
    }
    subscribers.forEach((fn) => fn(resolvedTheme))
  }, [])

  return [theme, setTheme]
}
