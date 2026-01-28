/**
 * Create/Edit Jam Page
 * Unified form for creating new jams and editing existing ones
 * Routes: /host/create-jam (create) and /host/jams/:id/edit (edit)
 */

import React, {useEffect, useState, useCallback} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {useAuth} from '../../hooks'
import * as jamService from '../../services/jamService.ts'
import {ErrorAlert, SuccessAlert, SpotifyImportModal} from '../../components'

interface FormData {
  name: string
  description: string
  date: string
  time: string
  location: string
  hostMusicianId: string
  hostName?: string
  hostContact?: string
  status: 'ACTIVE' | 'INACTIVE' | 'FINISHED'
}

export function CreateJamPage() {
  const navigate = useNavigate()
  const { id: jamId } = useParams<{ id: string }>()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { t } = useTranslation()

  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [spotifyModalOpen, setSpotifyModalOpen] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    hostMusicianId: user?.id || '',
    status: 'ACTIVE',
  })

  // Initialize on mount
  const loadJamData = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await jamService.findOne(id)
      const jam = result.data

      // Parse date and time
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
        location: '',
        hostMusicianId: user?.id || '',
        status: jam.status as 'ACTIVE' | 'INACTIVE' | 'FINISHED',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('create_jam.messages.load_error')
      console.error('Error loading jam:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user?.id, t])

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!isAuthenticated) {
      navigate('/login')
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
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError(t('create_jam.validation.name_required'))
      return false
    }
    if (!formData.location.trim()) {
      setError(t('create_jam.validation.location_required'))
      return false
    }
    if (!formData.hostMusicianId) {
      setError(t('create_jam.validation.host_id_required'))
      return false
    }
    if (formData.date && !formData.time) {
      setError(t('create_jam.validation.time_required'))
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
      // Combine date and time
      let dateTimeString = ''
      if (formData.date && formData.time) {
        dateTimeString = `${formData.date}T${formData.time}:00Z`
      }

      const jamPayload = {
        name: formData.name,
        description: formData.description || undefined,
        date: dateTimeString || undefined,
        location: formData.location,
        hostMusicianId: formData.hostMusicianId,
        status: formData.status,
      }

      if (mode === 'create') {
        const result = await jamService.create(jamPayload)
        setSuccess(t('create_jam.messages.create_success', { name: result.data.name }))
        setTimeout(() => navigate('/host/dashboard'), 1500)
      } else if (jamId) {
        const result = await jamService.update(jamId, jamPayload)
        setSuccess(t('create_jam.messages.update_success', { name: result.data.name }))
        setTimeout(() => navigate('/host/dashboard'), 1500)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('create_jam.messages.save_error')
      console.error('Error saving jam:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!jamId) return

    if (!confirm(t('create_jam.messages.confirm_delete'))) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await jamService.deleteFn(jamId)
      setSuccess(t('create_jam.messages.delete_success'))
      setTimeout(() => navigate('/host/dashboard'), 1500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('create_jam.messages.delete_error')
      console.error('Error deleting jam:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSpotifySuccess = (newJamId: string) => {
    navigate(`/host/jams/${newJamId}/manage`)
  }

  // Show loading spinner while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  const title = mode === 'create'
    ? t('create_jam.title_create')
    : t('create_jam.title_edit', { name: formData.name })

  return (
    <div className="min-h-screen bg-base-100 p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/host/dashboard')}
            className="btn btn-ghost btn-sm mb-4"
          >
            ← {t('create_jam.back_to_dashboard')}
          </button>
          <h1 className="text-4xl font-bold">{title}</h1>
        </div>

        {/* Alerts */}
        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
        {success && <SuccessAlert message={success} onDismiss={() => setSuccess(null)} />}

        {/* Spotify Import Section - only in create mode */}
        {mode === 'create' && (
          <>
            <div className="card bg-base-200 shadow-lg mb-6">
              <div className="card-body items-center text-center">
                <h2 className="card-title">{t('create_jam.spotify_import_title')}</h2>
                <p className="text-base-content/70">{t('create_jam.spotify_import_desc')}</p>
                <div className="card-actions mt-2">
                  <button
                    className="btn btn-success"
                    onClick={() => setSpotifyModalOpen(true)}
                  >
                    {t('create_jam.spotify_import_btn')}
                  </button>
                </div>
              </div>
            </div>

            <div className="divider">{t('create_jam.or_manually')}</div>
          </>
        )}

        {/* Form Card */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Jam Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    {t('create_jam.form.jam_name')} <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t('create_jam.form.placeholder_name')}
                  className="input input-bordered"
                  required
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">{t('create_jam.form.description')}</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t('create_jam.form.placeholder_description')}
                  className="textarea textarea-bordered h-24"
                  disabled={loading}
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t('create_jam.form.date')}</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    disabled={loading}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t('create_jam.form.time')}</span>
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    {t('create_jam.form.location')} <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder={t('create_jam.form.placeholder_location')}
                  className="input input-bordered"
                  required
                  disabled={loading}
                />
              </div>

              {/* Host Name and Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      {t('create_jam.form.host_name')} <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    name="hostName"
                    value={formData.hostName}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      {t('create_jam.form.host_contact')} <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    name="hostContact"
                    value={formData.hostContact}
                    onChange={handleInputChange}
                    placeholder={t('create_jam.form.placeholder_contact')}
                    className="input input-bordered"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">{t('create_jam.form.status')}</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="select select-bordered"
                  disabled={loading}
                >
                  <option value="ACTIVE">{t('create_jam.form.status_active')}</option>
                  <option value="INACTIVE">{t('create_jam.form.status_inactive')}</option>
                  <option value="FINISHED">{t('create_jam.form.status_finished')}</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="card-actions justify-between mt-6 pt-4 border-t border-base-300">
                <button
                  type="button"
                  onClick={() => navigate('/host/dashboard')}
                  className="btn btn-ghost"
                  disabled={loading}
                >
                  {t('create_jam.actions.cancel')}
                </button>

                <div className="flex gap-2">
                  {mode === 'edit' && (
                    <button
                      type="button"
                      onClick={handleDelete}
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
              </div>
            </form>
          </div>
        </div>

        {/* Info Box */}
        <div className="alert alert-info mt-6">
          <p>
            {mode === 'create'
              ? t('create_jam.info.create_hint')
              : t('create_jam.info.edit_hint')}
          </p>
        </div>
      </div>

      {/* Spotify Import Modal */}
      <SpotifyImportModal
        isOpen={spotifyModalOpen}
        onClose={() => setSpotifyModalOpen(false)}
        onSuccess={handleSpotifySuccess}
      />
    </div>
  )
}

export default CreateJamPage
