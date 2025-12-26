/**
 * Instrument Group Component
 * Displays a group of musicians grouped by instrument with emoji and stacked names
 */

import {motion} from 'framer-motion'
import {useTranslation} from 'react-i18next'
import {getInstrumentEmoji} from '../../utils/instrumentEmojis'
import type {DashboardMusicianDto} from '../../types/api.types'

interface InstrumentGroupProps {
  instrument: string
  musicians: DashboardMusicianDto[]
  size?: 'sm' | 'md' | 'lg'
}

export function InstrumentGroup({ instrument, musicians, size = 'md' }: InstrumentGroupProps) {
  const { t } = useTranslation()

  const sizeClasses = {
    sm: { container: 'p-2', emoji: 'text-lg', text: 'text-xs' },
    md: { container: 'p-3', emoji: 'text-2xl', text: 'text-xs' },
    lg: { container: 'p-4', emoji: 'text-3xl', text: 'text-sm' },
  }

  const classes = sizeClasses[size]

  return (
    <motion.div
      key={instrument}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-slate-700/50 hover:bg-slate-600/50 transition-colors rounded-lg ${classes.container} text-center`}
    >
      <p className={`mb-${size === 'lg' ? '3' : '2'} ${classes.emoji}`}>
        {getInstrumentEmoji(instrument)}
      </p>
      <div className="space-y-1">
        {musicians &&
          musicians.map((musician) => (
            <p key={musician.id} className={`font-semibold text-white ${classes.text}`}>
              {musician.name || t('publicDashboard.unknown', 'Unknown')}
            </p>
          ))}
      </div>
    </motion.div>
  )
}

