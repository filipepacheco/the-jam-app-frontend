/**
 * Socket Testing Utilities
 * Helpers for testing socket connections and events in components
 */


import type {ServerToClientEvents} from "../../types/socket.types.ts";

/**
 * Mock Socket IO Server for testing
 * Simulates backend socket behavior
 */
export class MockSocketServer {
  private listeners: Map<string, Set<Function>> = new Map()
  private connectedClients: Set<string> = new Set()
  private isRunning = false

  constructor() {
    this.isRunning = true
  }

  /**
   * Simulate receiving an event from client
   */
  receiveFromClient(clientId: string, event: string, data: any): void {
    console.log(`[MockSocketServer] Received from client ${clientId}: ${event}`)

    // Handle joinJam
    if (event === 'joinJam') {
      this.connectedClients.add(clientId)
      this.broadcastToAll('musicianJoined', {
        jamId: data.jamId,
        musician: { id: clientId, name: 'Test Musician', instrument: 'guitar', level: 'BEGINNER', contact: clientId },
        role: 'musician',
        timestamp: Date.now(),
      })
    }

    // Handle leaveJam
    if (event === 'leaveJam') {
      this.connectedClients.delete(clientId)
      this.broadcastToAll('musicianLeft', {
        jamId: data.jamId,
        musicianId: clientId,
        musicianName: 'Test Musician',
        role: 'musician',
        timestamp: Date.now(),
      })
    }

    // Handle state requests
    if (event.includes('request-state')) {
      const jamId = data.jamId
      this.sendToClient(clientId, 'live:state-sync', {
        jamId,
        jam: {
          id: jamId,
          name: 'Test Jam',
          hostName: 'Test Host',
          description: 'Test jam session',
          date: new Date().toISOString(),
          status: 'ACTIVE',
          location: 'Test Location',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          schedules: [],
          registrations: [],
          jamMusics: [],
        },
        currentPerformance: null,
        musicians: Array.from(this.connectedClients).map(id => ({
          id,
          name: 'Test Musician',
          instrument: 'guitar',
          level: 'BEGINNER',
          contact: id,
          phone: '123456789',
          createdAt: new Date().toISOString(),
        })),
        registrations: [],
        schedule: [],
        timestamp: Date.now(),
      })
    }
  }

  /**
   * Send event to specific client
   */
  sendToClient<K extends keyof ServerToClientEvents>(
    clientId: string,
    event: K,
    data: any
  ): void {
    const listeners = this.listeners.get(`${clientId}:${String(event)}`)
    if (listeners) {
      listeners.forEach(listener => listener(data))
    }
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcastToAll<K extends keyof ServerToClientEvents>(
    event: K,
    data: any
  ): void {
    const listeners = this.listeners.get(String(event))
    if (listeners) {
      listeners.forEach(listener => listener(data))
    }
  }

  /**
   * Register event listener
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  /**
   * Get connected clients count
   */
  getConnectedCount(): number {
    return this.connectedClients.size
  }

  /**
   * Shutdown mock server
   */
  shutdown(): void {
    this.isRunning = false
    this.listeners.clear()
    this.connectedClients.clear()
  }
}

/**
 * Test utilities for socket integration
 */
export class SocketTestUtils {
  /**
   * Wait for async operation to complete
   */
  static async waitFor(
    condition: () => boolean,
    timeout = 5000,
    checkInterval = 100
  ): Promise<void> {
    const startTime = Date.now()

    while (!condition()) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout waiting for condition after ${timeout}ms`)
      }
      await new Promise(resolve => setTimeout(resolve, checkInterval))
    }
  }

  /**
   * Create mock jam data
   */
  static createMockJam(overrides = {}) {
    return {
      id: 'test-jam-1',
      name: 'Test Jam',
      hostName: 'Test Host',
      description: 'Test jam session',
      date: new Date().toISOString(),
      status: 'ACTIVE' as const,
      location: 'Test Location',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schedules: [],
      registrations: [],
      jamMusics: [],
      ...overrides,
    }
  }

  /**
   * Create mock musician data
   */
  static createMockMusician(overrides = {}) {
    return {
      id: 'musician-1',
      name: 'Test Musician',
      instrument: 'guitar',
      level: 'BEGINNER' as const,
      contact: 'test@example.com',
      phone: '123456789',
      createdAt: new Date().toISOString(),
      ...overrides,
    }
  }

  /**
   * Create mock registration data
   */
  static createMockRegistration(overrides = {}) {
    return {
      id: 'reg-1',
      musicianId: 'musician-1',
      jamId: 'test-jam-1',
      scheduleId: 'schedule-1',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      musician: SocketTestUtils.createMockMusician(),
      ...overrides,
    }
  }

  /**
   * Create mock schedule data
   */
  static createMockSchedule(overrides = {}) {
    return {
      id: 'schedule-1',
      jamId: 'test-jam-1',
      musicId: 'music-1',
      order: 1,
      status: 'SCHEDULED' as const,
      createdAt: new Date().toISOString(),
      music: {
        id: 'music-1',
        title: 'Test Song',
        artist: 'Test Artist',
        duration: 180,
        createdAt: new Date().toISOString(),
      },
      registrations: [],
      ...overrides,
    }
  }
}

