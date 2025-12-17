/**
 * useJamState Hook
 * Access global jam context state
 */

import {useContext} from 'react'
import {JamContext, type JamContextType} from '../contexts'

/**
 * Hook to access jam context
 * @returns Jam context state and actions
 * @throws Error if used outside JamProvider
 *
 * @example
 * const { jam, musicians, joinJam } = useJamState()
 */
export function useJamState(): JamContextType {
  const context = useContext(JamContext)

  if (!context) {
    throw new Error('useJamState must be used within <JamProvider>')
  }

  return context
}

