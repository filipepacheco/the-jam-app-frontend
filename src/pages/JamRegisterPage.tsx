/**
 * Jam Register
 * Page for registering to a specific jam with jam context
 */

import {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {useAuth} from '../hooks'
import type {JamDetails} from '../services'
import * as jamService from '../services/jamService'
import {Alert, FullPageSpinner, JamContextDisplay, JamRegistrationForm} from '../components'

export function JamRegisterPage() {
  const { jamId } = useParams<{ jamId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuth()
  const [jam, setJam] = useState<JamDetails | null>(null)
  const [mostNeededSpecialty, setMostNeededSpecialty] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/jams/${jamId}/register`)
    }
  }, [isAuthenticated, jamId, navigate])

  useEffect(() => {
    const fetchJam = async () => {
      if (!jamId) {
        setError(t('errors.jam_id_not_provided'))
        setLoading(false)
        return
      }

      try {
        const jamData = await jamService.getJamDetails(jamId)
        setJam(jamData)

        // Compute most needed specialty from already-fetched data
        const available = jamData.specialtySlots
          .map((slot) => ({
            specialty: slot.specialty,
            availableSlots: Math.max(0, slot.required - slot.registered),
          }))
          .filter((item) => item.availableSlots > 0)
          .sort((a, b) => b.availableSlots - a.availableSlots)
        setMostNeededSpecialty(available.length > 0 ? available[0].specialty : null)
      } catch (err) {
        const message = err instanceof Error ? err.message : t('errors.failed_to_load_jam')
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchJam()
  }, [jamId])

  const handleRegistration = async (specialty: string, level: string) => {
    // TODO: Call registration API endpoint
    // For now, just resolve
    return Promise.resolve()
  }

  if (!isAuthenticated) {
    return null // Redirecting...
  }

  if (loading) {
    return <FullPageSpinner />
  }

  if (error || !jam) {
    return (
      <div className="min-h-screen bg-base-100 p-4">
        <div className="container mx-auto max-w-2xl">
          <Alert type="error" message={error || t('jams.not_found')} title={t('jams.error_loading_jam')} />
          <button onClick={() => navigate('/jams')} className="btn btn-primary mt-4">
            {t('jams.back_to_jams')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-base-200 border-b border-base-300">
        <div className="container mx-auto max-w-2xl px-4 py-6">
          <button
            onClick={() => navigate(`/jams/${jamId}`)}
            className="btn btn-ghost btn-sm mb-4"
          >
            {t('jams.back_to_jam')}
          </button>
          <h1 className="text-3xl font-bold">{t('jams.register_for_name', { name: jam.name })}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-6">
          {/* Jam Context */}
          <JamContextDisplay jam={jam} />

          {/* User Info */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="font-semibold">👤 {t('jams.registering_as')}</h3>
              <p className="mt-2">
                <span className="font-semibold">{user?.name}</span>
                <span className="text-base-content/70 ml-2">({user?.email || user?.phone})</span>
              </p>
              <a href="/profile" className="link link-sm mt-2">
                {t('profile.edit_profile')} →
              </a>
            </div>
          </div>

          {/* Registration Form */}
          <JamRegistrationForm
            jam={jam}
            onSubmit={handleRegistration}
            defaultSpecialty={mostNeededSpecialty}
          />
        </div>
      </div>
    </div>
  )
}



