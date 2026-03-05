/**
 * Shared UI constants for language and theme selectors
 */

import { SUPPORTED_LANGUAGES } from '../config/languages.config'

export const LANGUAGES = SUPPORTED_LANGUAGES.map(l => ({ code: l.code, label: l.name }))

export const THEMES = [
  'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate',
  'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'garden',
  'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'black',
  'luxury', 'dracula', 'cmyk', 'autumn', 'business', 'acid', 'lemonade',
  'night', 'coffee', 'winter',
] as const
