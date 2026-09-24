import {renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {nearestTurn, sceneShift, useSceneShift} from '../components/publicDashboard/venueScene'

describe('venueScene', () => {
  it('lights the same song the same way on every screen, and no song in the brand color', () => {
    expect(sceneShift('song-1')).toBe(sceneShift('song-1'))
    expect(sceneShift(null)).toBe(0)
    const shifts = new Set(Array.from({length: 40}, (_, index) => sceneShift(`song-${index}`)))
    expect(shifts.size).toBeGreaterThan(3)
  })

  it('turns the hue the short way round the wheel', () => {
    expect(nearestTurn(0, 110)).toBe(110)
    expect(nearestTurn(110, -130)).toBe(230)
    expect(nearestTurn(230, 0)).toBe(360)
    expect(nearestTurn(360, -50)).toBe(310)
  })

  it('keeps the unwrapped hue across scene changes', () => {
    const {result, rerender} = renderHook(({target}) => useSceneShift(target), {initialProps: {target: 110}})
    expect(result.current).toBe(110)
    rerender({target: -130})
    expect(result.current).toBe(230)
    rerender({target: -130})
    expect(result.current).toBe(230)
  })
})
