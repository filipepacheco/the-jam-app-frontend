/**
 * Suggest New Song Modal Component
 * Modal for creating a new song and adding it to a jam's schedule
 * Supports importing song metadata from Spotify
 */

import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { spotifyService } from '../../services'
import { MusicModalFormFields } from '../MusicModalFormFields'
import { parseDuration } from '../../lib/musicUtils'
import { formatDuration } from '../../lib/formatters'
import { isValidSpotifyTrackUrl } from '../../lib/spotifyUtils'
import type { CreateMusicDto } from '../../types/api.types'
import type {JamParticipationOutcome} from '../../lib/jam-participation/jamParticipationController'
import { Alert } from '../Alert'
import { Modal } from '../Modal'
import { Action } from '../Action'
import { Field, FormSubmissionFeedback } from '../Field'

interface SuggestNewSongModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateMusicDto) => Promise<JamParticipationOutcome>
}

type SubmitStep = 'idle' | 'creating' | 'linking'

export function SuggestNewSongModal({
  isOpen,
  onClose,
  onSubmit,
}: SuggestNewSongModalProps) {
  const { t } = useTranslation()

  // Spotify import state
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)

  // Form state - default band setup: 1 vocal, 2 guitars, 1 bass, 1 drums
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    description: '',
    link: '',
    info: '',
    genre: '',
    duration: '',
    neededDrums: 1,
    neededGuitars: 2,
    neededVocals: 1,
    neededBass: 1,
    neededKeys: 0,
  })

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [submitStep, setSubmitStep] = useState<SubmitStep>('idle')
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSpotifyUrl('')
      setImportLoading(false)
      setImportError(null)
      setImportSuccess(false)
      setFormData({
        title: '',
        artist: '',
        description: '',
        link: '',
        info: '',
        genre: '',
        duration: '',
        neededDrums: 1,
        neededGuitars: 2,
        neededVocals: 1,
        neededBass: 1,
        neededKeys: 0,
      })
      setSubmitting(false)
      setSubmitStep('idle')
      setError(null)
    }
  }, [isOpen])

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear import success when user modifies form
    if (importSuccess) setImportSuccess(false)
  }, [importSuccess])

  // Handle Spotify import
  const handleSpotifyImport = useCallback(async () => {
    if (!isValidSpotifyTrackUrl(spotifyUrl)) {
      setImportError(t('jams.invalid_spotify_url'))
      return
    }

    setImportLoading(true)
    setImportError(null)
    setImportSuccess(false)

    const result = await spotifyService.getTrackMetadata(spotifyUrl)

    if (result.success && result.data) {
      setFormData((prev) => ({
        ...prev,
        title: result.data.title,
        artist: result.data.artist,
        link: result.data.spotifyUrl,
        duration: formatDuration(result.data.durationMs, 'ms'),
      }))
      setImportSuccess(true)
      setImportError(null)
    } else {
      setImportError(result.error || t('jams.spotify_import_error'))
    }

    setImportLoading(false)
  }, [spotifyUrl, t])

  // Handle form submission
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    if (!formData.title.trim()) {
      setError(t('music_library.validation.title_required'))
      return
    }
    if (!formData.artist.trim()) {
      setError(t('music_library.validation.artist_required'))
      return
    }

    // Parse duration
    const durationInSeconds = formData.duration ? parseDuration(formData.duration) : null
    if (formData.duration && durationInSeconds === null) {
      setError(t('music_library.feedback.invalid_duration'))
      return
    }

    setSubmitting(true)

    try {
      setSubmitStep('creating')

      const payload: CreateMusicDto = {
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        description: formData.description.trim() || undefined,
        link: formData.link.trim() || undefined,
        info: formData.info.trim() || undefined,
        genre: formData.genre || undefined,
        duration: durationInSeconds || undefined,
        status: 'SUGGESTED',
        neededDrums: formData.neededDrums,
        neededGuitars: formData.neededGuitars,
        neededVocals: formData.neededVocals,
        neededBass: formData.neededBass,
        neededKeys: formData.neededKeys,
      }

      setSubmitStep('linking')
      const outcome = await onSubmit(payload)
      if (outcome.code === 'failure' || outcome.code === 'partial_success' || outcome.code === 'refresh_failure') {
        setError(outcome.error.message || t('jams.suggest_failed'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('jams.suggest_failed'))
      setSubmitStep('idle')
    } finally {
      setSubmitting(false)
    }
  }, [formData, onSubmit, t])

  // Get submit button label based on current step
  const getSubmitLabel = () => {
    if (!submitting) return t('common.suggest_song')
    if (submitStep === 'creating') return t('jams.creating_song')
    if (submitStep === 'linking') return t('jams.linking_to_jam')
    return t('common.suggesting')
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('jams.suggest_new_song_title')}
      size="lg"
      scrollable
      closeDisabled={submitting}
      footer={
        <>
          <Action variant="quiet" onClick={onClose} state={submitting ? 'disabled' : 'idle'}>
            {t('common.cancel')}
          </Action>
          {/* Two elements on purpose: ActionProps is a discriminated union, so a
              loading Action must carry a literal state="loading" and a
              loadingLabel. See docs/design-system/action-controls.md. */}
          {submitting ? (
            <Action state="loading" loadingLabel={getSubmitLabel()}>
              {getSubmitLabel()}
            </Action>
          ) : (
            <Action
              type="submit"
              form="suggest-new-song-form"
              state={!formData.title.trim() || !formData.artist.trim() ? 'disabled' : 'idle'}
            >
              {getSubmitLabel()}
            </Action>
          )}
        </>
      }
    >
      <form
        id="suggest-new-song-form"
        onSubmit={(e) => { void handleSubmit(e) }}
        className="space-y-6"
      >
        {/* Description */}
        <p className="text-sm text-base-content/70">
          {t('jams.suggest_new_song_description')}
        </p>

        {/* Error Alert */}
        <Alert type="error" message={error} />

        {/* Spotify Import Section */}
        <div className="bg-base-200 rounded-lg p-4 space-y-3">
          {/* Field wraps exactly one control, so the import Action is a sibling
              of the Field, not a child of it. */}
          <div className="flex gap-2 items-end">
            <Field
              id="spotify-url"
              label={t('jams.spotify_url_label')}
              className="flex-1"
              disabled={importLoading || submitting}
              error={importError ?? undefined}
            >
              <Field.Input
                type="text"
                value={spotifyUrl}
                onChange={(e) => {
                  setSpotifyUrl(e.target.value)
                  setImportError(null)
                  setImportSuccess(false)
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
                variant="secondary"
                onClick={() => { void handleSpotifyImport() }}
                state={!spotifyUrl.trim() || submitting ? 'disabled' : 'idle'}
              >
                {t('jams.import_from_spotify')}
              </Action>
            )}
          </div>
          {importSuccess && (
            <FormSubmissionFeedback state="success" message={t('jams.import_success')} />
          )}
        </div>

        {/* Form Fields */}
        <MusicModalFormFields formData={formData} onChange={handleFieldChange} />

      </form>
    </Modal>
  )
}
