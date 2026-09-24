import {act, render} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {CurrentSongCard} from '../components/publicDashboard/CurrentSongCard'
import {NextSongCard} from '../components/publicDashboard/NextSongCard'
import {StageFlight} from '../components/publicDashboard/StageFlight'
import type {Boarding} from '../components/publicDashboard/useStageHandover'
import type {DashboardSongDto} from '../types/api.types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string, options?: {names?: string}) => options?.names ? `${key} ${options.names}` : key}),
}))
// The confetti canvas needs a real browser; the applause test checks the stage around it.
vi.mock('../components/publicDashboard/ConfettiWrapper', () => ({default: () => null}))

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
let timings: (KeyframeAnimationOptions | undefined)[] = []
let played: {cancel: ReturnType<typeof vi.fn>}[] = []
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
  timings = []
  played = []
  stubMotionPreference(false)
  Element.prototype.animate = vi.fn(function (this: Element, keyframes: Keyframe[], options?: KeyframeAnimationOptions) {
    targets.push(this)
    frames.push(keyframes)
    timings.push(options)
    const animation = {cancel: vi.fn(), finished: Promise.resolve()}
    played.push(animation)
    return animation as unknown as Animation
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
    const words = targets.filter(target => target.classList.contains('venue-word-inner')).map(target => target.textContent)
    expect(rolled).toEqual(['Psycho Killer', 'Talking Heads', 'Amy Winehouse'])
    expect(words).toEqual(['Valerie'])

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
    const words = targets.filter(target => target.classList.contains('venue-word-inner')).map(target => target.textContent)
    expect(rolled).toEqual(['Psycho Killer', 'Talking Heads', 'publicDashboard.thankYou'])
    expect(words).toEqual(['publicDashboard.jamFinished'])
    expect(container.querySelector('[data-venue-lineup]')).not.toBeInTheDocument()
  })

  it('applauds the band that just played under a strobe, with its lineup out of the way', () => {
    const {container, rerender} = render(<CurrentSongCard song={psychoKiller} />)
    targets = []
    timings = []
    rerender(<CurrentSongCard song={valerie} applause={psychoKiller} />)
    const stage = container.querySelector('.venue-current')!

    expect(stage).toHaveAttribute('data-playback', 'applause')
    expect(stage).toHaveTextContent('publicDashboard.applauseLabel')
    expect(stage.querySelector('.venue-artist')).toHaveTextContent('Psycho Killer · Talking Heads')
    const words = targets.filter(target => target.classList.contains('venue-word-inner')).map(target => target.textContent)
    expect(words).toEqual(['publicDashboard.applauseFor', 'Yuri', 'and', 'Marina'])
    expect(stage.querySelector('[data-venue-musician="yuri"]')).toBeInTheDocument()
    expect(targets.some(target => target.hasAttribute('data-venue-instrument'))).toBe(false)
    const strobe = targets.findIndex(target => target.classList.contains('venue-change-wash'))
    expect(timings[strobe]).toMatchObject({iterations: 3})

    targets = []
    rerender(<CurrentSongCard song={valerie} />)
    expect(stage).toHaveAttribute('data-playback', 'sounding')
    expect(targets.some(target => target.hasAttribute('data-venue-instrument'))).toBe(true)
  })

  it('leaves a spotlighted sign-up hidden in its slot for the spotlight to fly in', () => {
    const {container, rerender} = render(<CurrentSongCard song={psychoKiller} />)
    targets = []
    const joined = {...psychoKiller, musicians: [...psychoKiller.musicians, {id: 'bia', name: 'Bia', instrument: 'vocals'}]}
    rerender(<CurrentSongCard song={joined} awaiting={new Set(['song-1:bia'])} />)

    const name = container.querySelector('[data-venue-musician="bia"]')
    expect(name).toHaveAttribute('data-venue-awaiting')
    expect(container.querySelector('.venue-current')).toHaveAttribute('data-venue-song-id', 'song-1')
    expect(targets).not.toContain(name)
    expect(targets.some(target => target.classList.contains('venue-musician-wash'))).toBe(false)
  })

  it('changes the stage light color only once the new song has fully arrived', async () => {
    const {container, rerender} = render(<CurrentSongCard song={psychoKiller} />)
    const stage = container.querySelector<HTMLElement>('.venue-current')!
    const before = stage.style.getPropertyValue('--venue-scene-shift')
    rerender(<CurrentSongCard song={{...valerie, id: 'song-9'}} />)
    expect(stage.style.getPropertyValue('--venue-scene-shift')).toBe(before)

    await act(async () => {})
    expect(stage.style.getPropertyValue('--venue-scene-shift')).not.toBe(before)
  })

  it('keeps the stage lights and meter mounted but still while a song is paused', () => {
    const {container} = render(<CurrentSongCard song={psychoKiller} playbackState="PAUSED" />)
    const stage = container.querySelector('.venue-current')!

    expect(stage).toHaveAttribute('data-playback', 'still')
    expect(stage.querySelector('.venue-stage-fx')).toBeInTheDocument()
    expect(stage.querySelector('.venue-live-beat')).toBeInTheDocument()
    expect(stage).toHaveTextContent('schedule.statuses.paused')
  })

  describe('up-next flight', () => {
    const encore: DashboardSongDto = {...psychoKiller, id: 'song-3', title: 'Encore', artist: 'Band', musicians: []}

    function Board({stage, next, boarding = null, onLand = vi.fn()}: {stage: DashboardSongDto | null; next: DashboardSongDto | null; boarding?: Boarding | null; onLand?: (id: number) => void}) {
      return (
        <div className="venue-programme">
          <CurrentSongCard song={stage} boarding={boarding?.id} />
          <NextSongCard song={next} boarding={boarding?.id} />
          <StageFlight boarding={boarding} onLand={onLand} />
        </div>
      )
    }

    it('flies the up-next title, artist and band to the stage, then shows the stage text', async () => {
      const onLand = vi.fn()
      const {container, rerender} = render(<Board stage={psychoKiller} next={valerie} onLand={onLand} />)
      targets = []
      const boarding = {song: valerie, id: 1}
      rerender(<Board stage={valerie} next={encore} boarding={boarding} onLand={onLand} />)

      const stage = container.querySelector('.venue-current')!
      const clones = [...container.querySelectorAll<HTMLElement>('.venue-flight-clone')]
      expect(clones.map(clone => [clone.dataset.part, clone.textContent])).toEqual([
        ['word', 'Valerie'], ['artist', 'Amy Winehouse'], ['name', 'Yuri'], ['name', 'Marina'],
      ])
      expect(stage).toHaveAttribute('data-venue-boarding')
      // Nothing rises or lands on the stage, and the up-next card lets the old song go.
      expect(targets.filter(target => stage.contains(target) && target.classList.contains('venue-word-inner'))).toHaveLength(0)
      expect(targets.filter(target => stage.contains(target) && target.hasAttribute('data-venue-instrument'))).toHaveLength(0)
      expect(container.querySelector('.venue-next [data-venue-ghost]')).toBeEmptyDOMElement()

      await act(async () => {})
      expect(onLand).toHaveBeenCalledWith(1)

      targets = []
      rerender(<Board stage={valerie} next={encore} onLand={onLand} />)
      expect(container.querySelector('.venue-flight-clone')).not.toBeInTheDocument()
      expect(stage).not.toHaveAttribute('data-venue-boarding')
      expect(targets.some(target => target.classList.contains('venue-change-wash'))).toBe(true)
      expect(targets.filter(target => target.classList.contains('venue-instrument-label')).length).toBeGreaterThan(0)
    })

    it('cancels the flight when the display goes away', () => {
      const {rerender, unmount} = render(<Board stage={psychoKiller} next={valerie} />)
      rerender(<Board stage={valerie} next={encore} boarding={{song: valerie, id: 1}} />)
      const flights = played.filter((_, index) => (targets[index] as HTMLElement).classList.contains('venue-flight-clone'))
      expect(flights.length).toBeGreaterThan(0)
      unmount()
      flights.forEach(animation => expect(animation.cancel).toHaveBeenCalled())
    })
  })
})
