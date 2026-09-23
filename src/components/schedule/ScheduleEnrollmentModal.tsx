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
import {activeRegistrations, normalizeInstrument} from '../../utils/musicianUtils'
import {translationKey} from '../../lib/i18n/translationKeys'
import {ScheduleDetailsCard} from './ScheduleDetailsCard'
import {Alert} from '../Alert'
import {Action} from '../Action'
import {Modal} from '../Modal'
import {ModalFooter} from '../ModalFooter'

interface ScheduleEnrollmentModalProps {
  schedule: ScheduleResponseDto
  isOpen: boolean
  musicianId?: string | null
  preferredInstrument?: string | null
  onClose: () => void
  onSubmit: (instrument: string) => Promise<JamParticipationOutcome>
  onWithdraw?: (registrationId: string) => Promise<JamParticipationOutcome>
}

export function ScheduleEnrollmentModal({
                                            schedule, isOpen, musicianId, preferredInstrument, onClose, onSubmit, onWithdraw,
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
      activeRegistrations(schedule.registrations)
        .filter((registration) => registration.musicianId === musicianId || registration.musician?.id === musicianId)
        .map((registration) => normalizeInstrument(registration.instrument ?? '')),
    ), [musicianId, schedule.registrations])
    const ownRegistrations = useMemo(() => activeRegistrations(schedule.registrations).filter(
      (registration) => registration.musicianId === musicianId || registration.musician?.id === musicianId,
    ), [musicianId, schedule.registrations])
    const withdrawnInstruments = useMemo(() => new Set(
      (schedule.registrations ?? [])
        .filter((registration) => registration.status?.toUpperCase() === 'WITHDRAWN'
          && (registration.musicianId === musicianId || registration.musician?.id === musicianId))
        .map((registration) => normalizeInstrument(registration.instrument)),
    ), [musicianId, schedule.registrations])

    useEffect(() => {
      if (!isOpen) return

      const normalizedPreference = preferredInstrument
        ? normalizeInstrument(preferredInstrument)
        : ''
      const preferredOption = instrumentOptions.find(({key, needed, registered}) =>
        key === normalizedPreference
        && !registeredInstruments.has(key)
        && (needed === -1 || registered < needed || withdrawnInstruments.has(key))
      )

      setSelectedInstrument(preferredOption?.key ?? '')
    }, [instrumentOptions, isOpen, preferredInstrument, registeredInstruments, withdrawnInstruments, schedule.id])

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

  const handleWithdraw = async (registrationId: string) => {
    if (!onWithdraw) return
    setEnrollLoading(true)
    setError(null)
    try {
      const outcome = await onWithdraw(registrationId)
      if (outcome.code === 'failure' || outcome.code === 'refresh_failure') {
        setError(outcome.error.message || t('registration.withdraw_failed'))
      } else if (outcome.code !== 'success') {
        setError(t('registration.withdraw_failed'))
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('registration.withdraw_failed'))
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
        responsive
        scrollable
        footer={
          <ModalFooter
            onCancel={onClose}
            onSubmit={() => void handleEnroll()}
            submitLabel={enrollLoading ? t('schedule.enrolling') : t('schedule.enroll_now')}
            submitting={enrollLoading}
            submitDisabled={!selectedInstrument}
          />
        }
      >
        <ScheduleDetailsCard schedule={schedule} />
        <Alert type="error" message={error} />
        {onWithdraw && ownRegistrations.length > 0 && (
          <section className="mb-4 min-w-0" aria-label={t('registration.your_registrations')}>
            <p className="mb-2 text-sm font-semibold text-base-content">{t('registration.your_registrations')}</p>
            <div className="space-y-2">
              {ownRegistrations.map((registration) => (
                <div key={registration.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg bg-base-200 p-2">
                  <span className="min-w-0 ds-wrap-user-content text-sm text-base-content">
                    {t(translationKey('schedule.instruments', normalizeInstrument(registration.instrument)))}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline btn-error min-h-11 h-auto max-w-full whitespace-normal text-center"
                    disabled={enrollLoading}
                    onClick={() => void handleWithdraw(registration.id)}
                    aria-label={t('registration.withdraw_instrument', {instrument: registration.instrument})}
                  >
                    {t('registration.withdraw')}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Instrument choice is a visible set of options, not a dropdown whose
            contents the Musician must inspect one item at a time. */}
        <fieldset disabled={enrollLoading}>
          <legend className="mb-2 text-sm font-semibold text-base-content">
            {t('schedule.select_your_instrument')}
          </legend>
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2">
            {instrumentOptions.map((option) => {
              const isUnlimited = option.needed === -1
              const remaining = isUnlimited ? Infinity : option.needed - option.registered
              const isFull = !isUnlimited && remaining <= 0
              const isAlreadyRegistered = registeredInstruments.has(option.key)
              const isRestorable = withdrawnInstruments.has(option.key)
              const isUnavailable = (isFull && !isRestorable) || isAlreadyRegistered
              const unavailableReason = isAlreadyRegistered
                ? t('schedule.already_registered')
                : isRestorable
                  ? t('schedule.rejoin')
                  : isFull
                  ? t('schedule.full_parentheses')
                  : null

              return (
                <Action
                  key={option.key}
                  type="button"
                  variant={selectedInstrument === option.key ? 'primary' : 'secondary'}
                  state={isUnavailable || enrollLoading ? 'disabled' : 'idle'}
                  aria-pressed={selectedInstrument === option.key}
                  onClick={() => setSelectedInstrument(option.key)}
                  className="min-h-12 min-w-0 h-auto justify-start whitespace-normal px-3 py-2.5 text-left"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span aria-hidden="true" className="shrink-0">{option.emoji}</span>
                    <span className="min-w-0 ds-wrap-user-content leading-tight">
                      <span className="block font-semibold">{option.label}</span>
                      {unavailableReason ? (
                        <span className="mt-0.5 block text-xs opacity-75">{unavailableReason}</span>
                      ) : null}
                    </span>
                  </span>
                </Action>
              )
            })}
          </div>
        </fieldset>
      </Modal>
    )
}
