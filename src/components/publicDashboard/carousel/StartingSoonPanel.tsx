import { useTranslation } from 'react-i18next'
import type { DashboardSongDto } from '../../../types/api.types'

interface StartingSoonPanelProps {
  song?: DashboardSongDto | null
}

export function StartingSoonPanel({ song }: StartingSoonPanelProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-8">
      <p className="text-7xl md:text-9xl mb-8 animate-pulse" aria-hidden="true">🎉</p>

      <h2 className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 ds-wrap-user-content">
        {t('publicDashboard.startingSoon')}
      </h2>

      {song ? (
        <div className="mt-4">
          <p className="text-2xl md:text-3xl text-base-content/70 mb-2">
            {t('publicDashboard.firstUp')}
          </p>
          <p className="text-4xl md:text-6xl font-bold mb-2 ds-wrap-user-content">{song.title}</p>
          <p className="text-2xl md:text-4xl text-base-content/60 ds-wrap-user-content">
            {t('publicDashboard.by')} {song.artist}
          </p>
        </div>
      ) : (
        <p className="text-2xl md:text-3xl text-base-content/70 mt-4">
          {t('publicDashboard.preparingSetlist')}
        </p>
      )}
    </div>
  )
}
