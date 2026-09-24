import {act, fireEvent, render, renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {createReactionBatcher, createReactionFeed, isReaction, MAX_BATCH, type Reaction} from '../lib/realtime/jamReactions'

// A fake Realtime channel: records listeners and sends, joins at once.
type Listener = (message: {payload?: unknown}) => void
const channels: {name: string; listeners: Listener[]; sent: unknown[]}[] = []
const removeChannel = vi.fn()
vi.mock('../lib/supabase/config', () => ({
  supabase: {
    channel: (name: string) => {
      const record = {name, listeners: [] as Listener[], sent: [] as unknown[]}
      channels.push(record)
      const channel = {
        on: (_type: string, _filter: unknown, listener: Listener) => {
          record.listeners.push(listener)
          return channel
        },
        subscribe: () => channel,
        send: (message: unknown) => {
          record.sent.push(message)
          return Promise.resolve('ok')
        },
      }
      return channel
    },
    removeChannel: (...args: unknown[]) => removeChannel(...args),
  },
}))
vi.mock('react-i18next', () => ({useTranslation: () => ({t: (key: string) => key})}))

const {useAudienceReactions, useClapCount} = await import('../components/publicDashboard/useAudienceReactions')
const {ReactionLayer} = await import('../components/publicDashboard/ReactionLayer')
const {ReactionBar} = await import('../components/jam-detail-v2/ReactionBar')

const originalAnimate = Element.prototype.animate

beforeEach(() => {
  channels.length = 0
  removeChannel.mockClear()
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn()})))
  Element.prototype.animate = vi.fn(() => ({cancel: vi.fn(), finished: new Promise(() => {})}) as unknown as Animation)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  Element.prototype.animate = originalAnimate
})

describe('reaction payloads', () => {
  it('accepts only a known kind with a small whole count', () => {
    expect(isReaction({kind: 'clap', count: 1})).toBe(true)
    expect(isReaction({kind: 'rock', count: MAX_BATCH})).toBe(true)
    expect(isReaction({kind: 'boo', count: 1})).toBe(false)
    expect(isReaction({kind: 'clap', count: MAX_BATCH + 1})).toBe(false)
    expect(isReaction({kind: 'clap', count: 1.5})).toBe(false)
    expect(isReaction({kind: 'clap', count: 0})).toBe(false)
    expect(isReaction({kind: 'clap', count: '3'})).toBe(false)
    expect(isReaction(null)).toBe(false)
  })

  it('merges fast taps into one message for each kind and caps the count', () => {
    const sent: Reaction[] = []
    const batcher = createReactionBatcher(reaction => sent.push(reaction), 400)
    for (let tap = 0; tap < 14; tap++) batcher.tap('clap')
    batcher.tap('fire')
    expect(sent).toEqual([])
    vi.advanceTimersByTime(400)
    expect(sent).toEqual([{kind: 'clap', count: MAX_BATCH}, {kind: 'fire', count: 1}])
  })
})

describe('useAudienceReactions', () => {
  it('listens on the Jam channel and passes on only valid reactions', () => {
    const {result} = renderHook(() => useAudienceReactions('jam-1', true))
    const heard: Reaction[] = []
    result.current.subscribe(reaction => heard.push(reaction))

    expect(channels.map(({name}) => name)).toEqual(['jam-reactions:jam-1'])
    const [listener] = channels[0].listeners
    listener({payload: {kind: 'heart', count: 2}})
    listener({payload: {kind: 'heart', count: 2, name: 'extra fields are dropped'}})
    listener({payload: {kind: '<script>', count: 1}})
    expect(heard).toEqual([{kind: 'heart', count: 2}, {kind: 'heart', count: 2}])
  })

  it('leaves the channel when disabled and when unmounted', () => {
    const {rerender, unmount} = renderHook(({enabled}) => useAudienceReactions('jam-1', enabled), {initialProps: {enabled: true}})
    rerender({enabled: false})
    expect(removeChannel).toHaveBeenCalledTimes(1)
    rerender({enabled: true})
    unmount()
    expect(removeChannel).toHaveBeenCalledTimes(2)
  })

  it('counts the claps of each applause, from zero', () => {
    const feed = createReactionFeed()
    const {result, rerender} = renderHook(({active}) => useClapCount(feed, active), {initialProps: {active: 'song-1' as string | null}})
    act(() => {
      feed.emit({kind: 'clap', count: 3})
      feed.emit({kind: 'fire', count: 5})
      feed.emit({kind: 'clap', count: 2})
      vi.advanceTimersByTime(150)
    })
    expect(result.current).toBe(5)

    rerender({active: 'song-2'})
    expect(result.current).toBe(0)
    rerender({active: null})
    act(() => {
      feed.emit({kind: 'clap', count: 4})
      vi.advanceTimersByTime(150)
    })
    expect(result.current).toBe(0)
  })
})

describe('ReactionLayer', () => {
  it('floats each reaction, spread over time, and never more than the cap', () => {
    const feed = createReactionFeed()
    const {container} = render(<ReactionLayer feed={feed} gentle={false} />)
    const layer = container.querySelector('.venue-reactions')!
    act(() => {
      for (let batch = 0; batch < 5; batch++) feed.emit({kind: 'clap', count: MAX_BATCH})
      vi.advanceTimersByTime(1)
    })
    expect(layer.childElementCount).toBeGreaterThan(0)
    expect(layer.childElementCount).toBeLessThan(MAX_BATCH * 5)
    act(() => vi.advanceTimersByTime(600))
    expect(layer.childElementCount).toBe(30)
    expect(layer.textContent).toContain('👏')
  })
})

describe('ReactionBar', () => {
  it('sends the taps of the audience to the Jam channel, batched', async () => {
    const {getByRole} = render(<ReactionBar jamId="jam-1" />)
    const clap = getByRole('button', {name: 'jams.reactions.clap'})
    fireEvent.click(clap)
    fireEvent.click(clap)
    fireEvent.click(getByRole('button', {name: 'jams.reactions.rock'}))
    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    expect(channels.map(({name}) => name)).toEqual(['jam-reactions:jam-1'])
    expect(channels[0].sent).toEqual([
      {type: 'broadcast', event: 'reaction', payload: {kind: 'clap', count: 2}},
      {type: 'broadcast', event: 'reaction', payload: {kind: 'rock', count: 1}},
    ])
  })

  it('keeps review taps local when not live', () => {
    const {getByRole} = render(<ReactionBar jamId="jam-1" live={false} />)
    fireEvent.click(getByRole('button', {name: 'jams.reactions.fire'}))
    vi.advanceTimersByTime(400)
    expect(channels).toHaveLength(0)
  })
})
