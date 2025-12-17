/**
 * useSocketListeners Hook
 * Subscribes to multiple socket events with automatic cleanup
 */

import {useEffect} from 'react'
import {getSocketService} from '../services/socket/socketService'
import type {ServerToClientEvents} from '../types/socket.types'

/**
 * Subscribe to multiple socket events with automatic cleanup
 * @param listeners - Record of event names and their callbacks
 * @param dependencies - React dependency array (optional)
 *
 * @example
 * useSocketListeners({
 *   'registration:created': (data) => console.log('New registration:', data),
 *   'musician:joined': (data) => console.log('Musician joined:', data),
 * }, [jamId])
 */
export function useSocketListeners(
  listeners: Partial<{
    [K in keyof ServerToClientEvents]: ServerToClientEvents[K]
  }>,
  dependencies: any[] = []
): void {
  const socketService = getSocketService()

  useEffect(() => {
    // Subscribe to all listeners
    Object.entries(listeners).forEach(([event, callback]) => {
      if (callback) {
        socketService.on(event as keyof ServerToClientEvents, callback as any)
      }
    })

    // Cleanup: unsubscribe from all listeners
    return () => {
      Object.entries(listeners).forEach(([event, callback]) => {
        if (callback) {
          socketService.off(event as keyof ServerToClientEvents, callback as any)
        }
      })
    }
  }, dependencies) // eslint-disable-line react-hooks/exhaustive-deps
}

