/**
 * Create/Edit Jam Page
 * Unified form for creating new jams and editing existing ones
 * Routes: /host/create-jam (create) and /host/jams/:id/edit (edit)
 */

import {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {useAuth} from '../hooks'
import {jamService} from '../services'
import {ErrorAlert, SuccessAlert} from '../components'

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

  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
      loadJamData(jamId)
    } else {
      setMode('create')
    }
  }, [jamId, isAuthenticated, authLoading, navigate, user])

  const loadJamData = async (id: string) => {
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to load jam'
      console.error('❌ Error loading jam:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

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
      setError('Jam name is required')
      return false
    }
    if (!formData.location.trim()) {
      setError('Location is required')
      return false
    }
    if (!formData.hostMusicianId) {
      setError('Host musician ID is required')
      return false
    }
    if (formData.date && !formData.time) {
      setError('Time is required when date is specified')
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
        setSuccess(`✓ Jam "${result.data.name}" created successfully!`)
        // Redirect to dashboard after short delay
        setTimeout(() => navigate('/host/dashboard'), 1500)
      } else if (jamId) {
        const result = await jamService.update(jamId, jamPayload)
        setSuccess(`✓ Jam "${result.data.name}" updated successfully!`)
        setTimeout(() => navigate('/host/dashboard'), 1500)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save jam'
      console.error('❌ Error saving jam:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!jamId) return

    if (!confirm('Are you sure you want to delete this jam? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await jamService.deleteFn(jamId)
      setSuccess('Jam deleted successfully!')
      setTimeout(() => navigate('/host/dashboard'), 1500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete jam'
      console.error('❌ Error deleting jam:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Show loading spinner while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  const title = mode === 'create' ? 'Create New Jam' : `Edit "${formData.name}"`

  return (
    <div className="min-h-screen bg-base-100 p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/host/dashboard')}
            className="btn btn-ghost btn-sm mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold">{title}</h1>
        </div>

        {/* Alerts */}
        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
        {success && <SuccessAlert message={success} onDismiss={() => setSuccess(null)} />}

        {/* Form Card */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Jam Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Jam Name <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Jazz Night 2025"
                  className="input input-bordered"
                  required
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Description</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of your jam session..."
                  className="textarea textarea-bordered h-24"
                  disabled={loading}
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Date</span>
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
                    <span className="label-text font-semibold">Time</span>
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
                    Location <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Studio A, 123 Music St"
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
                      Host Name <span className="text-error">*</span>
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
                      Host Contact <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    name="hostContact"
                    value={formData.hostContact}
                    onChange={handleInputChange}
                    placeholder="Email or phone"
                    className="input input-bordered"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Status</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="select select-bordered"
                  disabled={loading}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="FINISHED">Finished</option>
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
                  Cancel
                </button>

                <div className="flex gap-2">
                  {mode === 'edit' && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="btn btn-error btn-outline"
                      disabled={loading}
                    >
                      Delete Jam
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
                        Saving...
                      </>
                    ) : mode === 'create' ? (
                      'Create Jam'
                    ) : (
                      'Update Jam'
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
            💡 {mode === 'create'
              ? 'Create a new jam session. You can add songs and manage registrations later.'
              : 'Update the jam details. Changes will be saved immediately.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default CreateJamPage

