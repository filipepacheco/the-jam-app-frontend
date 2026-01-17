/**
 * Host - Test Songs Management Page
 * Quick access to test the songs management functionality
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as jamService from '../services/jamService'
import type { JamResponseDto } from '../types/api.types'
import { ErrorAlert } from '../components/ErrorAlert'

export function HostTestSongsPage() {
  const navigate = useNavigate()
  const [jams, setJams] = useState<JamResponseDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadJams()
  }, [])

  const loadJams = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await jamService.findAll()
      setJams(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jams')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-100 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h1 className="card-title text-2xl mb-4">🎵 Host: Test Songs Management</h1>
            <p className="text-base-content/70 mb-6">
              Select a jam to manage its songs and test linking music to jams.
            </p>

            {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg" />
              </div>
            ) : jams.length === 0 ? (
              <div className="alert alert-warning">
                <p>No jams found. Please create a jam first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {jams.map((jam) => (
                  <div key={jam.id} className="card bg-base-100 shadow-md">
                    <div className="card-body p-4 flex flex-row items-center justify-between">
                      <div>
                        <h3 className="font-bold">{jam.name || 'Jam'}</h3>
                        <p className="text-sm text-base-content/70">ID: {jam.id}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/host/jams/${jam.id}/songs`)}
                        className="btn btn-primary btn-sm"
                      >
                        Manage Songs →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HostTestSongsPage

