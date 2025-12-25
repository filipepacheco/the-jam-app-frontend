import {useTranslation} from 'react-i18next'

type Props = {
  className?: string
}

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
]

export default function LanguageSwitcher({ className }: Props) {
  const { i18n, t } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="flex items-center w-full">
      <select
        onChange={(e) => changeLanguage(e.target.value)}
        value={i18n.language.split('-')[0]} // Handle cases like 'en-US'
        className={`select select-bordered select-xs sm:select-sm text-xs sm:text-sm ${className || ''}`}
        aria-label={t('common.select_language', { defaultValue: 'Select Language' })}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </div>
  )
}
