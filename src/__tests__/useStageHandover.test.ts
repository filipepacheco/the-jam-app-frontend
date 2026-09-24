import {act, renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {APPLAUSE_MS, BOARDING_MS, useStageHandover} from '../components/publicDashboard/useStageHandover'
import type {DashboardSongDto, PlaybackState} from '../types/api.types'

const song = (id: string, musicians = [{id: `${id}-vocals`, name: `Singer ${id}`, instrument: 'vocals'}]): DashboardSongDto => ({
  id, title: `Title ${id}`, artist: `Artist ${id}`, duration: null, musicians,
})
const [a, b, c] = [song('a'), song('b'), song('c')]

interface Live {
  currentSong: DashboardSongDto | null
  nextSong: DashboardSongDto | null
  playbackState: PlaybackState
  finished: boolean
}

function renderShow(initial: Live, enabled = true, flight = false) {
  return renderHook(({live, on}) => useStageHandover(live, {enabled: on, flight}), {initialProps: {live: initial, on: enabled}})
}
const live = (currentSong: DashboardSongDto | null, nextSong: DashboardSongDto | null, playbackState: PlaybackState = 'PLAYING', finished = false): Live =>
  ({currentSong, nextSong, playbackState, finished})

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useStageHandover', () => {
  it('shows the live data on first load, without applause', () => {
    const {result} = renderShow(live(a, b))
    expect(result.current).toMatchObject({stage: a, next: b, finished: false, applause: null})
  })

  it('applauds a heard song, holds the incoming song in the next card, then moves on', () => {
    const {result, rerender} = renderShow(live(a, b))
    rerender({live: live(b, c, 'STOPPED'), on: true})
    expect(result.current).toMatchObject({stage: null, next: b, finished: false, applause: a})

    act(() => vi.advanceTimersByTime(APPLAUSE_MS - 1))
    expect(result.current.applause).toBe(a)
    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toMatchObject({stage: b, next: c, finished: false, applause: null})
  })

  it('releases the hold to the latest data, without a second timer', () => {
    const {result, rerender} = renderShow(live(a, b))
    rerender({live: live(b, c), on: true})
    act(() => vi.advanceTimersByTime(APPLAUSE_MS / 2))
    rerender({live: live(c, null), on: true})
    expect(result.current.applause).toBe(a)
    act(() => vi.advanceTimersByTime(APPLAUSE_MS / 2))
    expect(result.current).toMatchObject({stage: c, next: null, finished: false, applause: null})
  })

  it('does not applaud a song the room never heard, or a song without a named band', () => {
    const {result, rerender} = renderShow(live(a, b, 'STOPPED'))
    rerender({live: live(b, c, 'STOPPED'), on: true})
    expect(result.current.applause).toBeNull()

    const nameless = song('d', [{id: 'd-1', name: '', instrument: 'drums'}])
    rerender({live: live(nameless, c), on: true})
    rerender({live: live(c, null), on: true})
    expect(result.current.applause).toBeNull()
  })

  it('counts a song that was paused as heard', () => {
    const {result, rerender} = renderShow(live(a, b, 'STOPPED'))
    rerender({live: live(a, b, 'PAUSED'), on: true})
    rerender({live: live(b, c, 'STOPPED'), on: true})
    expect(result.current.applause).toBe(a)
  })

  it('cancels the applause when the host goes back to the same song', () => {
    const {result, rerender} = renderShow(live(a, b))
    rerender({live: live(b, c), on: true})
    rerender({live: live(a, b), on: true})
    expect(result.current).toMatchObject({stage: a, next: b, finished: false, applause: null})
  })

  it('applauds the last band before the finale', () => {
    const {result, rerender} = renderShow(live(a, null))
    rerender({live: live(null, null, 'STOPPED', true), on: true})
    expect(result.current).toMatchObject({stage: null, next: null, finished: false, applause: a})
    act(() => vi.advanceTimersByTime(APPLAUSE_MS))
    expect(result.current).toMatchObject({stage: null, next: null, finished: true, applause: null})
  })

  it('passes the live data straight through when disabled', () => {
    const {result, rerender} = renderShow(live(a, b), false)
    rerender({live: live(b, c), on: false})
    expect(result.current).toMatchObject({stage: b, next: c, finished: false, applause: null})
  })

  describe('up-next flight', () => {
    it('boards the up-next song when the applause releases', () => {
      const {result, rerender} = renderShow(live(a, b), true, true)
      rerender({live: live(b, c), on: true})
      expect(result.current.boarding).toBeNull()
      act(() => vi.advanceTimersByTime(APPLAUSE_MS))
      expect(result.current).toMatchObject({stage: b, next: c, applause: null, boarding: {song: b}})
    })

    it('boards on a direct handover, and ends when the flight lands', () => {
      const {result, rerender} = renderShow(live(a, b, 'STOPPED'), true, true)
      rerender({live: live(b, c, 'STOPPED'), on: true})
      expect(result.current.boarding?.song).toBe(b)
      act(() => result.current.land(result.current.boarding!.id))
      expect(result.current.boarding).toBeNull()
    })

    it('always ends a boarding, so no stage text stays hidden', () => {
      const {result, rerender} = renderShow(live(a, b, 'STOPPED'), true, true)
      rerender({live: live(b, c, 'STOPPED'), on: true})
      act(() => vi.advanceTimersByTime(BOARDING_MS))
      expect(result.current.boarding).toBeNull()
    })

    it('does not board on first load, out of order, into the finale, or with the flight off', () => {
      const {result, rerender} = renderShow(live(a, b, 'STOPPED'), true, true)
      expect(result.current.boarding).toBeNull()
      rerender({live: live(c, null, 'STOPPED'), on: true})
      expect(result.current.boarding).toBeNull()
      rerender({live: live(null, null, 'STOPPED', true), on: true})
      expect(result.current.boarding).toBeNull()

      const off = renderShow(live(a, b, 'STOPPED'), true, false)
      off.rerender({live: live(b, c, 'STOPPED'), on: true})
      expect(off.result.current.boarding).toBeNull()
    })

    it('does not board when the host changed the queue during the applause', () => {
      const {result, rerender} = renderShow(live(a, b), true, true)
      rerender({live: live(b, c), on: true})
      rerender({live: live(c, null), on: true})
      act(() => vi.advanceTimersByTime(APPLAUSE_MS))
      expect(result.current).toMatchObject({stage: c, boarding: null})
    })
  })
})
