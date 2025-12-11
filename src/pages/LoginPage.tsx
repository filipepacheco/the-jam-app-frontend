/**
 * Login Page
 * Supabase auth with email/password and social OAuth login
 */

import {useEffect, useState} from 'react'
import {useAuth} from '../hooks'
import {useNavigate} from 'react-router-dom'
import {SupabaseLoginForm} from '../components/forms/SupabaseLoginForm'
import {isSupabaseConfigured} from '../lib/supabase'
import SimpleLoginForm from '../components/forms/SimpleLoginForm'
import {ProfileSetupModal} from "../components";

export function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, user, isNewUser } = useAuth()
  const [showProfileSetup, setShowProfileSetup] = useState(false)

  // Determine smart redirect destination
  const getRedirectPath = () => {
    const params = new URLSearchParams(window.location.search)

    // Check for explicit redirect param
    const redirectParam = params.get('redirect')
    if (redirectParam) {
      return redirectParam
    }

    // Check if coming from jam registration flow
    const jamId = params.get('jamId')
    if (jamId) {
      return `/jams/${jamId}/register`
    }

    // Check if we came from a jam detail page
    const referer = document.referrer
    if (referer.includes('/jams/')) {
      const match = referer.match(/\/jams\/([^/]+)/)
      if (match) {
        return `/jams/${match[1]}`
      }
    }

    // Default to home
    return '/'
  }

  // If user is already authenticated, redirect to appropriate location
  useEffect(() => {
    if (isAuthenticated) {
      // Check if new user without name - show profile setup modal
      if (isNewUser && user?.name === null) {
        setShowProfileSetup(true)
        return // Don't redirect yet, let user complete profile
      }
      // For existing users or users with complete profile, redirect
      navigate(getRedirectPath(), { replace: true })
    }
  }, [isAuthenticated, isNewUser, user?.name, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  // If authenticated and not showing profile setup modal, redirect or return null
  if (isAuthenticated && !showProfileSetup) {
    return null
  }

  const useSupabase = isSupabaseConfigured()

  const handleProfileSetupClose = () => {
    setShowProfileSetup(false)
    // Redirect after profile setup is complete
    navigate(getRedirectPath(), { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🎸 Jam Session</h1>
          <p className="text-base-content/70">
            {useSupabase ? 'Sign in to your account with your email or social account' : 'Login or create your musician account'}
          </p>
        </div>

        {/* Login Form - Use Supabase if configured, otherwise fallback */}
        {useSupabase ? <SupabaseLoginForm /> : <SimpleLoginForm />}

        {/* Footer Links */}
        <div className="mt-8 text-center text-sm">
          <a href="/" className="link link-hover text-primary">
            ← Back to Home
          </a>
        </div>
      </div>

      {/* Profile Setup Modal - Show for new users with null name */}
      <ProfileSetupModal
        isOpen={showProfileSetup}
        onClose={handleProfileSetupClose}
      />
    </div>
  )
}

export default LoginPage
