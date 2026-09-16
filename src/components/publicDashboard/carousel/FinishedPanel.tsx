import { useTranslation } from 'react-i18next'

export function FinishedPanel() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-8">
      <p className="text-7xl md:text-9xl mb-8" aria-hidden="true">👏</p>

      <h2 className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 ds-wrap-user-content">
        {t('publicDashboard.jamFinished')}
      </h2>

      <p className="text-2xl md:text-4xl text-base-content/70">
        {t('publicDashboard.thankYou')}
      </p>
    </div>
  )
}
