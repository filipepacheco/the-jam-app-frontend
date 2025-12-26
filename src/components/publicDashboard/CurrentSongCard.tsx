/**
 * Current Song Card Component
 * Displays currently playing song with musicians grouped by instrument
 */

import {motion} from 'framer-motion'
import {useTranslation} from 'react-i18next'
import {InstrumentGroup} from './InstrumentGroup'
import type {DashboardSongDto} from '../../types/api.types'

interface CurrentSongCardProps {
  song: DashboardSongDto
}

export function CurrentSongCard({ song }: CurrentSongCardProps) {
  const { t } = useTranslation()

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '0:00'
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      key={`current-${song.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      <div className="bg-linear-to-br from-purple-900/40 to-blue-900/40 backdrop-blur border border-purple-500/30 rounded-2xl p-8 md:p-12">
        <p className="text-purple-300 text-sm md:text-lg font-semibold uppercase tracking-widest mb-4">
          {t('publicDashboard.nowPlaying', 'Now Playing')}
        </p>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 text-wrap">{song.title}</h2>
        <p className="md:text-3xl text-purple-200 mb-2">
          {t('publicDashboard.by', 'by')} {song.artist}
        </p>
        {song.duration && (
          <p className="text-lg md:text-xl text-purple-300 mb-8">⏱️ {formatDuration(song.duration)}</p>
        )}

        {song.musicians && song.musicians.length > 0 ? (
          <div className="mt-8">
            <p className="text-lg md:text-2xl font-bold text-white mb-6">
              {t('publicDashboard.currentMusicians', 'Current Musicians')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  <InstrumentGroup key={instrument} instrument={instrument} musicians={musicians} size="lg" />
                ))
              })()}
            </div>
          </div>
        ) : (
          <p className="text-purple-300 text-lg">{t('publicDashboard.noMusicians', 'No musicians registered yet')}</p>
        )}
      </div>
    </motion.div>
  )
}

