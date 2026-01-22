/**
 * Instrument Group Component
 * Displays a group of musicians grouped by instrument with emoji and stacked names
 */

import {memo, useMemo} from 'react'
import {motion} from 'framer-motion'
import {useTranslation} from 'react-i18next'
import {useReducedMotion} from '../../hooks'
import {getInstrumentEmoji} from '../../utils/instrumentEmojis'
import type {DashboardMusicianDto} from '../../types/api.types'

interface InstrumentGroupProps {
  instrument: string
  musicians: DashboardMusicianDto[]
  size?: 'sm' | 'md' | 'lg'
}

// Animation configuration for musician cards
const MUSICIAN_INITIAL = { opacity: 0, x: -10, scale: 0.9 } as const
const MUSICIAN_ANIMATE = { opacity: 1, x: 0, scale: 1 } as const

// Spring animation configuration for smooth bouncy entry
const MUSICIAN_SPRING_TRANSITION = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
} as const

export const InstrumentGroup = memo(function InstrumentGroup({ instrument, musicians, size = 'md' }: InstrumentGroupProps) {
  const { t } = useTranslation()
  const { transition, prefersReducedMotion } = useReducedMotion()

  const sizeClasses = {
    sm: { container: 'p-2', emoji: 'text-lg', text: 'text-xs' },
    md: { container: 'p-3', emoji: 'text-2xl', text: 'text-xs' },
    lg: { container: 'p-4', emoji: 'text-3xl', text: 'text-sm' },
  }

  const classes = sizeClasses[size]

  // Calculate deterministic stagger delay based on musician ID
  const transitionConfig = useMemo(() => {
    if (prefersReducedMotion) {
      return transition
    }

    const delay =
      musicians.length > 0 ? (musicians[0].id?.charCodeAt(0) ?? 0) % 5 * 0.1 : 0
    return { ...MUSICIAN_SPRING_TRANSITION, delay }
  }, [prefersReducedMotion, musicians, transition])

  return (
    <motion.div
      key={instrument}
      initial={MUSICIAN_INITIAL}
      animate={MUSICIAN_ANIMATE}
      transition={transitionConfig}
      className={`bg-slate-700/50 hover:bg-slate-600/50 transition-colors rounded-lg ${classes.container} text-center`}
    >
      <p className={`mb-${size === 'lg' ? '3' : '2'} ${classes.emoji}`}>
        {getInstrumentEmoji(instrument)}
      </p>
      <div className="space-y-1">
        {musicians &&
          musicians.map((musician) => (
            <p key={musician.id} className={`font-semibold text-white ${classes.text} truncate`} title={musician.name || t('publicDashboard.unknown', 'Unknown')}>
              {musician.name || t('publicDashboard.unknown', 'Unknown')}
            </p>
          ))}
      </div>
    </motion.div>
  )
})

