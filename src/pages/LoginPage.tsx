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

import {useTranslation} from 'react-i18next'

export function LoginPage() {
  const { t } = useTranslation()
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
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg"></span>
          <span className="text-sm sm:text-base font-semibold text-base-content/70">{t('common.loading')}</span>
        </div>
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
    <div className="min-h-screen flex items-center justify-center bg-base-100 px-2 sm:px-4 py-4 sm:py-8">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3">{t('auth.login_page_title')}</h1>
          <p className="text-xs sm:text-sm lg:text-base text-base-content/70">
            {useSupabase ? t('auth.login_page_supabase_desc') : t('auth.login_page_simple_desc')}
          </p>
        </div>

        {/* Login Form - Use Supabase if configured, otherwise fallback */}
        {useSupabase ? <SupabaseLoginForm /> : <SimpleLoginForm />}

        {/* Footer Links */}
        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm">
          <a href="/" className="link link-hover text-primary">
            {t('auth.back_to_home')}
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
