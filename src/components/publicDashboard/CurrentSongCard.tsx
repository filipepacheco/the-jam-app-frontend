/**
 * Current Song Card Component
 * Displays currently playing song with musicians grouped by instrument
 */

import {motion} from 'framer-motion'
import {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {useReducedMotion} from '../../hooks'
import {InstrumentGroup} from './InstrumentGroup'
import {WaveformVisualizer} from './WaveformVisualizer'
import {groupMusiciansByInstrument} from '../../utils/musicianUtils'
import {formatDuration} from '../../lib/formatters'
import type {DashboardSongDto} from '../../types/api.types'

interface CurrentSongCardProps {
  song: DashboardSongDto
}

// Animation configurations for optimal performance
const CARD_ENTRY_ANIMATION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
} as const

const CARD_PULSE_ANIMATION = {
  scale: [1, 1.015, 1],
}

const CARD_PULSE_TRANSITION = {
  duration: 3,
  repeat: Infinity,
  ease: 'easeInOut',
} as const

export function CurrentSongCard({ song }: CurrentSongCardProps) {
  const { t } = useTranslation()
  const { transition, prefersReducedMotion } = useReducedMotion()

  // Memoize pulse transition to prevent object recreation on re-renders
  const pulseTransition = useMemo(
    () => (prefersReducedMotion ? { duration: 0 } : CARD_PULSE_TRANSITION),
    [prefersReducedMotion]
  )

  return (
    <motion.div
      key={`current-${song.id}`}
      {...CARD_ENTRY_ANIMATION}
      transition={transition}
      className="mb-12"
    >
      <motion.div
        className="bg-base-200/80 border border-primary/20 rounded-2xl p-8 md:p-12"
        animate={prefersReducedMotion ? {} : CARD_PULSE_ANIMATION}
        transition={pulseTransition}
      >
        <p className="text-base-content/70 text-sm md:text-lg font-semibold uppercase tracking-widest mb-4">
          {t('publicDashboard.nowPlaying', 'Now Playing')}
        </p>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 text-wrap">{song.title}</h2>
        <WaveformVisualizer className="my-4" />
        <p className="md:text-3xl text-base-content/80 mb-2">
          {t('publicDashboard.by', 'by')} {song.artist}
        </p>
        {song.duration && (
          <p className="text-lg md:text-xl text-base-content/70 mb-8">⏱️ {formatDuration(song.duration)}</p>
        )}

        {song.musicians && song.musicians.length > 0 ? (
          <div className="mt-8">
            <p className="text-lg md:text-2xl font-bold text-base-content mb-6">
              {t('publicDashboard.currentMusicians', 'Current Musicians')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(groupMusiciansByInstrument(song.musicians)).map(([instrument, musicians]) => (
                <InstrumentGroup key={instrument} instrument={instrument} musicians={musicians} size="lg" />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-base-content/70 text-lg">{t('publicDashboard.noMusicians', 'No musicians registered yet')}</p>
        )}
      </motion.div>
    </motion.div>
  )
}

