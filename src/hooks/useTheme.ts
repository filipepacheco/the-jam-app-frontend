import { useEffect, useState, useCallback } from 'react'

const THEME_KEY = 'theme'
const DEFAULT_THEME = 'dark'

const readStoredTheme = (): string => {
  try {
    return localStorage.getItem(THEME_KEY) || DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

const subscribers = new Set<(theme: string) => void>()

export function useTheme(): [string, (theme: string) => void] {
  const [theme, setThemeState] = useState<string>(readStoredTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    subscribers.add(setThemeState)
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY && e.newValue) setThemeState(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => {
      subscribers.delete(setThemeState)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const setTheme = useCallback((next: string) => {
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // ignore quota / privacy-mode failures
    }
    subscribers.forEach((fn) => fn(next))
  }, [])

  return [theme, setTheme]
}
