/**
 * Schedule Enrollment Modal Component
 * Modal for musicians to enroll into a specific schedule
 */

import type {ScheduleResponseDto} from '../../types/api.types'
import type {JamParticipationOutcome} from '../../lib/jam-participation/jamParticipationController'
import {useFormState} from '../../hooks'
import {useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {getInstrumentOptions} from '../../utils/scheduleUtils'
import {normalizeInstrument} from '../../utils/musicianUtils'
import {ScheduleDetailsCard} from './ScheduleDetailsCard'
import {Alert} from '../Alert'
import {Action} from '../Action'
import {InstrumentsSummary} from './InstrumentsSummary'
import {Modal} from '../Modal'
import {ModalFooter} from '../ModalFooter'

interface ScheduleEnrollmentModalProps {
  schedule: ScheduleResponseDto
  isOpen: boolean
  musicianId?: string | null
  preferredInstrument?: string | null
  onClose: () => void
  onSubmit: (instrument: string) => Promise<JamParticipationOutcome>
}

export function ScheduleEnrollmentModal({
                                            schedule, isOpen, musicianId, preferredInstrument, onClose, onSubmit,
                                        }: ScheduleEnrollmentModalProps) {
    const { t } = useTranslation()
    const [selectedInstrument, setSelectedInstrument] = useState('')
    const { error, setError, isLoading: enrollLoading, setIsLoading: setEnrollLoading } = useFormState({ navigateOnSuccess: false })

    const instrumentOptions = useMemo(() => getInstrumentOptions(schedule, (key) => {
        const instrumentKeyMap: Record<string, string> = {
            drums: t('schedule.instruments.drums'),
            guitars: t('schedule.instruments.guitars'),
            vocals: t('schedule.instruments.vocals'),
            bass: t('schedule.instruments.bass'),
            keys: t('schedule.instruments.keys'),
        }
        return instrumentKeyMap[key] || key
    }), [schedule, t])
    const registeredInstruments = useMemo(() => new Set(
      (schedule.registrations ?? [])
        .filter((registration) => registration.musicianId === musicianId || registration.musician?.id === musicianId)
        .map((registration) => normalizeInstrument(registration.instrument ?? '')),
    ), [musicianId, schedule.registrations])

    useEffect(() => {
      if (!isOpen) return

      const normalizedPreference = preferredInstrument
        ? normalizeInstrument(preferredInstrument)
        : ''
      const preferredOption = instrumentOptions.find(({key, needed, registered}) =>
        key === normalizedPreference
        && !registeredInstruments.has(key)
        && (needed === -1 || registered < needed)
      )

      setSelectedInstrument(preferredOption?.key ?? '')
    }, [instrumentOptions, isOpen, preferredInstrument, registeredInstruments, schedule.id])

  const handleEnroll = async () => {
    if (!selectedInstrument) {
      setError(t('errors.please_select_instrument'))
      return
    }

    setEnrollLoading(true)
    setError(null)

    try {
      const outcome = await onSubmit(selectedInstrument)
      if (outcome.code === 'failure' || outcome.code === 'refresh_failure') {
        setError(outcome.error.message || t('errors.failed_to_enroll'))
      }
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

        {/* Instrument choice is a visible set of options, not a dropdown whose
            contents the Musician must inspect one item at a time. */}
        <fieldset className="mb-4" disabled={enrollLoading}>
          <legend className="mb-2 text-sm font-semibold text-base-content">
            {t('schedule.select_your_instrument')}
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {instrumentOptions.map((option) => {
              const isUnlimited = option.needed === -1
              const remaining = isUnlimited ? Infinity : option.needed - option.registered
              const isFull = !isUnlimited && remaining <= 0
              const isAlreadyRegistered = registeredInstruments.has(option.key)
              const isUnavailable = isFull || isAlreadyRegistered
              const detail = isAlreadyRegistered
                ? t('schedule.already_registered')
                : isFull
                  ? t('schedule.full_parentheses')
                  : isUnlimited
                    ? t('schedule.any_instrument_welcome')
                    : t('schedule.needed_count_parentheses', {count: remaining})

              return (
                <Action
                  key={option.key}
                  type="button"
                  variant={selectedInstrument === option.key ? 'primary' : 'secondary'}
                  state={isUnavailable || enrollLoading ? 'disabled' : 'idle'}
                  aria-pressed={selectedInstrument === option.key}
                  onClick={() => setSelectedInstrument(option.key)}
                  className="min-w-0 justify-start text-left"
                >
                  <span aria-hidden="true">{option.emoji}</span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{option.label}</span>
                    <span className="block text-xs opacity-75">{detail}</span>
                  </span>
                </Action>
              )
            })}
          </div>
        </fieldset>

        <InstrumentsSummary instrumentOptions={instrumentOptions} />
      </Modal>
    )
}
