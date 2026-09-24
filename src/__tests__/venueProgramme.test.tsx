import {act, render} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {VenueProgramme} from '../components/publicDashboard/VenueProgramme'

interface Played {
  target: Element
  frames: Keyframe[]
  effect: {target: Element | null}
  cancel: ReturnType<typeof vi.fn>
  finish: () => void
}

// happy-dom has no layout. Each test says what the grid reports for the stage
// label it shows (rows) and where each text sits (tops), so the reading taken
// before React changes the DOM differs from the one after.
let rows: Record<string, string> = {}
/** What the grid reports while a resize is on it. */
let midway: string | null = null
let tops: Record<string, number> = {}
let played: Played[] = []
const originalAnimate = Element.prototype.animate
const originalRect = Element.prototype.getBoundingClientRect
const originalStyle = window.getComputedStyle

beforeEach(() => {
  rows = {'Tocando agora': '600px 300px', Aplausos: '600px 300px'}
  midway = null
  tops = {}
  played = []
  Element.prototype.animate = vi.fn(function (this: Element, frames: Keyframe[]) {
    let finish = () => {}
    const finished = new Promise<void>(resolve => {
      finish = resolve
    })
    const animation = {target: this, frames, effect: {target: this}, cancel: vi.fn(), finish, finished}
    played.push(animation)
    return animation as unknown as Animation
  })
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const top = (this as HTMLElement).dataset?.block ? tops[this.textContent ?? ''] ?? 0 : 0
    return {top, left: 0, width: 100, height: 10, right: 100, bottom: top + 10, x: 0, y: top, toJSON: () => ({})} as DOMRect
  }
  vi.spyOn(window, 'getComputedStyle').mockImplementation(element => {
    const style = originalStyle(element)
    return {
      position: element.classList.contains('wash') ? 'absolute' : 'static',
      gridTemplateRows: element.classList.contains('venue-programme') ? rowsOf(element) : style.gridTemplateRows,
    } as CSSStyleDeclaration
  })
})

function rowsOf(grid: Element) {
  const resizing = played.some(({target, effect, cancel}) => target === grid && effect.target === grid && cancel.mock.calls.length === 0)
  return resizing && midway ? midway : rows[grid.querySelector('.venue-current p')?.textContent ?? '']
}

afterEach(() => {
  Element.prototype.animate = originalAnimate
  Element.prototype.getBoundingClientRect = originalRect
  vi.restoreAllMocks()
})

function Cards({next = true, label = 'Tocando agora'}: {next?: boolean; label?: string}) {
  return (
    <>
      <section className="venue-current">
        <span className="wash" />
        <p data-block="label">{label}</p>
      </section>
      {next && <section className="venue-next" data-venue-song-id="song-2"><p data-block="next">Valerie</p></section>}
    </>
  )
}

const programme = (container: HTMLElement) => container.querySelector('.venue-programme') as HTMLElement
const rowMoves = () => played.filter(({target}) => target.classList.contains('venue-programme'))

describe('VenueProgramme', () => {
  it('eases the rows from their old sizes to the new ones, and clips the cards meanwhile', async () => {
    rows.Aplausos = '650px 250px'
    const {container, rerender} = render(<VenueProgramme still={false}><Cards /></VenueProgramme>)
    rerender(<VenueProgramme still={false}><Cards label="Aplausos" /></VenueProgramme>)

    expect(rowMoves().map(({frames}) => frames)).toEqual([[{gridTemplateRows: '600px 300px'}, {gridTemplateRows: '650px 250px'}]])
    expect(programme(container)).toHaveAttribute('data-venue-resizing')
    await act(async () => rowMoves()[0].finish())
    expect(programme(container)).not.toHaveAttribute('data-venue-resizing')
  })

  it('glides a block from where the room saw it, and leaves pinned layers alone', () => {
    tops = {'Tocando agora': 100, Aplausos: 60}
    const {rerender} = render(<VenueProgramme still={false}><Cards /></VenueProgramme>)
    rerender(<VenueProgramme still={false}><Cards label="Aplausos" /></VenueProgramme>)

    expect(played.map(({target, frames}) => [(target as HTMLElement).dataset.block, frames])).toEqual([
      ['label', [{translate: '0px 40px'}, {translate: '0 0'}]],
    ])
  })

  it('does nothing when the layout holds, and a no-op render keeps a running resize going', () => {
    const {rerender} = render(<VenueProgramme still={false}><Cards /></VenueProgramme>)
    rerender(<VenueProgramme still={false}><Cards label="Aplausos" /></VenueProgramme>)
    expect(played).toHaveLength(0)

    rows['Tocando agora'] = '650px 250px'
    rerender(<VenueProgramme still={false}><Cards /></VenueProgramme>)
    const [resize] = rowMoves()
    // Mid-resize the grid reports the animated rows; the layout under them holds.
    midway = '620px 280px'
    rerender(<VenueProgramme still={false}><Cards /></VenueProgramme>)
    expect(resize.cancel).not.toHaveBeenCalled()
    expect(resize.effect.target).toBe(resize.target)
    expect(rowMoves()).toHaveLength(1)
  })

  it('fades a card that left in its old place while its row closes', async () => {
    tops = {Valerie: 300}
    rows.Aplausos = '900px 0px'
    const {container, rerender} = render(<VenueProgramme still={false}><Cards /></VenueProgramme>)
    rerender(<VenueProgramme still={false}><Cards label="Aplausos" next={false} /></VenueProgramme>)

    const ghost = container.querySelector('.venue-leaving') as HTMLElement
    expect(ghost).toHaveClass('venue-next')
    expect(ghost).toHaveAttribute('aria-hidden', 'true')
    expect(ghost).not.toHaveAttribute('data-venue-song-id')
    expect(rowMoves()[0].frames).toEqual([{gridTemplateRows: '600px 300px'}, {gridTemplateRows: '900px 0px'}])

    const exit = played.find(({target}) => target === ghost)
    await act(async () => exit?.finish())
    expect(container.querySelector('.venue-leaving')).toBeNull()
  })

  it('sizes the cards at once with reduced motion, and stops a running resize', () => {
    rows.Aplausos = '650px 250px'
    const {container, rerender} = render(<VenueProgramme still={false}><Cards /></VenueProgramme>)
    rerender(<VenueProgramme still={false}><Cards label="Aplausos" /></VenueProgramme>)
    const [resize] = rowMoves()

    rerender(<VenueProgramme still><Cards /></VenueProgramme>)
    expect(resize.cancel).toHaveBeenCalled()
    expect(rowMoves()).toHaveLength(1)
    expect(programme(container)).not.toHaveAttribute('data-venue-resizing')
  })
})
