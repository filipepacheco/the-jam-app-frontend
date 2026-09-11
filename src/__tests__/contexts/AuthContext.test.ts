import { describe, expect, it } from 'vitest'
import { deriveRole, deriveInitialRole, isHostRole } from '../../contexts/AuthContext'

describe('deriveRole', () => {
  it('returns the explicit role when present', () => {
    expect(deriveRole({ role: 'host', isHost: false })).toBe('host')
  })

  it('falls back to host when isHost is true and role is absent', () => {
    expect(deriveRole({ isHost: true })).toBe('host')
  })

  it('falls back to user when neither role nor isHost is set', () => {
    expect(deriveRole({})).toBe('user')
  })

  it('prioritizes role over isHost when both are present and disagree', () => {
    expect(deriveRole({ role: 'user', isHost: true })).toBe('user')
  })
})

describe('deriveInitialRole', () => {
  it('returns the explicit role when present', () => {
    expect(deriveInitialRole({ role: 'host' })).toBe('host')
  })

  it('falls back to host when isHost is true and role is absent', () => {
    expect(deriveInitialRole({ isHost: true })).toBe('host')
  })

  it('falls back to viewer (not user) when neither role nor isHost is set', () => {
    expect(deriveInitialRole({})).toBe('viewer')
  })

  it('falls back to viewer when there is no stored data at all', () => {
    expect(deriveInitialRole(undefined)).toBe('viewer')
  })

  it('prioritizes role over isHost when they disagree, matching deriveRole', () => {
    // The divergence case: a backend response of {role: 'user', isHost: true} must not
    // resolve to 'host' just because a bypass site might read isHost directly.
    expect(deriveInitialRole({ role: 'user', isHost: true })).toBe('user')
  })
})

describe('isHostRole', () => {
  it('returns true for the host role', () => {
    expect(isHostRole('host')).toBe(true)
  })

  it('returns false for user and viewer roles', () => {
    expect(isHostRole('user')).toBe(false)
    expect(isHostRole('viewer')).toBe(false)
  })

  it('resolves to false for a role derived from a divergent {role: "user", isHost: true} profile', () => {
    // End-to-end regression for the spec's exact case: isHost() must say false here,
    // even though the legacy isHost field says true.
    const role = deriveRole({ role: 'user', isHost: true })
    expect(isHostRole(role)).toBe(false)
  })
})
