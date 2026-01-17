/**
 * Auth Callback Page
 * Handles OAuth redirect from Supabase after social login
 */

import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useAuth} from '../hooks/useAuth'
import {useTranslation} from 'react-i18next'

export function AuthCallbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, isNewUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    // Get redirect path from session storage (set before OAuth redirect)
    const getRedirectPath = () => {
      // If new user, redirect to login page to show ProfileSetupModal
      const storedRedirect = sessionStorage.getItem('auth_redirect')
      if (storedRedirect) {
        sessionStorage.removeItem('auth_redirect')
        return storedRedirect
      }
      return '/'
    }

    // Check for error in URL (Supabase puts errors in hash)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const errorDescription = hashParams.get('error_description')

    if (errorDescription) {
      // Clean up session storage on error
      sessionStorage.removeItem('auth_redirect')
      setError(decodeURIComponent(errorDescription))
      return
    }

    // If authenticated and not loading, redirect
    if (!isLoading && isAuthenticated) {
      // Small delay to allow state to settle
      const timer = setTimeout(() => {
        const redirectPath = getRedirectPath()
        navigate(redirectPath, { replace: true })
      }, 500)

      return () => clearTimeout(timer)
    }

    // Set timeout: if not authenticated after 10 seconds, show error
    const timeoutId = setTimeout(() => {
      if (!isAuthenticated && !error && isLoading) {
        setTimedOut(true)
      }
    }, 10000)

    return () => clearTimeout(timeoutId)
  }, [isAuthenticated, isLoading, isNewUser, navigate, error])

  // Show error if OAuth failed or timed out
  if (error || timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
        <div className="card bg-base-200 w-full max-w-md">
          <div className="card-body text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="card-title justify-center text-error">Authentication Failed</h2>
            <p className="text-base-content/70 mt-2">
              {timedOut
                ? 'Authentication is taking too long. Please try again.'
                : error}
            </p>
            <div className="card-actions justify-center mt-6">
              <a href="/login" className="btn btn-primary">
                {t('auth.try_again')}
              </a>
              <a href="/" className="btn btn-ghost">
                {t('auth.go_home')}
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading spinner while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="mt-4 text-base-content/70">Completing sign in...</p>
      </div>
    </div>
  )
}

export default AuthCallbackPage

