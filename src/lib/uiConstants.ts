/**
 * Shared UI constants for language and theme selectors
 */

import { SUPPORTED_LANGUAGES } from '../config/languages.config'
import { SELECTABLE_THEMES } from '../design-system/foundations'

export const LANGUAGES = SUPPORTED_LANGUAGES.map(l => ({ code: l.code, label: l.name }))

export const THEMES = SELECTABLE_THEMES
