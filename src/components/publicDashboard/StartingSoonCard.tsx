/**
 * Starting Soon Card Component
 * Fallback display when no song is currently playing
 */

import {motion} from 'framer-motion'
import {useTranslation} from 'react-i18next'
import type {DashboardSongDto} from '../../types/api.types'

interface StartingSoonCardProps {
  song: DashboardSongDto
}

export function StartingSoonCard({ song }: StartingSoonCardProps) {
  const { t } = useTranslation()

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-12">
      <div className="bg-linear-to-br from-slate-800/40 to-slate-700/40 backdrop-blur border border-slate-500/30 rounded-2xl p-8 md:p-12 text-center">
        <div className="animate-pulse mb-6">
          <p className="text-5xl md:text-7xl font-black mb-4">🎉</p>
        </div>
        <h2 className="text-4xl md:text-6xl font-black mb-4">{t('publicDashboard.startingSoon', 'Starting Soon!')}</h2>
        <div className="mt-8">
          <p className="text-lg md:text-2xl text-slate-300 mb-2">{t('publicDashboard.firstUp', 'First up:')}</p>
          <p className="text-3xl md:text-5xl font-bold text-white mb-2">{song.title}</p>
          <p className="text-xl md:text-2xl text-slate-400">
            {t('publicDashboard.by', 'by')} {song.artist}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

