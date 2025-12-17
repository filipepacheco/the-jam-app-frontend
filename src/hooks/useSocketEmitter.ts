/**
 * useSocketEmitter Hook
 * Provides a function to emit socket events with error handling
 */

import {useCallback} from 'react'
import {getSocketService} from '../services/socket/socketService'
import type {ClientToServerEvents} from '../types/socket.types'

/**
 * Hook for emitting socket events
 * @param eventName - Name of the event to emit
 * @returns Function to emit the event with payload
 *
 * @example
 * const emit = useSocketEmitter('joinJam')
 * emit({ jamId: '123' }).catch(err => console.error(err))
 */
export function useSocketEmitter<K extends keyof ClientToServerEvents>(
  eventName: K
): (payload: Parameters<ClientToServerEvents[K]>[0]) => Promise<void> {
  const socketService = getSocketService()

  return useCallback(
    async (payload: Parameters<ClientToServerEvents[K]>[0]) => {
      try {
        if (!socketService.isConnected()) {
          throw new Error('Socket not connected')
        }

        await socketService.emit(eventName, payload)
      } catch (error) {
        console.error(`❌ Failed to emit event ${String(eventName)}:`, error)
        throw error
      }
    },
    [eventName, socketService]
  )
}

