/**
 * Register Page
 * For new users to create an account
 * Uses simplified email/phone registration that auto-creates account on first login
 */

import {useNavigate} from 'react-router-dom'
import {useAuth} from '../hooks'
import SimpleLoginForm from '../components/forms/SimpleLoginForm'

import {useTranslation} from 'react-i18next'

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()

  // If user is already authenticated, redirect to home
  if (isAuthenticated) {
    navigate('/')
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('auth.register_page_title')}</h1>
          <p className="text-base-content/70">{t('auth.register_page_subtitle')}</p>
        </div>

        {/* Info Box */}
        <div className="alert alert-info mb-6">
          <div>
            <p className="font-semibold">{t('auth.register_how_it_works')}</p>
            <p className="text-sm">{t('auth.register_how_it_works_desc')}</p>
          </div>
        </div>

        {/* Registration Form (reuses login form) */}
        <SimpleLoginForm />

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-base-content/60">{t('auth.already_have_account')}</p>
          <a href="/login" className="link link-hover text-primary font-semibold">
            {t('auth.login_here')}
          </a>
        </div>

        <div className="mt-6 text-center text-sm">
          <a href="/" className="link link-hover text-base-content/60">
            {t('auth.back_to_home')}
          </a>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage

