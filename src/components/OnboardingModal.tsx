/**
 * Onboarding Modal Component
 * Shows after first social login to collect instrument & genre preferences
 */

import React, {useState} from 'react'
import {useAuth} from '../hooks'
import {INSTRUMENTS} from '../lib/instruments'
import {useTranslation} from 'react-i18next'
import type {MusicianLevel} from '../types/api.types'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

const SKILL_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL']

/**
 * Check if a name looks like an email prefix (not a real name)
 */
const isEmailPrefix = (name: string): boolean => {
  if (!name) return false
  // Email prefixes often contain: underscore, dots, numbers, or are all lowercase
  return name.includes('_') || name.includes('@') || /^\d+$/.test(name) || /^[a-z0-9.]+$/.test(name)
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { t } = useTranslation()
  const { user, completeOnboarding, clearNewUserFlag } = useAuth()
  // Don't prefill if name looks like an email prefix
  const initialName = user?.name && !isEmailPrefix(user.name) ? user.name : ''
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(user?.phone || '')
  const [instrument, setInstrument] = useState('')
  const [level, setLevel] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Format phone number with Brazilian mask: (XX) XXXXX-XXXX
   * @param value - Raw phone number string
   * @returns Formatted phone number
   */
  const formatBrazilianPhone = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '')

    // Apply mask: (XX) XXXXX-XXXX
    if (digits.length === 0) return ''
    if (digits.length <= 2) return `(${digits}`
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBrazilianPhone(e.target.value)
    setPhone(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Name is required
    if (!name.trim()) {
      setError(t('profile.name_required'))
      return
    }

    // Phone is required (minimum 14 chars for Brazilian format)
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setError(t('jams.onboarding.phone_required'))
      return
    }

    // Instrument and skill level are required
    if (!instrument) {
      setError(t('jams.onboarding.instrument_required'))
      return
    }

    if (!level) {
      setError(t('jams.onboarding.level_required'))
      return
    }

    setIsLoading(true)

    try {
      // Update profile with instrument, level, and optional name/phone
      const result = await completeOnboarding(instrument, level as MusicianLevel, { name: name.trim(), phone })

      if (result.success) {
        onClose()
      } else {
        // Check for duplicate phone error
        const errorMsg = result.error || ''
        if (errorMsg.toLowerCase().includes('telefone') && errorMsg.toLowerCase().includes('already exists')) {
          setError(t('jams.onboarding.phone_duplicate'))
        } else {
          setError(result.error || t('profile.update_failed'))
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic_error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    clearNewUserFlag()
    onClose()
  }

  if (!isOpen) return null

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        {/* Header */}
        <h3 className="font-bold text-lg mb-2">
          {t('jams.onboarding.welcome_title')}
        </h3>
        <p className="text-base-content/70 mb-6">
          {t('jams.onboarding.welcome_desc')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field - Required */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">{t('jams.onboarding.name_label')} <span className="text-error">*</span></span>
            </label>
            <input
              type="text"
              placeholder={t('jams.onboarding.name_placeholder')}
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Phone Field - Required */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">{t('jams.onboarding.phone_label')} <span className="text-error">*</span></span>
            </label>
            <input
              type="tel"
              placeholder="(XX) XXXXX-XXXX"
              className="input input-bordered w-full"
              value={phone}
              onChange={handlePhoneChange}
              disabled={isLoading}
              maxLength={15}
              required
            />
          </div>

          {/* Instrument Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">{t('jams.onboarding.instrument_q')} <span className="text-error">*</span></span>
            </label>
            <select
              className="select select-bordered w-full"
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              disabled={isLoading}
            >
              <option value="">{t('jams.onboarding.instrument_choose')}</option>
              {INSTRUMENTS.map((inst) => (
                <option key={inst} value={inst}>
                  {t(`schedule.instruments.${inst}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Skill Level Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">{t('jams.onboarding.level_q')} <span className="text-error">*</span></span>
            </label>
            <select
              className="select select-bordered w-full"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              disabled={isLoading}
            >
              <option value="">{t('jams.onboarding.level_choose')}</option>
              {SKILL_LEVELS.map((lv) => (
                <option key={lv} value={lv}>
                  {t(`schedule.levels.${lv}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="modal-action">
          {/*  <button*/}
          {/*    type="button"*/}
          {/*    className="btn btn-ghost"*/}
          {/*    onClick={handleSkip}*/}
          {/*    disabled={isLoading}*/}
          {/*  >*/}
          {/*    Skip for now*/}
          {/*  </button>*/}
            <button
              type="submit"
              className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
              disabled={isLoading || !name.trim() || phone.replace(/\D/g, '').length < 10 || !instrument || !level}
            >
              {isLoading ? t('common.saving') : t('jams.onboarding.get_started')}
            </button>
          </div>
        </form>
      </div>

      {/* Non-clickable backdrop */}
      <div className="modal-backdrop bg-black/50" />
    </dialog>
  )
}



