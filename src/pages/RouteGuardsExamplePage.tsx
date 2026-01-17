/**
 * Route Guards Example Page
 * Demonstrates how to use route guard components
 */

import { HostOnly, UserOnly, AuthenticatedOnly, ViewerOnly } from '../components/RouteGuards'
import { useCanAccess } from '../lib/auth/routeGuardHooks'
import { useAuth } from '../hooks/useAuth'

export function RouteGuardsExamplePage() {
  const { user, role } = useAuth()
  const canCreateJams = useCanAccess('host')
  const canRegister = useCanAccess(['user', 'host'])

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto max-w-7xl p-6 space-y-6">
        <div className="navbar bg-base-200 rounded-box">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">📋 Route Guards Examples</h1>
          </div>
          <div className="flex-none">
            <a href="/" className="btn btn-ghost btn-sm">
              ← Back to Home
            </a>
          </div>
        </div>

        {/* Example 1: ViewerOnly - Shows only to anonymous users */}
        <section>
          <h3 className="text-xl font-bold mb-4">Example 1: ViewerOnly Component</h3>
          <ViewerOnly
            fallback={
              <div className="alert alert-info">
                <span>This content is only for viewers. You're logged in as {role}</span>
              </div>
            }
          >
            <div className="alert alert-success">
              <span>👋 Welcome viewer! This page is for anonymous users only.</span>
            </div>
          </ViewerOnly>
        </section>

        {/* Example 2: UserOnly - Shows only to authenticated users */}
        <section>
          <h3 className="text-xl font-bold mb-4">Example 2: UserOnly Component</h3>
          <UserOnly
            fallback={
              <div className="alert alert-warning">
                <span>You must be logged in as a Musician or Host to see this.</span>
              </div>
            }
          >
            <div className="alert alert-success">
              <span>👍 Welcome musician/host! You have access to this content.</span>
            </div>
          </UserOnly>
        </section>

        {/* Example 3: HostOnly - Shows only to hosts */}
        <section>
          <h3 className="text-xl font-bold mb-4">Example 3: HostOnly Component</h3>
          <HostOnly
            fallback={
              <div className="alert alert-warning">
                <span>Only hosts can see this content.</span>
              </div>
            }
          >
            <div className="alert alert-success">
              <span>🎛️ Welcome host! You have access to host-only features.</span>
            </div>
          </HostOnly>
        </section>

        {/* Example 4: AuthenticatedOnly - Shows to any authenticated user */}
        <section>
          <h3 className="text-xl font-bold mb-4">Example 4: AuthenticatedOnly Component</h3>
          <AuthenticatedOnly
            fallback={
              <div className="alert alert-warning">
                <span>You must be logged in to see this.</span>
              </div>
            }
          >
            <div className="alert alert-success">
              <span>✅ You are authenticated! {user?.name || 'User'}</span>
            </div>
          </AuthenticatedOnly>
        </section>

        {/* Example 5: useCanAccess Hook */}
        <section>
          <h3 className="text-xl font-bold mb-4">Example 5: useCanAccess Hook</h3>
          <div className="card bg-base-200">
            <div className="card-body space-y-2">
              <p>Can create jams: {canCreateJams ? '✅ Yes' : '❌ No'}</p>
              <p>Can register for jams: {canRegister ? '✅ Yes' : '❌ No'}</p>
              <p>Current role: {role}</p>
            </div>
          </div>
        </section>

        {/* Usage Guide */}
        <section className="alert alert-info">
          <div>
            <h4 className="font-bold mb-2">📖 Usage Guide</h4>
            <div className="space-y-2 text-sm">
              <p>
                <strong>ProtectedRoute:</strong> Generic guard requiring specific role(s)
              </p>
              <pre className="bg-base-300 p-2 rounded text-xs overflow-auto">
{`<ProtectedRoute requiredRole="host">
  <HostDashboard />
</ProtectedRoute>`}
              </pre>

              <p className="mt-2">
                <strong>HostOnly:</strong> Shorthand for host-only routes
              </p>
              <pre className="bg-base-300 p-2 rounded text-xs overflow-auto">
{`<HostOnly>
  <CreateJamPage />
</HostOnly>`}
              </pre>

              <p className="mt-2">
                <strong>useCanAccess:</strong> Check permissions in component logic
              </p>
              <pre className="bg-base-300 p-2 rounded text-xs overflow-auto">
{`const canCreate = useCanAccess('host')
if (canCreate) {
  // Show create button
}`}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default RouteGuardsExamplePage

