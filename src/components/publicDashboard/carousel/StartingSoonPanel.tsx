import { useTranslation } from 'react-i18next'
import type { DashboardSongDto } from '../../../types/api.types'

interface StartingSoonPanelProps {
  song?: DashboardSongDto | null
}

export function StartingSoonPanel({ song }: StartingSoonPanelProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-8">
      <p className="text-7xl md:text-9xl mb-8 animate-pulse">🎉</p>

      <h2 className="text-6xl md:text-8xl lg:text-9xl font-black mb-6">
        {t('publicDashboard.startingSoon', 'Starting Soon!')}
      </h2>

      {song ? (
        <div className="mt-4">
          <p className="text-2xl md:text-3xl text-slate-300 mb-2">
            {t('publicDashboard.firstUp', 'First up:')}
          </p>
          <p className="text-4xl md:text-6xl font-bold mb-2">{song.title}</p>
          <p className="text-2xl md:text-4xl text-slate-400">
            {t('publicDashboard.by', 'by')} {song.artist}
          </p>
        </div>
      ) : (
        <p className="text-2xl md:text-3xl text-slate-300 mt-4">
          {t('publicDashboard.preparingSetlist', 'Setting up the setlist...')}
        </p>
      )}
    </div>
  )
}
