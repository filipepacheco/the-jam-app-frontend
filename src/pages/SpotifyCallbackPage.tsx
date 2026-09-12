/**
 * Spotify OAuth Callback Page
 * Handles the PKCE redirect from Spotify, exchanges code for token,
 * and redirects to the jam management page with the access token
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from '../components/FeedbackStates'
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
        <ErrorState
          className="w-full max-w-md"
          role="alert"
          title={t('spotify.callback.auth_failed')}
          description={error}
          action={{
            label: t('spotify.callback.retry'),
            onClick: () => navigate('/host/dashboard'),
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <LoadingState label={t('spotify.callback.processing')} />
    </div>
  )
}

export default SpotifyCallbackPage
