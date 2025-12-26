import React from 'react'
import type {RegistrationResponseDto} from '../../types/api.types'
import {getInstrumentIcon} from '../schedule/RegistrationList'
import {motion} from 'framer-motion'

interface Props {
  registrations: RegistrationResponseDto[]
  t: (k: string, opts?: any) => string
  compact?: boolean
}

export default function MusiciansGrid({ registrations, t, compact = false }: Props) {
  if (!registrations || registrations.length === 0) {
    return <p className="text-purple-300 text-lg">{t('publicDashboard.noMusicians', 'No musicians registered yet')}</p>
  }

  const grouped = registrations.reduce((acc: Record<string, RegistrationResponseDto[]>, r) => {
    const instrument = r.instrument || r.musician?.instrument || 'Unknown'
    acc[instrument] = acc[instrument] || []
    acc[instrument].push(r)
    return acc
  }, {})

  return (
    <div className={compact ? 'grid grid-cols-2 md:grid-cols-3 gap-3' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'}>
      {Object.entries(grouped).map(([instrument, list]) => (
        <motion.div key={instrument} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className={compact ? 'bg-slate-700/50 rounded-lg p-3 text-center' : 'bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center'}>
          <p className={compact ? 'text-3xl mb-3' : 'text-4xl mb-4'}>{getInstrumentIcon(instrument)}</p>
          <div className={compact ? 'space-y-1' : 'space-y-2'}>
            {list.map((reg) => (
              <p key={reg.id} className={compact ? 'font-semibold text-white text-xs' : 'font-semibold text-white text-sm'}>{reg.musician?.name || t('publicDashboard.unknown')}</p>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

