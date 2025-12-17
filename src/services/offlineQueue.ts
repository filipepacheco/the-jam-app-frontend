/**
 * Offline Queue Service
 * Manages queuing of socket events when offline and flushes them on reconnection
 */

/**
 * Queued socket action
 */
export interface QueuedAction {
  id: string
  event: string
  payload: any
  timestamp: number
  retries: number
  priority: 'high' | 'normal' | 'low'
  maxRetries: number
}

/**
 * Queue statistics
 */
export interface QueueStats {
  total: number
  pending: number
  failed: number
  highPriority: number
}

/**
 * Offline Queue Manager - Singleton
 */
class OfflineQueueManager {
  private static instance: OfflineQueueManager | null = null
  private queue: Map<string, QueuedAction> = new Map()
  private persistenceKey = 'socket_offline_queue'
  private listeners: ((queue: QueuedAction[]) => void)[] = []

  private constructor() {
    this.loadFromStorage()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): OfflineQueueManager {
    if (!OfflineQueueManager.instance) {
      OfflineQueueManager.instance = new OfflineQueueManager()
    }
    return OfflineQueueManager.instance
  }

  /**
   * Add action to queue
   */
  addAction(
    event: string,
    payload: any,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const action: QueuedAction = {
      id,
      event,
      payload,
      timestamp: Date.now(),
      retries: 0,
      priority,
      maxRetries: priority === 'high' ? 5 : 3,
    }

    this.queue.set(id, action)
    this.saveToStorage()
    this.notifyListeners()

    console.log(`📤 Queued action: ${event} (Priority: ${priority})`)

    return id
  }

  /**
   * Remove action from queue
   */
  removeAction(id: string): boolean {
    const removed = this.queue.delete(id)
    if (removed) {
      this.saveToStorage()
      this.notifyListeners()
    }
    return removed
  }

  /**
   * Get all pending actions
   */
  getQueue(): QueuedAction[] {
    return Array.from(this.queue.values()).sort((a, b) => {
      // Sort by priority first, then by timestamp
      const priorityOrder = { high: 0, normal: 1, low: 2 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.timestamp - b.timestamp
    })
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const queue = this.getQueue()
    return {
      total: queue.length,
      pending: queue.filter((a) => a.retries < a.maxRetries).length,
      failed: queue.filter((a) => a.retries >= a.maxRetries).length,
      highPriority: queue.filter((a) => a.priority === 'high').length,
    }
  }

  /**
   * Mark action as retried
   */
  incrementRetries(id: string): QueuedAction | null {
    const action = this.queue.get(id)
    if (!action) return null

    action.retries++
    this.saveToStorage()
    this.notifyListeners()

    return action
  }

  /**
   * Clear failed actions (retries exceeded)
   */
  clearFailed(): number {
    const initialSize = this.queue.size

    // Remove actions that have exceeded max retries
    for (const [id, action] of this.queue.entries()) {
      if (action.retries >= action.maxRetries) {
        this.queue.delete(id)
        console.warn(`🗑️ Discarded failed action: ${action.event} (${id})`)
      }
    }

    const removed = initialSize - this.queue.size
    if (removed > 0) {
      this.saveToStorage()
      this.notifyListeners()
    }

    return removed
  }

  /**
   * Clear all pending actions
   */
  clearAll(): number {
    const size = this.queue.size
    this.queue.clear()
    this.saveToStorage()
    this.notifyListeners()
    console.log(`🗑️ Cleared ${size} queued actions`)
    return size
  }

  /**
   * Clear queue for specific event
   */
  clearByEvent(event: string): number {
    let removed = 0

    for (const [id, action] of this.queue.entries()) {
      if (action.event === event) {
        this.queue.delete(id)
        removed++
      }
    }

    if (removed > 0) {
      this.saveToStorage()
      this.notifyListeners()
    }

    return removed
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(listener: (queue: QueuedAction[]) => void): () => void {
    this.listeners.push(listener)

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Notify all listeners of queue changes
   */
  private notifyListeners(): void {
    const queue = this.getQueue()
    this.listeners.forEach((listener) => {
      try {
        listener(queue)
      } catch (err) {
        console.error('Error in queue listener:', err)
      }
    })
  }

  /**
   * Save queue to localStorage
   */
  private saveToStorage(): void {
    try {
      const queue = this.getQueue()
      localStorage.setItem(this.persistenceKey, JSON.stringify(queue))
    } catch (err) {
      console.error('Failed to save queue to storage:', err)
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.persistenceKey)
      if (stored) {
        const queue = JSON.parse(stored) as QueuedAction[]

        // Only restore actions added within last hour
        const oneHourAgo = Date.now() - 3600000
        const recentActions = queue.filter((a) => a.timestamp > oneHourAgo)

        recentActions.forEach((action) => {
          this.queue.set(action.id, action)
        })

        console.log(`📥 Restored ${recentActions.length} queued actions from storage`)
      }
    } catch (err) {
      console.error('Failed to load queue from storage:', err)
      // Clear corrupted storage
      localStorage.removeItem(this.persistenceKey)
    }
  }
}

/**
 * Get the offline queue manager instance
 */
export function getOfflineQueueManager(): OfflineQueueManager {
  return OfflineQueueManager.getInstance()
}

export { OfflineQueueManager }

