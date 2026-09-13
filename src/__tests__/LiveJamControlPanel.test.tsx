import {act, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import type {LiveStateResponseDto} from '../types/jamControl.types'
import {LiveJamControlPanel} from '../components/schedule/LiveJamControlPanel'
import {jamControlService} from '../services'

const {state} = vi.hoisted(() => ({
  state: {
    currentSong: null,
    nextSongs: ['a', 'b', 'c'].map((id, index) => ({
      id,
      order: index + 1,
      status: 'SCHEDULED' as const,
      music: {title: `Music ${id}`, artist: `Artist ${id}`},
      musicians: [],
    })),
    previousSongs: [],
    suggestedSongs: [],
    jamStatus: 'ACTIVE',
    playbackState: 'PLAYING',
  } satisfies LiveStateResponseDto,
}))

vi.mock('swr', () => ({
  default: () => ({data: state, error: undefined, isLoading: false, mutate: vi.fn()}),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('LiveJamControlPanel', () => {
  it('routes mouse reordering through the Live Queue interface', () => {
    render(<LiveJamControlPanel jamId="jam-1" />)
    fireEvent.click(screen.getByRole('button', {name: 'live_control.reorder_drag'}))
    const items = screen.getAllByRole('listitem')

    fireEvent.dragStart(items[1])
    fireEvent.dragOver(items[0])
    fireEvent.drop(items[0])

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      expect.stringContaining('Music b'),
      expect.stringContaining('Music a'),
      expect.stringContaining('Music c'),
    ])
  })

  it('routes touch reordering through the Live Queue interface', () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 42))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    render(<LiveJamControlPanel jamId="jam-1" />)
    fireEvent.click(screen.getByRole('button', {name: 'live_control.reorder_drag'}))
    const items = screen.getAllByRole('listitem')
    const list = screen.getByRole('list')
    items.forEach((item, index) => {
      vi.spyOn(item, 'getBoundingClientRect').mockReturnValue({
        top: index * 100,
        bottom: index * 100 + 100,
        height: 100,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: index * 100,
        toJSON: () => ({}),
      })
    })

    fireEvent.touchStart(items[1], {touches: [{clientX: 1, clientY: 150}]})
    fireEvent.touchMove(list, {touches: [{clientX: 1, clientY: 10}]})
    fireEvent.touchEnd(list)

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      expect.stringContaining('Music b'),
      expect.stringContaining('Music a'),
      expect.stringContaining('Music c'),
    ])
  })

  it('routes keyboard reordering through the Live Queue interface', () => {
    vi.useFakeTimers()
    render(<LiveJamControlPanel jamId="jam-1" />)
    fireEvent.click(screen.getByRole('button', {name: 'live_control.reorder_drag'}))
    const before = screen.getAllByRole('listitem')

    fireEvent.keyDown(before[1], {key: 'ArrowUp'})

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      expect.stringContaining('Music b'),
      expect.stringContaining('Music a'),
      expect.stringContaining('Music c'),
    ])
  })

  it('removes touch listeners, animation frames, and delayed focus on unmount', () => {
    vi.useFakeTimers()
    const requestFrame = vi.fn(() => 42)
    const cancelFrame = vi.fn()
    vi.stubGlobal('requestAnimationFrame', requestFrame)
    vi.stubGlobal('cancelAnimationFrame', cancelFrame)
    const {unmount} = render(<LiveJamControlPanel jamId="jam-1" />)
    fireEvent.click(screen.getByRole('button', {name: 'live_control.reorder_drag'}))
    const items = screen.getAllByRole('listitem')
    const list = screen.getByRole('list')
    const removeListener = vi.spyOn(list, 'removeEventListener')
    const focus = vi.spyOn(items[1], 'focus')

    fireEvent.keyDown(items[1], {key: 'ArrowUp'})
    fireEvent.touchStart(items[0], {touches: [{clientX: 1, clientY: 1}]})
    fireEvent.touchMove(list, {touches: [{clientX: 1, clientY: 1}]})
    unmount()
    vi.runAllTimers()

    expect(focus).not.toHaveBeenCalled()
    expect(cancelFrame).toHaveBeenCalledWith(42)
    expect(removeListener.mock.calls.map(([eventName]) => eventName)).toEqual(
      expect.arrayContaining(['touchstart', 'touchmove', 'touchend', 'touchcancel']),
    )
  })

  it('cancels debounced persistence on unmount', () => {
    vi.useFakeTimers()
    const reorder = vi.spyOn(jamControlService, 'reorderQueue').mockResolvedValue({success: true})
    const {unmount} = render(<LiveJamControlPanel jamId="jam-1" />)
    fireEvent.click(screen.getByRole('button', {name: 'live_control.reorder_drag'}))
    fireEvent.keyDown(screen.getAllByRole('listitem')[1], {key: 'ArrowUp'})
    fireEvent.click(screen.getByRole('button', {name: 'live_control.reorder_save'}))

    unmount()
    vi.runAllTimers()

    expect(reorder).not.toHaveBeenCalled()
  })

  it('aborts in-flight persistence on unmount', () => {
    vi.useFakeTimers()
    let signal: AbortSignal | undefined
    vi.spyOn(jamControlService, 'reorderQueue').mockImplementation((_jamId, _updates, nextSignal) => {
      signal = nextSignal
      return new Promise(() => {})
    })
    const {unmount} = render(<LiveJamControlPanel jamId="jam-1" />)
    fireEvent.click(screen.getByRole('button', {name: 'live_control.reorder_drag'}))
    fireEvent.keyDown(screen.getAllByRole('listitem')[1], {key: 'ArrowUp'})
    fireEvent.click(screen.getByRole('button', {name: 'live_control.reorder_save'}))
    act(() => { vi.advanceTimersByTime(300) })

    unmount()

    expect(signal?.aborted).toBe(true)
  })
})
