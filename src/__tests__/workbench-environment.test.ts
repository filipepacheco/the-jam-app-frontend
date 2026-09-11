import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAuthFixture } from '../workbench/fixtures'
import {
  installReducedMotionPreference,
  resetReducedMotionPreference,
} from '../workbench/reducedMotion'

describe('workbench shared environment', () => {
  afterEach(() => {
    resetReducedMotionPreference()
  })

  it.each(['guest', 'viewer', 'user', 'host'] as const)(
    'provides deterministic %s authentication context',
    (role) => {
      const context = createAuthFixture(role)

      expect(context.role).toBe(role === 'guest' ? 'viewer' : role)
      expect(context.isAuthenticated).toBe(role !== 'guest')
      expect(context.user?.role ?? null).toBe(role === 'guest' ? null : role)
      expect(context.isUser()).toBe(role === 'user')
      expect(context.isViewer()).toBe(role === 'viewer')
    },
  )

  it('updates matchMedia consumers when reduced motion changes', () => {
    const listener = vi.fn()

    installReducedMotionPreference(false)
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    mediaQuery.addEventListener('change', listener)

    installReducedMotionPreference(true)

    expect(mediaQuery.matches).toBe(true)
    expect(listener).toHaveBeenCalledOnce()
    expect(listener.mock.calls[0]?.[0]).toMatchObject({ matches: true })
  })
})
