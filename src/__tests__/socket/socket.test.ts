/// <reference types="vitest" />
/**
 * Socket Integration Tests
 * Tests for socket service, hooks, and context integration
 */

import {getSocketService} from '../../services/socket'
import {getOfflineQueueManager, getUserErrorMessage, mapSocketError} from '../../services'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'

describe('Socket Service', () => {
  const socketService = getSocketService()

  beforeEach(() => {
    socketService.disconnect()
  })

  afterEach(() => {
    socketService.disconnect()
  })

  it('should be a singleton', () => {
    const service1 = getSocketService()
    const service2 = getSocketService()
    expect(service1).toBe(service2)
  })

  it('should initialize with idle state', () => {
    expect(socketService.getConnectionState()).toBe('idle')
    expect(socketService.isConnected()).toBe(false)
  })

  it('should handle token setting', () => {
    socketService.setToken('test-token')
    expect(socketService.getConnectionState()).toBe('idle')
  })
})


describe('Offline Queue', () => {
  const queueManager = getOfflineQueueManager()

  beforeEach(() => {
    queueManager.clearAll()
  })

  afterEach(() => {
    queueManager.clearAll()
  })

  it('should add actions to queue', () => {
    const id = queueManager.addAction('test-event', { data: 'test' })

    expect(id).toBeDefined()
    expect(queueManager.getQueue().length).toBe(1)
  })

  it('should respect priority ordering', () => {
    const lowId = queueManager.addAction('low', { data: 'low' }, 'low')
    const highId = queueManager.addAction('high', { data: 'high' }, 'high')
    const normalId = queueManager.addAction('normal', { data: 'normal' }, 'normal')

    const queue = queueManager.getQueue()

    expect(queue[0].id).toBe(highId)
    expect(queue[1].id).toBe(normalId)
    expect(queue[2].id).toBe(lowId)
  })

  it('should track retries', () => {
    const id = queueManager.addAction('test', { data: 'test' })

    queueManager.incrementRetries(id)
    queueManager.incrementRetries(id)

    const action = queueManager.getQueue()[0]
    expect(action.retries).toBe(2)
  })

  it('should clear failed actions', () => {
    const id1 = queueManager.addAction('test1', { data: '1' }, 'normal')
    const id2 = queueManager.addAction('test2', { data: '2' }, 'normal')

    for (let i = 0; i < 4; i++) {
      queueManager.incrementRetries(id1)
    }

    queueManager.clearFailed()

    const queue = queueManager.getQueue()
    expect(queue.length).toBe(1)
    expect(queue[0].id).toBe(id2)
  })

  it('should get statistics', () => {
    queueManager.addAction('test1', { data: '1' })
    queueManager.addAction('test2', { data: '2' }, 'high')

    const stats = queueManager.getStats()

    expect(stats.total).toBe(2)
    expect(stats.pending).toBe(2)
    expect(stats.highPriority).toBe(1)
  })

  it('should clear by event type', () => {
    queueManager.addAction('event1', { data: '1' })
    queueManager.addAction('event2', { data: '2' })
    queueManager.addAction('event1', { data: '3' })

    const removed = queueManager.clearByEvent('event1')

    expect(removed).toBe(2)
    expect(queueManager.getQueue().length).toBe(1)
  })

  it('should persist to localStorage', () => {
    queueManager.clearAll()
    queueManager.addAction('test', { data: 'test' }, 'high')

    const stored = localStorage.getItem('socket_offline_queue')
    expect(stored).toBeDefined()
    expect(stored).toContain('test')
  })

  it('should restore from localStorage', () => {
    queueManager.clearAll()
    queueManager.addAction('test1', { data: '1' })

    const stored = localStorage.getItem('socket_offline_queue')
    const restored = stored ? JSON.parse(stored) : []

    expect(restored.length).toBeGreaterThan(0)
  })

  it('should allow subscriptions', (done: any) => {
    const listener = () => {}
    const unsubscribe = queueManager.subscribe(listener)

    queueManager.addAction('test', { data: 'test' })

    unsubscribe()
    done()
  })
})

describe('Error Handler', () => {
  it('should map AUTH_ERROR', () => {
    const error = { code: 'AUTH_ERROR', message: 'Not authenticated' }
    const info = mapSocketError(error as any)

    expect(info.code).toBe('AUTH_ERROR')
    expect(info.userMessage).toContain('authorized')
    expect(info.recoveryAction).toBe('logout')
  })

  it('should map NETWORK_ERROR', () => {
    const error = { code: 'NETWORK_ERROR', message: 'Connection lost' }
    const info = mapSocketError(error as any)

    expect(info.code).toBe('NETWORK_ERROR')
    expect(info.userMessage).toContain('Connection lost')
    expect(info.recoveryAction).toBe('retry')
  })

  it('should provide user-friendly messages', () => {
    const error = { code: 'RATE_LIMITED', message: 'Too many requests' }
    const message = getUserErrorMessage(error as any)

    expect(message).toBeDefined()
    expect(typeof message).toBe('string')
    expect(message.length).toBeGreaterThan(0)
  })

  it('should handle unknown errors', () => {
    const error = new Error('Unknown error')
    const info = mapSocketError(error)

    expect(info.userMessage).toContain('unexpected')
  })
})

