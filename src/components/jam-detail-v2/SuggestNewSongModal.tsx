/**
 * Suggest New Song Modal Component
 * Modal for creating a new song and adding it to a jam's schedule
 * Supports importing song metadata from Spotify
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { musicService, scheduleService } from '../../services'
import { spotifyService } from '../../services/spotifyService'
import { MusicModalFormFields } from '../MusicModalFormFields'
import { parseDuration } from '../../lib/musicUtils'
import { formatDuration } from '../../lib/formatters'
import { isValidSpotifyTrackUrl } from '../../lib/spotifyUtils'
import type { CreateMusicDto } from '../../types/api.types'

interface SuggestNewSongModalProps {
  jamId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type SubmitStep = 'idle' | 'creating' | 'linking'

export function SuggestNewSongModal({
  jamId,
  isOpen,
  onClose,
  onSuccess,
}: SuggestNewSongModalProps) {
  const { t } = useTranslation()
  const modalRef = useRef<HTMLDivElement>(null)

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

  // Handle Escape key and focus management
  useEffect(() => {
    if (!isOpen || !modalRef.current) return

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    if (firstElement) firstElement.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, submitting])

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
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
      // Step 1: Create the music
      setSubmitStep('creating')

      const payload: CreateMusicDto = {
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        description: formData.description.trim() || undefined,
        link: formData.link.trim() || undefined,
        genre: formData.genre || undefined,
        duration: durationInSeconds || undefined,
        status: 'SUGGESTED',
        neededDrums: formData.neededDrums,
        neededGuitars: formData.neededGuitars,
        neededVocals: formData.neededVocals,
        neededBass: formData.neededBass,
        neededKeys: formData.neededKeys,
      }

      const musicResult = await musicService.create(payload)

      if (!musicResult.success || !musicResult.data) {
        setError(musicResult.error || t('music_library.errors.failed_to_add'))
        setSubmitting(false)
        setSubmitStep('idle')
        return
      }

      // Step 2: Link to jam via schedule
      setSubmitStep('linking')

      const scheduleResult = await scheduleService.create({
        jamId,
        musicId: musicResult.data.id,
        order: 0,
        status: 'SUGGESTED',
      } as any)

      if (!scheduleResult.success) {
        // Music was created but linking failed - still show partial success
        setError(t('jams.suggest_failed'))
        setSubmitting(false)
        setSubmitStep('idle')
        return
      }

      // Success!
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('jams.suggest_failed'))
      setSubmitStep('idle')
    } finally {
      setSubmitting(false)
    }
  }, [formData, jamId, onSuccess, t])

  // Get submit button label based on current step
  const getSubmitLabel = () => {
    if (!submitting) return t('common.suggest_song')
    if (submitStep === 'creating') return t('jams.creating_song')
    if (submitStep === 'linking') return t('jams.linking_to_jam')
    return t('common.suggesting')
  }

  if (!isOpen) return null

  return (
    <dialog className="modal modal-open" aria-labelledby="suggest-new-song-modal-title">
      <div
        ref={modalRef}
        className="modal-box max-w-lg w-full max-h-[90vh] flex flex-col p-0"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-base-300 flex items-center justify-between shrink-0">
          <h3 id="suggest-new-song-modal-title" className="font-bold text-lg sm:text-xl">
            {t('jams.suggest_new_song_title')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label={t('common.close')}
            disabled={submitting}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={(e) => { void handleSubmit(e) }} className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Description */}
            <p className="text-sm text-base-content/70">
              {t('jams.suggest_new_song_description')}
            </p>

            {/* Error Alert */}
            {error && (
              <div className="alert alert-error" role="alert">
                <span>{error}</span>
              </div>
            )}

            {/* Spotify Import Section */}
            <div className="bg-base-200 rounded-lg p-4 space-y-3">
              <label className="label py-0" htmlFor="spotify-url">
                <span className="label-text font-medium">{t('jams.spotify_url_label')}</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="spotify-url"
                  type="text"
                  value={spotifyUrl}
                  onChange={(e) => {
                    setSpotifyUrl(e.target.value)
                    setImportError(null)
                    setImportSuccess(false)
                  }}
                  className="input input-bordered flex-1"
                  placeholder={t('jams.spotify_url_placeholder')}
                  disabled={importLoading || submitting}
                />
                <button
                  type="button"
                  onClick={() => { void handleSpotifyImport() }}
                  className="btn btn-secondary"
                  disabled={!spotifyUrl.trim() || importLoading || submitting}
                >
                  {importLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm" aria-hidden="true"></span>
                      {t('jams.importing_metadata')}
                    </>
                  ) : (
                    t('jams.import_from_spotify')
                  )}
                </button>
              </div>
              {importError && (
                <p className="text-sm text-error">{importError}</p>
              )}
              {importSuccess && (
                <p className="text-sm text-success">{t('jams.import_success')}</p>
              )}
            </div>

            {/* Form Fields */}
            <MusicModalFormFields formData={formData} onChange={handleFieldChange} />
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-4 border-t border-base-300 flex justify-end gap-3 shrink-0 bg-base-100 sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={submitting}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !formData.title.trim() || !formData.artist.trim()}
            >
              {submitting && <span className="loading loading-spinner loading-sm" aria-hidden="true"></span>}
              {getSubmitLabel()}
            </button>
          </div>
        </form>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose} aria-label={t('common.close')} disabled={submitting}>
          close
        </button>
      </form>
    </dialog>
  )
}
