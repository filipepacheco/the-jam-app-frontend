/**
 * Spotify Import Modal
 * Allows hosts to create a jam from a public Spotify playlist
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { X, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { spotifyService } from '../services'
import { ErrorAlert } from './ErrorAlert'
import type { SpotifyImportResponse } from '../types/spotify.types'

interface SpotifyImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (jamId: string) => void
}

const SPOTIFY_URL_PATTERN = /^https:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+/
const SPOTIFY_URI_PATTERN = /^spotify:playlist:[a-zA-Z0-9]+$/

function isValidSpotifyUrl(url: string): boolean {
  return SPOTIFY_URL_PATTERN.test(url) || SPOTIFY_URI_PATTERN.test(url)
}

export function SpotifyImportModal({ isOpen, onClose, onSuccess }: SpotifyImportModalProps) {
  const { t } = useTranslation()
  const [playlistUrl, setPlaylistUrl] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [showOverrides, setShowOverrides] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<SpotifyImportResponse | null>(null)

  useEffect(() => {
    if (isOpen) {
      setPlaylistUrl('')
      setName('')
      setDescription('')
      setDate('')
      setLocation('')
      setShowOverrides(false)
      setError(null)
      setImportResult(null)
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isSubmitting, onClose])

  const handleSubmit = useCallback(async () => {
    if (!playlistUrl.trim()) {
      setError(t('spotify.import_modal.url_required'))
      return
    }

    if (!isValidSpotifyUrl(playlistUrl.trim())) {
      setError(t('spotify.import_modal.url_invalid'))
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await spotifyService.importPlaylist({
      playlistUrl: playlistUrl.trim(),
      name: name.trim() || undefined,
      description: description.trim() || undefined,
      date: date || undefined,
      location: location.trim() || undefined,
    })

    setIsSubmitting(false)

    if (result.success && result.data) {
      setImportResult(result.data)
    } else {
      setError(result.error || t('spotify.import_modal.errors.import_failed'))
    }
  }, [playlistUrl, name, description, date, location, t])

  if (!isOpen) return null

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg" id="spotify-import-title">
              {t('spotify.import_modal.title')}
            </h3>
            <p className="text-sm text-base-content/70">
              {t('spotify.import_modal.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {importResult ? (
          /* Success State */
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle className="w-16 h-16 text-success mb-4" />
            <h4 className="text-xl font-bold mb-2">{t('spotify.import_modal.success_title')}</h4>
            <p className="text-base-content/70 mb-4">{t('spotify.import_modal.success_message')}</p>

            <div className="stats stats-vertical shadow w-full mb-4">
              <div className="stat">
                <div className="stat-title">{t('spotify.import_modal.imported_tracks')}</div>
                <div className="stat-value text-success text-2xl">{importResult.importedTracks}</div>
              </div>
              {importResult.reusedTracks > 0 && (
                <div className="stat">
                  <div className="stat-title">{t('spotify.import_modal.reused_tracks')}</div>
                  <div className="stat-value text-info text-2xl">{importResult.reusedTracks}</div>
                </div>
              )}
              {importResult.skippedTracks > 0 && (
                <div className="stat">
                  <div className="stat-title">{t('spotify.import_modal.skipped_tracks')}</div>
                  <div className="stat-value text-warning text-2xl">{importResult.skippedTracks}</div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onSuccess(importResult.jam.id)}
              className="btn btn-primary"
            >
              {t('spotify.import_modal.view_jam')}
            </button>
          </div>
        ) : (
          /* Form */
          <div className="space-y-4">
            {error && (
              <ErrorAlert message={error} onDismiss={() => setError(null)} />
            )}

            {/* Playlist URL */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">{t('spotify.import_modal.url_label')}</span>
              </label>
              <input
                type="url"
                className="input input-bordered w-full"
                placeholder={t('spotify.import_modal.url_placeholder')}
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Override Details Toggle */}
            <button
              type="button"
              className="btn btn-ghost btn-sm gap-1 -ml-2"
              onClick={() => setShowOverrides(!showOverrides)}
            >
              {showOverrides ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {t('spotify.import_modal.override_section')}
            </button>

            {showOverrides && (
              <div className="space-y-3">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t('spotify.import_modal.name_label')}</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder={t('spotify.import_modal.name_placeholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t('spotify.import_modal.description_label')}</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-20 resize-none"
                    placeholder={t('spotify.import_modal.description_placeholder')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t('spotify.import_modal.date_label')}</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input input-bordered w-full"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t('spotify.import_modal.location_label')}</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder={t('spotify.import_modal.location_placeholder')}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="modal-action">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn btn-ghost"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => { void handleSubmit() }}
                disabled={isSubmitting || !playlistUrl.trim()}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {t('spotify.import_modal.importing')}
                  </>
                ) : (
                  t('spotify.import_modal.import_button')
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose} disabled={isSubmitting}>
          {t('common.close')}
        </button>
      </form>
    </dialog>
  )
}
