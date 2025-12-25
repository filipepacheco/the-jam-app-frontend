/**
 * Profile Page
 * Display and edit user profile information
 * Accessible to all authenticated users
 */

import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useAuth} from '../hooks'
import type {AuthUser, UpdateProfileDto} from '../types/auth.types'
import {ProfileHeader} from '../components/ProfileHeader'
import {ProfileFormSection} from '../components/ProfileFormSection'
import {ErrorAlert, SuccessAlert} from '../components'

import {useTranslation} from 'react-i18next'

export function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading, updateProfile } = useAuth()

  // State
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<AuthUser>>({})

  // ... (auth guard and init from user)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  const handleEditToggle = () => {
    if (isEditMode) {
      // Revert to original data when canceling
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        contact: user?.contact || '',
        instrument: user?.instrument || '',
        genre: user?.genre || '',
        level: user?.level || '',
        hostName: user?.hostName || '',
        hostContact: user?.hostContact || '',
      })
      setError(null)
    }
    setIsEditMode(!isEditMode)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    if (!formData.name?.trim()) {
      setError(t('profile.name_required'))
      return
    }

    if (!formData.phone?.trim()) {
      setError(t('profile.phone_required'))
      return
    }

    setIsLoading(true)

    try {
      const updates: UpdateProfileDto = {
        name: formData.name,
        contact: formData.contact,
        instrument: formData.instrument,
        level: formData.level,
      }

      await updateProfile(updates)

      setSuccess(t('profile.update_success'))
      setIsEditMode(false)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.update_failed'))
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-200 to-base-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Alerts */}
        {error && <ErrorAlert message={error} title={t('common.error')} />}
        {success && <SuccessAlert message={success} title={t('common.success_title')} />}

        {/* Profile Header */}
        <ProfileHeader user={user} />

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          {/* Contact Information Section */}
          <ProfileFormSection
            title={t('profile.contact_info')}
            icon="📞"
            isEditMode={isEditMode}
            fields={[
              {
                name: 'name',
                label: t('profile.name_label'),
                type: 'text',
                value: formData.name || '',
                onChange: handleInputChange,
                disabled: isLoading,
                readOnly: !isEditMode,
              },
              {
                name: 'email',
                label: t('profile.email_label'),
                type: 'email',
                value: formData.email || '',
                onChange: handleInputChange,
                disabled: true,
                readOnly: true,
              },
              {
                name: 'phone',
                label: t('profile.phone_label'),
                type: 'tel',
                value: formData.phone || '',
                onChange: handleInputChange,
                disabled: isLoading || !isEditMode,
                readOnly: !isEditMode,
              },
              {
                name: 'contact',
                label: t('profile.contact_label'),
                type: 'text',
                value: formData.contact || '',
                onChange: handleInputChange,
                disabled: isLoading || !isEditMode,
                readOnly: !isEditMode,
              },
            ]}
          />

          {/* Musician Profile Section - Only for musicians */}
          {user.role === 'user' && (
            <ProfileFormSection
              title={t('profile.musician_profile')}
              icon="🎸"
              isEditMode={isEditMode}
              fields={[
                {
                  name: 'instrument',
                  label: t('profile.instrument_label'),
                  type: 'text',
                  value: formData.instrument || '',
                  onChange: handleInputChange,
                  disabled: isLoading || !isEditMode,
                  readOnly: !isEditMode,
                },
                {
                  name: 'genre',
                  label: t('profile.genre_label'),
                  type: 'text',
                  value: formData.genre || '',
                  onChange: handleInputChange,
                  disabled: isLoading || !isEditMode,
                  readOnly: !isEditMode,
                },
                {
                  name: 'level',
                  label: t('profile.level_label'),
                  type: 'select',
                  value: formData.level || '',
                  onChange: handleInputChange,
                  disabled: isLoading || !isEditMode,
                  readOnly: !isEditMode,
                  options: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL'],
                },
              ]}
            />
          )}

          {/* Host Information Section - Only for hosts */}
          {user.isHost && (
            <ProfileFormSection
              title={t('profile.host_info')}
              icon="🎤"
              isEditMode={isEditMode}
              fields={[
                {
                  name: 'hostName',
                  label: t('profile.host_name_label'),
                  type: 'text',
                  value: formData.hostName || '',
                  onChange: handleInputChange,
                  disabled: isLoading || !isEditMode,
                  readOnly: !isEditMode,
                },
                {
                  name: 'hostContact',
                  label: t('profile.host_contact_label'),
                  type: 'text',
                  value: formData.hostContact || '',
                  onChange: handleInputChange,
                  disabled: isLoading || !isEditMode,
                  readOnly: !isEditMode,
                },
              ]}
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center pt-6">
            {!isEditMode ? (
              <button
                type="button"
                onClick={handleEditToggle}
                className="btn btn-primary btn-lg"
              >
                ✏️ {t('profile.edit_profile')}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleEditToggle}
                  disabled={isLoading}
                  className="btn btn-ghost btn-lg"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-lg"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      {t('profile.saving')}
                    </>
                  ) : (
                    <>💾 {t('profile.save_changes')}</>
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfilePage

