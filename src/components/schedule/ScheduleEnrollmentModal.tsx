/**
 * Schedule Enrollment Modal Component
 * Modal for musicians to enroll into a specific schedule
 */

import type {ScheduleResponseDto} from '../../types/api.types'
import {registrationService} from '../../services'
import {useAuth} from '../../hooks'
import {useState, useRef, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {getInstrumentOptions} from '../../utils/scheduleUtils'
import {ScheduleDetailsCard} from './ScheduleDetailsCard'
import {ErrorAlert} from './ErrorAlert'
import {InstrumentsSummary} from './InstrumentsSummary'

interface ScheduleEnrollmentModalProps {
  schedule: ScheduleResponseDto
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ScheduleEnrollmentModal({
                                            schedule, isOpen, onClose, onSuccess,
                                        }: ScheduleEnrollmentModalProps) {
    const { t } = useTranslation()
    const { user } = useAuth()
    const [selectedInstrument, setSelectedInstrument] = useState('')
    const [enrollLoading, setEnrollLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const modalRef = useRef<HTMLDivElement>(null)

    // Manage focus within modal
    useEffect(() => {
        if (!isOpen || !modalRef.current) return

        // Focus the first focusable element
        const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        if (firstElement) firstElement.focus()

        // Handle Escape key
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

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
      await registrationService.create({
        musicianId: user.id,
        scheduleId: schedule.id,
        instrument: selectedInstrument,
        jamMusicId: schedule.musicId || '',
      })

      onClose()
      onSuccess()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error.message || t('errors.failed_to_enroll'))
    } finally {
      setEnrollLoading(false)
    }
  }

    if (!isOpen) return null

    return (
      <div className="modal modal-open" ref={modalRef}>
        <div className="modal-box max-w-sm">
                <h3 className="font-bold text-lg mb-4">{t('schedule.enroll_title')}</h3>

                <ScheduleDetailsCard schedule={schedule} />
                <ErrorAlert error={error} />

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
                            return (<option key={option.key} value={option.key} disabled={isFull}>
                                    {option.emoji} {option.label} {isFull ? t('schedule.full_parentheses') : t('schedule.needed_count_parentheses', { count: remaining })}
                                </option>)
                        })}
                    </select>
                </div>

                <InstrumentsSummary instrumentOptions={instrumentOptions} />

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
          <div className="modal-backdrop" onClick={onClose}></div>
        </div>
      </div>
    )
}

