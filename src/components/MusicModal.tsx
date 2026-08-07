/**
 * Music Modal Component (Add/Edit/Suggest)
 * Responsive modal with scrollable content and fixed footer
 */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { musicService } from '../services'
import type { CreateMusicDto, MusicResponseDto, UpdateMusicDto } from '../types/api.types'
import { MusicModalFormFields } from './MusicModalFormFields'
import { isDuplicate as checkDuplicate, parseDuration } from '../lib/musicUtils'
import { Modal } from './Modal'

interface MusicModalProps {
  mode: 'add' | 'edit' | 'suggest'
  music?: MusicResponseDto
  existingSongs: MusicResponseDto[]
  onClose: () => void
  onSuccess: () => void
  setError: (error: string | null) => void
  setSuccess: (success: string | null) => void
}

export function MusicModal({
  mode,
  music,
  existingSongs,
  onClose,
  onSuccess,
  setError,
  setSuccess,
}: MusicModalProps) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: music?.title || '',
    artist: music?.artist || '',
    description: music?.description || '',
    link: music?.link || '',
    info: music?.info || '',
    genre: music?.genre || '',
    duration: music?.duration
      ? `${Math.floor(music.duration / 60)}:${String(music.duration % 60).padStart(2, '0')}`
      : '',
    neededDrums: music?.neededDrums ?? 1,
    neededGuitars: music?.neededGuitars ?? 2,
    neededVocals: music?.neededVocals ?? 1,
    neededBass: music?.neededBass ?? 1,
    neededKeys: music?.neededKeys ?? 0,
  })

  const handleFieldChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError(t('music_library.validation.title_required'))
      return
    }
    if (!formData.artist.trim()) {
      setError(t('music_library.validation.artist_required'))
      return
    }

    if (mode !== 'edit' && checkDuplicate(existingSongs, formData.title, formData.artist, music?.id)) {
      setError(t('music_library.feedback.duplicate_error', { title: formData.title, artist: formData.artist }))
      return
    }

    const durationInSeconds = formData.duration ? parseDuration(formData.duration) : null
    if (formData.duration && durationInSeconds === null) {
      setError(t('music_library.feedback.invalid_duration'))
      return
    }

    setSubmitting(true)

    try {
      const status: 'APPROVED' | 'SUGGESTED' | undefined =
        mode === 'suggest' ? 'SUGGESTED' : mode === 'add' ? 'APPROVED' : undefined

      const payload: CreateMusicDto | UpdateMusicDto = {
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        description: formData.description.trim() || undefined,
        link: formData.link.trim() || undefined,
        info: formData.info.trim() || undefined,
        genre: formData.genre,
        duration: durationInSeconds || undefined,
        status,
        neededDrums: formData.neededDrums,
        neededGuitars: formData.neededGuitars,
        neededVocals: formData.neededVocals,
        neededBass: formData.neededBass,
        neededKeys: formData.neededKeys,
      }

      // Each call now throws on failure; the catch below surfaces the message.
      if (mode === 'add') {
        await musicService.create(payload as CreateMusicDto)
        setSuccess(t('music_library.feedback.add_success', { title: formData.title }))
      } else if (mode === 'suggest') {
        await musicService.create(payload as CreateMusicDto)
        setSuccess(t('music_library.feedback.suggest_success', { title: formData.title }))
      } else if (music) {
        await musicService.update(music.id, payload as UpdateMusicDto)
        setSuccess(t('music_library.feedback.update_success', { title: formData.title }))
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('music_library.errors.failed_to_add'))
    } finally {
      setSubmitting(false)
    }
  }

  const getModalTitle = () => {
    switch (mode) {
      case 'add':
        return t('music_library.modals.add_title')
      case 'suggest':
        return t('music_library.modals.suggest_title')
      case 'edit':
        return t('music_library.modals.edit_title', { title: music?.title })
      default:
        return ''
    }
  }

  const getSubmitLabel = () => {
    if (submitting) {
      switch (mode) {
        case 'add':
          return t('common.adding')
        case 'suggest':
          return t('common.suggesting')
        case 'edit':
          return t('music_library.modals.updating')
      }
    }
    switch (mode) {
      case 'add':
        return t('music_library.modals.add_btn')
      case 'suggest':
        return t('music_library.modals.suggest_btn')
      case 'edit':
        return t('music_library.modals.update_btn')
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={getModalTitle()}
      size="lg"
      scrollable
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            disabled={submitting}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => {
              const syntheticEvent = { preventDefault: () => {} } as React.FormEvent
              void handleSubmit(syntheticEvent)
            }}
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting && <span className="loading loading-spinner loading-sm mr-2" />}
            {getSubmitLabel()}
          </button>
        </>
      }
    >
      <form onSubmit={(e) => { void handleSubmit(e) }}>
        <MusicModalFormFields formData={formData} onChange={handleFieldChange} />
        {/* Hidden submit button for form Enter key submission */}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
