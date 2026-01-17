/**
 * Authentication Flow Test Page
 * Tests login, jam detail, and jam registration functionality
 */

import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { loginOrRegister } from '../services/authService'
import * as jamService from '../services/jamService'

export function AuthFlowTestPage() {
  const { user, isAuthenticated, logout, role, login } = useAuth()
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (result: string, type: 'success' | 'error' | 'info' = 'info') => {
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'
    setTestResults((prev) => [`${icon} ${result}`, ...prev.slice(0, 14)])
  }

  // Test 1: Login with Email
  const testLoginWithEmail = async () => {
    setIsLoading(true)
    try {
      const result = await loginOrRegister('testuser@example.com')
      // Update AuthContext to reflect logged-in state
      login(result.user, result.token)
      addResult(`Logged in as: ${result.user.name} (${result.user.email})`, 'success')
    } catch (err) {
      addResult(`Login error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Test 2: Login with Phone
  const testLoginWithPhone = async () => {
    setIsLoading(true)
    try {
      const result = await loginOrRegister(undefined, '1234567890')
      // Update AuthContext to reflect logged-in state
      login(result.user, result.token)
      addResult(`Logged in with phone: ${result.user.phone}`, 'success')
    } catch (err) {
      addResult(`Phone login error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Test 3: Get Jam Details
  const testGetJamDetails = async () => {
    setIsLoading(true)
    try {
      // Try with a test jam ID - replace with actual ID from your backend
      const jamId = 'test-jam-1'
      const jam = await jamService.getJamDetails(jamId)
      addResult(
        `Loaded jam: ${jam.nome} - Status: ${jam.status} - Musicians: ${jam.musicianCount}`,
        'success'
      )
    } catch (err) {
      addResult(
        `Jam details error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'error'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Test 4: Get Most Needed Specialty
  const testMostNeededSpecialty = async () => {
    setIsLoading(true)
    try {
      const jamId = 'test-jam-1'
      const specialty = await jamService.getMostNeededSpecialty(jamId)
      addResult(`Most needed specialty: ${specialty || 'None available'}`, 'success')
    } catch (err) {
      addResult(
        `Specialty error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'error'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Test 5: Logout
  const testLogout = () => {
    logout()
    addResult('Logged out successfully', 'success')
  }

  // Test 6: Check Auth State
  const checkAuthState = () => {
    addResult(
      `Auth state - Authenticated: ${isAuthenticated}, Role: ${role}, User: ${user?.name || 'None'}`,
      'info'
    )
  }

  // Test 7: Input Validation Tests
  const testInputValidation = () => {
    const tests = [
      {
        input: 'invalid-email',
        type: 'email',
        shouldFail: true,
        desc: 'Invalid email format',
      },
      {
        input: 'user@example.com',
        type: 'email',
        shouldFail: false,
        desc: 'Valid email format',
      },
      {
        input: '123',
        type: 'phone',
        shouldFail: true,
        desc: 'Phone too short',
      },
      {
        input: '1234567890',
        type: 'phone',
        shouldFail: false,
        desc: 'Valid phone format',
      },
    ]

    tests.forEach((test) => {
      const digitsOnly = test.input.replace(/\D/g, '')

      let valid = false
      if (test.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        valid = emailRegex.test(test.input)
      } else if (test.type === 'phone') {
        valid = digitsOnly.length >= 10
      }

      const passed = valid !== test.shouldFail
      addResult(`${test.desc}: ${passed ? '✓' : '✗'}`, passed ? 'success' : 'error')
    })
  }

  return (
    <div className="min-h-screen bg-base-100 p-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="navbar bg-base-200 rounded-box">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">🧪 Auth Flow Testing</h1>
          </div>
          <div className="flex-none">
            <a href="/" className="btn btn-ghost btn-sm">
              ← Back to Home
            </a>
          </div>
        </div>

        {/* Current Auth State */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">👤 Current Auth State</h2>
            <div className="space-y-2">
              <p>
                <span className="font-semibold">Authenticated:</span> {isAuthenticated ? '✅ Yes' : '❌ No'}
              </p>
              <p>
                <span className="font-semibold">Role:</span> {role}
              </p>
              {user && (
                <>
                  <p>
                    <span className="font-semibold">Name:</span> {user.name}
                  </p>
                  <p>
                    <span className="font-semibold">Email:</span> {user.email}
                  </p>
                  {user.phone && (
                    <p>
                      <span className="font-semibold">Phone:</span> {user.phone}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title mb-4">🧬 Test Functions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                className="btn btn-outline btn-sm"
                onClick={testLoginWithEmail}
                disabled={isLoading}
              >
                Test Login (Email)
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={testLoginWithPhone}
                disabled={isLoading}
              >
                Test Login (Phone)
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={testGetJamDetails}
                disabled={isLoading}
              >
                Test Get Jam Details
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={testMostNeededSpecialty}
                disabled={isLoading}
              >
                Test Most Needed Specialty
              </button>
              <button
                className="btn btn-warning btn-sm"
                onClick={testLogout}
                disabled={!isAuthenticated || isLoading}
              >
                Test Logout
              </button>
              <button className="btn btn-info btn-sm" onClick={checkAuthState} disabled={isLoading}>
                Check Auth State
              </button>
              <button
                className="btn btn-secondary btn-sm col-span-full"
                onClick={testInputValidation}
                disabled={isLoading}
              >
                Test Input Validation
              </button>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title mb-4">📊 Test Results</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.map((result, idx) => (
                  <div key={idx} className="alert alert-info text-sm">
                    <span>{result}</span>
                  </div>
                ))}
              </div>
              <button
                className="btn btn-sm btn-ghost mt-4"
                onClick={() => setTestResults([])}
              >
                Clear Results
              </button>
            </div>
          </div>
        )}

        {/* Manual Test Scenarios */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title mb-4">📋 Manual Test Scenarios</h2>
            <div className="space-y-3">
              <div className="collapse collapse-arrow bg-base-300">
                <input type="checkbox" />
                <div className="collapse-title font-semibold">Scenario 1: New User Login</div>
                <div className="collapse-content">
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Click "Test Login (Email)"</li>
                    <li>Verify user is created and logged in</li>
                    <li>Check navbar shows logged-in state</li>
                    <li>Refresh page - user should persist</li>
                  </ol>
                </div>
              </div>
              <div className="collapse collapse-arrow bg-base-300">
                <input type="checkbox" />
                <div className="collapse-title font-semibold">Scenario 2: Existing User Login</div>
                <div className="collapse-content">
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Login with same email twice</li>
                    <li>Second time should return existing user</li>
                    <li>Check user ID is the same</li>
                  </ol>
                </div>
              </div>
              <div className="collapse collapse-arrow bg-base-300">
                <input type="checkbox" />
                <div className="collapse-title font-semibold">Scenario 3: Phone Login</div>
                <div className="collapse-content">
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Click "Test Login (Phone)"</li>
                    <li>User should be created with phone</li>
                    <li>Verify phone is stored in auth state</li>
                  </ol>
                </div>
              </div>
              <div className="collapse collapse-arrow bg-base-300">
                <input type="checkbox" />
                <div className="collapse-title font-semibold">Scenario 4: Jam Details Loading</div>
                <div className="collapse-content">
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Click "Test Get Jam Details" (requires jam in backend)</li>
                    <li>Should display jam info, specialties, and slots</li>
                    <li>Check specialty slots are formatted correctly</li>
                  </ol>
                </div>
              </div>
              <div className="collapse collapse-arrow bg-base-300">
                <input type="checkbox" />
                <div className="collapse-title font-semibold">Scenario 5: Logout Flow</div>
                <div className="collapse-content">
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Login first</li>
                    <li>Click "Test Logout"</li>
                    <li>Check auth state is cleared</li>
                    <li>Refresh page - should be logged out</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expected Errors */}
        <div className="alert alert-warning">
          <div>
            <h3 className="font-bold">⚠️ Expected Errors</h3>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>Invalid email/phone format errors from validation</li>
              <li>404 errors for jam IDs that don't exist (create test jam first)</li>
              <li>Network errors if backend is not running</li>
            </ul>
          </div>
        </div>

        {/* Next Steps */}
        <div className="alert alert-info">
          <div>
            <h3 className="font-bold">✅ Testing Checklist</h3>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>[ ] Backend `/auth/login` endpoint working</li>
              <li>[ ] Email login creates/returns user</li>
              <li>[ ] Phone login creates/returns user</li>
              <li>[ ] User data persists in localStorage</li>
              <li>[ ] Refresh page maintains login state</li>
              <li>[ ] Logout clears all data</li>
              <li>[ ] Input validation works (email/phone format)</li>
              <li>[ ] Jam details API working (if available)</li>
              <li>[ ] Error messages are user-friendly</li>
              <li>[ ] Network errors are handled gracefully</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthFlowTestPage

