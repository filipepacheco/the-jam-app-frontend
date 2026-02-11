/**
 * Schedule Enrollment Modal Component
 * Modal for musicians to enroll into a specific schedule
 */

import type {ScheduleResponseDto} from '../../types/api.types'
import {registrationService} from '../../services'
import {useAuth, useFormState} from '../../hooks'
import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {getInstrumentOptions} from '../../utils/scheduleUtils'
import {ScheduleDetailsCard} from './ScheduleDetailsCard'
import {Alert} from '../Alert'
import {InstrumentsSummary} from './InstrumentsSummary'
import {Modal} from '../Modal'
import {ModalFooter} from '../ModalFooter'

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
    const { error, setError, isLoading: enrollLoading, setIsLoading: setEnrollLoading } = useFormState({ navigateOnSuccess: false })

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
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('schedule.enroll_title')}
        size="sm"
        footer={
          <ModalFooter
            onCancel={onClose}
            onSubmit={handleEnroll}
            submitLabel={enrollLoading ? t('schedule.enrolling') : t('schedule.enroll_now')}
            submitting={enrollLoading}
            submitDisabled={!selectedInstrument}
          />
        }
      >
        <ScheduleDetailsCard schedule={schedule} />
        <Alert type="error" message={error} />

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
              // -1 means unlimited (no requirements defined)
              const isUnlimited = option.needed === -1
              const remaining = isUnlimited ? Infinity : option.needed - option.registered
              const isFull = !isUnlimited && remaining <= 0
              return (<option key={option.key} value={option.key} disabled={isFull}>
                {option.emoji} {option.label} {isFull ? t('schedule.full_parentheses') : isUnlimited ? '' : t('schedule.needed_count_parentheses', { count: remaining })}
              </option>)
            })}
          </select>
        </div>

        <InstrumentsSummary instrumentOptions={instrumentOptions} />
      </Modal>
    )
}
