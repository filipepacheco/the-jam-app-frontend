import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it} from 'vitest'
import {useDashboardLayout} from '../hooks/useDashboardLayout'

describe('venue display layout preference', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to showing the stage and next performance together', () => {
    expect(renderHook(() => useDashboardLayout()).result.current.layout).toBe('classic')
  })

  it.each(['classic', 'carousel'])('restores an explicit %s preference', (layout) => {
    localStorage.setItem('dashboard-layout', layout)
    expect(renderHook(() => useDashboardLayout()).result.current.layout).toBe(layout)
  })

  it('persists a layout change across remounts', () => {
    const {result, unmount} = renderHook(() => useDashboardLayout())
    act(() => result.current.setLayout('carousel'))
    unmount()
    expect(renderHook(() => useDashboardLayout()).result.current.layout).toBe('carousel')
  })
})
