/**
 * Profile Setup Modal Component
 * Shows after first login to collect profile information: name, instrument, level, and optional contact
 * This replaces/extends the OnboardingModal to include name field
 */

import {useState} from 'react'
import {useAuth} from '../hooks'
import {INSTRUMENTS} from '../lib/instruments'
import {useTranslation} from 'react-i18next'

interface ProfileSetupModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileSetupModal({ isOpen, onClose }: ProfileSetupModalProps) {
  const { t } = useTranslation()
  const { user, updateProfile, clearNewUserFlag } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [instrument, setInstrument] = useState('')
  const [level, setLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL' | ''>('')
  const [contact, setContact] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const levels: Array<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL'> = [
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED',
    'PROFESSIONAL',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Name is required
    if (!name.trim()) {
      setError(t('profile.name_required'))
      return
    }

    // At least instrument or level should be provided
    if (!instrument && !level) {
      setError(t('jams.profile_setup.instrument_level_error'))
      return
    }

    setIsLoading(true)

    try {
      const updates: Record<string, string> = { name: name.trim() }
      if (instrument) updates.instrument = instrument
      if (level) updates.level = level
      if (contact) updates.contact = contact

      const result = await updateProfile(updates as Parameters<typeof updateProfile>[0])

      if (result.success) {
        clearNewUserFlag()
        onClose()
      } else {
        setError(result.error || t('profile.update_failed'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic_error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    // Skip without saving - user can complete later
    clearNewUserFlag()
    onClose()
  }

  if (!isOpen) return null

  return (
    <dialog className="modal modal-open">
      <div className="modal-box w-full max-w-md">
        {/* Header */}
        <h3 className="font-bold text-lg mb-2">
          {t('jams.profile_setup.title')}
        </h3>
        <p className="text-base-content/70 mb-6">
          {t('jams.profile_setup.desc')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field - Required */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">{t('jams.profile_setup.name_label')}</span>
            </label>
            <input
              type="text"
              placeholder={t('jams.profile_setup.name_placeholder')}
              className="input input-bordered"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Instrument Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">{t('jams.profile_setup.instrument_label')}</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              disabled={isLoading}
            >
              <option value="">{t('jams.profile_setup.instrument_choose')}</option>
              {INSTRUMENTS.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>

          {/* Level Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">{t('jams.profile_setup.level_label')}</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={level}
              onChange={(e) => setLevel(e.target.value as typeof level)}
              disabled={isLoading}
            >
              <option value="">{t('jams.profile_setup.level_choose')}</option>
              {levels.map((lv) => (
                <option key={lv} value={lv}>
                  {t(`schedule.levels.${lv.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Contact Field - Optional */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">{t('jams.profile_setup.contact_label')}</span>
            </label>
            <input
              type="text"
              placeholder={t('jams.profile_setup.contact_placeholder')}
              className="input input-bordered"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Error Alert */}
          {error && (
            <div role="alert" className="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="modal-action mt-6">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleSkip}
              disabled={isLoading}
            >
              {t('jams.onboarding.skip')}
            </button>
            <button
              type="submit"
              className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? t('musician_form.saving') : t('jams.profile_setup.save_btn')}
            </button>
          </div>
        </form>
      </div>

      {/* Backdrop - prevent closing by clicking outside */}
      <form method="dialog" className="modal-backdrop">
        <button disabled={isLoading}>{t('common.close')}</button>
      </form>
    </dialog>
  )
}

export default ProfileSetupModal

