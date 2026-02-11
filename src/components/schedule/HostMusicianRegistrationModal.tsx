/**
 * Host Musician Registration Modal Component
 * Allows hosts to manually register musicians into specific schedules
 */

import {useEffect, useState, useCallback} from 'react'
import type {MusicianResponseDto, ScheduleResponseDto} from '../../types/api.types'
import {registrationService} from '../../services'
import {musicianService} from '../../services'
import {useFormState} from '../../hooks'
import {useTranslation} from 'react-i18next'
import {getInstrumentOptions} from '../../utils/scheduleUtils'
import {ScheduleDetailsCard} from './ScheduleDetailsCard'
import {Alert} from '../Alert'
import {InstrumentsSummary} from './InstrumentsSummary'
import {Modal} from '../Modal'
import {ModalFooter} from '../ModalFooter'

interface HostMusicianRegistrationModalProps {
  schedule: ScheduleResponseDto
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
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
  const { error, setError, isLoading: loading, setIsLoading: setLoading } = useFormState({ navigateOnSuccess: false })
  const [musicianLoading, setMusicianLoading] = useState(false)

  // Load all musicians when modal opens
  const loadMusicians = useCallback(async () => {
    setMusicianLoading(true)
    try {
      const result = await musicianService.findAll()
      setMusicians(result.data || [])
    } catch (err) {
      setError(t('errors.failed_to_load_musicians'))
    } finally {
      setMusicianLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (isOpen) {
      void loadMusicians()
    }
  }, [isOpen, loadMusicians])

  const instrumentOptions = getInstrumentOptions(schedule, (key) => {
    const instrumentKeyMap: Record<string, string> = {
      drums: t('schedule.instruments.drums'),
      guitars: t('schedule.instruments.guitars'),
      vocals: t('schedule.instruments.vocals'),
      bass: t('schedule.instruments.bass'),
      keys: t('schedule.instruments.keys'),
    }
    return instrumentKeyMap[key] || key
  })

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
      })

      onClose()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.failed_to_register_musician'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('schedule.add_musician_title')}
      size="sm"
      footer={
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleRegister}
          submitLabel={loading ? t('common.adding') : t('schedule.add_musician_btn')}
          submitting={loading}
          submitDisabled={!selectedMusicianId || !selectedInstrument}
        />
      }
    >
      <ScheduleDetailsCard schedule={schedule} />
      <Alert type="error" message={error} />

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
              {musician.name} ({musician.instrument ? t(`schedule.instruments.${musician.instrument}`, musician.instrument) : t('common.unknown')})
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
              <option key={option.key} value={option.key} disabled={isFull}>
                {option.emoji} {option.label} {isFull ? t('schedule.full_parentheses') : t('schedule.needed_count_parentheses', { count: remaining })}
              </option>
            )
          })}
        </select>
      </div>

      <InstrumentsSummary instrumentOptions={instrumentOptions} />
    </Modal>
  )
}
