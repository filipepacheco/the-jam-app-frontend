/**
 * Onboarding Modal Component
 * Welcomes new users and offers optional musician profile fields.
 */

import React, {useEffect, useState} from 'react'
import {useAuth, useFormState} from '../hooks'
import {INSTRUMENTS} from '../lib/instruments'
import {translationKey} from '../lib/i18n/translationKeys'
import {useTranslation} from 'react-i18next'
import type {SkillLevel, UpdateProfileDto} from '../types/auth.types'
import {Alert} from './Alert'
import {Modal} from './Modal'
import {Action} from './Action'
import {Field} from './Field'

interface OnboardingModalProps { isOpen: boolean }

const SKILL_LEVELS: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL']

export function OnboardingModal({ isOpen }: OnboardingModalProps) {
  const { t } = useTranslation()
  const { user, updateProfile, clearNewUserFlag } = useAuth()
  const initialName = user?.name || ''
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(user?.phone || '')
  const [instrument, setInstrument] = useState(user?.instrument || '')
  const [level, setLevel] = useState<SkillLevel | ''>(user?.level || '')
  const { error, setError, isLoading, setIsLoading } = useFormState({ navigateOnSuccess: false })

  useEffect(() => {
    if (!isOpen) return
    setName(user?.name || '')
    setPhone(user?.phone || '')
    setInstrument(user?.instrument || '')
    setLevel(user?.level || '')
  }, [isOpen, user?.id, user?.name, user?.phone, user?.instrument, user?.level])

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

    // A provided phone number must be complete, but contact information is optional.
    if (phone && phone.replace(/\D/g, '').length < 10) {
      setError(t('jams.onboarding.phone_invalid'))
      return
    }

    setIsLoading(true)

    try {
      const updates: UpdateProfileDto = {name: name.trim()}
      if (phone) updates.phone = phone
      if (instrument) updates.instrument = instrument
      if (level) updates.level = level
      const result = await updateProfile(updates)

      if (result.success) {
        const completion = await clearNewUserFlag()
        if (!completion.success) {
          setError(completion.errorKey ? t(completion.errorKey) : (completion.error || t('profile.update_failed')))
        }
      } else {
        setError(result.errorKey ? t(result.errorKey) : (result.error || t('profile.update_failed')))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic_error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = async () => {
    setError(null)
    setIsLoading(true)
    try {
      const completion = await clearNewUserFlag()
      if (!completion.success) {
        setError(completion.errorKey ? t(completion.errorKey) : (completion.error || t('profile.update_failed')))
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : t('errors.generic_error'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const canSubmit = !isLoading &&
    name.trim() &&
    (!phone || phone.replace(/\D/g, '').length >= 10)

  return (
    // Modal.tsx stays the wrapper here (not OverlayModal): it is shared by
    // many out-of-scope consumers, so swapping only this usage would change
    // its focus-trap and dismissal implementation without a review of
    // Modal.tsx's other consumers. See docs/design-system/
    // schedule-registration-migration.md for the same precedent.
    <Modal
      isOpen={isOpen}
      onClose={() => undefined}
      title={t('jams.onboarding.welcome_title')}
      closeDisabled={true}
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2 pb-[env(safe-area-inset-bottom)]">
          <Action variant="quiet" state={isLoading ? 'disabled' : 'idle'} onClick={() => void handleSkip()}>
            <Action.Label>{t('jams.onboarding.skip')}</Action.Label>
          </Action>
          {isLoading ? (
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
          )}
        </div>
      }
    >
      <p className="text-base-content/70 mb-6">
        {t('jams.onboarding.welcome_desc')}
      </p>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        {/* Name Field - Required */}
        <Field id="onboarding-name" label={t('jams.onboarding.name_label')} required requiredLabel={t('common.required')} disabled={isLoading}>
          <Field.Input
            type="text"
            placeholder={t('jams.onboarding.name_placeholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        {/* Phone Field - Optional */}
        <Field id="onboarding-phone" label={t('jams.onboarding.phone_optional_label')} disabled={isLoading}>
          <Field.Input
            type="tel"
            placeholder="(XX) XXXXX-XXXX"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={15}
          />
        </Field>

        {/* Instrument Selection */}
        <Field id="onboarding-instrument" label={t('jams.onboarding.instrument_q')} disabled={isLoading}>
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
        <Field id="onboarding-level" label={t('jams.onboarding.level_q')} disabled={isLoading}>
          <Field.Select
            value={level}
            onChange={(e) => setLevel(e.target.value as SkillLevel | '')}
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
