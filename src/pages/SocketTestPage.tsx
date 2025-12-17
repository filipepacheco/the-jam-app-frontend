/**
 * Socket Testing Page
 * Interactive page to test socket connections, events, and state management
 */

import {useState} from 'react'
import {useConnectionStatus, useSocketListeners} from '../hooks'
import {getSocketService} from '../services'
import type {LiveStateSyncPayload, MusicianJoinedPayload} from '../types/socket.types'

interface TestResult {
  name: string
  status: 'pending' | 'passed' | 'failed'
  message: string
  timestamp: number
}

export function SocketTestPage() {
  const socketService = getSocketService()
  const { isConnected, state, retry } = useConnectionStatus()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  // Test data
  const [receivedEvents, setReceivedEvents] = useState<string[]>([])
  const [jamState, setJamState] = useState<LiveStateSyncPayload | null>(null)

  // Setup socket event listeners for testing
  useSocketListeners(
    {
      'live:state-sync': (data: LiveStateSyncPayload) => {
        setJamState(data)
        setReceivedEvents(prev => [...prev, `live:state-sync (${data.jamId})`])
      },
      'musicianJoined': (data: MusicianJoinedPayload) => {
        setReceivedEvents(prev => [...prev, `musicianJoined (${data.musicianName})`])
      },
    },
    []
  )

  /**
   * Add test result
   */
  const addResult = (name: string, status: 'passed' | 'failed', message: string) => {
    setTestResults(prev => [
      ...prev,
      {
        name,
        status,
        message,
        timestamp: Date.now(),
      },
    ])
  }

  /**
   * Test 1: Socket Connection
   */
  const testConnection = async () => {
    try {
      setIsRunning(true)
      const token = localStorage.getItem('token')

      if (!socketService.isConnected()) {
        await socketService.connect(token || undefined)
      }

      if (socketService.isConnected()) {
        addResult('Socket Connection', 'passed', 'Connected successfully')
        return true
      } else {
        addResult('Socket Connection', 'failed', 'Connection established but not confirmed')
        return false
      }
    } catch (err) {
      addResult('Socket Connection', 'failed', `Error: ${err instanceof Error ? err.message : String(err)}`)
      return false
    } finally {
      setIsRunning(false)
    }
  }

  /**
   * Test 2: State Request
   */
  const testStateRequest = async () => {
    try {
      setIsRunning(true)

      if (!socketService.isConnected()) {
        addResult('State Request', 'failed', 'Socket not connected')
        return false
      }

      // Emit request state event
      const jamId = 'test-jam-1'
      await socketService.emit('public:request-state', { jamId })

      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (jamState) {
        addResult('State Request', 'passed', `Received state for jam: ${jamState.jamId}`)
        return true
      } else {
        addResult('State Request', 'failed', 'No state received after 1 second')
        return false
      }
    } catch (err) {
      addResult('State Request', 'failed', `Error: ${err instanceof Error ? err.message : String(err)}`)
      return false
    } finally {
      setIsRunning(false)
    }
  }

  /**
   * Test 3: Event Subscription
   */
  const testEventSubscription = async () => {
    try {
      setIsRunning(true)
      setReceivedEvents([])

      const initialCount = receivedEvents.length

      // Wait for any socket event
      await new Promise(resolve => setTimeout(resolve, 2000))

      if (receivedEvents.length > initialCount) {
        addResult('Event Subscription', 'passed', `Received ${receivedEvents.length} events`)
        return true
      } else {
        addResult('Event Subscription', 'failed', 'No events received after 2 seconds')
        return false
      }
    } catch (err) {
      addResult('Event Subscription', 'failed', `Error: ${err instanceof Error ? err.message : String(err)}`)
      return false
    } finally {
      setIsRunning(false)
    }
  }

  /**
   * Test 4: Offline Queue
   */
  const testOfflineQueue = async () => {
    try {
      setIsRunning(true)

      // Import offline queue
      const { getOfflineQueueManager } = await import('../services/offlineQueue')
      const queueManager = getOfflineQueueManager()

      // Clear queue
      queueManager.clearAll()

      // Add action to queue
      const actionId = queueManager.addAction('test-event', { data: 'test' }, 'high')

      const queue = queueManager.getQueue()
      if (queue.length === 1 && queue[0].id === actionId) {
        addResult('Offline Queue', 'passed', 'Successfully queued action')

        // Cleanup
        queueManager.clearAll()
        return true
      } else {
        addResult('Offline Queue', 'failed', 'Action not found in queue')
        return false
      }
    } catch (err) {
      addResult('Offline Queue', 'failed', `Error: ${err instanceof Error ? err.message : String(err)}`)
      return false
    } finally {
      setIsRunning(false)
    }
  }

  /**
   * Test 5: Connection Status
   */
  const testConnectionStatus = async () => {
    try {
      setIsRunning(true)

      // Wait for connection state to update
      await new Promise(resolve => setTimeout(resolve, 500))

      // Check actual socket service connection status
      const actualConnected = socketService.isConnected()
      const actualState = socketService.getConnectionState()

      if (actualConnected && actualState === 'connected') {
        addResult('Connection Status', 'passed', `Status: ${actualState}`)
        return true
      } else {
        addResult('Connection Status', 'failed', `Expected connected, got: ${actualState}`)
        return false
      }
    } catch (err) {
      addResult('Connection Status', 'failed', `Error: ${err instanceof Error ? err.message : String(err)}`)
      return false
    } finally {
      setIsRunning(false)
    }
  }

  /**
   * Run all tests
   */
  const runAllTests = async () => {
    setTestResults([])
    setIsRunning(true)

    console.log('🧪 Starting socket tests...')

    // Run tests in sequence
    await testConnection()
    await new Promise(resolve => setTimeout(resolve, 500))

    await testConnectionStatus()
    await new Promise(resolve => setTimeout(resolve, 500))

    await testStateRequest()
    await new Promise(resolve => setTimeout(resolve, 500))

    await testEventSubscription()
    await new Promise(resolve => setTimeout(resolve, 500))

    await testOfflineQueue()

    setIsRunning(false)
    console.log('✅ Socket tests completed')
  }

  /**
   * Clear test results
   */
  const clearResults = () => {
    setTestResults([])
    setReceivedEvents([])
    setJamState(null)
  }

  const passedCount = testResults.filter(r => r.status === 'passed').length
  const failedCount = testResults.filter(r => r.status === 'failed').length
  const totalTests = testResults.length

  return (
    <div className="min-h-screen bg-base-200 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">🧪 Socket Testing Dashboard</h1>
          <p className="text-gray-600">Test socket connections, events, and state management</p>
        </div>

        {/* Connection Status Card */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Connection Status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="label">
                  <span className="label-text font-semibold">Current State</span>
                </div>
                <div className={`badge badge-lg ${
                  state === 'connected' ? 'badge-success' :
                  state === 'connecting' ? 'badge-warning' :
                  state === 'error' ? 'badge-error' :
                  'badge-ghost'
                }`}>
                  {state}
                </div>
              </div>
              <div>
                <div className="label">
                  <span className="label-text font-semibold">Connected</span>
                </div>
                <div className={`badge badge-lg ${isConnected ? 'badge-success' : 'badge-error'}`}>
                  {isConnected ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
            <div className="card-actions justify-end mt-4">
              <button
                className="btn btn-sm btn-primary"
                onClick={retry}
                disabled={isRunning || (state === 'connected')}
              >
                {state === 'connected' ? 'Connected' : 'Retry Connection'}
              </button>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Test Controls</h2>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn btn-primary"
                onClick={runAllTests}
                disabled={isRunning}
              >
                {isRunning ? '🔄 Running...' : '▶️ Run All Tests'}
              </button>
              <button
                className="btn btn-outline"
                onClick={clearResults}
                disabled={isRunning}
              >
                🗑️ Clear Results
              </button>
            </div>
          </div>
        </div>

        {/* Test Results Summary */}
        {totalTests > 0 && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title">Test Results Summary</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="stat place-items-center">
                  <div className="stat-title">Total</div>
                  <div className="stat-value">{totalTests}</div>
                </div>
                <div className="stat place-items-center">
                  <div className="stat-title">Passed</div>
                  <div className="stat-value text-success">{passedCount}</div>
                </div>
                <div className="stat place-items-center">
                  <div className="stat-title">Failed</div>
                  <div className="stat-value text-error">{failedCount}</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="progress">
                  <div
                    className={`progress-value ${passedCount > 0 ? 'bg-success' : 'bg-error'}`}
                    style={{ width: `${(passedCount / totalTests) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Pass rate: {totalTests > 0 ? ((passedCount / totalTests) * 100).toFixed(0) : 0}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Test Results Details */}
        {testResults.length > 0 && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title">Test Details</h2>
              <div className="space-y-2">
                {testResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-2 ${
                      result.status === 'passed'
                        ? 'border-success bg-success/10'
                        : 'border-error bg-error/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {result.status === 'passed' ? '✅' : '❌'}
                        </span>
                        <span className="font-semibold">{result.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Received Events */}
        {receivedEvents.length > 0 && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title">Received Events ({receivedEvents.length})</h2>
              <div className="overflow-y-auto max-h-64">
                <div className="space-y-2">
                  {receivedEvents.map((event, idx) => (
                    <div key={idx} className="p-2 bg-info/10 rounded text-sm">
                      {idx + 1}. {event}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Jam State Preview */}
        {jamState && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title">Jam State Preview</h2>
              <pre className="bg-base-200 p-4 rounded text-xs overflow-x-auto max-h-64">
                {JSON.stringify(jamState, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

