/**
 * Host Musician Registration Modal Component
 * Allows hosts to manually register musicians into specific schedules
 */

import {useEffect, useState} from 'react'
import type {MusicianResponseDto, ScheduleResponseDto} from '../../types/api.types'
import {registrationService} from '../../services/registrationService'
import {musicianService} from '../../services/musicianService'
import {useTranslation} from 'react-i18next'

interface HostMusicianRegistrationModalProps {
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

export function HostMusicianRegistrationModal({
  schedule,
  isOpen,
  onClose,
  onSuccess,
}: HostMusicianRegistrationModalProps) {
  const { t } = useTranslation()
  const [musicians, setMusicians] = useState<MusicianResponseDto[]>([])
  const [selectedMusicianId, setSelectedMusicianId] = useState('')
  const [selectedInstrument, setSelectedInstrument] = useState('')
  const [loading, setLoading] = useState(false)
  const [musicianLoading, setMusicianLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load all musicians when modal opens
  useEffect(() => {
    if (isOpen) {
      loadMusicians()
    }
  }, [isOpen])

  const loadMusicians = async () => {
    setMusicianLoading(true)
    try {
      const result = await musicianService.findAll()
      setMusicians(result.data || [])
    } catch (err) {
      setError(t('errors.failed_to_load_musicians'))
    } finally {
      setMusicianLoading(false)
    }
  }

  const getInstrumentOptions = (): InstrumentOption[] => {
    if (!schedule.music) return []

    const options: InstrumentOption[] = []
    const instrumentMap = [
      { key: 'drums', label: t('schedule.instruments.drums'), emoji: '🥁', field: 'neededDrums' as const },
      { key: 'guitars', label: t('schedule.instruments.guitars'), emoji: '🎸', field: 'neededGuitars' as const },
      { key: 'vocals', label: t('schedule.instruments.vocals'), emoji: '🎤', field: 'neededVocals' as const },
      { key: 'bass', label: t('schedule.instruments.bass'), emoji: '🎸', field: 'neededBass' as const },
      { key: 'keys', label: t('schedule.instruments.keys'), emoji: '🎹', field: 'neededKeys' as const },
    ]

    instrumentMap.forEach(({ key, label, emoji, field }) => {
      const needed = schedule.music![field] || 0
      if (needed > 0) {
        const registered = schedule.registrations?.filter(
          (reg) => reg.musician?.instrument === label
        ).length || 0
        options.push({
          key,
          label,
          emoji,
          needed,
          registered,
        })
      }
    })

    return options
  }

  const handleRegister = async () => {
    if (!selectedMusicianId) {
      setError(t('errors.please_select_musician'))
      return
    }

    if (!selectedInstrument) {
      setError(t('errors.please_select_instrument'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      await registrationService.create({
        musicianId: selectedMusicianId,
        scheduleId: schedule.id,
        instrument: selectedInstrument,
      } as any)

      onClose()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.failed_to_register_musician'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const instrumentOptions = getInstrumentOptions()

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-sm">
        <h3 className="font-bold text-lg mb-4">{t('schedule.add_musician_title')}</h3>

        {/* Schedule Details */}
        <div className="bg-base-200 rounded p-3 mb-4">
          <p className="font-semibold text-sm truncate">{schedule.music?.title || t('schedule.song_tba')}</p>
          <p className="text-xs text-base-content/70 truncate">
            {t('common.by')} {schedule.music?.artist || t('schedule.artist_tba')}
          </p>
          {schedule.music?.duration && (
            <p className="text-xs text-base-content/60 mt-1">
              ⏱️ {Math.floor(schedule.music.duration / 60)}:
              {String(schedule.music.duration % 60).padStart(2, '0')}
            </p>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error mb-4">
            <p>{error}</p>
          </div>
        )}

        {/* Musician Selection */}
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">{t('schedule.select_musician')}</span>
          </label>
          <select
            value={selectedMusicianId}
            onChange={(e) => setSelectedMusicianId(e.target.value)}
            className="select select-bordered"
            disabled={musicianLoading || loading}
          >
            <option value="">{t('schedule.choose_musician')}</option>
            {musicians.map((musician) => (
              <option key={musician.id} value={musician.id}>
                {musician.name} ({musician.instrument || t('schedule.unknown')})
              </option>
            ))}
          </select>
        </div>

        {/* Instrument Selection */}
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">{t('schedule.select_instrument')}</span>
          </label>
          <select
            value={selectedInstrument}
            onChange={(e) => setSelectedInstrument(e.target.value)}
            className="select select-bordered"
            disabled={loading}
          >
            <option value="">{t('schedule.choose_instrument')}</option>
            {instrumentOptions.map((option) => {
              const remaining = option.needed - option.registered
              const isFull = remaining <= 0
              return (
                <option key={option.key} value={option.label} disabled={isFull}>
                  {option.emoji} {option.label} {isFull ? t('schedule.full_parentheses') : t('schedule.needed_count_parentheses', { count: remaining })}
                </option>
              )
            })}
          </select>
        </div>

        {/* Instruments Summary */}
        <div className="text-sm text-base-content/70 mb-4 p-3 bg-base-200 rounded">
          <p className="font-semibold mb-2 text-xs">{t('schedule.instruments_needed')}</p>
          <div className="flex flex-wrap gap-2">
            {instrumentOptions.map((option) => {
              const remaining = option.needed - option.registered
              return (
                <span
                  key={option.key}
                  className={`badge badge-sm ${remaining > 0 ? 'badge-warning' : 'badge-error'}`}
                >
                  {option.emoji} {option.label}: {remaining > 0 ? t('schedule.left_count', { count: remaining }) : t('schedule.full')}
                </span>
              )
            })}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-action">
          <button
            onClick={onClose}
            className="btn btn-ghost"
            disabled={loading}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleRegister}
            className="btn btn-primary"
            disabled={loading || !selectedMusicianId || !selectedInstrument}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {t('schedule.adding')}
              </>
            ) : (
              t('schedule.add_musician_btn')
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}

