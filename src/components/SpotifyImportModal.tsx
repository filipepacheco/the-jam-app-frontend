/**
 * Spotify Import Modal
 * Allows hosts to create a jam from a public Spotify playlist
 * OR add songs to an existing jam
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, ChevronDown, ChevronUp, Plus, ListMusic } from 'lucide-react'
import { spotifyService } from '../services'
import { jamService } from '../services'
import { Alert } from './Alert'
import { Modal } from './Modal'
import { ModalFooter } from './ModalFooter'
import type { SpotifyImportResponse } from '../types/spotify.types'
import type { JamResponseDto } from '../types/api.types'
import { isValidSpotifyPlaylistUrl } from '../lib/spotifyUtils'

type ImportMode = 'new' | 'existing'

interface SpotifyImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (jamId: string, isExistingJam: boolean) => void
  preselectedJamId?: string  // Optional: if provided, pre-select "existing" mode with this jam
  preselectedJamName?: string // Optional: name of the preselected jam
}

export function SpotifyImportModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedJamId,
  preselectedJamName
}: SpotifyImportModalProps) {
  const { t } = useTranslation()

  // Mode state - default to 'existing' if preselectedJamId provided
  const [mode, setMode] = useState<ImportMode>(preselectedJamId ? 'existing' : 'new')
  const [selectedJamId, setSelectedJamId] = useState<string>(preselectedJamId || '')
  const [userJams, setUserJams] = useState<JamResponseDto[]>([])
  const [loadingJams, setLoadingJams] = useState(false)

  // Form state
  const [playlistUrl, setPlaylistUrl] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [slug, setSlug] = useState('')
  const [showOverrides, setShowOverrides] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<SpotifyImportResponse | null>(null)

  // Load user's jams for the dropdown
  const loadUserJams = useCallback(async () => {
    setLoadingJams(true)
    try {
      const result = await jamService.findAll()
      // Filter to only show jams that are not finished
      const activeJams = result.data.filter(jam => jam.status !== 'FINISHED')
      setUserJams(activeJams)
    } catch (err) {
      console.error('Failed to load jams:', err)
    } finally {
      setLoadingJams(false)
    }
  }, [])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset form
      setPlaylistUrl('')
      setName('')
      setDescription('')
      setDate('')
      setLocation('')
      setSlug('')
      setShowOverrides(false)
      setError(null)
      setImportResult(null)

      // Set mode based on preselectedJamId
      const initialMode = preselectedJamId ? 'existing' : 'new'
      setMode(initialMode)
      setSelectedJamId(preselectedJamId || '')

      // Load user's jams if in existing mode or might switch to it
      if (initialMode === 'existing' || !preselectedJamId) {
        void loadUserJams()
      }
    }
  }, [isOpen, preselectedJamId, loadUserJams])

  // Handle mode change
  const handleModeChange = (newMode: ImportMode) => {
    setMode(newMode)
    setError(null)
    // Reset selected jam when switching to new mode
    if (newMode === 'new') {
      setSelectedJamId('')
    } else if (newMode === 'existing' && preselectedJamId) {
      setSelectedJamId(preselectedJamId)
    }
  }

  const handleSubmit = useCallback(async () => {
    if (!playlistUrl.trim()) {
      setError(t('spotify.import_modal.url_required'))
      return
    }

    if (!isValidSpotifyPlaylistUrl(playlistUrl.trim())) {
      setError(t('spotify.import_modal.url_invalid'))
      return
    }

    // Validate based on mode
    if (mode === 'existing' && !selectedJamId) {
      setError(t('spotify.import_modal.select_jam_required'))
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await spotifyService.importPlaylist({
      playlistUrl: playlistUrl.trim(),
      // If existing jam mode, include jamId
      ...(mode === 'existing' && { jamId: selectedJamId }),
      // If new jam mode, include these fields
      ...(mode === 'new' && {
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        date: date || undefined,
        location: location.trim() || undefined,
        slug: slug.trim() || undefined,
      }),
    })

    setIsSubmitting(false)

    if (result.success && result.data) {
      setImportResult(result.data)
    } else {
      // Handle errors - the error is a string message from the service layer
      const errorMessage = result.error || t('spotify.import_modal.errors.import_failed')
      setError(errorMessage)
    }
  }, [playlistUrl, name, description, date, location, slug, mode, selectedJamId, t])

  if (!isOpen) return null

  // Success state
  if (importResult) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={() => onSuccess(importResult.jam.id, importResult.isExistingJam)}
        title={
          importResult.isExistingJam
            ? t('spotify.import_modal.success_title_existing')
            : t('spotify.import_modal.success_title')
        }
        size="md"
      >
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircle className="w-16 h-16 text-success mb-4" />
          <p className="text-base-content/70 mb-4">
            {importResult.isExistingJam
              ? t('spotify.import_modal.success_message_existing', { name: importResult.jam.name })
              : t('spotify.import_modal.success_message')
            }
          </p>

          <div className="stats stats-vertical shadow w-full mb-4">
            {/* Show added tracks for existing jam */}
            {importResult.isExistingJam && (
              <div className="stat">
                <div className="stat-title">{t('spotify.import_modal.added_tracks')}</div>
                <div className="stat-value text-success text-2xl">{importResult.addedTracks}</div>
              </div>
            )}

            {/* Show duplicate tracks if any */}
            {importResult.duplicateTracks > 0 && (
              <div className="stat">
                <div className="stat-title">{t('spotify.import_modal.duplicate_tracks')}</div>
                <div className="stat-value text-warning text-2xl">{importResult.duplicateTracks}</div>
                <div className="stat-desc">{t('spotify.import_modal.duplicate_tracks_desc')}</div>
              </div>
            )}

            {/* Show imported/reused for new jam or details for existing */}
            {!importResult.isExistingJam && (
              <div className="stat">
                <div className="stat-title">{t('spotify.import_modal.imported_tracks')}</div>
                <div className="stat-value text-success text-2xl">{importResult.importedTracks}</div>
              </div>
            )}

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
            onClick={() => onSuccess(importResult.jam.id, importResult.isExistingJam)}
            className="btn btn-primary"
          >
            {importResult.isExistingJam
              ? t('spotify.import_modal.back_to_jam')
              : t('spotify.import_modal.view_jam')
            }
          </button>
        </div>
      </Modal>
    )
  }

  const titleContent = (
    <div>
      <span className="font-bold text-lg">{t('spotify.import_modal.title')}</span>
      <p className="text-sm text-base-content/70 font-normal">{t('spotify.import_modal.subtitle')}</p>
    </div>
  )

  // Form state
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titleContent}
      size="md"
      closeDisabled={isSubmitting}
      footer={
        <ModalFooter
          onCancel={onClose}
          onSubmit={() => { void handleSubmit() }}
          submitLabel={
            isSubmitting
              ? t('spotify.import_modal.importing')
              : mode === 'existing'
                ? t('spotify.import_modal.add_to_jam_button')
                : t('spotify.import_modal.import_button')
          }
          submitting={isSubmitting}
          submitDisabled={!playlistUrl.trim() || (mode === 'existing' && !selectedJamId)}
        />
      }
    >
      <div className="space-y-4">
        {error && (
          <Alert type="error" message={error} onDismiss={() => setError(null)} />
        )}

        {/* Mode Selection - Only show if no preselectedJamId */}
        {!preselectedJamId && (
          <div className="join w-full">
            <button
              type="button"
              onClick={() => handleModeChange('new')}
              className={`join-item btn btn-sm flex-1 ${mode === 'new' ? 'btn-active' : 'btn-ghost'}`}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t('spotify.import_modal.mode_new')}
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('existing')}
              className={`join-item btn btn-sm flex-1 ${mode === 'existing' ? 'btn-active' : 'btn-ghost'}`}
            >
              <ListMusic className="w-4 h-4 mr-1" />
              {t('spotify.import_modal.mode_existing')}
            </button>
          </div>
        )}

        {/* Playlist URL - Always required */}
        <fieldset className="fieldset">
          <label className="fieldset-legend">{t('spotify.import_modal.url_label')}</label>
          <input
            type="url"
            className="input input-bordered w-full"
            placeholder={t('spotify.import_modal.url_placeholder')}
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            disabled={isSubmitting}
          />
        </fieldset>

        {/* Existing Jam Selector */}
        {mode === 'existing' && (
          <fieldset className="fieldset">
            <label className="fieldset-legend">{t('spotify.import_modal.select_jam_label')}</label>
            {preselectedJamId ? (
              <input
                type="text"
                className="input input-bordered w-full bg-base-200"
                value={preselectedJamName || t('spotify.import_modal.current_jam')}
                disabled
              />
            ) : (
              <select
                className="select select-bordered w-full"
                value={selectedJamId}
                onChange={(e) => setSelectedJamId(e.target.value)}
                disabled={isSubmitting || loadingJams}
              >
                <option value="">{t('spotify.import_modal.select_jam_placeholder')}</option>
                {userJams.map((jam) => (
                  <option key={jam.id} value={jam.id}>
                    {jam.name} ({jam._count?.schedules ?? jam.schedules?.length ?? 0} {t('spotify.import_modal.songs_count')})
                  </option>
                ))}
              </select>
            )}
            {loadingJams && (
              <span className="loading loading-spinner loading-xs mt-2"></span>
            )}
          </fieldset>
        )}

        {/* New Jam Fields */}
        {mode === 'new' && (
          <>
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
                <fieldset className="fieldset">
                  <label className="fieldset-legend">{t('spotify.import_modal.name_label')}</label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder={t('spotify.import_modal.name_placeholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <label className="fieldset-legend">{t('spotify.import_modal.description_label')}</label>
                  <textarea
                    className="textarea textarea-bordered h-20 resize-none w-full"
                    placeholder={t('spotify.import_modal.description_placeholder')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <label className="fieldset-legend">{t('spotify.import_modal.date_label')}</label>
                  <input
                    type="datetime-local"
                    className="input input-bordered w-full"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={isSubmitting}
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <label className="fieldset-legend">{t('spotify.import_modal.location_label')}</label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder={t('spotify.import_modal.location_placeholder')}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={isSubmitting}
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <label className="fieldset-legend">{t('create_jam.form.slug')}</label>
                  <div className="flex items-stretch">
                    <span className="inline-flex items-center px-3 bg-base-300 border border-r-0 border-base-content/20 rounded-l-lg text-xs text-base-content/70 select-none whitespace-nowrap">
                      jamapp.com.br/jams/
                    </span>
                    <input
                      type="text"
                      className="input input-bordered rounded-l-none font-mono text-sm flex-1 min-w-0"
                      placeholder={t('create_jam.form.placeholder_slug')}
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                      disabled={isSubmitting}
                      maxLength={80}
                    />
                  </div>
                  <p className="fieldset-label text-base-content/50">
                    {t('create_jam.form.slug_hint')}
                  </p>
                </fieldset>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
