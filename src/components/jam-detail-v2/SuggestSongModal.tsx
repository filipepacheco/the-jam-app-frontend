/**
 * Suggest Song Modal Component
 * Modal for suggesting a new song to add to jam schedule
 */

import {useCallback, useEffect, useRef, useState} from 'react'
import {useTranslation} from 'react-i18next'
import type {MusicResponseDto} from '../../types/api.types'
import {musicService, scheduleService} from '../../services'
import {ErrorAlert} from "../ErrorAlert.tsx";

interface SuggestSongModalProps {
  jamId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function SuggestSongModal({
  jamId,
  isOpen,
  onClose,
  onSuccess,
}: SuggestSongModalProps) {
  const { t } = useTranslation()
  const [selectedSongId, setSelectedSongId] = useState('')
  const [allSongs, setAllSongs] = useState<MusicResponseDto[]>([])
  const [loadingSongs, setLoadingSongs] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Manage focus within modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return

    // Focus the first focusable element
    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    if (firstElement) firstElement.focus()

    // Handle Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Load songs when modal opens
  const loadSongs = useCallback(async () => {
    setLoadingSongs(true)
    setError(null)

    try {
      const response = await musicService.findAll()
      setAllSongs(response.data || [])
    } catch (err) {
      setError(t('jams.loading_songs_failed'))
    } finally {
      setLoadingSongs(false)
    }
  }, [t])

  useEffect(() => {
    if (isOpen) {
      void loadSongs()
    } else {
      // Reset state when modal closes
      setSelectedSongId('')
      setError(null)
    }
  }, [isOpen, loadSongs])

  const handleSuggest = async () => {
    if (!selectedSongId) {
      setError(t('jams.select_song_error'))
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await scheduleService.create({
        jamId,
        musicId: selectedSongId,
        order: 0,
        status: 'SUGGESTED',
      } as any)

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('jams.suggest_failed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="suggest-modal-title" ref={modalRef}>
      <div className="modal-box max-w-md">
        <h3 id="suggest-modal-title" className="font-bold text-lg mb-4">
          {t('jams.suggest_modal_title')}
        </h3>

        <ErrorAlert message={error}/>

        {/* Loading State */}
        {loadingSongs && !allSongs.length ? (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="loading loading-spinner loading-sm" aria-hidden="true"></span>
              <span className="text-sm text-base-content/70 font-semibold">
                {t('jams.loading_songs')}
              </span>
            </div>
            <div className="form-control">
              <label className="label" htmlFor="song-select">
                <span className="label-text">{t('jams.select_song')}</span>
              </label>
              <div className="skeleton h-12 w-full rounded"></div>
            </div>
          </div>
        ) : (
          <div className="form-control mb-4">
            <label className="label" htmlFor="song-select">
              <span className="label-text">{t('jams.select_song')}</span>
            </label>
            <select
              id="song-select"
              value={selectedSongId}
              onChange={(e) => setSelectedSongId(e.target.value)}
              className="select select-bordered w-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              disabled={loadingSongs || submitting}
              name="song"
            >
              <option value="">{t('jams.choose_song')}</option>
              {allSongs.map((song) => (
                <option key={song.id} value={song.id}>
                  {song.title} - {song.artist}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-base-200 rounded-lg p-3 mb-4">
          <p className="font-semibold text-sm mb-2">{t('jams.how_it_works_short')}</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-base-content/70">
            <li>{t('jams.how_it_works_list.select')}</li>
            <li>{t('jams.how_it_works_list.slot')}</li>
            <li>{t('jams.how_it_works_list.review')}</li>
            <li>{t('jams.how_it_works_list.register')}</li>
          </ul>
        </div>

        {/* Modal Actions */}
        <div className="modal-action">
          <button
            onClick={onClose}
            className="btn btn-ghost"
            disabled={submitting}
            type="button"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSuggest}
            className="btn btn-primary"
            disabled={submitting || !selectedSongId || loadingSongs}
            type="button"
          >
            {submitting ? (
              <>
                <span className="loading loading-spinner loading-sm" aria-hidden="true"></span>
                {t('common.suggesting')}
              </>
            ) : (
              t('common.suggest_song')
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}
