import React from 'react'
import type {ScheduleResponseDto} from '../../types/api.types'
import {motion} from 'framer-motion'
import MusiciansGrid from './MusiciansGrid'

interface Props {
  song: ScheduleResponseDto | null
  t: (k: string, opts?: any) => string
}

export default function NextSongsCard({ song, t }: Props) {
  if (!song || !song.music) return null

  const regs = song.registrations || []

  return (
    <motion.div key={`next-${song.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-12">
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 md:p-8">
        <p className="text-slate-300 text-sm md:text-base font-semibold uppercase tracking-widest mb-3">{t('publicDashboard.upNext')}</p>
        <h3 className="text-3xl md:text-5xl font-bold text-white mb-2">{song.music.title}</h3>
        <p className="text-lg md:text-2xl text-slate-300 mb-4">{song.music.artist}</p>

        {regs && regs.length > 0 && (
          <div className="mt-6">
            <p className="text-base md:text-lg font-semibold text-white mb-3">{t('publicDashboard.musiciansToBeCalled')}</p>
            <MusiciansGrid registrations={regs} t={t as any} compact />
          </div>
        )}
      </div>
    </motion.div>
  )
}
