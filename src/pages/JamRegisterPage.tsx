/**
 * Jam Register Page
 * Page for registering to a specific jam with jam context
 */

import {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {useAuth} from '../hooks'
import type {JamDetails} from '../services'
import {jamService} from '../services'
import {JamContextDisplay} from '../components/JamContextDisplay'
import {JamRegistrationForm} from '../components/forms/JamRegistrationForm'
import {ErrorAlert} from '../components'

export function JamRegisterPage() {
  const { jamId } = useParams<{ jamId: string }>()
  const navigate = useNavigate()
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
        setError('Jam ID not provided')
        setLoading(false)
        return
      }

      try {
        const jamData = await jamService.getJamDetails(jamId)
        setJam(jamData)

        // Get most needed specialty for pre-selection
        const mostNeeded = await jamService.getMostNeededSpecialty(jamId)
        setMostNeededSpecialty(mostNeeded)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load jam'
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
    console.log('Registering with specialty:', specialty, 'level:', level)
    return Promise.resolve()
  }

  if (!isAuthenticated) {
    return null // Redirecting...
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  if (error || !jam) {
    return (
      <div className="min-h-screen bg-base-100 p-4">
        <div className="container mx-auto max-w-2xl">
          <ErrorAlert message={error || 'Jam not found'} title="Error Loading Jam" />
          <button onClick={() => navigate('/jams')} className="btn btn-primary mt-4">
            ← Back to Jams
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
            ← Back to Jam
          </button>
          <h1 className="text-3xl font-bold">Register for {jam.nome}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-6">
          {/* Jam Context */}
          <JamContextDisplay jam={jam as any} />

          {/* User Info */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="font-semibold">👤 Registering as</h3>
              <p className="mt-2">
                <span className="font-semibold">{user?.name}</span>
                <span className="text-base-content/70 ml-2">({user?.email || user?.phone})</span>
              </p>
              <a href="/profile" className="link link-sm mt-2">
                Edit profile →
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

export default JamRegisterPage

