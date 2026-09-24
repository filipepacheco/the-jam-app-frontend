import {act, renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {MOMENT_TIMEOUT_MS, useJoinSpotlight} from '../components/publicDashboard/useJoinSpotlight'
import type {DashboardMusicianDto, DashboardSongDto} from '../types/api.types'

const musician = (id: string, instrument = 'vocals'): DashboardMusicianDto => ({id, name: id[0].toUpperCase() + id.slice(1), instrument})
const song = (id: string, ...musicians: DashboardMusicianDto[]): DashboardSongDto => ({id, title: `Title ${id}`, artist: 'Artist', duration: null, musicians})
const withMusician = (target: DashboardSongDto, ...added: DashboardMusicianDto[]) => ({...target, musicians: [...target.musicians, ...added]})

const stage = song('stage', musician('yuri'))
const next = song('next', musician('camila'))
const later = song('later')

interface Props {
  current: DashboardSongDto | null
  queue: DashboardSongDto[]
  enabled?: boolean
  flight?: boolean
  paused?: boolean
}

function renderSpotlight(initial: Props) {
  return renderHook(({current, queue, enabled = true, flight = true, paused = false}: Props) =>
    useJoinSpotlight(current, queue, {enabled, flight, paused}), {initialProps: initial})
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useJoinSpotlight', () => {
  it('does not announce the lineup that is already there on first load', () => {
    const {result} = renderSpotlight({current: stage, queue: [next, later]})
    expect(result.current.moment).toBeNull()
    expect(result.current.awaiting.size).toBe(0)
  })

  it('announces a sign-up on any queued song and hides its slot until it lands', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next, later]})
    rerender({current: stage, queue: [next, withMusician(later, musician('bianca', 'keys'))]})

    expect(result.current.moment?.joins.map(join => [join.musician.name, join.title])).toEqual([['Bianca', 'Title later']])
    expect([...result.current.awaiting]).toEqual(['later:bianca'])

    act(() => result.current.finish(result.current.moment!.id))
    expect(result.current.moment).toBeNull()
    expect(result.current.awaiting.size).toBe(0)
  })

  it('merges one poll of sign-ups into one moment, with the overflow as a count', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next]})
    rerender({current: withMusician(stage, musician('ana'), musician('bia')), queue: [withMusician(next, musician('caio'), musician('dani'), musician('eva'))]})

    expect(result.current.moment?.joins.map(join => join.musician.id)).toEqual(['ana', 'bia', 'caio'])
    expect(result.current.moment?.extra).toBe(2)
    expect(result.current.awaiting.has('next:dani')).toBe(false)
  })

  it('does not announce a queue that moves on, a repeated poll, a move or a leave', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next, later]})
    rerender({current: next, queue: [later, song('slid-into-view', musician('zoe'))]})
    rerender({current: next, queue: [later, song('slid-into-view', musician('zoe'))]})
    rerender({current: next, queue: [withMusician(later, musician('camila'))]})
    rerender({current: song('next'), queue: [later]})
    expect(result.current.moment).toBeNull()
  })

  it('announces nothing while hidden or in another layout', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next], enabled: false})
    rerender({current: stage, queue: [withMusician(next, musician('bianca'))], enabled: false})
    expect(result.current.moment).toBeNull()
  })

  it('keeps the slots visible when names will not fly', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next], flight: false})
    rerender({current: stage, queue: [withMusician(next, musician('bianca'))], flight: false})
    expect(result.current.moment).not.toBeNull()
    expect(result.current.awaiting.size).toBe(0)
  })

  it('always ends a moment, so no name stays hidden', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next]})
    rerender({current: stage, queue: [withMusician(next, musician('bianca'))]})
    act(() => vi.advanceTimersByTime(MOMENT_TIMEOUT_MS))
    expect(result.current.moment).toBeNull()
    expect(result.current.awaiting.size).toBe(0)
  })

  it('holds the timeout while the stage applauds', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next], paused: true})
    rerender({current: stage, queue: [withMusician(next, musician('bianca'))], paused: true})
    act(() => vi.advanceTimersByTime(MOMENT_TIMEOUT_MS))
    expect(result.current.moment).not.toBeNull()
  })
})
