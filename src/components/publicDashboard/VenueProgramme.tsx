import {Component, createRef, type ReactNode} from 'react'
import {FLIGHT} from './venueFlight'
import {EASE_IN_OUT, cssEase} from './venueMotion'
import './venue-display.css'

interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** The programme as the room sees it: its row sizes, its cards and the blocks in them. */
interface Layout {
  rows: number[]
  cards: Map<Element, Box>
  blocks: Map<Element, Box>
}

interface Move {
  animation: Animation
  target: Element
}

interface VenueProgrammeProps {
  /** Reduced motion or a hidden page: the cards take their new size at once. */
  still: boolean
  children: ReactNode
}

// The cards resize at the pace of the up-next flight, so it lands on the final layout.
const RESIZE: KeyframeAnimationOptions = {duration: FLIGHT.travel, easing: cssEase(EASE_IN_OUT)}
const CARDS = ':scope > section:not(.venue-leaving)'
const NEAR = 0.5

const near = (a: number, b: number) => Math.abs(a - b) < NEAR
const px = (rows: number[]) => rows.map(size => `${size}px`).join(' ')

function measure(grid: HTMLElement): Layout {
  const origin = grid.getBoundingClientRect()
  const box = (element: Element): Box => {
    const rect = element.getBoundingClientRect()
    return {x: rect.left - origin.left, y: rect.top - origin.top, width: rect.width, height: rect.height}
  }
  const cards = new Map<Element, Box>()
  const blocks = new Map<Element, Box>()
  grid.querySelectorAll(CARDS).forEach(card => {
    cards.set(card, box(card))
    // Only blocks in the flow move: washes, lights and overlays are pinned to the card.
    for (const block of card.children) {
      if (getComputedStyle(block).position !== 'absolute') blocks.set(block, box(block))
    }
  })
  // A grid reports its tracks in pixels ("632.6px 279.4px").
  const rows = getComputedStyle(grid).gridTemplateRows.split(' ').map(parseFloat)
  return {rows: rows.every(Number.isFinite) ? rows : [], cards, blocks}
}

function sameRows(a: number[], b: number[]) {
  return a.length === b.length && a.every((size, index) => near(size, b[index]))
}

/** Blocks that are in both layouts stand in the same place. */
function samePlaces(a: Map<Element, Box>, b: Map<Element, Box>) {
  return [...b].every(([block, box]) => {
    const seen = a.get(block)
    return !seen || (near(seen.x, box.x) && near(seen.y, box.y))
  })
}

/**
 * The stage and up-next column. When a song change makes a card taller or
 * shorter, the rows ease to their new sizes instead of jumping, and the text
 * blocks in each card glide from where the room saw them. A card that leaves
 * (the up-next card at the finale) fades out in place while the stage grows.
 *
 * A class, because only getSnapshotBeforeUpdate can see the layout before
 * React changes the DOM. Its componentDidUpdate runs after the cards' own
 * cues and the flight measured their targets, so they aim at the final layout.
 */
export class VenueProgramme extends Component<VenueProgrammeProps> {
  private ref = createRef<HTMLDivElement>()
  private moves: Move[] = []
  /** The layout the running moves end on. */
  private rest: Layout | null = null
  private ghosts = new Set<HTMLElement>()
  private cue = 0

  getSnapshotBeforeUpdate(): Layout | null {
    const grid = this.ref.current
    if (!grid || this.props.still || typeof grid.animate !== 'function') return null
    return measure(grid)
  }

  componentDidUpdate(_previous: VenueProgrammeProps, _state: unknown, before: Layout | null) {
    const grid = this.ref.current
    if (!grid) return
    if (!before) {
      this.stop()
      return
    }
    // Lift the running moves off, without a restart, to read the new layout.
    this.aim(false)
    const after = measure(grid)
    const leaving = [...before.cards].filter(([card]) => !card.isConnected)
    const reference = this.moves.length > 0 && this.rest ? this.rest : before
    if (leaving.length === 0 && sameRows(reference.rows, after.rows) && samePlaces(reference.blocks, after.blocks)) {
      // Nothing moved (a polling response, say): a running move carries on.
      this.aim(true)
      return
    }

    this.stop()
    this.rest = after
    leaving.forEach(([card, box]) => this.leave(grid, card, box))
    const moves: Move[] = []
    if (before.rows.length > 0 && after.rows.length > 0 && !sameRows(before.rows, after.rows)) {
      // A card that left takes a row with it: it closes to zero.
      const count = Math.max(before.rows.length, after.rows.length)
      const pad = (rows: number[]) => [...rows, ...Array<number>(count - rows.length).fill(0)]
      const frames = [{gridTemplateRows: px(pad(before.rows))}, {gridTemplateRows: px(pad(after.rows))}]
      moves.push({animation: grid.animate(frames, RESIZE), target: grid})
    }
    // Each block starts where the room saw it, then glides with its card.
    const start = moves.length > 0 ? measure(grid).blocks : after.blocks
    start.forEach((box, block) => {
      const seen = before.blocks.get(block)
      if (!seen || (near(seen.x, box.x) && near(seen.y, box.y))) return
      const frames = [{translate: `${seen.x - box.x}px ${seen.y - box.y}px`}, {translate: '0 0'}]
      moves.push({animation: block.animate(frames, RESIZE), target: block})
    })
    if (moves.length === 0) return

    this.moves = moves
    const id = this.cue
    // Content that is taller than its card mid-resize is revealed, not spilled.
    grid.dataset.venueResizing = ''
    void Promise.allSettled(moves.map(({animation}) => animation.finished)).then(() => {
      if (this.cue !== id) return
      this.moves = []
      this.rest = null
      delete grid.dataset.venueResizing
    })
  }

  componentWillUnmount() {
    this.stop()
    this.ghosts.forEach(ghost => ghost.remove())
    this.ghosts.clear()
  }

  /** Points each running move at its element, or at nothing to read the layout under it. */
  private aim(on: boolean) {
    this.moves.forEach(({animation, target}) => {
      const effect = animation.effect as KeyframeEffect | null
      if (effect && 'target' in effect) effect.target = on ? target : null
    })
  }

  private stop() {
    this.cue += 1
    this.moves.forEach(({animation}) => animation.cancel())
    this.moves = []
    this.rest = null
    if (this.ref.current) delete this.ref.current.dataset.venueResizing
  }

  /** A copy of the card that left, in its old place, sinks back and fades. */
  private leave(grid: HTMLElement, card: Element, box: Box) {
    const ghost = card.cloneNode(true) as HTMLElement
    ghost.classList.add('venue-leaving')
    // The copy is scenery: no flight or join looks for songs in it.
    ghost.removeAttribute('data-venue-song-id')
    ghost.setAttribute('aria-hidden', 'true')
    ghost.inert = true
    Object.assign(ghost.style, {left: `${box.x}px`, top: `${box.y}px`, width: `${box.width}px`, height: `${box.height}px`})
    grid.append(ghost)
    this.ghosts.add(ghost)
    // It fades on the resize's curve, so the stage grows into the space it clears.
    const exit = ghost.animate(
      [{opacity: 1, transform: 'none'}, {opacity: 0, transform: 'translate3d(0, 12px, 0)'}],
      {duration: FLIGHT.travel * 0.6, easing: RESIZE.easing, fill: 'forwards'},
    )
    void Promise.allSettled([exit.finished]).then(() => {
      ghost.remove()
      this.ghosts.delete(ghost)
    })
  }

  render() {
    return <div ref={this.ref} className="venue-programme">{this.props.children}</div>
  }
}
