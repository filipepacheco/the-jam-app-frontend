/**
 * Onboarding Modal Component
 * Shows after first social login to collect instrument & genre preferences
 */

import React, {useState} from 'react'
import {useAuth, useFormState} from '../hooks'
import {INSTRUMENTS} from '../lib/instruments'
import {translationKey} from '../lib/i18n/translationKeys'
import {useTranslation} from 'react-i18next'
import type {MusicianLevel} from '../types/api.types'
import {Alert} from './Alert'
import {Modal} from './Modal'
import {Action} from './Action'
import {Field} from './Field'

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
  const { user, completeOnboarding } = useAuth()
  // Don't prefill if name looks like an email prefix
  const initialName = user?.name && !isEmailPrefix(user.name) ? user.name : ''
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(user?.phone || '')
  const [instrument, setInstrument] = useState('')
  const [level, setLevel] = useState('')
  const { error, setError, isLoading, setIsLoading } = useFormState({ navigateOnSuccess: false })

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

  if (!isOpen) return null

  const canSubmit = !isLoading && name.trim() && phone.replace(/\D/g, '').length >= 10 && instrument && level

  return (
    // Modal.tsx stays the wrapper here (not OverlayModal): it is shared by
    // many out-of-scope consumers, so swapping only this usage would change
    // its focus-trap and dismissal implementation without a review of
    // Modal.tsx's other consumers. See docs/design-system/
    // schedule-registration-migration.md for the same precedent.
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('jams.onboarding.welcome_title')}
      closeDisabled={true}
      footer={
        isLoading ? (
          <Action variant="primary" state="loading" loadingLabel={t('common.saving')}>
            <Action.Label>{t('jams.onboarding.get_started')}</Action.Label>
          </Action>
        ) : (
          <Action
            variant="primary"
            state={canSubmit ? 'idle' : 'disabled'}
            onClick={() => {
              const syntheticEvent = { preventDefault: () => {} } as React.FormEvent
              void handleSubmit(syntheticEvent)
            }}
          >
            <Action.Label>{t('jams.onboarding.get_started')}</Action.Label>
          </Action>
        )
      }
    >
      <p className="text-base-content/70 mb-6">
        {t('jams.onboarding.welcome_desc')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field - Required */}
        <Field id="onboarding-name" label={t('jams.onboarding.name_label')} required requiredLabel={t('common.required')} disabled={isLoading}>
          <Field.Input
            type="text"
            placeholder={t('jams.onboarding.name_placeholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        {/* Phone Field - Required */}
        <Field id="onboarding-phone" label={t('jams.onboarding.phone_label')} required requiredLabel={t('common.required')} disabled={isLoading}>
          <Field.Input
            type="tel"
            placeholder="(XX) XXXXX-XXXX"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={15}
          />
        </Field>

        {/* Instrument Selection */}
        <Field id="onboarding-instrument" label={t('jams.onboarding.instrument_q')} required requiredLabel={t('common.required')} disabled={isLoading}>
          <Field.Select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
          >
            <option value="">{t('jams.onboarding.instrument_choose')}</option>
            {INSTRUMENTS.map((inst) => (
              <option key={inst} value={inst}>
                {t(translationKey('schedule.instruments', inst))}
              </option>
            ))}
          </Field.Select>
        </Field>

        {/* Skill Level Selection */}
        <Field id="onboarding-level" label={t('jams.onboarding.level_q')} required requiredLabel={t('common.required')} disabled={isLoading}>
          <Field.Select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option value="">{t('jams.onboarding.level_choose')}</option>
            {SKILL_LEVELS.map((lv) => (
              <option key={lv} value={lv}>
                {t(translationKey('schedule.levels', lv))}
              </option>
            ))}
          </Field.Select>
        </Field>

        {/* Error Alert */}
        <Alert type="error" message={error} />

        {/* Hidden submit button for form Enter key submission */}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
