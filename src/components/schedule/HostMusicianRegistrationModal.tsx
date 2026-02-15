/**
 * Host Musician Registration Modal Component
 * Allows hosts to batch-register musicians into specific schedules.
 * Supports a queue-based flow: pick musician+instrument, add to queue, submit all at once.
 */

import {useEffect, useState, useCallback} from 'react'
import type {MusicianResponseDto, ScheduleResponseDto} from '../../types/api.types'
import {registrationService} from '../../services'
import {musicianService} from '../../services'
import {useFormState} from '../../hooks'
import {useTranslation} from 'react-i18next'
import {getInstrumentOptions} from '../../utils/scheduleUtils'
import type {InstrumentOption} from '../../utils/scheduleUtils'
import {getInstrumentEmoji} from '../../lib/schedule/instrumentHelpers'
import {ScheduleDetailsCard} from './ScheduleDetailsCard'
import {Alert} from '../Alert'
import {InstrumentsSummary} from './InstrumentsSummary'
import {Modal} from '../Modal'
import {ModalFooter} from '../ModalFooter'
import {Plus, X} from 'lucide-react'

interface HostMusicianRegistrationModalProps {
  schedule: ScheduleResponseDto
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface QueuedRegistration {
  id: string
  musicianId: string
  musicianName: string
  instrument: string
  instrumentLabel: string
}

interface SubmissionProgress {
  completed: number
  total: number
  errors: Array<{ musicianName: string; instrument: string; message: string }>
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
  const { error, setError } = useFormState({ navigateOnSuccess: false })
  const [musicianLoading, setMusicianLoading] = useState(false)

  // Batch state
  const [queue, setQueue] = useState<QueuedRegistration[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState<SubmissionProgress | null>(null)

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

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      void loadMusicians()
      setQueue([])
      setProgress(null)
      setSelectedMusicianId('')
      setSelectedInstrument('')
      setError(null)
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

  // Adjust remaining slots by subtracting queued items
  const getAdjustedRemaining = (option: InstrumentOption): number => {
    if (option.needed === -1) return -1 // unlimited
    const queuedForInstrument = queue.filter(q => q.instrument === option.key).length
    return option.needed - option.registered - queuedForInstrument
  }

  const handleAddToQueue = () => {
    if (!selectedMusicianId) {
      setError(t('errors.please_select_musician'))
      return
    }
    if (!selectedInstrument) {
      setError(t('errors.please_select_instrument'))
      return
    }

    // Duplicate check: same musician + same instrument already in queue
    const isDuplicate = queue.some(
      q => q.musicianId === selectedMusicianId && q.instrument === selectedInstrument
    )
    if (isDuplicate) {
      setError(t('schedule.batch.duplicate_in_queue'))
      return
    }

    const musician = musicians.find(m => m.id === selectedMusicianId)
    const instrumentOption = instrumentOptions.find(o => o.key === selectedInstrument)

    if (!musician || !instrumentOption) return

    setQueue(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        musicianId: selectedMusicianId,
        musicianName: musician.name,
        instrument: selectedInstrument,
        instrumentLabel: instrumentOption.label,
      },
    ])

    setSelectedMusicianId('')
    setSelectedInstrument('')
    setError(null)
  }

  const handleRemoveFromQueue = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id))
  }

  const handleSubmitAll = async () => {
    if (queue.length === 0) return

    setSubmitting(true)
    setError(null)
    const errors: SubmissionProgress['errors'] = []
    const successIds: string[] = []

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i]
      setProgress({ completed: i, total: queue.length, errors })

      try {
        await registrationService.create({
          musicianId: item.musicianId,
          scheduleId: schedule.id,
          instrument: item.instrument,
        })
        successIds.push(item.id)
      } catch (err) {
        errors.push({
          musicianName: item.musicianName,
          instrument: item.instrumentLabel,
          message: err instanceof Error ? err.message : t('errors.failed_to_register_musician'),
        })
      }
    }

    setProgress({ completed: queue.length, total: queue.length, errors })

    if (errors.length === 0) {
      // Full success
      setSubmitting(false)
      setProgress(null)
      onClose()
      onSuccess()
    } else if (errors.length === queue.length) {
      // All failed
      setError(t('schedule.batch.all_failed'))
      setSubmitting(false)
    } else {
      // Partial failure - remove successful items, keep failed ones
      setQueue(prev => prev.filter(q => !successIds.includes(q.id)))
      setError(t('schedule.batch.partial_error', {
        success: successIds.length,
        failed: errors.length,
      }))
      setSubmitting(false)
      onSuccess() // refresh parent for the ones that succeeded
    }
  }

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('schedule.add_musician_title')}
      size="sm"
      scrollable
      closeDisabled={submitting}
      footer={
        <ModalFooter
          onCancel={handleClose}
          onSubmit={handleSubmitAll}
          submitLabel={
            submitting && progress
              ? t('schedule.batch.submitting_progress', { completed: progress.completed, total: progress.total })
              : t('schedule.batch.submit_all', { count: queue.length })
          }
          submitting={submitting}
          submitDisabled={queue.length === 0}
        />
      }
    >
      <ScheduleDetailsCard schedule={schedule} />
      <Alert type="error" message={error} />

      {/* Musician Selection */}
      <div className="form-control mb-3">
        <label className="label">
          <span className="label-text">{t('schedule.select_musician')}</span>
        </label>
        <select
          value={selectedMusicianId}
          onChange={(e) => setSelectedMusicianId(e.target.value)}
          className="select select-bordered"
          disabled={musicianLoading || submitting}
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
      <div className="form-control mb-3">
        <label className="label">
          <span className="label-text">{t('schedule.select_instrument')}</span>
        </label>
        <select
          value={selectedInstrument}
          onChange={(e) => setSelectedInstrument(e.target.value)}
          className="select select-bordered"
          disabled={submitting}
        >
          <option value="">{t('schedule.choose_instrument')}</option>
          {instrumentOptions.map((option) => {
            const remaining = getAdjustedRemaining(option)
            const isFull = remaining !== -1 && remaining <= 0
            return (
              <option key={option.key} value={option.key} disabled={isFull}>
                {option.emoji} {option.label} {isFull ? t('schedule.full_parentheses') : remaining === -1 ? '' : t('schedule.needed_count_parentheses', { count: remaining })}
              </option>
            )
          })}
        </select>
      </div>

      {/* Add to Queue Button */}
      <div className="flex justify-end mb-4">
        <button
          type="button"
          className="btn btn-sm btn-outline btn-primary"
          onClick={handleAddToQueue}
          disabled={!selectedMusicianId || !selectedInstrument || submitting}
        >
          <Plus className="size-4" />
          {t('schedule.batch.add_to_queue')}
        </button>
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-base-content/60 mb-2">
            {t('schedule.batch.queue_count', { count: queue.length })}
          </div>
          <div className="space-y-1">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2 text-sm"
              >
                <span>
                  {getInstrumentEmoji(item.instrument)} {item.musicianName} - {item.instrumentLabel}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs btn-circle"
                  onClick={() => handleRemoveFromQueue(item.id)}
                  disabled={submitting}
                  aria-label={t('common.remove')}
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {submitting && progress && (
        <div className="mb-4">
          <div className="text-sm text-base-content/60 mb-1">
            {t('schedule.batch.submitting_progress', { completed: progress.completed, total: progress.total })}
          </div>
          <progress
            className="progress progress-primary w-full"
            value={progress.completed}
            max={progress.total}
          />
        </div>
      )}

      <InstrumentsSummary instrumentOptions={instrumentOptions} />
    </Modal>
  )
}
