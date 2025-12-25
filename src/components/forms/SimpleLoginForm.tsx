/**
 * Simple Login Form Component
 * Single input for email or phone login with smart post-login redirects
 */

import {useState} from 'react'
import {useAuth} from '../../hooks'
import {loginOrRegister} from '../../services'
import {ErrorAlert} from '../index'
import {useLocation, useNavigate} from 'react-router-dom'
import {useTranslation} from 'react-i18next'

export function SimpleLoginForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Determine redirect destination based on:
  // 1. ?redirect= query param (explicit override)
  // 2. Coming from jam registration flow (?jamId param)
  // 3. Referrer from jam detail page
  // 4. Default to home page
  const getRedirectPath = () => {
    const params = new URLSearchParams(window.location.search)

    // Check for explicit redirect param
    const redirectParam = params.get('redirect')
    if (redirectParam) {
      return redirectParam
    }

    // Check if coming from jam registration flow (has jam context in search)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedInput = input.trim()

    // Determine if email or phone
    const isEmail = trimmedInput.includes('@')
    const isPhone = /^\d/.test(trimmedInput.replace(/\D/g, ''))

    if (!isEmail && !isPhone) {
      setError(t('errors.invalid_email_phone'))
      return
    }

    setIsLoading(true)

    try {
      const result = await loginOrRegister(isEmail ? trimmedInput : undefined, !isEmail ? trimmedInput : undefined)

      // Login successful - update auth context with user and token
      login(result.user, result.token)

      // Redirect to appropriate location based on context
      const redirectPath = getRedirectPath()
      navigate(redirectPath)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.auth_failed')
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email/Phone Input */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">{t('auth.email_phone_label')}</span>
            </label>
            <input
              type="text"
              placeholder={t('auth.email_phone_placeholder')}
              className="input input-bordered"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <label className="label">
              <span className="label-text-alt text-xs text-base-content/60">
                {t('auth.phone_hint')}
              </span>
            </label>
          </div>

          {/* Error Alert */}
          {error && (
            <ErrorAlert
              message={error}
              title={t('auth.login_error_title')}
            />
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {t('auth.logging_in')}
              </>
            ) : (
              t('common.continue')
            )}
          </button>
        </form>

        {/* Info */}
        <div className="divider my-2"></div>
        <p className="text-xs text-base-content/60 text-center">
          {t('auth.terms_agreement')}
        </p>
      </div>
    </div>
  )
}

export default SimpleLoginForm

