import {act, render} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {CurrentSongCard} from '../components/publicDashboard/CurrentSongCard'
import type {DashboardSongDto} from '../types/api.types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

const psychoKiller: DashboardSongDto = {
  id: 'song-1',
  title: 'Psycho Killer',
  artist: 'Talking Heads',
  duration: 261,
  musicians: [
    {id: 'yuri', name: 'Yuri', instrument: 'vocals'},
    {id: 'marina', name: 'Marina', instrument: 'drums'},
  ],
}
const valerie: DashboardSongDto = {...psychoKiller, id: 'song-2', title: 'Valerie', artist: 'Amy Winehouse'}

let targets: Element[] = []
let frames: Keyframe[][] = []
const originalAnimate = Element.prototype.animate

function stubMotionPreference(reduce: boolean) {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })))
}

beforeEach(() => {
  targets = []
  frames = []
  stubMotionPreference(false)
  Element.prototype.animate = vi.fn(function (this: Element, keyframes: Keyframe[]) {
    targets.push(this)
    frames.push(keyframes)
    return {cancel: vi.fn(), finished: Promise.resolve()} as unknown as Animation
  })
})

afterEach(() => {
  Element.prototype.animate = originalAnimate
  vi.unstubAllGlobals()
})

describe('useVenueChangeMotion', () => {
  it('opens with an intro, then ignores a polling response with the same visible values', () => {
    const {rerender} = render(<CurrentSongCard song={psychoKiller} />)
    expect(targets.some(target => target.classList.contains('venue-current'))).toBe(true)

    targets = []
    rerender(<CurrentSongCard song={structuredClone(psychoKiller)} />)
    expect(targets).toHaveLength(0)
  })

  it('moves only the arriving musician when the lineup of the same song changes', () => {
    const {rerender} = render(<CurrentSongCard song={psychoKiller} />)
    targets = []
    rerender(<CurrentSongCard song={{...psychoKiller, musicians: [...psychoKiller.musicians, {id: 'bia', name: 'Bia', instrument: 'vocals'}]}} />)

    const moved = targets.map(target => target.getAttribute('data-venue-musician') ?? target.className)
    expect(moved).toContain('bia')
    expect(moved).toContain('venue-musician-wash')
    expect(moved).not.toContain('yuri')
    expect(moved).not.toContain('marina')
    expect(targets.some(target => target.classList.contains('venue-roll-line'))).toBe(false)
  })

  it('rolls the outgoing song out of a hidden ghost copy and clears it afterwards', async () => {
    const {container, rerender} = render(<CurrentSongCard song={psychoKiller} />)
    targets = []
    rerender(<CurrentSongCard song={valerie} />)

    const ghost = container.querySelector('[data-venue-ghost]')!
    expect(ghost).toHaveAttribute('aria-hidden', 'true')
    expect(ghost).toHaveTextContent('Psycho Killer')
    const rolled = targets.filter(target => target.classList.contains('venue-roll-line')).map(target => target.textContent)
    expect(rolled).toEqual(['Psycho Killer', 'Talking Heads', 'Valerie', 'Amy Winehouse'])

    await act(async () => {})
    expect(ghost).toBeEmptyDOMElement()
    expect(container.querySelector('.venue-current')).not.toHaveAttribute('data-venue-cue')
  })

  it('swaps songs with an opacity-only crossfade when reduced motion is preferred', () => {
    stubMotionPreference(true)
    const {container, rerender} = render(<CurrentSongCard song={psychoKiller} />)
    expect(targets).toHaveLength(0)

    rerender(<CurrentSongCard song={valerie} />)
    expect(targets.length).toBeGreaterThan(0)
    expect(frames.flat().some(frame => 'transform' in frame || 'filter' in frame)).toBe(false)
    expect(container.querySelector('.venue-current')).toHaveAttribute('data-venue-motion', 'paused')
  })

  it('rolls the last song out and the finale in when the Jam finishes', () => {
    const {container, rerender} = render(<CurrentSongCard song={psychoKiller} />)
    targets = []
    rerender(<CurrentSongCard song={psychoKiller} finished />)

    const rolled = targets.filter(target => target.classList.contains('venue-roll-line')).map(target => target.textContent)
    expect(rolled).toEqual(['Psycho Killer', 'Talking Heads', 'publicDashboard.jamFinished', 'publicDashboard.thankYou'])
    expect(container.querySelector('[data-venue-lineup]')).not.toBeInTheDocument()
  })

  it('keeps the stage lights and meter mounted but still while a song is paused', () => {
    const {container} = render(<CurrentSongCard song={psychoKiller} playbackState="PAUSED" />)
    const stage = container.querySelector('.venue-current')!

    expect(stage).toHaveAttribute('data-playback', 'still')
    expect(stage.querySelector('.venue-stage-fx')).toBeInTheDocument()
    expect(stage.querySelector('.venue-live-beat')).toBeInTheDocument()
    expect(stage).toHaveTextContent('schedule.statuses.paused')
  })
})
