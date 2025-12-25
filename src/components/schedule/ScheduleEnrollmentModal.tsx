/**
 * Schedule Enrollment Modal Component
 * Modal for musicians to enroll into a specific schedule
 */

import type {ScheduleResponseDto} from '../../types/api.types'
import {registrationService} from '../../services/registrationService'
import {useAuth} from '../../hooks'
import {useState} from 'react'
import {useTranslation} from 'react-i18next'

interface ScheduleEnrollmentModalProps {
  schedule: ScheduleResponseDto
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface InstrumentOption {
    key: string
    label: string
    emoji: string
    needed: number
    registered: number
}

export function ScheduleEnrollmentModal({
                                            schedule, isOpen, onClose, onSuccess,
                                        }: ScheduleEnrollmentModalProps) {
    const { t } = useTranslation()
    const { user } = useAuth()
    const [selectedInstrument, setSelectedInstrument] = useState('')
    const [enrollLoading, setEnrollLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const getInstrumentOptions = (): InstrumentOption[] => {
        if (!schedule.music) return []

        const options: InstrumentOption[] = []
        const instrumentMap = [{
            key: 'drums',
            label: t('schedule.instruments.drums'),
            emoji: '🥁',
            field: 'neededDrums' as const
        }, {key: 'guitars', label: t('schedule.instruments.guitars'), emoji: '🎸', field: 'neededGuitars' as const}, {
            key: 'vocals',
            label: t('schedule.instruments.vocals'),
            emoji: '🎤',
            field: 'neededVocals' as const
        }, {key: 'bass', label: t('schedule.instruments.bass'), emoji: '🎸', field: 'neededBass' as const}, {
            key: 'keys',
            label: t('schedule.instruments.keys'),
            emoji: '🎹',
            field: 'neededKeys' as const
        },]

        instrumentMap.forEach(({key, label, emoji, field}) => {
            const needed = schedule.music![field] || 0
            if (needed > 0) {
                const registered = schedule.registrations?.filter((reg) => reg.musician?.instrument === label).length || 0
                options.push({
                    key, label, emoji, needed, registered,
                })
            }
        })

        return options
    }

  const handleEnroll = async () => {
    if (!selectedInstrument) {
      setError(t('errors.please_select_instrument'))
      return
    }

    if (!user?.id) {
      setError(t('errors.no_token_found'))
      return
    }

    setEnrollLoading(true)
    setError(null)

    try {
      if (import.meta.env.DEV) {
        console.log('📝 Attempting enrollment with:', {
          musicianId: user.id,
          scheduleId: schedule.id,
          instrument: selectedInstrument,
        })
        const token = localStorage.getItem('auth_token')
        console.log('🔐 Current auth token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN')
      }

      await registrationService.create({
        musicianId: user.id,
        scheduleId: schedule.id,
        instrument: selectedInstrument,
      } as any)

      if (import.meta.env.DEV) {
        console.log('✅ Enrollment successful!')
      }

      onClose()
      onSuccess()
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('❌ Enrollment error:', err)
        console.error('Error details:', {
          message: err.message || 'Unknown error',
          fullError: err,
        })
      }
      setError(err.message || t('errors.failed_to_enroll'))
    } finally {
      setEnrollLoading(false)
    }
  }

    if (!isOpen) return null

    const instrumentOptions = getInstrumentOptions()

    return (<div className="modal modal-open">
            <div className="modal-box max-w-sm">
                <h3 className="font-bold text-lg mb-4">{t('schedule.enroll_title')}</h3>

                {/* Schedule Details */}
                <div className="bg-base-200 rounded p-3 mb-4">
                    <p className="font-semibold text-sm truncate">{schedule.music?.title || t('schedule.song_tba')}</p>
                    <p className="text-xs text-base-content/70 truncate">
                        {t('common.by')} {schedule.music?.artist || t('schedule.artist_tba')}
                    </p>
                    {schedule.music?.duration && (<p className="text-xs text-base-content/60 mt-1">
                            ⏱️ {Math.floor(schedule.music.duration / 60)}:
                            {String(schedule.music.duration % 60).padStart(2, '0')}
                        </p>)}
                </div>

                {/* Error Alert */}
                {error && (<div className="alert alert-error mb-4">
                        <p>{error}</p>
                    </div>)}

                {/* Instrument Selection */}
                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text">{t('schedule.select_your_instrument')}</span>
                    </label>
                    <select
                        value={selectedInstrument}
                        onChange={(e) => setSelectedInstrument(e.target.value)}
                        className="select select-bordered"
                        disabled={enrollLoading}
                    >
                        <option value="">{t('schedule.choose_instrument')}</option>
                        {instrumentOptions.map((option) => {
                            const remaining = option.needed - option.registered
                            const isFull = remaining <= 0
                            return (<option key={option.key} value={option.label} disabled={isFull}>
                                    {option.emoji} {option.label} {isFull ? t('schedule.full_parentheses') : t('schedule.needed_count_parentheses', { count: remaining })}
                                </option>)
                        })}
                    </select>
                </div>

                {/* Instruments Summary */}
                <div className="text-sm text-base-content/70 mb-4 p-3 bg-base-200 rounded">
                    <p className="font-semibold mb-2 text-xs">{t('schedule.instruments_needed')}</p>
                    <div className="flex flex-wrap gap-2">
                        {instrumentOptions.map((option) => {
                            const remaining = option.needed - option.registered
                            return (<span
                                    key={option.key}
                                    className={`badge badge-sm ${remaining > 0 ? 'badge-warning' : 'badge-error'}`}
                                >
                  {option.emoji} {option.label}: {remaining > 0 ? t('schedule.left_count', { count: remaining }) : t('schedule.full')}
                </span>)
                        })}
                    </div>
                </div>

                {/* Modal Actions */}
                <div className="modal-action">
                    <button
                        onClick={onClose}
                        className="btn btn-ghost"
                        disabled={enrollLoading}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleEnroll}
                        className="btn btn-primary"
                        disabled={enrollLoading || !selectedInstrument}
                    >
                        {enrollLoading ? (<>
                                <span className="loading loading-spinner loading-sm"></span>
                                {t('schedule.enrolling')}
                            </>) : (t('schedule.enroll_now'))}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>)
}

