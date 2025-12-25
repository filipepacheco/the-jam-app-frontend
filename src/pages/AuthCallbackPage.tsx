/**
 * Auth Callback Page
 * Handles OAuth redirect from Supabase after social login
 */

import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useAuth} from '../hooks'
import {useTranslation} from 'react-i18next'

export function AuthCallbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, isNewUser } = useAuth()
  const [error, setError] = useState<string | null>(null)

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
  }, [isAuthenticated, isLoading, isNewUser, navigate])

  // Show error if OAuth failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
        <div className="card bg-base-200 w-full max-w-md">
          <div className="card-body text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="card-title justify-center text-error">Authentication Failed</h2>
            <p className="text-base-content/70 mt-2">{error}</p>
            <div className="card-actions justify-center mt-6">
              <a href="/login" className="btn btn-primary">
                Try Again
              </a>
              <a href="/" className="btn btn-ghost">
                Go Home
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

