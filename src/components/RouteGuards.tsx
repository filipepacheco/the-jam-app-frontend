/**
 * Route Guards
 * Higher-order components and utilities for protecting routes based on user role
 */

import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks'
import type { UserRole } from '../types/auth.types'
import { Alert } from './Alert'
import { FullPageSpinner } from './FullPageSpinner'

/**
 * Props for route guard components
 */
interface RouteGuardProps {
  children: ReactNode
  requiredRole?: UserRole | UserRole[]
  fallback?: ReactNode
}

/**
 * Checks if user has required role
 * @param userRole - Current user role
 * @param requiredRole - Single role or array of roles
 * @returns true if user has required role
 */
function hasRequiredRole(userRole: UserRole, requiredRole?: UserRole | UserRole[]): boolean {
  if (!requiredRole) return true // No role required

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole)
  }

  return userRole === requiredRole
}

/**
 * ProtectedRoute Component
 * Protects routes by requiring specific role(s)
 * Renders children if authorized, otherwise shows error
 */
export function ProtectedRoute({
  children,
  requiredRole,
  fallback,
}: RouteGuardProps) {
  const { t } = useTranslation()
  const { role, isLoading } = useAuth()

  if (isLoading) {
    return <FullPageSpinner />
  }

  const isAuthorized = hasRequiredRole(role, requiredRole)

  if (!isAuthorized) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Alert
            type="error"
            message={t('errors.insufficient_permission', {
              role: Array.isArray(requiredRole) ? requiredRole.join(', ') : requiredRole
            })}
            title={t('errors.access_denied')}
          />
        </div>
      )
    )
  }

  return <>{children}</>
}

/**
 * HostOnly Component
 * Protects routes for host-only access
 */
export function HostOnly({ children, fallback }: Omit<RouteGuardProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="host" fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}

/**
 * UserOnly Component
 * Protects routes for authenticated musicians/users
 */
export function UserOnly({ children, fallback }: Omit<RouteGuardProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole={['user', 'host']} fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}

/**
 * AuthenticatedOnly Component
 * Protects routes for any authenticated user (user or host)
 */
export function AuthenticatedOnly({ children, fallback }: Omit<RouteGuardProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole={['user', 'host']} fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}

/**
 * ViewerOnly Component
 * Protects routes for anonymous/viewer access (no authentication required)
 */
export function ViewerOnly({ children, fallback }: Omit<RouteGuardProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="viewer" fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}


