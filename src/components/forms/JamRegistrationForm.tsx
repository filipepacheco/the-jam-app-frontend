/**
 * Jam Registration Form Component
 * Form for registering to a jam with specialty and level selection
 */

import React, {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {Action, Field, FormSubmissionFeedback} from '../index'
import type {JamDetails} from '../../services'
import {useFormState} from '../../hooks'
import {useTranslation} from 'react-i18next'

export const MUSIC_LEVELS = ['beginner', 'intermediate', 'advanced', 'professional'] as const

function submissionActionState(isLoading: boolean, isUnavailable: boolean, loadingLabel: string) {
  if (isLoading) return { state: 'loading' as const, loadingLabel }
  if (isUnavailable) return { state: 'disabled' as const }
  return { state: 'idle' as const }
}

interface JamRegistrationFormProps {
  jam: JamDetails
  onSubmit?: (specialty: string, level: string) => Promise<void>
  defaultSpecialty?: string | null
}

export function JamRegistrationForm({
  jam,
  onSubmit,
  defaultSpecialty,
}: JamRegistrationFormProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [specialty, setSpecialty] = useState<string>(defaultSpecialty || '')
  const [level, setLevel] = useState<string>('')
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [specialtyError, setSpecialtyError] = useState<string | null>(null)
  const { error, setError, isLoading, setIsLoading, success, setSuccess } = useFormState({ navigateOnSuccess: false })

  // Get available specialties
  const availableSpecialties = jam.specialtySlots
    ? jam.specialtySlots.filter((s) => s.required > s.registered)
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSpecialtyError(null)

    // Validation
    if (!specialty) {
      setSpecialtyError(t('errors.please_select_instrument'))
      return
    }

    if (!agreeToTerms) {
      setError(t('errors.must_agree_terms'))
      return
    }

    setIsLoading(true)

    try {
      if (onSubmit) {
        await onSubmit(specialty, level)
      }
      setSuccess('registered')

      // Show success for 2 seconds then redirect
      setTimeout(() => {
        void navigate(`/jams/${jam.id}/my-status`)
      }, 2000)
    } catch {
      setError(t('errors.generic_error'))
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title text-lg">{t('jams.registration_successful_title')}</h2>
          <FormSubmissionFeedback state="success" message={t('jams.registration_pending_approval')} />
          <p className="text-sm text-base-content/70 mt-4">{t('jams.redirecting')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title text-lg mb-4">{t('jams.register_for_jam_title')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Specialty Selection */}
          <Field
            id="registration-specialty"
            label={t('schedule.select_instrument')}
            required
            requiredLabel={t('common.required')}
            error={specialtyError}
            hint={availableSpecialties.length === 0 ? t('jams.no_specialties_available') : undefined}
            disabled={isLoading || availableSpecialties.length === 0}
          >
            {availableSpecialties.length > 0 ? (
              <Field.Select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                <option value="">{t('schedule.choose_instrument')}</option>
                {availableSpecialties.map((slot) => (
                  <option key={slot.specialty} value={slot.specialty}>
                    {slot.specialty} ({t('schedule.slots_available_dynamic', { count: Math.max(0, slot.required - slot.registered) })})
                  </option>
                ))}
              </Field.Select>
            ) : (
              <Field.Select value="">
                <option>{t('schedule.choose_instrument')}</option>
              </Field.Select>
            )}
          </Field>

          {/* Level Selection */}
          <Field
            id="registration-level"
            label={t('schedule.levels.experience_level')}
            hint={t('common.optional')}
            disabled={isLoading}
          >
            <Field.Select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="">{t('schedule.choose_level')}</option>
              {MUSIC_LEVELS.map((lv) => (
                <option key={lv} value={lv}>
                  {t(`schedule.levels.${lv}`)}
                </option>
              ))}
            </Field.Select>
          </Field>

          {/* Agreement Checkbox */}
          <div className="form-control">
            <label className="label cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                disabled={isLoading}
              />
              <span className="label-text ml-3 text-sm">
                {t('schedule.registration_pending_agreement')}
              </span>
            </label>
          </div>

          {/* Error Alert */}
          {error && <FormSubmissionFeedback state="error" message={error} />}

          {/* Buttons */}
          <div className="flex gap-2 mt-6">
            <Action
              type="button"
              className="flex-1"
              variant="quiet"
              state={isLoading ? 'disabled' : 'idle'}
              onClick={() => { void navigate(`/jams/${jam.id}`) }}
            >
              <Action.Label>{t('common.cancel')}</Action.Label>
            </Action>
            <Action
              type="submit"
              className="flex-1"
              variant="primary"
              aria-describedby="registration-prerequisites"
              {...submissionActionState(
                isLoading,
                !specialty || !agreeToTerms || availableSpecialties.length === 0,
                t('jams.registering'),
              )}
            >
              <Action.Label>{t('jams.join_this_jam')}</Action.Label>
            </Action>
          </div>

          {/* Info */}
          <p className="text-xs text-base-content/60 text-center mt-4" id="registration-prerequisites">
            {t('jams.registration_requirements')}
          </p>
          <p className="text-xs text-base-content/60 text-center">
            {t('jams.manage_registrations_hint')}
          </p>
        </form>
      </div>
    </div>
  )
}
