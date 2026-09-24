import {renderHook} from '@testing-library/react'
import {afterEach, expect, it, vi} from 'vitest'
import {useReducedMotion} from '../hooks/useReducedMotion'

afterEach(() => vi.unstubAllGlobals())

it.each([true, false])('honors reduced motion %s on the first render', (matches) => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })))
  const renderedPreferences: boolean[] = []
  renderHook(() => {
    const preference = useReducedMotion()
    renderedPreferences.push(preference.prefersReducedMotion)
    return preference
  })
  expect(renderedPreferences[0]).toBe(matches)
})
