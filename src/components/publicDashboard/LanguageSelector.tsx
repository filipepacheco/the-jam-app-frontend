/**
 * Language Selector Component
 * Reusable button group for language selection
 *
 * See docs/design-system/public-dashboard-migration.md, decision 5: this
 * stays a bespoke compact pill-button group rather than `Action`. It lives
 * in a tight, single-line settings bar; resizing each button to the
 * canonical 44px control would reflow that whole bar, which is layout
 * churn out of scope for this migration. Flagged there as a follow-up.
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
              ? 'bg-base-100 text-base-content font-semibold focus-visible:ring-offset-base-100'
              : 'bg-base-content/10 text-base-content hover:bg-base-content/20 focus-visible:ring-offset-base-300'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}

