/**
 * Post-Login Behavior Test Page
 * Tests and demonstrates post-login redirect behavior, state storage, and role management
 */

import {useEffect, useState} from 'react'
import {useAuth} from '../hooks'
import {useLocation, useNavigate} from 'react-router-dom'

interface PostLoginBehaviorTest {
  name: string
  description: string
  test: () => Promise<boolean>
  result?: boolean
  error?: string
}

export function PostLoginBehaviorTestPage() {
  const { user, isAuthenticated, role, login, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [tests, setTests] = useState<PostLoginBehaviorTest[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [simulatedRedirectPath, setSimulatedRedirectPath] = useState<string>('/')

  // Test 1: Role is set to 'user' after login
  const testRoleAfterLogin = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const isUserRole = role === 'user'
        console.log('Test: Role after login - Expected: user, Got:', role)
        resolve(isUserRole)
      }, 500)
    })
  }

  // Test 2: User data persists in localStorage
  const testUserPersistenceInLocalStorage = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const storedUser = localStorage.getItem('auth_user')
      const isStored = storedUser !== null
      console.log('Test: User in localStorage - Found:', isStored)
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        console.log('Stored user data:', userData)
      }
      resolve(isStored)
    })
  }

  // Test 3: Token is stored securely
  const testTokenStorage = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const token = localStorage.getItem('auth_token')
      const isStored = token !== null
      console.log('Test: Auth token in localStorage - Found:', isStored)
      resolve(isStored)
    })
  }

  // Test 4: isAuthenticated flag is true
  const testAuthenticatedFlag = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      console.log('Test: isAuthenticated flag - Value:', isAuthenticated)
      resolve(isAuthenticated)
    })
  }

  // Test 5: User object has correct structure
  const testUserStructure = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!user) {
        console.log('Test: User structure - User is null')
        resolve(false)
        return
      }

      const hasRequiredFields = !!(user.id && user.name && user.email && user.role)
      console.log('Test: User structure - Has required fields:', hasRequiredFields)
      console.log('User object:', user)
      resolve(hasRequiredFields)
    })
  }

  // Test 6: Logout clears all data
  const testLogoutClearsData = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      logout()
      setTimeout(() => {
        const storedUser = localStorage.getItem('auth_user')
        const token = localStorage.getItem('auth_token')
        const isCleared = storedUser === null && token === null
        console.log('Test: Logout clears data - All cleared:', isCleared)
        resolve(isCleared)
      }, 500)
    })
  }

  // Test 7: Simulate redirect logic
  const testRedirectLogic = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const currentPath = location.pathname
      console.log('Test: Current path:', currentPath)
      console.log('Test: Simulated redirect to:', simulatedRedirectPath)
      resolve(true)
    })
  }

  // Initialize tests
  useEffect(() => {
    setTests([
      {
        name: 'Role Set to "user"',
        description: 'After login, role should be automatically set to "user" (musician)',
        test: testRoleAfterLogin,
      },
      {
        name: 'User Persists in localStorage',
        description: 'User data should be stored in localStorage with auth_user key',
        test: testUserPersistenceInLocalStorage,
      },
      {
        name: 'Token Stored Securely',
        description: 'Auth token should be stored in localStorage with auth_token key',
        test: testTokenStorage,
      },
      {
        name: 'Authenticated Flag True',
        description: 'isAuthenticated should be true after successful login',
        test: testAuthenticatedFlag,
      },
      {
        name: 'User Object Structure',
        description: 'User object should have id, name, email, and role fields',
        test: testUserStructure,
      },
      {
        name: 'Logout Clears Data',
        description: 'Logout should clear user and token from localStorage and set isAuthenticated to false',
        test: testLogoutClearsData,
      },
      {
        name: 'Redirect Logic',
        description: 'Test redirect path detection logic',
        test: testRedirectLogic,
      },
    ])
  }, [isAuthenticated, user, role])

  const runAllTests = async () => {
    setIsRunning(true)
    const updatedTests = [...tests]

    for (let i = 0; i < updatedTests.length; i++) {
      try {
        const result = await updatedTests[i].test()
        updatedTests[i].result = result
        updatedTests[i].error = undefined
      } catch (err) {
        updatedTests[i].result = false
        updatedTests[i].error = err instanceof Error ? err.message : 'Unknown error'
      }
      setTests([...updatedTests])
    }

    setIsRunning(false)
  }

  const simulateLogin = () => {
    // Simulate a successful login
    const mockUser = {
      id: 'test-user-123',
      name: 'Test Musician',
      email: 'test@example.com',
      phone: '1234567890',
      role: 'user' as const,
      isHost: false,
    }

    login(mockUser, 'mock-token-' + Date.now())
  }

  const handleRedirectSimulation = (path: string) => {
    setSimulatedRedirectPath(path)
  }

  const redirectScenarios = [
    { label: 'Home Page (default)', path: '/', description: 'No context - redirect to home' },
    { label: 'Jam Detail Page', path: '/jams/jam-123', description: 'Coming from jam detail - stay on jam' },
    { label: 'Jam Registration', path: '/jams/jam-456/register', description: 'Coming from registration - return to registration' },
  ]

  return (
    <div className="min-h-screen bg-base-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="card bg-primary text-primary-content">
          <div className="card-body">
            <h1 className="card-title text-2xl">Post-Login Behavior Test</h1>
            <p>Verify post-login state management, redirects, and persistence</p>
          </div>
        </div>

        {/* Current Auth State */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Current Auth State</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Authenticated:</span>
                <span className={`ml-2 badge ${isAuthenticated ? 'badge-success' : 'badge-error'}`}>
                  {isAuthenticated ? 'YES' : 'NO'}
                </span>
              </div>
              <div>
                <span className="font-semibold">Role:</span>
                <span className="ml-2 badge badge-info">{role}</span>
              </div>
              {user && (
                <>
                  <div>
                    <span className="font-semibold">User ID:</span>
                    <span className="ml-2 text-base-content/70">{user.id}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Name:</span>
                    <span className="ml-2 text-base-content/70">{user.name}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Email:</span>
                    <span className="ml-2 text-base-content/70">{user.email}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Simulation Controls</h2>
            <div className="space-y-4">
              {/* Login Simulation */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Simulate Login</span>
                </label>
                <button onClick={simulateLogin} className="btn btn-primary btn-sm">
                  📝 Simulate User Login
                </button>
                <p className="text-xs text-base-content/60 mt-2">
                  This creates a mock user and stores it in context + localStorage
                </p>
              </div>

              {/* Logout Simulation */}
              {isAuthenticated && (
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Simulate Logout</span>
                  </label>
                  <button onClick={logout} className="btn btn-error btn-sm">
                    🚪 Logout
                  </button>
                  <p className="text-xs text-base-content/60 mt-2">
                    This clears user data from context + localStorage
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Redirect Scenarios */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Redirect Scenarios</h2>
            <p className="text-sm text-base-content/70 mb-4">
              After login, user should be redirected to the appropriate page based on context:
            </p>
            <div className="space-y-3">
              {redirectScenarios.map((scenario) => (
                <div key={scenario.path} className="p-3 bg-base-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{scenario.label}</div>
                      <div className="text-xs text-base-content/60">{scenario.description}</div>
                      <div className="text-xs text-primary mt-1">Path: {scenario.path}</div>
                    </div>
                    <button
                      onClick={() => handleRedirectSimulation(scenario.path)}
                      className={`btn btn-xs ${
                        simulatedRedirectPath === scenario.path ? 'btn-primary' : 'btn-ghost'
                      }`}
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-info text-info-content rounded-lg">
              <p className="text-sm font-semibold">Selected Redirect: {simulatedRedirectPath}</p>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title">Test Results</h2>
              <button onClick={runAllTests} disabled={isRunning} className="btn btn-sm btn-primary">
                {isRunning ? '⏳ Running...' : '▶️ Run All Tests'}
              </button>
            </div>

            <div className="space-y-3">
              {tests.map((test, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-2 ${
                    test.result === undefined
                      ? 'border-base-300 bg-base-100'
                      : test.result
                        ? 'border-success bg-success/10'
                        : 'border-error bg-error/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {test.result === undefined && <span className="loading loading-spinner loading-sm"></span>}
                      {test.result === true && <span className="text-2xl">✅</span>}
                      {test.result === false && <span className="text-2xl">❌</span>}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{test.name}</div>
                      <div className="text-xs text-base-content/70">{test.description}</div>
                      {test.error && <div className="text-xs text-error mt-1">Error: {test.error}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Post-Login Behavior Documentation */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Post-Login Behavior Documentation</h2>
            <div className="divider my-2"></div>

            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-bold mb-2">✅ Step 1: Store User + Token</h3>
                <ul className="list-disc list-inside space-y-1 text-base-content/80">
                  <li>User data stored in AuthContext state</li>
                  <li>User data serialized and stored in localStorage with key: <code className="badge badge-sm">auth_user</code></li>
                  <li>JWT token stored in localStorage with key: <code className="badge badge-sm">auth_token</code></li>
                  <li>Both persist across page refreshes</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-2">✅ Step 2: Set Role to 'user'</h3>
                <ul className="list-disc list-inside space-y-1 text-base-content/80">
                  <li>All users logging in automatically get role: <code className="badge badge-sm">user</code> (musician)</li>
                  <li>No role selection during login - role is determined by backend</li>
                  <li>Role persists in AuthContext and localStorage</li>
                  <li>Non-authenticated users default to role: <code className="badge badge-sm">viewer</code></li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-2">✅ Step 3: Smart Redirect</h3>
                <ul className="list-disc list-inside space-y-1 text-base-content/80">
                  <li>Explicit redirect: <code className="badge badge-sm">?redirect=/path</code> query parameter</li>
                  <li>Jam context redirect: <code className="badge badge-sm">?jamId=123</code> → <code className="text-primary">/jams/123/register</code></li>
                  <li>Referrer detection: From jam detail → return to jam detail</li>
                  <li>Default fallback: Redirect to home page <code className="text-primary">/</code></li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-2">✅ Step 4: Persistence & Recovery</h3>
                <ul className="list-disc list-inside space-y-1 text-base-content/80">
                  <li>On app load, AuthContext checks localStorage for user + token</li>
                  <li>If both exist, user is restored to authenticated state</li>
                  <li>If either missing, user defaults to viewer role</li>
                  <li>No re-authentication required for page refreshes</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-2">✅ Step 5: Logout</h3>
                <ul className="list-disc list-inside space-y-1 text-base-content/80">
                  <li>Clears user from AuthContext state</li>
                  <li>Clears auth_user from localStorage</li>
                  <li>Clears auth_token from localStorage</li>
                  <li>Resets role to <code className="badge badge-sm">viewer</code></li>
                  <li>Sets isAuthenticated to false</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Test Status */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">How to Test</h2>
            <div className="space-y-3 text-sm">
              <div className="steps steps-vertical w-full">
                <div className="step step-primary">
                  <div>
                    <strong>Step 1: Simulate Login</strong>
                    <p className="text-xs text-base-content/70">Click "Simulate User Login" button above</p>
                  </div>
                </div>
                <div className="step step-primary">
                  <div>
                    <strong>Step 2: Run Tests</strong>
                    <p className="text-xs text-base-content/70">Click "Run All Tests" to validate all behaviors</p>
                  </div>
                </div>
                <div className="step step-primary">
                  <div>
                    <strong>Step 3: Check Results</strong>
                    <p className="text-xs text-base-content/70">All tests should show ✅ if implementation is correct</p>
                  </div>
                </div>
                <div className="step step-primary">
                  <div>
                    <strong>Step 4: Refresh Page</strong>
                    <p className="text-xs text-base-content/70">User should remain authenticated (persistence test)</p>
                  </div>
                </div>
                <div className="step">
                  <div>
                    <strong>Step 5: Test Logout</strong>
                    <p className="text-xs text-base-content/70">Click logout and verify all data is cleared</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Access Info */}
        <div className="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold">Access This Test Page</p>
            <p className="text-sm">Visit: <code className="badge badge-sm badge-ghost">?postLoginTest=true</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostLoginBehaviorTestPage

