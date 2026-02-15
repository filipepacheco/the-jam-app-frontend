import { useTranslation } from 'react-i18next'

export function FinishedPanel() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-8">
      <p className="text-7xl md:text-9xl mb-8">👏</p>

      <h2 className="text-6xl md:text-8xl lg:text-9xl font-black mb-6">
        {t('publicDashboard.jamFinished', "That's a wrap!")}
      </h2>

      <p className="text-2xl md:text-4xl text-slate-300">
        {t('publicDashboard.thankYou', 'Thanks for jamming with us!')}
      </p>
    </div>
  )
}
