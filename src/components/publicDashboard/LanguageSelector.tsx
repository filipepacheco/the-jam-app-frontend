/**
 * Language Selector Component
 * Reusable button group for language selection
 */

import {SUPPORTED_LANGUAGES} from '../../config/languages.config'

interface LanguageSelectorProps {
  currentLang: string
  onChange: (lang: string) => void
  onSelectClose?: () => void
}

export function LanguageSelector({ currentLang, onChange, onSelectClose }: LanguageSelectorProps) {
  const handleLanguageClick = (lang: string) => {
    onChange(lang)
    onSelectClose?.()
  }

  return (
    <div className="flex items-center gap-2">
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => handleLanguageClick(lang.code)}
          aria-label={`Switch to ${lang.name}`}
          aria-pressed={currentLang.startsWith(lang.code)}
          className={`px-3 py-1 rounded text-xs transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
            currentLang.startsWith(lang.code)
              ? 'bg-white text-slate-900 font-semibold focus-visible:ring-offset-white'
              : 'bg-white/10 text-white hover:bg-white/20 focus-visible:ring-offset-slate-900'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}

