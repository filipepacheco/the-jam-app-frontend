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
          className={`px-3 py-1 rounded text-xs transition ${
            currentLang.startsWith(lang.code)
              ? 'bg-white text-slate-900 font-semibold'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}

