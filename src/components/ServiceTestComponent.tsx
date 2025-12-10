/**
 * Service Testing Component
 * Interactive component to test all services in the app
 * Useful for quick manual testing without console scripts
 */

import React, {useState} from 'react'
import {jamService, musicianService, musicService,} from '../services'
import type {ApiError} from '../types/api.types'

interface TestResult {
  name: string
  status: 'idle' | 'loading' | 'success' | 'error'
  message: string
  data?: unknown
  error?: string
}

/**
 * Service Testing Component
 * Provides UI for testing all service operations
 */
export function ServiceTestComponent(): React.ReactElement {
  const [results, setResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (result: TestResult) => {
    setResults((prev) => [result, ...prev])
  }

  const clearResults = () => {
    setResults([])
  }

  /**
   * Test Jam Service
   */
  const testJamService = async () => {
    setIsLoading(true)
    try {
      // Create
      const createResult = await jamService.create({
        name: `Test Jam ${new Date().getTime()}`,
        description: 'Test jam description',
        status: 'ACTIVE',
      })

      if (!createResult.data) {
        throw new Error('Failed to create jam')
      }

      const jamId = createResult.data.id

      // Get all
      const allResult = await jamService.findAll()
      const allCount = allResult.data?.length ?? 0

      // Get one
      const oneResult = await jamService.findOne(jamId)

      addResult({
        name: 'Jam Service',
        status: 'success',
        message: `✅ Created jam (${jamId}), found ${allCount} total`,
        data: { created: createResult.data, fetched: oneResult.data },
      })
    } catch (error) {
      const apiError = error as ApiError
      addResult({
        name: 'Jam Service',
        status: 'error',
        message: '❌ Failed',
        error: apiError.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Test Musician Service
   */
  const testMusicianService = async () => {
    setIsLoading(true)
    try {
      const createResult = await musicianService.create({
        name: `Test Musician ${new Date().getTime()}`,
        contact: '+1-555-0123',
        instrument: 'Guitar',
        level: 'INTERMEDIATE',
      })

      if (!createResult.data) {
        throw new Error('Failed to create musician')
      }

      const allResult = await musicianService.findAll()
      const allCount = allResult.data?.length ?? 0

      addResult({
        name: 'Musician Service',
        status: 'success',
        message: `✅ Created musician, found ${allCount} total`,
        data: createResult.data,
      })
    } catch (error) {
      const apiError = error as ApiError
      addResult({
        name: 'Musician Service',
        status: 'error',
        message: '❌ Failed',
        error: apiError.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Test Music Service
   */
  const testMusicService = async () => {
    setIsLoading(true)
    try {
      const createResult = await musicService.create({
        title: `Test Song ${new Date().getTime()}`,
        artist: 'Test Artist',
        genre: 'Rock',
        duration: 180,
      })

      if (!createResult.data) {
        throw new Error('Failed to create music')
      }

      const allResult = await musicService.findAll()
      const allCount = allResult.data?.length ?? 0

      addResult({
        name: 'Music Service',
        status: 'success',
        message: `✅ Created music, found ${allCount} total`,
        data: createResult.data,
      })
    } catch (error) {
      const apiError = error as ApiError
      addResult({
        name: 'Music Service',
        status: 'error',
        message: '❌ Failed',
        error: apiError.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Test all services
   */
  const testAllServices = async () => {
    setIsLoading(true)
    clearResults()

    await testJamService()
    await testMusicianService()
    await testMusicService()

    setIsLoading(false)
  }

  return (
    <div className="p-6 bg-base-200 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">🧪 Service Testing Panel</h2>

      {/* Test Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className="btn btn-primary"
          onClick={testAllServices}
          disabled={isLoading}
        >
          {isLoading ? 'Testing...' : 'Test All Services'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={testJamService}
          disabled={isLoading}
        >
          Test Jams
        </button>
        <button
          className="btn btn-secondary"
          onClick={testMusicianService}
          disabled={isLoading}
        >
          Test Musicians
        </button>
        <button
          className="btn btn-secondary"
          onClick={testMusicService}
          disabled={isLoading}
        >
          Test Music
        </button>
        <button
          className="btn btn-outline"
          onClick={clearResults}
          disabled={isLoading}
        >
          Clear Results
        </button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {results.length === 0 ? (
          <div className="alert alert-info">
            <span>Click "Test All Services" to run tests</span>
          </div>
        ) : (
          results.map((result, index) => (
            <div
              key={index}
              className={`alert ${
                result.status === 'success' ? 'alert-success' : 'alert-error'
              }`}
            >
              <div className="w-full">
                <h3 className="font-bold">{result.name}</h3>
                <p>{result.message}</p>
                {result.error && (
                  <p className="text-sm text-error mt-2">Error: {result.error}</p>
                )}
                {result.data ? (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-semibold">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-black bg-opacity-20 rounded text-xs overflow-auto">
                      {JSON.stringify(result.data as unknown, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="alert alert-info mt-6">
        <span>
          ℹ️ Make sure backend is running on http://localhost:3000 for tests to work
        </span>
      </div>
    </div>
  )
}

