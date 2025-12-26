/**
 * Next Song Card Component
 * Displays next song to be played with musicians grouped by instrument
 */

import {motion} from 'framer-motion'
import {useTranslation} from 'react-i18next'
import {InstrumentGroup} from './InstrumentGroup'
import type {DashboardSongDto} from '../../types/api.types'

interface NextSongCardProps {
  song: DashboardSongDto
}

export function NextSongCard({ song }: NextSongCardProps) {
  const { t } = useTranslation()

  return (
    <motion.div
      key={`next-${song.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mb-12"
    >
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 md:p-8">
        <p className="text-slate-300 text-sm md:text-base font-semibold uppercase tracking-widest mb-3">
          {t('publicDashboard.upNext')}
        </p>
        <h3 className="text-3xl md:text-5xl font-bold text-white mb-2">{song.title}</h3>
        <p className="text-lg md:text-2xl text-slate-300 mb-4">{song.artist}</p>

        {song.musicians && song.musicians.length > 0 && (
          <div className="mt-6">
            <p className="text-base md:text-lg font-semibold text-white mb-4">
              {t('publicDashboard.musiciansToBeCalled')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(() => {
                // Group musicians by instrument
                const groupedByInstrument = (song.musicians || []).reduce((acc: Record<string, typeof song.musicians>, musician: any) => {
                  const instrument = musician.instrument || 'Unknown'
                  if (!acc[instrument]) {
                    acc[instrument] = []
                  }
                  acc[instrument].push(musician)
                  return acc
                }, {})

                return Object.entries(groupedByInstrument).map(([instrument, musicians]) => (
                  <InstrumentGroup key={instrument} instrument={instrument} musicians={musicians} size="md" />
                ))
              })()}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

