/**
 * Page-level alert state management hook
 * Minimal hook for error/success state in pages (not forms/modals - use useFormState for those)
 */

import { useState, useCallback } from 'react'

export function usePageAlerts() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])
  const clearSuccess = useCallback(() => setSuccess(null), [])
  const clearAll = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  return {
    error,
    setError,
    clearError,
    success,
    setSuccess,
    clearSuccess,
    clearAll,
  }
}
