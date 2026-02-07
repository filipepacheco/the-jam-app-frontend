/**
 * Starting Soon Card Component
 * Fallback display when no song is currently playing
 */

import {motion} from 'framer-motion'
import {useTranslation} from 'react-i18next'
import {useReducedMotion} from '../../hooks'
import {InstrumentGroup} from './InstrumentGroup'
import {groupMusiciansByInstrument} from '../../utils/musicianUtils'
import type {DashboardSongDto} from '../../types/api.types'

interface StartingSoonCardProps {
  song: DashboardSongDto | null
}

export function StartingSoonCard({ song }: StartingSoonCardProps) {
  const { t } = useTranslation()
  const { transition } = useReducedMotion()

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={transition} className="mb-8">
      <div className="bg-linear-to-br from-slate-800/40 to-slate-700/40 backdrop-blur border border-slate-500/30 rounded-2xl p-6 md:p-10 text-center">
        <div className="animate-pulse mb-3">
          <p className="text-5xl md:text-7xl font-black">🎉</p>
        </div>
        <h2 className="text-4xl md:text-6xl font-black mb-2">{t('publicDashboard.startingSoon', 'Starting Soon!')}</h2>
        {song ? (
          <div className="mt-4">
            <p className="text-lg md:text-2xl text-slate-300 mb-1">{t('publicDashboard.firstUp', 'First up:')}</p>
            <p className="text-3xl md:text-5xl font-bold text-white mb-1">{song.title}</p>
            <p className="text-xl md:text-2xl text-slate-400">
              {t('publicDashboard.by', 'by')} {song.artist}
            </p>

            {song.musicians && song.musicians.length > 0 && (
              <div className="mt-6">
                <p className="text-base md:text-lg font-semibold text-white mb-3">
                  {t('publicDashboard.musiciansToBeCalled')}
                </p>
                <div className="inline-flex flex-wrap gap-3 justify-center">
                  {Object.entries(groupMusiciansByInstrument(song.musicians)).map(([instrument, musicians]) => (
                    <InstrumentGroup key={instrument} instrument={instrument} musicians={musicians} size="md" />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-lg md:text-2xl text-slate-300 mt-3">
            {t('publicDashboard.preparingSetlist', 'Setting up the setlist...')}
          </p>
        )}
      </div>
    </motion.div>
  )
}
