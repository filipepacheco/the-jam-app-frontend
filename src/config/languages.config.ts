/**
 * Language configuration
 * Centralized list of supported languages
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'pt', label: 'PT', name: 'Português' },
] as const

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code']

/**
 * Check if language code matches a supported language
 */
export function isSupportedLanguage(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGES.some((lang) => code.startsWith(lang.code))
}

/**
 * Get language label by code
 */
export function getLanguageLabel(code: string): string {
  return SUPPORTED_LANGUAGES.find((lang) => code.startsWith(lang.code))?.label || 'EN'
}

