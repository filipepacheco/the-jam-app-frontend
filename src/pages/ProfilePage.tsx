/**
 * Profile Page
 * Display and edit user profile information
 * Accessible to all authenticated users
 */

import React, {useState} from 'react'
import {useAuth} from '../hooks'
import type {AuthUser, UpdateProfileDto} from '../types/auth.types'
import {ProfileHeader} from '../components/ProfileHeader'
import {ProfileFormSection} from '../components/ProfileFormSection'
import {Alert, FullPageSpinner} from '../components'

import {useTranslation} from 'react-i18next'

export function ProfilePage() {
  const { t } = useTranslation()
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
        level: user?.level,
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
    return <FullPageSpinner />
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-200 to-base-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Alerts */}
        {error && <Alert type="error" message={error} title={t('common.error')} />}
        {success && <Alert type="success" message={success} title={t('common.success_title')} />}

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
                      {t('common.saving')}
                    </>
                  ) : (
                    <>💾 {t('common.save_changes')}</>
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

