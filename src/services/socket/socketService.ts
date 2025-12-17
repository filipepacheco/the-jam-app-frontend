/**
 * Socket Service - Singleton
 * Manages single Socket.IO connection instance with robust connection handling
 */

import {io, type Socket} from 'socket.io-client'
import type {
  ClientToServerEvents,
  ISocketService,
  ServerToClientEvents,
  SocketConnectionState
} from "../../types/socket.types"

/**
 * Socket Service - Singleton pattern
 * Manages the WebSocket connection lifecycle
 */
class SocketService implements ISocketService {
  private static instance: SocketService | null = null
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null
  private connectionState: SocketConnectionState = 'idle'
  private token: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null

  /**
   * Private constructor - use getInstance()
   */
  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService()
    }
    return SocketService.instance
  }

  /**
   * Check if socket is currently connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  /**
   * Get current connection state
   */
  getConnectionState(): SocketConnectionState {
    return this.connectionState
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.token = token
    // If already connected, emit token update
    if (this.socket?.connected) {
      this.socket.auth = { token: `Bearer ${token}` }
    }
  }

  /**
   * Connect to socket server
   */
  async connect(token?: string): Promise<void> {
    if (this.socket?.connected) {
      console.log('✅ Socket already connected')
      return
    }

    if (token) {
      this.token = token
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

      console.log('🔗 Socket connecting to:', baseUrl)

      this.connectionState = 'connecting'

      this.socket = io(baseUrl, {
        auth: {
          token: this.token ? `Bearer ${this.token}` : '',
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        transports: ['websocket', 'polling'],
      })

      // Setup event handlers
      this.setupEventHandlers()

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        if (this.socket?.connected) {
          resolve()
          return
        }

        const onConnect = () => {
          this.socket?.off('connect', onConnect)
          this.socket?.off('connect_error', onError)
          resolve()
        }

        const onError = (error: Error) => {
          this.socket?.off('connect', onConnect)
          this.socket?.off('connect_error', onError)
          reject(error)
        }

        this.socket?.on('connect', onConnect)
        this.socket?.on('connect_error', onError)

        // Timeout after 10 seconds
        const timeout = setTimeout(() => {
          this.socket?.off('connect', onConnect)
          this.socket?.off('connect_error', onError)
          reject(new Error('Socket connection timeout'))
        }, 10000)

        const cleanupTimeout = () => clearTimeout(timeout)
        this.socket?.once('connect', cleanupTimeout)
        this.socket?.once('connect_error', cleanupTimeout)
      })

      this.connectionState = 'connected'
      this.reconnectAttempts = 0
      console.log('✅ Socket connected successfully')
    } catch (error) {
      this.connectionState = 'error'
      console.error('❌ Socket connection failed:', error)
      throw error
    }
  }

  /**
   * Disconnect from socket server
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.socket) {
      this.socket.off()
      this.socket.disconnect()
      this.socket = null
    }

    this.connectionState = 'disconnected'
    this.reconnectAttempts = 0
    console.log('⏹️ Socket disconnected')
  }

  /**
   * Emit event to server
   */
  emit<K extends keyof ClientToServerEvents>(
    event: K,
    data: Parameters<ClientToServerEvents[K]>[0]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'))
        return
      }

      try {
        ;(this.socket.emit as any)(event, data, (response?: any) => {
          // Response can be either an error or success response
          // Only treat it as an error if it's an Error object
          if (response instanceof Error) {
            reject(response)
          } else {
            // Success - response may contain {success: true, message: '...'} or be undefined
            resolve()
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Subscribe to server event
   */
  on<K extends keyof ServerToClientEvents>(
    event: K,
    callback: ServerToClientEvents[K]
  ): void {
    if (!this.socket) {
      console.warn(`⚠️ Socket not initialized, cannot subscribe to ${String(event)}`)
      return
    }

    ;(this.socket.on as any)(event, callback)
  }

  /**
   * Subscribe to server event (once only)
   */
  once<K extends keyof ServerToClientEvents>(
    event: K,
    callback: ServerToClientEvents[K]
  ): void {
    if (!this.socket) {
      console.warn(`⚠️ Socket not initialized, cannot subscribe to ${String(event)}`)
      return
    }

    ;(this.socket.once as any)(event, callback)
  }

  /**
   * Unsubscribe from server event
   */
  off<K extends keyof ServerToClientEvents>(
    event: K,
    callback?: ServerToClientEvents[K]
  ): void {
    if (!this.socket) {
      return
    }

    if (callback) {
      ;(this.socket.off as any)(event, callback)
    } else {
      ;(this.socket.off as any)(event)
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('✅ Socket connected')
      this.connectionState = 'connected'
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Socket disconnected:', reason)
      this.connectionState = 'disconnected'
    })

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ Socket connection error:', error)
      this.connectionState = 'error'
    })

    // Handle reconnection attempts
    ;(this.socket.on as any)('reconnect_attempt', () => {
      this.reconnectAttempts++
      console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
    })

    ;(this.socket.on as any)('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed after max attempts')
      this.connectionState = 'error'
    })
  }
}

// Export singleton instance getter
export function getSocketService(): ISocketService {
  return SocketService.getInstance()
}

// Export for testing
export { SocketService }

