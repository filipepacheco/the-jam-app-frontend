/**
 * Current Song Card Component
 * Displays currently playing song with musicians grouped by instrument
 *
 * Display-specific wrapper, documented in
 * docs/design-system/public-dashboard-migration.md: `DataCard` was
 * evaluated and not applied here. `DataCard` fixes its own background,
 * border radius, and padding scale, which would remove the semi-transparent
 * surface, the accent `border-primary/20` that visually distinguishes
 * "now playing" from the other cards, and the padding tuned for this
 * card's distance-legible type scale (`text-5xl` to `text-8xl`).
 */

import {AnimatePresence, motion} from 'framer-motion'
import {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {useReducedMotion} from '../../hooks'
import {InstrumentGroup} from './InstrumentGroup'
import {WaveformVisualizer} from './WaveformVisualizer'
import {groupMusiciansByInstrument} from '../../utils/musicianUtils'
import {formatDuration} from '../../lib/formatters'
import type {DashboardSongDto} from '../../types/api.types'

interface CurrentSongCardProps {
  song: DashboardSongDto | null
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
      key={`current-${song?.id ?? 'waiting'}`}
      initial={prefersReducedMotion ? false : CARD_ENTRY_ANIMATION.initial}
      animate={CARD_ENTRY_ANIMATION.animate}
      transition={transition}
      className="mb-12"
    >
      <motion.div
        className="bg-primary/15 border-2 border-primary/40 rounded-2xl p-8 md:p-12"
        animate={prefersReducedMotion ? {} : CARD_PULSE_ANIMATION}
        transition={pulseTransition}
      >
        <p className="text-primary text-sm md:text-lg font-semibold mb-4">
          {t('publicDashboard.nowPlaying', 'Now Playing')}
        </p>
        {song ? (
          <>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 ds-wrap-user-content">{song.title}</h2>
            <WaveformVisualizer className="my-4" />
            <p className="md:text-3xl text-base-content/80 mb-2 ds-wrap-user-content">
              {t('publicDashboard.by', 'by')} {song.artist}
            </p>
            {song.duration && (
              <p className="text-lg md:text-xl text-base-content/70 mb-8">
                <span aria-hidden="true">⏱️</span> {formatDuration(song.duration)}
              </p>
            )}

            {song.musicians && song.musicians.length > 0 ? (
              <div className="mt-8">
                <p className="text-lg md:text-2xl font-bold text-base-content mb-6">
                  {t('publicDashboard.currentMusicians', 'Current Musicians')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <AnimatePresence initial={false} mode="popLayout">
                    {Object.entries(groupMusiciansByInstrument(song.musicians)).map(([instrument, musicians]) => (
                      <motion.div
                        key={`${instrument}:${musicians.map(({id}) => id).join(',')}`}
                        layout={!prefersReducedMotion}
                        initial={prefersReducedMotion ? false : {opacity: 0, y: 8}}
                        animate={{opacity: 1, y: 0}}
                        exit={prefersReducedMotion ? undefined : {opacity: 0, y: -8}}
                        transition={transition}
                      >
                        <InstrumentGroup instrument={instrument} musicians={musicians} size="lg" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <p className="text-base-content/70 text-lg">{t('publicDashboard.noMusicians', 'No musicians registered yet')}</p>
            )}
          </>
        ) : (
          <div className="py-6 md:py-10">
            <h2 className="text-4xl font-black text-base-content md:text-6xl">
              {t('publicDashboard.waitingForPerformance')}
            </h2>
            <p className="mt-4 text-lg text-base-content/70 md:text-2xl">
              {t('publicDashboard.waitingForPerformanceHelp')}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
