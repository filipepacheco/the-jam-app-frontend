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
  stubMotionPreference(false)
  Element.prototype.animate = vi.fn(function (this: Element) {
    targets.push(this)
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

  it('keeps every change still when reduced motion is preferred', () => {
    stubMotionPreference(true)
    const {container, rerender} = render(<CurrentSongCard song={psychoKiller} />)
    rerender(<CurrentSongCard song={valerie} />)

    expect(targets).toHaveLength(0)
    expect(container.querySelector('.venue-current')).toHaveAttribute('data-venue-motion', 'paused')
  })
})
