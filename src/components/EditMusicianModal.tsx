/**
 * Edit Musician
 * Modal form for editing musician details
 */

import React, {useState} from 'react'
import type {MusicianLevel, MusicianResponseDto} from '../types/api.types'
import {useFormState} from '../hooks'
import {useTranslation} from 'react-i18next'
import {INSTRUMENTS} from '../lib/instruments'
import {Alert} from './Alert'
import {Modal} from './Modal'
import {ModalFooter} from './ModalFooter'

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
  })

  const { error, setError, isLoading, setIsLoading } = useFormState({ navigateOnSuccess: false })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      footer={
        <ModalFooter
          onCancel={onClose}
          onSubmit={() => {
            const syntheticEvent = { preventDefault: () => {} } as React.FormEvent
            void handleSubmit(syntheticEvent)
          }}
          submitLabel={isLoading ? t('common.saving') : t('common.save_changes')}
          submitting={isLoading}
        />
      }
    >
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Musician ID (read-only) */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">{t('musician_form.musician_id')}</span>
          </label>
          <input
            type="text"
            value={musician.id}
            disabled
            className="input input-bordered input-disabled"
          />
        </div>

        {/* Name */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">{t('musician_form.name_label')}</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="input input-bordered"
            placeholder={t('musician_form.name_placeholder')}
            disabled={isLoading}
          />
        </div>

        {/* Instrument */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">{t('musician_form.instrument_label')}</span>
          </label>
          <select
            name="instrument"
            value={formData.instrument}
            onChange={handleInputChange}
            className="select select-bordered"
            disabled={isLoading}
          >
            <option value="">{t('musician_form.instrument_placeholder')}</option>
            {INSTRUMENTS.map((inst) => (
              <option key={inst} value={inst}>
                {t(`schedule.instruments.${inst}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Level */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">{t('schedule.levels.experience_level')}</span>
          </label>
          <select
            name="level"
            value={formData.level}
            onChange={handleInputChange}
            className="select select-bordered"
            disabled={isLoading}
          >
            <option value="BEGINNER">{t('schedule.levels.beginner')}</option>
            <option value="INTERMEDIATE">{t('schedule.levels.intermediate')}</option>
            <option value="ADVANCED">{t('schedule.levels.advanced')}</option>
            <option value="PROFESSIONAL">{t('schedule.levels.professional')}</option>
          </select>
        </div>

        {/* Contact */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">{t('musician_form.contact_label')}</span>
          </label>
          <input
            type="text"
            name="contact"
            value={formData.contact}
            onChange={handleInputChange}
            className="input input-bordered"
            placeholder={t('musician_form.contact_placeholder')}
            disabled={isLoading}
          />
        </div>

        {/* Phone */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">{t('musician_form.phone_label')}</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="input input-bordered"
            placeholder={t('musician_form.phone_placeholder')}
            disabled={isLoading}
          />
        </div>

        {/* Error Alert */}
        <Alert type="error" message={error} />

        {/* Hidden submit button for form Enter key submission */}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
