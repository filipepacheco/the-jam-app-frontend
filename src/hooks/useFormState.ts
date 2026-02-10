/**
 * Custom hook for managing form state
 * Encapsulates common form patterns: loading, error, success, and optional redirect handling
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getRedirectPath } from '../utils/navigationUtils'

interface UseFormStateOptions {
  onSuccess?: () => void
  defaultErrorMessage?: string
  navigateOnSuccess?: boolean
}

export function useFormState(options?: UseFormStateOptions) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleError = useCallback((err: unknown) => {
    const message =
      err instanceof Error ? err.message : (options?.defaultErrorMessage || t('errors.generic_error'))
    setError(message)
  }, [options?.defaultErrorMessage, t])

  const handleSuccess = useCallback(() => {
    options?.onSuccess?.()
    if (options?.navigateOnSuccess !== false) {
      navigate(getRedirectPath())
    }
  }, [navigate, options])

  const resetError = useCallback(() => setError(null), [])

  const resetState = useCallback(() => {
    setError(null)
    setSuccess(null)
    setIsLoading(false)
    setSubmitting(false)
  }, [])

  return {
    error,
    setError,
    success,
    setSuccess,
    isLoading,
    setIsLoading,
    submitting,
    setSubmitting,
    handleError,
    handleSuccess,
    resetError,
    resetState,
  }
}
