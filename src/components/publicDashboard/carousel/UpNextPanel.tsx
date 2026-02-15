import { useTranslation } from 'react-i18next'
import { groupMusiciansByInstrument } from '../../../utils/musicianUtils'
import { getInstrumentEmoji } from '../../../utils/instrumentEmojis'
import type { DashboardSongDto } from '../../../types/api.types'

interface UpNextPanelProps {
  song: DashboardSongDto
}

export function UpNextPanel({ song }: UpNextPanelProps) {
  const { t } = useTranslation()
  const grouped = groupMusiciansByInstrument(song.musicians)

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-8">
      <p className="text-2xl tracking-[0.3em] uppercase text-cyan-300 font-semibold mb-6">
        {t('publicDashboard.upNext')}
      </p>

      <h2 className="text-7xl md:text-8xl lg:text-9xl font-black mb-4 text-wrap leading-tight">
        {song.title}
      </h2>

      <p className="text-3xl md:text-5xl text-cyan-100 mb-10">
        {t('publicDashboard.by', 'by')} {song.artist}
      </p>

      {song.musicians && song.musicians.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-8">
          {Object.entries(grouped).map(([instrument, musicians]) => (
            <div key={instrument} className="flex flex-col items-center gap-2">
              <span className="text-4xl">{getInstrumentEmoji(instrument)}</span>
              {musicians.map((m) => (
                <span key={m.id} className="text-2xl md:text-3xl font-semibold">
                  {m.name}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
