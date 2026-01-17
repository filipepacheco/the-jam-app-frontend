/**
 * Custom hook for managing form state
 * Encapsulates common form patterns: loading, error, and redirect handling
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getRedirectPath } from '../utils/navigationUtils'

interface UseFormStateOptions {
  onSuccess?: () => void
  defaultErrorMessage?: string
}

export function useFormState(options?: UseFormStateOptions) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleError = (err: unknown) => {
    const message =
      err instanceof Error ? err.message : (options?.defaultErrorMessage || t('errors.generic_error'))
    setError(message)
  }

  const handleSuccess = () => {
    options?.onSuccess?.()
    navigate(getRedirectPath())
  }

  const resetError = () => setError(null)

  return {
    error,
    setError,
    isLoading,
    setIsLoading,
    handleError,
    handleSuccess,
    resetError,
  }
}
