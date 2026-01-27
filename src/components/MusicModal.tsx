/**
 * Music Modal Component (Add/Edit/Suggest)
 * Extracted from MusicPage for reuse and separation of concerns
 */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { musicService } from '../services'
import type { CreateMusicDto, MusicResponseDto, UpdateMusicDto } from '../types/api.types'
import { MusicModalFormFields } from './MusicModalFormFields'
import { isDuplicate as checkDuplicate, parseDuration } from '../lib/musicUtils'

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
    genre: music?.genre || '',
    duration: music?.duration
      ? `${Math.floor(music.duration / 60)}:${String(music.duration % 60).padStart(2, '0')}`
      : '',
    neededDrums: music?.neededDrums || 0,
    neededGuitars: music?.neededGuitars || 0,
    neededVocals: music?.neededVocals || 0,
    neededBass: music?.neededBass || 0,
    neededKeys: music?.neededKeys || 0,
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
    if (!formData.genre) {
      setError(t('music_library.validation.genre_required'))
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
        genre: formData.genre,
        duration: durationInSeconds || undefined,
        status,
        neededDrums: formData.neededDrums,
        neededGuitars: formData.neededGuitars,
        neededVocals: formData.neededVocals,
        neededBass: formData.neededBass,
        neededKeys: formData.neededKeys,
      }

      if (mode === 'add') {
        const result = await musicService.create(payload as CreateMusicDto)
        if (!result.success) {
          setError(result.error ||t('music_library.errors.failed_to_add'))
          return
        }
        setSuccess(t('music_library.feedback.add_success', { title: formData.title }))
      } else if (mode === 'suggest') {
        const result = await musicService.create(payload as CreateMusicDto)
        if (!result.success) {
          setError(result.error ||t('music_library.errors.failed_to_suggest'))
          return
        }
        setSuccess(t('music_library.feedback.suggest_success', { title: formData.title }))
      } else if (music) {
        const result = await musicService.update(music.id, payload as UpdateMusicDto)
        if (!result.success) {
          setError(result.error ||t('music_library.errors.failed_to_update'))
          return
        }
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
    <dialog className="modal modal-open" aria-labelledby="music-modal-title">
      <div className="modal-box max-w-lg">
        <h3 id="music-modal-title" className="font-bold text-lg mb-4">
          {getModalTitle()}
        </h3>

        <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-4">
          <MusicModalFormFields formData={formData} onChange={handleFieldChange} />

          <div className="modal-action">
            <button type="button" onClick={onClose} className="btn btn-ghost" disabled={submitting}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting && <span className="loading loading-spinner loading-sm" />}
              {getSubmitLabel()}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>
          {t('common.close')}
        </button>
      </form>
    </dialog>
  )
}
