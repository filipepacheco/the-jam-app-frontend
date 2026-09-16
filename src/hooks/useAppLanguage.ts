/**
 * useAppLanguage Hook
 * Manages application language preference from i18n
 */

import {useCallback, useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {normalizeLocale, type AppLocale} from '../lib/i18n/applicationLocale'

export function useAppLanguage() {
  const { i18n } = useTranslation()

  const currentLang = useMemo(() => {
    return normalizeLocale(i18n.resolvedLanguage ?? i18n.language) ?? 'pt-BR'
  }, [i18n.language, i18n.resolvedLanguage])

  const changeLanguage = useCallback(
    (input: string | undefined) => {
      const locale = normalizeLocale(input)
      if (locale) void i18n.changeLanguage(locale)
    },
    [i18n]
  )

  return { currentLang: currentLang as AppLocale, changeLanguage, i18n }
}
