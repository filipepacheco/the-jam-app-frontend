import {act, fireEvent, render, renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {MotionGlobalConfig} from 'framer-motion'
import {cleanName, createReactionBatcher, createReactionFeed, isReaction, MAX_BATCH, MAX_NAME, type Reaction} from '../lib/realtime/jamReactions'

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
// Keys stand for the copy; a {name} goes before the key, so it shows.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string, options?: {name?: string}) => options?.name === undefined ? key : `${options.name} ${key}`}),
}))

// Exits finish at once, so a line leaves the DOM when its time is up.
MotionGlobalConfig.skipAnimations = true

const {useAudienceReactions, useClapCount} = await import('../components/publicDashboard/useAudienceReactions')
const {ReactionLayer} = await import('../components/publicDashboard/ReactionLayer')
const {ReactionBar} = await import('../components/jam-detail-v2/ReactionBar')
const {ReactionShoutouts, MAX_SHOUTOUTS, SHOUTOUT_MS} = await import('../components/publicDashboard/ReactionShoutouts')

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

  it('cleans a name to one short line of printable text', () => {
    expect(cleanName('Lipe')).toBe('Lipe')
    expect(cleanName('Li\u0000pe\u0007')).toBe('Lipe')
    expect(cleanName('\u202EepiL\u200F\u2066')).toBe('epiL')
    expect(cleanName('  Ana \n\t Clara  ')).toBe('Ana Clara')
    expect(cleanName('x'.repeat(MAX_NAME + 10))).toBe('x'.repeat(MAX_NAME))
    expect(cleanName('🎸'.repeat(MAX_NAME + 1))).toBe('🎸'.repeat(MAX_NAME))
    expect(cleanName('')).toBeNull()
    expect(cleanName(' \u200B\n ')).toBeNull()
    expect(cleanName(null)).toBeNull()
    expect(cleanName(undefined)).toBeNull()
    expect(cleanName(42)).toBeNull()
    expect(cleanName({name: 'Lipe'})).toBeNull()
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
    listener({payload: {kind: 'heart', count: 2, name: '  Lipe\u202E  ', extra: 'dropped'}})
    listener({payload: {kind: 'fire', count: 1, name: 42}})
    listener({payload: {kind: '<script>', count: 1, name: 'Lipe'}})
    expect(heard).toEqual([
      {kind: 'heart', count: 2, name: null},
      {kind: 'heart', count: 2, name: 'Lipe'},
      {kind: 'fire', count: 1, name: null},
    ])
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

  it('sends the account name with each batch and shows that it reaches the big screen', async () => {
    const {getByRole, getByText} = render(<ReactionBar jamId="jam-1" name="Lipe" />)
    fireEvent.click(getByRole('button', {name: 'jams.reactions.heart'}))
    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    expect(channels[0].sent).toEqual([{type: 'broadcast', event: 'reaction', payload: {kind: 'heart', count: 1, name: 'Lipe'}}])
    expect(getByText('jams.reactions.named')).toBeTruthy()
  })

  it('sends no name for a guest and tells them to sign in', async () => {
    const {getByRole, getByText, queryByText} = render(<ReactionBar jamId="jam-1" guest />)
    fireEvent.click(getByRole('button', {name: 'jams.reactions.fire'}))
    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    expect(channels[0].sent).toEqual([{type: 'broadcast', event: 'reaction', payload: {kind: 'fire', count: 1}}])
    expect(getByText('jams.reactions.anonymous')).toBeTruthy()
    expect(queryByText('jams.reactions.named')).toBeNull()
  })

  it('keeps review taps local when not live', () => {
    const {getByRole} = render(<ReactionBar jamId="jam-1" live={false} />)
    fireEvent.click(getByRole('button', {name: 'jams.reactions.fire'}))
    vi.advanceTimersByTime(400)
    expect(channels).toHaveLength(0)
  })
})

describe('ReactionShoutouts', () => {
  // framer-motion runs these, not the stub: its exits must finish.
  beforeEach(() => {
    Element.prototype.animate = originalAnimate
  })

  const wait = (ms: number) => act(async () => {
    vi.advanceTimersByTime(ms)
  })

  const renderFeed = () => {
    const feed = createReactionFeed()
    const {container} = render(<ReactionShoutouts feed={feed} gentle={false} />)
    const lines = () => [...container.querySelectorAll('.venue-shoutout')].map(line => line.textContent)
    const emit = (reaction: Reaction) => act(async () => {
      feed.emit(reaction)
    })
    return {emit, lines}
  }

  it('shows one line for each name and kind, and a repeat keeps its line', async () => {
    const {emit, lines} = renderFeed()
    await emit({kind: 'heart', count: 1, name: 'Lipe'})
    await emit({kind: 'fire', count: 2, name: 'Lipe'})
    await emit({kind: 'heart', count: 3, name: 'Lipe'})

    expect(lines()).toEqual(['Lipe publicDashboard.shoutoutHeart❤️', 'Lipe publicDashboard.shoutoutFire🔥'])
  })

  it('names a guest as someone in the crowd, in one line for each kind', async () => {
    const {emit, lines} = renderFeed()
    await emit({kind: 'clap', count: 1})
    await emit({kind: 'clap', count: 4, name: null})

    expect(lines()).toEqual(['publicDashboard.shoutoutSomeone publicDashboard.shoutoutClap👏'])
  })

  it('shows at most MAX_SHOUTOUTS lines and sends away the one with the oldest reaction', async () => {
    const {emit, lines} = renderFeed()
    const names = ['Ana', 'Bia', 'Caio', 'Duda']
    for (const name of names.slice(0, MAX_SHOUTOUTS)) {
      await emit({kind: 'rock', count: 1, name})
      await wait(100)
    }
    // Ana reacts again, so Bia is now the oldest.
    await emit({kind: 'rock', count: 1, name: 'Ana'})
    await emit({kind: 'rock', count: 1, name: 'Duda'})

    expect(lines()).toHaveLength(MAX_SHOUTOUTS)
    expect(lines().map(line => line?.split(' ')[0])).toEqual(['Ana', 'Caio', 'Duda'])
  })

  it('removes a line SHOUTOUT_MS after its last reaction', async () => {
    const {emit, lines} = renderFeed()
    await emit({kind: 'heart', count: 1, name: 'Lipe'})
    await emit({kind: 'fire', count: 1, name: 'Marina'})
    await wait(SHOUTOUT_MS - 1000)
    await emit({kind: 'heart', count: 1, name: 'Lipe'})

    await wait(1000)
    expect(lines()).toEqual(['Lipe publicDashboard.shoutoutHeart❤️'])
    await wait(SHOUTOUT_MS - 1000)
    expect(lines()).toEqual([])
  })
})
