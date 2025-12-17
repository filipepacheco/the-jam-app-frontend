/**
 * Socket Debugging Utilities
 * Tools for debugging and monitoring socket connections
 */

import {getSocketService} from './socket'
import {getOfflineQueueManager} from './offlineQueue'
import type {SocketConnectionState} from '../types/socket.types'

interface SocketDebugInfo {
  isConnected: boolean
  connectionState: SocketConnectionState
  baseUrl: string
  hasToken: boolean
  onlineStatus: boolean
  queueStats: {
    total: number
    pending: number
    failed: number
  }
  timestamp: number
}

/**
 * Socket Debugger
 * Provides debugging and monitoring capabilities
 */
export class SocketDebugger {
  private socketService = getSocketService()
  private queueManager = getOfflineQueueManager()
  private isEnabled = false
  private logHistory: string[] = []
  private maxHistorySize = 100

  /**
   * Enable socket debugging (logs all events)
   */
  enable(): void {
    if (this.isEnabled) return

    this.isEnabled = true
    this.log('🔍 Socket debugging enabled')

    // Listen to all events
    this.socketService.on('connect', () => this.log('✅ Connected'))
    this.socketService.on('disconnect', () => this.log('❌ Disconnected'))
    this.socketService.on('connect_error', (err: Error) =>
      this.log(`❌ Connection error: ${err.message}`)
    )

    // Log every socket event
    this.logSocketEvents()
  }

  /**
   * Disable socket debugging
   */
  disable(): void {
    this.isEnabled = false
    this.log('🔍 Socket debugging disabled')
  }

  /**
   * Get debug information
   */
  getDebugInfo(): SocketDebugInfo {
    const queueStats = this.queueManager.getStats()

    return {
      isConnected: this.socketService.isConnected(),
      connectionState: this.socketService.getConnectionState(),
      baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      hasToken: !!localStorage.getItem('token'),
      onlineStatus: navigator.onLine,
      queueStats,
      timestamp: Date.now(),
    }
  }

  /**
   * Print debug information to console
   */
  printDebugInfo(): void {
    const info = this.getDebugInfo()
    console.group('🧪 Socket Debug Info')
    console.log('Connection:', info.isConnected ? '✅ Connected' : '❌ Disconnected')
    console.log('State:', info.connectionState)
    console.log('Base URL:', info.baseUrl)
    console.log('Token:', info.hasToken ? '✅ Present' : '❌ Missing')
    console.log('Online:', info.onlineStatus ? '✅ Yes' : '❌ No')
    console.log('Queue Stats:', info.queueStats)
    console.groupEnd()
  }

  /**
   * Get log history
   */
  getLogHistory(): string[] {
    return [...this.logHistory]
  }

  /**
   * Clear log history
   */
  clearLogHistory(): void {
    this.logHistory = []
    this.log('📋 Log history cleared')
  }

  /**
   * Print log history
   */
  printLogHistory(): void {
    console.group('📋 Socket Log History')
    this.logHistory.forEach(log => console.log(log))
    console.groupEnd()
  }

  /**
   * Test connection to backend
   */
  async testConnection(
    baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  ): Promise<boolean> {
    try {
      this.log(`🧪 Testing connection to ${baseUrl}`)

      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        mode: 'cors',
      })

      if (response.ok) {
        this.log('✅ Backend health check passed')
        return true
      } else {
        this.log(`❌ Backend health check failed: ${response.status}`)
        return false
      }
    } catch (err) {
      this.log(`❌ Connection test failed: ${err instanceof Error ? err.message : String(err)}`)
      return false
    }
  }

  /**
   * Export debug data
   */
  exportDebugData(): {
    debugInfo: SocketDebugInfo
    logHistory: string[]
    queue: any[]
  } {
    return {
      debugInfo: this.getDebugInfo(),
      logHistory: this.getLogHistory(),
      queue: this.queueManager.getQueue(),
    }
  }

  /**
   * Print everything for support
   */
  printDebugBundle(): void {
    console.group('🐛 Socket Debug Bundle')
    this.printDebugInfo()
    console.log('')
    this.printLogHistory()
    console.log('')
    console.log('Queue:', this.queueManager.getQueue())
    console.groupEnd()

    console.log('📋 Debug data exported. Copy the above for support.')
  }

  /**
   * Log a message
   */
  private log(message: string): void {
    const timestamp = new Date().toLocaleTimeString()
    const fullMessage = `[${timestamp}] ${message}`

    console.log(fullMessage)

    this.logHistory.push(fullMessage)
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift()
    }
  }

  /**
   * Monitor socket events
   */
  private logSocketEvents(): void {
    const events = [
      'live:state-sync',
      'schedule:created',
      'schedule:updated',
      'registration:created',
      'registration:approved',
      'musicianJoined',
      'musicianLeft',
      'error',
    ]

    events.forEach(event => {
      this.socketService.on(event as any, (data: any) => {
        this.log(`📨 Event: ${event}`)
        console.debug(`[${event}]`, data)
      })
    })
  }
}

/**
 * Global socket debugger instance
 */
let debuggerInstance: SocketDebugger | null = null

/**
 * Get or create socket debugger
 */
export function getSocketDebugger(): SocketDebugger {
  if (!debuggerInstance) {
    debuggerInstance = new SocketDebugger()
  }
  return debuggerInstance
}

/**
 * Expose debugger to window for console access
 */
if (typeof window !== 'undefined') {
  ;(window as any).__socketDebugger = getSocketDebugger()
  console.log('💡 Socket debugger available: window.__socketDebugger')
  console.log('Commands:')
  console.log('  __socketDebugger.enable() - Enable debugging')
  console.log('  __socketDebugger.disable() - Disable debugging')
  console.log('  __socketDebugger.printDebugInfo() - Print debug info')
  console.log('  __socketDebugger.printLogHistory() - Print log history')
  console.log('  __socketDebugger.printDebugBundle() - Print everything')
  console.log('  __socketDebugger.exportDebugData() - Get raw debug data')
  console.log('  await __socketDebugger.testConnection() - Test backend connection')
}

