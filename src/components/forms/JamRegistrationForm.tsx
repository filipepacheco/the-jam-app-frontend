/**
 * Jam Registration Form Component
 * Form for registering to a jam with specialty and level selection
 */

import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {ErrorAlert, SuccessAlert} from '../index'
import type {JamDetails} from '../../services'
import {useTranslation} from 'react-i18next'

export const MUSIC_LEVELS = ['beginner', 'intermediate', 'advanced', 'professional'] as const

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
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Get available specialties
  const availableSpecialties = jam.specialtySlots
    ? jam.specialtySlots.filter((s) => s.required > s.registered)
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!specialty) {
      setError(t('errors.please_select_instrument'))
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
      setSuccess(true)

      // Show success for 2 seconds then redirect
      setTimeout(() => {
        navigate(`/jams/${jam.id}/my-status`)
      }, 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('errors.generic_error')
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="card bg-base-200">
        <div className="card-body">
          <SuccessAlert
            message={t('jams.registration_pending_approval')}
            title={t('jams.registration_successful_title')}
          />
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
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">{t('schedule.select_instrument')}</span>
            </label>
            {availableSpecialties.length > 0 ? (
              <select
                className="select select-bordered"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                disabled={isLoading}
              >
                <option value="">{t('schedule.choose_instrument')}</option>
                {availableSpecialties.map((slot) => (
                  <option key={slot.specialty} value={slot.specialty}>
                    {slot.specialty} ({t('schedule.slots_available_dynamic', { count: Math.max(0, slot.required - slot.registered) })})
                  </option>
                ))}
              </select>
            ) : (
              <div className="alert alert-warning">
                <span>{t('jams.no_specialties_available')}</span>
              </div>
            )}
          </div>

          {/* Level Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">{t('schedule.levels.experience_level')}</span>
              <span className="label-text-alt text-xs text-base-content/60">{t('common.optional')}</span>
            </label>
            <select
              className="select select-bordered"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              disabled={isLoading}
            >
              <option value="">{t('schedule.choose_level')}</option>
              {MUSIC_LEVELS.map((lv) => (
                <option key={lv} value={lv}>
                  {t(`schedule.levels.${lv}`)}
                </option>
              ))}
            </select>
          </div>

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
          {error && (
            <ErrorAlert message={error} title={t('errors.registration_error_title')} />
          )}

          {/* Buttons */}
          <div className="flex gap-2 mt-6">
            <button
              type="button"
              className="btn btn-ghost flex-1"
              onClick={() => navigate(`/jams/${jam.id}`)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className={`btn btn-primary flex-1 ${isLoading ? 'loading' : ''}`}
              disabled={isLoading || !specialty || !agreeToTerms || availableSpecialties.length === 0}
            >
              {isLoading ? t('jams.registering') : t('jams.join_this_jam')}
            </button>
          </div>

          {/* Info */}
          <p className="text-xs text-base-content/60 text-center mt-4">
            {t('jams.manage_registrations_hint')}
          </p>
        </form>
      </div>
    </div>
  )
}

export default JamRegistrationForm

