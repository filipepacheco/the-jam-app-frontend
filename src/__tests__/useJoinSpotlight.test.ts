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
    expect(result.current.next).toBeNull()
    expect(result.current.queue).toBeNull()
    expect(result.current.awaiting.size).toBe(0)
  })

  it('announces an up-next sign-up in its card and hides its slot until it lands', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next, later]})
    rerender({current: stage, queue: [withMusician(next, musician('bianca', 'keys')), later]})

    expect(result.current.next?.joins.map(join => [join.musician.name, join.title])).toEqual([['Bianca', 'Title next']])
    expect(result.current.queue).toBeNull()
    expect([...result.current.awaiting]).toEqual(['next:bianca'])

    act(() => result.current.finish(result.current.next!.id))
    expect(result.current.next).toBeNull()
    expect(result.current.awaiting.size).toBe(0)
  })

  it('announces a later sign-up under the QR code, with nothing waiting to fly', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next, later]})
    rerender({current: stage, queue: [next, withMusician(later, musician('bianca', 'keys'))]})

    expect(result.current.queue?.joins.map(join => join.musician.name)).toEqual(['Bianca'])
    expect(result.current.queue?.lane).toBe('queue')
    expect(result.current.next).toBeNull()
    expect(result.current.awaiting.size).toBe(0)
  })

  it('announces a sign-up for the song on stage under the QR code', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next]})
    rerender({current: withMusician(stage, musician('ana')), queue: [next]})
    expect(result.current.queue?.joins.map(join => [join.musician.name, join.title])).toEqual([['Ana', 'Title stage']])
    expect(result.current.next).toBeNull()
    expect(result.current.awaiting.size).toBe(0)
  })

  it('announces a second song for someone already in the queue', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next, later]})
    rerender({current: stage, queue: [next, withMusician(later, musician('camila'))]})
    expect(result.current.queue?.joins.map(join => join.key)).toEqual(['later:camila'])
  })

  it('announces someone who moves to another song', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next, later]})
    rerender({current: stage, queue: [song('next'), withMusician(later, musician('camila'))]})
    expect(result.current.queue?.joins.map(join => join.key)).toEqual(['later:camila'])
  })

  it('announces each song when one musician signs up for two in the same poll', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next, later, song('last')]})
    rerender({current: stage, queue: [next, withMusician(later, musician('bianca')), song('last', musician('bianca'))]})
    expect(result.current.queue?.joins.map(join => join.key)).toEqual(['later:bianca', 'last:bianca'])
  })

  it('merges one poll of sign-ups into one moment, with the overflow as a count', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next]})
    rerender({current: stage, queue: [withMusician(next, musician('ana'), musician('bia'), musician('caio'), musician('dani'), musician('eva'))]})

    expect(result.current.next?.joins.map(join => join.musician.id)).toEqual(['ana', 'bia', 'caio'])
    expect(result.current.next?.extra).toBe(2)
    expect(result.current.awaiting.has('next:dani')).toBe(false)
  })

  it('moves an up-next announcement under the QR code once its song takes the stage', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next, later], paused: true})
    const joined = withMusician(next, musician('bianca'))
    rerender({current: stage, queue: [joined, later], paused: true})
    const waiting = result.current.next
    expect(waiting).not.toBeNull()
    rerender({current: joined, queue: [later], paused: true})
    expect(result.current.next).toBeNull()
    expect(result.current.queue).toEqual({...waiting, lane: 'queue'})
    expect(result.current.awaiting.size).toBe(0)
  })

  it('drops an up-next announcement whose song left the board', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next, later], paused: true})
    rerender({current: stage, queue: [withMusician(next, musician('bianca')), later], paused: true})
    rerender({current: stage, queue: [later], paused: true})
    expect(result.current.next).toBeNull()
    expect(result.current.queue).toBeNull()
  })

  it('does not announce a queue that moves on, a repeated poll or a leave', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next, later]})
    rerender({current: next, queue: [later, song('slid-into-view', musician('zoe'))]})
    rerender({current: next, queue: [later, song('slid-into-view', musician('zoe'))]})
    rerender({current: song('next'), queue: [later, song('slid-into-view', musician('zoe'))]})
    expect(result.current.next).toBeNull()
    expect(result.current.queue).toBeNull()
  })

  it('announces nothing while hidden or in another layout', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next], enabled: false})
    rerender({current: stage, queue: [withMusician(next, musician('bianca'))], enabled: false})
    expect(result.current.next).toBeNull()
  })

  it('takes the first lineup on screen as known, even when it arrives with the change', () => {
    const {result, rerender} = renderSpotlight({current: null, queue: [], enabled: false})
    rerender({current: null, queue: [next, later]})
    expect(result.current.next).toBeNull()
    expect(result.current.queue).toBeNull()
    rerender({current: null, queue: [next, withMusician(later, musician('bianca'))]})
    expect(result.current.queue?.joins.map(join => join.key)).toEqual(['later:bianca'])
  })

  it('keeps the slots visible when names will not fly', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next], flight: false})
    rerender({current: stage, queue: [withMusician(next, musician('bianca'))], flight: false})
    expect(result.current.next).not.toBeNull()
    expect(result.current.awaiting.size).toBe(0)
  })

  it('always ends a moment, so no name stays hidden', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next, later]})
    rerender({current: stage, queue: [withMusician(next, musician('bianca')), withMusician(later, musician('caio'))]})
    act(() => vi.advanceTimersByTime(MOMENT_TIMEOUT_MS))
    expect(result.current.next).toBeNull()
    expect(result.current.queue).toBeNull()
    expect(result.current.awaiting.size).toBe(0)
  })

  it('holds the timeout while the stage applauds', () => {
    const {result, rerender} = renderSpotlight({current: stage, queue: [next], paused: true})
    rerender({current: stage, queue: [withMusician(next, musician('bianca'))], paused: true})
    act(() => vi.advanceTimersByTime(MOMENT_TIMEOUT_MS))
    expect(result.current.next).not.toBeNull()
  })
})
