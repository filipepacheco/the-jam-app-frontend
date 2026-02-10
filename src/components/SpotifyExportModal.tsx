/**
 * Spotify Export Modal
 * Allows users to create a Spotify playlist from a jam's songs
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { X, CheckCircle, ExternalLink } from 'lucide-react'
import { spotifyService } from '../services'
import { Alert } from './Alert'
import type { SpotifyExportResponse } from '../types/spotify.types'

interface SpotifyExportModalProps {
  isOpen: boolean
  onClose: () => void
  jamId: string
  jamName: string
  spotifyAccessToken: string
}

export function SpotifyExportModal({
  isOpen,
  onClose,
  jamId,
  jamName,
  spotifyAccessToken,
}: SpotifyExportModalProps) {
  const { t } = useTranslation()
  const [playlistName, setPlaylistName] = useState(jamName)
  const [playlistDescription, setPlaylistDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportResult, setExportResult] = useState<SpotifyExportResponse | null>(null)

  useEffect(() => {
    if (isOpen) {
      setPlaylistName(jamName)
      setPlaylistDescription('')
      setIsPublic(true)
      setError(null)
      setExportResult(null)
    }
  }, [isOpen, jamName])

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
    setIsSubmitting(true)
    setError(null)

    const result = await spotifyService.exportPlaylist({
      jamId,
      spotifyAccessToken,
      playlistName: playlistName.trim() || undefined,
      playlistDescription: playlistDescription.trim() || undefined,
      public: isPublic,
    })

    setIsSubmitting(false)

    if (result.success && result.data) {
      setExportResult(result.data)
    } else {
      setError(result.error || t('spotify.export_modal.errors.export_failed'))
    }
  }, [jamId, spotifyAccessToken, playlistName, playlistDescription, isPublic, t])

  if (!isOpen) return null

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg" id="spotify-export-title">
              {t('spotify.export_modal.title')}
            </h3>
            <p className="text-sm text-base-content/70">
              {t('spotify.export_modal.subtitle')}
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

        {exportResult ? (
          /* Success State */
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle className="w-16 h-16 text-success mb-4" />
            <h4 className="text-xl font-bold mb-2">{t('spotify.export_modal.success_title')}</h4>
            <p className="text-base-content/70 mb-4">{t('spotify.export_modal.success_message')}</p>

            <div className="stats stats-vertical shadow w-full mb-4">
              <div className="stat">
                <div className="stat-title">{t('spotify.export_modal.total_tracks')}</div>
                <div className="stat-value text-success text-2xl">{exportResult.totalTracks}</div>
              </div>
              {exportResult.skippedTracks > 0 && (
                <div className="stat">
                  <div className="stat-title">{t('spotify.export_modal.skipped_tracks')}</div>
                  <div className="stat-value text-warning text-2xl">{exportResult.skippedTracks}</div>
                </div>
              )}
            </div>

            <a
              href={exportResult.spotifyPlaylistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              {t('spotify.export_modal.open_playlist')}
            </a>
          </div>
        ) : (
          /* Form */
          <div className="space-y-4">
            {error && (
              <Alert type="error" message={error} onDismiss={() => setError(null)} />
            )}

            {/* Playlist Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">{t('spotify.export_modal.name_label')}</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t('spotify.export_modal.description_label')}</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-20 resize-none"
                placeholder={t('spotify.export_modal.description_placeholder')}
                value={playlistDescription}
                onChange={(e) => setPlaylistDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Public Toggle */}
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">{t('spotify.export_modal.public_label')}</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={isSubmitting}
                />
              </label>
            </div>

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
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {t('spotify.export_modal.exporting')}
                  </>
                ) : (
                  t('spotify.export_modal.export_button')
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
