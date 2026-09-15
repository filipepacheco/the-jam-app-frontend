/**
 * Music Modal Component (Add/Edit/Suggest)
 * Responsive modal with scrollable content and fixed footer
 */

import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { musicService, spotifyService } from '../services'
import type { CreateMusicDto, MusicResponseDto, UpdateMusicDto } from '../types/api.types'
import { MusicModalFormFields } from './MusicModalFormFields'
import { isDuplicate as checkDuplicate, parseDuration } from '../lib/musicUtils'
import { formatDuration } from '../lib/formatters'
import { isValidSpotifyTrackUrl } from '../lib/spotifyUtils'
import { Modal } from './Modal'
import { Action } from './Action'
import { Field, FormSubmissionFeedback } from './Field'

interface MusicModalProps {
  mode: 'add' | 'edit' | 'suggest'
  music?: MusicResponseDto
  existingSongs: MusicResponseDto[]
  onClose: () => void
  onSuccess: (music?: MusicResponseDto) => void
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
  const [entryMode, setEntryMode] = useState<'manual' | 'spotify' | null>(mode === 'edit' ? 'manual' : null)
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
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

  const handleSpotifyImport = useCallback(async () => {
    if (!isValidSpotifyTrackUrl(spotifyUrl)) {
      setImportError(t('jams.invalid_spotify_url'))
      return
    }

    setImportLoading(true)
    setImportError(null)
    try {
      const result = await spotifyService.getTrackMetadata(spotifyUrl)

      if (result.success && result.data) {
        setFormData((current) => ({
          ...current,
          title: result.data.title,
          artist: result.data.artist,
          link: result.data.spotifyUrl,
          duration: formatDuration(result.data.durationMs, 'ms'),
        }))
        setImportSuccess(true)
      } else {
        setImportError(result.error || t('jams.spotify_import_error'))
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : t('jams.spotify_import_error'))
    } finally {
      setImportLoading(false)
    }
  }, [spotifyUrl, t])

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

      if (mode === 'add') {
        const result = await musicService.create(payload as CreateMusicDto)
        if (!result.success) {
          setError(result.error || t('music_library.errors.failed_to_add'))
          return
        }
        setSuccess(t('music_library.feedback.add_success', { title: formData.title }))
        onSuccess(result.data)
      } else if (mode === 'suggest') {
        const result = await musicService.create(payload as CreateMusicDto)
        if (!result.success) {
          setError(result.error || t('music_library.errors.failed_to_suggest'))
          return
        }
        setSuccess(t('music_library.feedback.suggest_success', { title: formData.title }))
        onSuccess(result.data)
      } else if (music) {
        const result = await musicService.update(music.id, payload as UpdateMusicDto)
        if (!result.success) {
          setError(result.error || t('music_library.errors.failed_to_update'))
          return
        }
        setSuccess(t('music_library.feedback.update_success', { title: formData.title }))
        onSuccess(result.data)
      }
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

  const showMusicFields = mode === 'edit' || entryMode === 'manual' || importSuccess
  const submitDisabled = !showMusicFields || !formData.title.trim() || !formData.artist.trim()

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={getModalTitle()}
      size="lg"
      scrollable
      footer={
        <>
          <Action
            type="button"
            onClick={onClose}
            variant="quiet"
            state={submitting ? 'disabled' : 'idle'}
          >
            <Action.Label>{t('common.cancel')}</Action.Label>
          </Action>
          {submitting ? (
            <Action type="button" variant="primary" state="loading" loadingLabel={getSubmitLabel()}>
              <Action.Label>{getSubmitLabel()}</Action.Label>
            </Action>
          ) : (
            <Action
              type="button"
              onClick={() => {
                const syntheticEvent = { preventDefault: () => {} } as React.FormEvent
                void handleSubmit(syntheticEvent)
              }}
              variant="primary"
              state={submitDisabled ? 'disabled' : 'idle'}
            >
              <Action.Label>{getSubmitLabel()}</Action.Label>
            </Action>
          )}
        </>
      }
    >
      <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-6">
        {mode !== 'edit' && (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-base-content">
              {t('jams.suggestion_source_title')}
            </legend>
            <p className="mb-3 text-sm text-base-content/70">
              {t('jams.suggestion_source_help')}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Action
                type="button"
                variant={entryMode === 'manual' ? 'primary' : 'secondary'}
                aria-pressed={entryMode === 'manual'}
                onClick={() => {
                  setEntryMode('manual')
                  setImportError(null)
                }}
              >
                {t('jams.suggestion_source_manual')}
              </Action>
              <Action
                type="button"
                variant={entryMode === 'spotify' ? 'primary' : 'secondary'}
                aria-pressed={entryMode === 'spotify'}
                onClick={() => {
                  setEntryMode('spotify')
                  setImportSuccess(false)
                }}
              >
                {t('jams.suggestion_source_spotify')}
              </Action>
            </div>
          </fieldset>
        )}

        {mode !== 'edit' && entryMode === 'spotify' && !importSuccess && (
          <div className="space-y-3 border-y border-base-300 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Field
                id="music-spotify-url"
                label={t('jams.spotify_url_label')}
                hint={t('jams.spotify_url_hint')}
                error={importError ?? undefined}
                disabled={importLoading || submitting}
                className="flex-1"
              >
                <Field.Input
                  value={spotifyUrl}
                  onChange={(event) => {
                    setSpotifyUrl(event.target.value)
                    setImportError(null)
                  }}
                  placeholder={t('jams.spotify_url_placeholder')}
                />
              </Field>
              {importLoading ? (
                <Action variant="secondary" state="loading" loadingLabel={t('jams.importing_metadata')}>
                  {t('jams.importing_metadata')}
                </Action>
              ) : (
                <Action
                  type="button"
                  variant="secondary"
                  onClick={() => void handleSpotifyImport()}
                  state={!spotifyUrl.trim() ? 'disabled' : 'idle'}
                >
                  {t('jams.import_from_spotify')}
                </Action>
              )}
            </div>
          </div>
        )}

        {mode !== 'edit' && entryMode === 'spotify' && importSuccess && (
          <FormSubmissionFeedback state="success" message={t('jams.import_success')} />
        )}

        {showMusicFields && <MusicModalFormFields formData={formData} onChange={handleFieldChange} />}
        {/* Hidden submit button for form Enter key submission */}
        <button type="submit" className="hidden" aria-label={getSubmitLabel()} />
      </form>
    </Modal>
  )
}
