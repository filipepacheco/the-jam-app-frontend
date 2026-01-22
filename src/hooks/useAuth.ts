/**
 * useAuth Hook
 * Custom hook to consume AuthContext
 */

import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import type { AuthContextType } from '../types/auth.types'

/**
 * Custom hook to access authentication context
 * Must be used within AuthProvider
 * @returns AuthContextType with all auth state and methods
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

