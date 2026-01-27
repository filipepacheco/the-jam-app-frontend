/**
 * Spotify OAuth Callback Page
 * Handles the PKCE redirect from Spotify, exchanges code for token,
 * and redirects to the jam management page with the access token
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getStoredPKCEState,
  exchangeCodeForToken,
  clearPKCEState,
} from '../lib/spotify/pkce'

export function SpotifyCallbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      const errorParam = searchParams.get('error')
      if (errorParam) {
        clearPKCEState()
        setError(
          errorParam === 'access_denied'
            ? t('spotify.callback.user_denied')
            : t('spotify.callback.auth_failed')
        )
        return
      }

      const code = searchParams.get('code')
      const state = searchParams.get('state')

      if (!code || !state) {
        clearPKCEState()
        setError(t('spotify.callback.auth_failed'))
        return
      }

      const storedState = getStoredPKCEState()
      if (!storedState || storedState.state !== state) {
        clearPKCEState()
        setError(t('spotify.callback.invalid_state'))
        return
      }

      try {
        const accessToken = await exchangeCodeForToken(code)
        const jamId = storedState.jamId
        clearPKCEState()
        navigate(`/host/jams/${jamId}/manage`, {
          replace: true,
          state: { spotifyAccessToken: accessToken },
        })
      } catch {
        clearPKCEState()
        setError(t('spotify.callback.code_exchange_failed'))
      }
    }

    void handleCallback()
  }, [searchParams, navigate, t])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
        <div className="card bg-base-200 w-full max-w-md">
          <div className="card-body text-center">
            <h2 className="card-title justify-center text-error">
              {t('spotify.callback.auth_failed')}
            </h2>
            <p className="text-base-content/70 mt-2">{error}</p>
            <div className="card-actions justify-center mt-6">
              <button
                type="button"
                onClick={() => navigate('/host/dashboard')}
                className="btn btn-primary"
              >
                {t('spotify.callback.retry')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="mt-4 text-base-content/70">{t('spotify.callback.processing')}</p>
      </div>
    </div>
  )
}

export default SpotifyCallbackPage
