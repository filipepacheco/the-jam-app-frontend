import {afterEach, describe, expect, it} from 'vitest'
import {authPath, getRedirectPath, safeRedirectPath} from '../utils/navigationUtils'

afterEach(() => window.history.replaceState({}, '', '/'))

describe('auth return destinations', () => {
  it('preserves pathname, query, and hash across the auth page', () => {
    const source = {pathname: '/jams/sunday', search: '?tab=schedule&song=3', hash: '#register'}
    const path = authPath('/register', source)
    window.history.replaceState({}, '', path)

    expect(getRedirectPath()).toBe('/jams/sunday?tab=schedule&song=3#register')
  })

  it('rejects external and auth-loop destinations', () => {
    expect(safeRedirectPath('//evil.example/path')).toBeNull()
    expect(safeRedirectPath('/\\evil.example/path')).toBeNull()
    expect(safeRedirectPath('/login?redirect=%2Flogin')).toBeNull()
    expect(safeRedirectPath('/auth/callback')).toBeNull()
  })
})
