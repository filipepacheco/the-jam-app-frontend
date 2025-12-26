import React from 'react'
import type {ScheduleResponseDto} from '../../types/api.types'
import {formatDuration} from '../../lib/formatters'
import MusiciansGrid from './MusiciansGrid'
import {motion} from 'framer-motion'

interface Props {
  performance: ScheduleResponseDto
  t: (k: string, opts?: any) => string
}

export default function NowPlayingCard({ performance, t }: Props) {
  if (!performance || !performance.music) return null

  const regs = performance.registrations || []

  return (
    <motion.div
      key={`current-${performance.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      <div className="bg-linear-to-br from-purple-900/40 to-blue-900/40 backdrop-blur border border-purple-500/30 rounded-2xl p-8 md:p-12">
        <p className="text-purple-300 text-sm md:text-lg font-semibold uppercase tracking-widest mb-4">{t('publicDashboard.nowPlaying', 'Now Playing')}</p>

        <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 text-wrap">{performance.music.title}</h2>

        <p className="md:text-3xl text-purple-200 mb-2">{t('publicDashboard.by', 'by')} {performance.music.artist}</p>

        {performance.music.duration && (
          <p className="text-lg md:text-xl text-purple-300 mb-8">{t('publicDashboard.durationPrefix', '⏱️')} {formatDuration(performance.music.duration)}</p>
        )}

        {regs.length > 0 ? (
          <div className="mt-8">
            <p className="text-lg md:text-2xl font-bold text-white mb-6">{t('publicDashboard.currentMusicians', 'Current Musicians')}</p>
            <MusiciansGrid registrations={regs} t={t as any} />
          </div>
        ) : (
          <p className="text-purple-300 text-lg">{t('publicDashboard.noMusicians', 'No musicians registered yet')}</p>
        )}

      </div>
    </motion.div>
  )
}
