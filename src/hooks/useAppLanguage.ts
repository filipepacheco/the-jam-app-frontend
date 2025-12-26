/**
 * useAppLanguage Hook
 * Manages application language preference from i18n
 */

import {useCallback, useMemo} from 'react'
import {useTranslation} from 'react-i18next'

export function useAppLanguage() {
  const { i18n } = useTranslation()

  const currentLang = useMemo(() => {
    if (i18n?.language) {
      return i18n.language
    }
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('i18nextLng')
      if (stored) return stored
    }
    return 'en'
  }, [i18n?.language])

  const changeLanguage = useCallback(
    (lang: string | undefined) => {
      if (lang) {
        i18n.changeLanguage(lang)
      }
    },
    [i18n]
  )

  return { currentLang, changeLanguage, i18n }
}

