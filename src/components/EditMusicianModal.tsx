/**
 * Edit Musician
 * Modal form for editing musician details
 */

import React, {useState} from 'react'
import type {MusicianLevel, MusicianResponseDto} from '../types/api.types'
import {useFormState} from '../hooks'
import {useTranslation} from 'react-i18next'
import {INSTRUMENTS} from '../lib/instruments'
import {translationKey} from '../lib/i18n/translationKeys'
import {Action} from './Action'
import {Alert} from './Alert'
import {Modal} from './Modal'
import {Field} from './Field'

interface EditMusicianModalProps {
  musician: MusicianResponseDto
  onSave: (musician: MusicianResponseDto) => void
  onClose: () => void
}

export function EditMusicianModal({ musician, onSave, onClose }: EditMusicianModalProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: musician.name ?? '',
    instrument: musician.instrument ?? '',
    level: (musician.level ?? 'BEGINNER') as MusicianLevel,
    contact: musician.contact ?? '',
    phone: musician.phone ?? '',
    bio: musician.bio ?? '',
    otherInstruments: musician.otherInstruments ?? '',
  })

  const { error, setError, isLoading, setIsLoading } = useFormState({ navigateOnSuccess: false })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    if (!formData.name.trim()) {
      setError(t('musician_form.name_required'))
      return
    }

    if (!formData.instrument.trim()) {
      setError(t('musician_form.instrument_required'))
      return
    }

    if (!formData.contact.trim()) {
      setError(t('musician_form.contact_required'))
      return
    }

    setIsLoading(true)

    try {
      const updatedMusician: MusicianResponseDto = {
        ...musician,
        ...formData,
      }

      onSave(updatedMusician)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('musician_form.failed_to_update'))
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('musician_form.edit_title')}
      size="md"
      scrollable
      responsive
      footer={
        <>
          <Action variant="quiet" onClick={onClose} state={isLoading ? 'disabled' : 'idle'}>
            {t('common.cancel')}
          </Action>
          {isLoading ? (
            <Action state="loading" loadingLabel={t('common.saving')}>
              {t('common.saving')}
            </Action>
          ) : (
            <Action type="submit" form="edit-musician-form">
              {t('common.save_changes')}
            </Action>
          )}
        </>
      }
    >
      <form id="edit-musician-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <Field id="edit-musician-name" label={t('musician_form.name_label')} disabled={isLoading}>
          <Field.Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder={t('musician_form.name_placeholder')}
          />
        </Field>

        {/* Instrument + Level (side by side on sm+) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="edit-musician-instrument" label={t('musician_form.instrument_label')} disabled={isLoading}>
            <Field.Select name="instrument" value={formData.instrument} onChange={handleInputChange}>
              <option value="">{t('musician_form.instrument_placeholder')}</option>
              {INSTRUMENTS.map((inst) => (
                <option key={inst} value={inst}>
                  {t(translationKey('schedule.instruments', inst))}
                </option>
              ))}
            </Field.Select>
          </Field>

          <Field id="edit-musician-level" label={t('schedule.levels.experience_level')} disabled={isLoading}>
            <Field.Select name="level" value={formData.level} onChange={handleInputChange}>
              <option value="BEGINNER">{t('schedule.levels.beginner')}</option>
              <option value="INTERMEDIATE">{t('schedule.levels.intermediate')}</option>
              <option value="ADVANCED">{t('schedule.levels.advanced')}</option>
              <option value="PROFESSIONAL">{t('schedule.levels.professional')}</option>
            </Field.Select>
          </Field>
        </div>

        {/* Contact + Phone (side by side on sm+) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="edit-musician-contact" label={t('musician_form.contact_label')} disabled={isLoading}>
            <Field.Input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleInputChange}
              placeholder={t('musician_form.contact_placeholder')}
            />
          </Field>

          <Field id="edit-musician-phone" label={t('musician_form.phone_label')} disabled={isLoading}>
            <Field.Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder={t('musician_form.phone_placeholder')}
            />
          </Field>
        </div>

        {/* Other Instruments */}
        <Field id="edit-musician-other-instruments" label={t('musician_form.other_instruments_label')} disabled={isLoading}>
          <Field.Input
            type="text"
            name="otherInstruments"
            value={formData.otherInstruments}
            onChange={handleInputChange}
            placeholder={t('musician_form.other_instruments_placeholder')}
            maxLength={200}
          />
        </Field>

        {/* Bio */}
        <Field id="edit-musician-bio" label={t('musician_form.bio_label')} disabled={isLoading}>
          <Field.Textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder={t('musician_form.bio_placeholder')}
            rows={3}
            maxLength={500}
          />
        </Field>

        {/* Error Alert */}
        <Alert type="error" message={error} />

      </form>
    </Modal>
  )
}
