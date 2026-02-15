/**
 * Create/Edit Jam Page
 * Unified form for creating new jams and editing existing ones
 * Routes: /host/create-jam (create) and /host/jams/:id/edit (edit)
 */

import React, {useEffect, useState, useCallback, useMemo, useRef, useId} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {useAuth, usePageAlerts} from '../../hooks'
import * as jamService from '../../services/jamService.ts'
import {Alert, FullPageSpinner, Modal, PageAlerts, SpotifyImportModal} from '../../components'
import {ListMusic} from 'lucide-react'

interface FormData {
  name: string
  description: string
  date: string
  time: string
  location: string
  slug: string
  hostMusicianId: string
  hostName?: string
  hostContact?: string
  status: 'ACTIVE' | 'INACTIVE' | 'LIVE' | 'FINISHED'
}

export function CreateJamPage() {
  const navigate = useNavigate()
  const { id: jamId } = useParams<{ id: string }>()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { t } = useTranslation()
  const formId = useId()
  const navTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [loading, setLoading] = useState(false)
  const {error, setError, clearError, success, setSuccess, clearSuccess} = usePageAlerts()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [spotifyModalOpen, setSpotifyModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    slug: '',
    hostMusicianId: user?.id || '',
    status: 'ACTIVE',
  })

  // Cleanup navigation timeout on unmount
  useEffect(() => {
    return () => {
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current)
    }
  }, [])

  // Preview slug derived from name (shows as placeholder when custom slug is empty)
  const slugPreview = useMemo(() => {
    if (!formData.name.trim()) return ''
    return formData.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
  }, [formData.name])

  // Initialize on mount
  const loadJamData = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await jamService.findOne(id)
      const jam = result.data

      // Parse date and time from UTC to local
      const dateObj = jam.date ? new Date(jam.date) : null
      const dateString = dateObj ? dateObj.toISOString().split('T')[0] : ''
      const timeString = dateObj
        ? `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`
        : ''

      setFormData({
        name: jam.name || '',
        description: jam.description || '',
        date: dateString,
        time: timeString,
        location: jam.location || '',
        slug: jam.slug || '',
        hostMusicianId: user?.id || '',
        hostName: jam.hostName || '',
        // hostContact not in JamResponseDto - backend DTO needs updating
        hostContact: (jam as unknown as Record<string, unknown>).hostContact as string || '',
        status: jam.status as FormData['status'],
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('create_jam.messages.load_error')
      console.error('Error loading jam:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user?.id, t, setError])

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!isAuthenticated) {
      void navigate('/login')
      return
    }

    // Auto-fill host musician ID from auth context
    setFormData((prev) => ({
      ...prev,
      hostMusicianId: user?.id || '',
    }))

    // Detect mode and load data if editing
    if (jamId) {
      setMode('edit')
      void loadJamData(jamId)
    } else {
      setMode('create')
    }
  }, [jamId, isAuthenticated, authLoading, navigate, user, loadJamData])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear field error on input
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = t('create_jam.validation.name_required')
    }
    if (!formData.location.trim()) {
      errors.location = t('create_jam.validation.location_required')
    }
    if (!formData.hostMusicianId) {
      errors.hostMusicianId = t('create_jam.validation.host_id_required')
    }
    if (formData.date && !formData.time) {
      errors.time = t('create_jam.validation.time_required')
    }
    if (formData.time && !formData.date) {
      errors.date = t('create_jam.validation.date_required_with_time')
    }

    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors)[0])
      // Focus the first field with an error
      const firstField = Object.keys(errors)[0]
      document.getElementById(`${formId}-${firstField}`)?.focus()
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Combine date and time as local time, then convert to UTC ISO string
      let dateTimeString: string | undefined
      if (formData.date && formData.time) {
        dateTimeString = new Date(`${formData.date}T${formData.time}`).toISOString()
      }

      // In create mode, auto-fill host info from auth profile
      const hostName = formData.hostName?.trim() || user?.name || undefined
      const hostContact = formData.hostContact?.trim() || user?.contact || user?.email || undefined

      const jamPayload = {
        name: formData.name,
        description: formData.description || undefined,
        date: dateTimeString,
        location: formData.location,
        slug: formData.slug.trim() || undefined,
        hostMusicianId: formData.hostMusicianId,
        hostName,
        hostContact,
        status: mode === 'create' ? 'ACTIVE' as const : formData.status,
      }

      if (mode === 'create') {
        const result = await jamService.create(jamPayload)
        setSuccess(t('create_jam.messages.create_success', { name: result.data.name }))
        navTimeoutRef.current = setTimeout(() => navigate('/host/dashboard'), 1500)
      } else if (jamId) {
        const result = await jamService.update(jamId, jamPayload)
        setSuccess(t('create_jam.messages.update_success', { name: result.data.name }))
        navTimeoutRef.current = setTimeout(() => navigate('/host/dashboard'), 1500)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('create_jam.messages.save_error')
      console.error('Error saving jam:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    setDeleteConfirmOpen(false)
    if (!jamId) return

    setLoading(true)
    setError(null)

    try {
      await jamService.deleteFn(jamId)
      setSuccess(t('create_jam.messages.delete_success'))
      navTimeoutRef.current = setTimeout(() => navigate('/host/dashboard'), 1500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('create_jam.messages.delete_error')
      console.error('Error deleting jam:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSpotifySuccess = (newJamId: string) => {
    void navigate(`/host/jams/${newJamId}/manage`)
  }

  // Show loading spinner while auth is initializing
  if (authLoading) {
    return <FullPageSpinner />
  }

  const title = mode === 'create'
    ? t('create_jam.title_create')
    : t('create_jam.title_edit', { name: formData.name })

  return (
    <div className="min-h-screen bg-base-100 p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => { void navigate('/host/dashboard') }}
            className="btn btn-ghost btn-sm mb-4"
          >
            ← {t('create_jam.back_to_dashboard')}
          </button>
          <h1 className="text-2xl sm:text-4xl font-bold">{title}</h1>
        </div>

        {/* Alerts */}
        <PageAlerts error={error} success={success} onDismissError={clearError} onDismissSuccess={clearSuccess} />

        {/* Single unified card */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <form onSubmit={(e) => { void handleSubmit(e) }} noValidate className="space-y-5">
              {/* Spotify inline banner - create mode only */}
              {mode === 'create' && (
                <button
                  type="button"
                  onClick={() => setSpotifyModalOpen(true)}
                  className="flex items-center gap-3 w-full p-3 rounded-lg bg-success/10 hover:bg-success/20 transition-colors text-left"
                >
                  <ListMusic className="size-5 shrink-0 text-success" />
                  <span className="text-sm flex-1">{t('create_jam.spotify_import_inline')}</span>
                  <span className="text-sm font-medium text-success">{t('create_jam.spotify_import_btn')} →</span>
                </button>
              )}

              {/* Jam Name */}
              <fieldset className="fieldset">
                <label className="fieldset-legend" htmlFor={`${formId}-name`}>
                  {t('create_jam.form.jam_name')} <span className="text-error">*</span>
                </label>
                <input
                  id={`${formId}-name`}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t('create_jam.form.placeholder_name')}
                  className={`input input-bordered w-full ${fieldErrors.name ? 'input-error' : ''}`}
                  required
                  disabled={loading}
                  aria-invalid={!!fieldErrors.name || undefined}
                  aria-describedby={fieldErrors.name ? `${formId}-name-error` : undefined}
                />
                {fieldErrors.name && (
                  <p id={`${formId}-name-error`} className="fieldset-label text-error">
                    {fieldErrors.name}
                  </p>
                )}
              </fieldset>

              {/* Location */}
              <fieldset className="fieldset">
                <label className="fieldset-legend" htmlFor={`${formId}-location`}>
                  {t('create_jam.form.location')} <span className="text-error">*</span>
                </label>
                <input
                  id={`${formId}-location`}
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder={t('create_jam.form.placeholder_location')}
                  className={`input input-bordered w-full ${fieldErrors.location ? 'input-error' : ''}`}
                  required
                  disabled={loading}
                  aria-invalid={!!fieldErrors.location || undefined}
                  aria-describedby={fieldErrors.location ? `${formId}-location-error` : undefined}
                />
                {fieldErrors.location && (
                  <p id={`${formId}-location-error`} className="fieldset-label text-error">
                    {fieldErrors.location}
                  </p>
                )}
              </fieldset>

              {/* URL Slug */}
              <fieldset className="fieldset">
                <label className="fieldset-legend" htmlFor={`${formId}-slug`}>
                  {t('create_jam.form.slug')}
                </label>
                <div className="flex items-stretch">
                  <span className="inline-flex items-center px-3 bg-base-300 border border-r-0 border-base-content/20 rounded-l-lg text-xs text-base-content/70 select-none whitespace-nowrap">
                    jamapp.com.br/jams/
                  </span>
                  <input
                    id={`${formId}-slug`}
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                      setFormData((prev) => ({ ...prev, slug: value }))
                      if (fieldErrors.slug) {
                        setFieldErrors((prev) => {
                          const next = { ...prev }
                          delete next.slug
                          return next
                        })
                      }
                    }}
                    placeholder={slugPreview || t('create_jam.form.placeholder_slug')}
                    className="input input-bordered rounded-l-none font-mono text-sm flex-1 min-w-0"
                    disabled={loading}
                    maxLength={80}
                  />
                </div>
                <p className="fieldset-label text-base-content/50">
                  {t('create_jam.form.slug_hint')}
                </p>
              </fieldset>

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <fieldset className="fieldset">
                  <label className="fieldset-legend" htmlFor={`${formId}-date`}>
                    {t('create_jam.form.date')}
                  </label>
                  <input
                    id={`${formId}-date`}
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className={`input input-bordered w-full ${fieldErrors.date ? 'input-error' : ''}`}
                    disabled={loading}
                    aria-invalid={!!fieldErrors.date || undefined}
                    aria-describedby={fieldErrors.date ? `${formId}-date-error` : undefined}
                  />
                  {fieldErrors.date && (
                    <p id={`${formId}-date-error`} className="fieldset-label text-error">
                      {fieldErrors.date}
                    </p>
                  )}
                </fieldset>
                <fieldset className="fieldset">
                  <label className="fieldset-legend" htmlFor={`${formId}-time`}>
                    {t('create_jam.form.time')}
                  </label>
                  <input
                    id={`${formId}-time`}
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className={`input input-bordered w-full ${fieldErrors.time ? 'input-error' : ''}`}
                    disabled={loading}
                    aria-invalid={!!fieldErrors.time || undefined}
                    aria-describedby={fieldErrors.time ? `${formId}-time-error` : undefined}
                  />
                  {fieldErrors.time && (
                    <p id={`${formId}-time-error`} className="fieldset-label text-error">
                      {fieldErrors.time}
                    </p>
                  )}
                </fieldset>
              </div>

              {/* Description */}
              <fieldset className="fieldset">
                <label className="fieldset-legend" htmlFor={`${formId}-description`}>
                  {t('create_jam.form.description')}
                </label>
                <textarea
                  id={`${formId}-description`}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t('create_jam.form.placeholder_description')}
                  className="textarea textarea-bordered resize-y w-full"
                  rows={2}
                  disabled={loading}
                />
              </fieldset>

              {/* Host Name and Contact - edit mode only */}
              {mode === 'edit' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <fieldset className="fieldset">
                    <label className="fieldset-legend" htmlFor={`${formId}-hostName`}>
                      {t('create_jam.form.host_name')}
                    </label>
                    <input
                      id={`${formId}-hostName`}
                      type="text"
                      name="hostName"
                      value={formData.hostName}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      disabled={loading}
                    />
                  </fieldset>
                  <fieldset className="fieldset">
                    <label className="fieldset-legend" htmlFor={`${formId}-hostContact`}>
                      {t('create_jam.form.host_contact')}
                    </label>
                    <input
                      id={`${formId}-hostContact`}
                      type="text"
                      name="hostContact"
                      value={formData.hostContact}
                      onChange={handleInputChange}
                      placeholder={t('create_jam.form.placeholder_contact')}
                      className="input input-bordered w-full"
                      disabled={loading}
                    />
                  </fieldset>
                </div>
              )}

              {/* Status - edit mode only */}
              {mode === 'edit' && (
                <fieldset className="fieldset">
                  <label className="fieldset-legend" htmlFor={`${formId}-status`}>
                    {t('create_jam.form.status')}
                  </label>
                  <select
                    id={`${formId}-status`}
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="select select-bordered w-full"
                    disabled={loading}
                  >
                    <option value="ACTIVE">{t('create_jam.form.status_active')}</option>
                    <option value="INACTIVE">{t('create_jam.form.status_inactive')}</option>
                    <option value="LIVE">{t('create_jam.form.status_live')}</option>
                    <option value="FINISHED">{t('create_jam.form.status_finished')}</option>
                  </select>
                </fieldset>
              )}

              {/* Action Buttons */}
              <div className="divider my-1" />
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { void navigate('/host/dashboard') }}
                  className="btn btn-ghost"
                  disabled={loading}
                >
                  {t('create_jam.actions.cancel')}
                </button>

                {mode === 'edit' && (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="btn btn-error btn-outline"
                    disabled={loading}
                  >
                    {t('create_jam.actions.delete')}
                  </button>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      {t('create_jam.actions.saving')}
                    </>
                  ) : mode === 'create' ? (
                    t('create_jam.actions.create')
                  ) : (
                    t('create_jam.actions.update')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Info Box */}
        <Alert
          type="info"
          message={mode === 'create'
            ? t('create_jam.info.create_hint')
            : t('create_jam.info.edit_hint')}
          className="mt-6"
        />
      </div>

      {/* Spotify Import Modal */}
      <SpotifyImportModal
        isOpen={spotifyModalOpen}
        onClose={() => setSpotifyModalOpen(false)}
        onSuccess={handleSpotifySuccess}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title={t('create_jam.messages.confirm_delete_title')}
        size="sm"
        role="alertdialog"
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn btn-error"
              onClick={() => { void handleDeleteConfirm() }}
            >
              {t('create_jam.actions.confirm_delete')}
            </button>
          </>
        }
      >
        <p>{t('create_jam.messages.confirm_delete')}</p>
      </Modal>
    </div>
  )
}

export default CreateJamPage
