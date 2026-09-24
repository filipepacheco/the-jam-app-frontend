import {Component, createRef} from 'react'
import type {Boarding} from './useStageHandover'
import {FLASH, LIFT_EASE, SHOW, SWEEP} from './useVenueChangeMotion'
import {FLIGHT, flightTransform, measureText, type TextBox} from './venueFlight'
import {EASE_IN_OUT, EASE_OUT, cssEase} from './venueMotion'

type Part = 'word' | 'title' | 'artist' | 'name'

/** One piece of the up-next card, measured before it leaves the DOM. */
interface Passenger {
  part: Part
  key: string
  text: string
  box: TextBox
}

interface Flight {
  id: number
  animations: Animation[]
  clones: HTMLElement[]
  landed: boolean
  /** Stage names with no passenger: they land in place when the flight does. */
  unmatched: Element[]
  groups: Set<Element>
}

interface StageFlightProps {
  boarding: Boarding | null
  onLand: (id: number) => void
}

const SONG = '[data-venue-song]'
const VISIBLE_NAME = '[data-venue-musician]:not([data-venue-awaiting])'

function boardPassengers(card: Element): Passenger[] {
  const passenger = (part: Part, key: string, element: Element): Passenger => ({part, key, text: element.textContent ?? '', box: measureText(element)})
  const words = [...card.querySelectorAll(`${SONG} .venue-next-title .venue-word-inner`)].map((word, index) => passenger('word', String(index), word))
  const title = card.querySelector(`${SONG} .venue-next-title .venue-roll-line`)
  const artist = card.querySelector(`${SONG} .venue-support .venue-roll-line`)
  const names = [...card.querySelectorAll<HTMLElement>(VISIBLE_NAME)].map(name => passenger('name', name.dataset.venueMusician ?? '', name))
  return [
    ...words,
    ...(title ? [passenger('title', 'title', title)] : []),
    ...(artist ? [passenger('artist', 'artist', artist)] : []),
    ...names,
  ]
}

/**
 * The up-next song walks onto the stage: its title words, artist and band
 * fly from the up-next card to their places on the stage, where the real
 * text waits hidden (`data-venue-boarding`) until the whole flight lands.
 *
 * A class, because the up-next text leaves the DOM in the same commit that
 * shows the new song, and only getSnapshotBeforeUpdate can measure it first.
 * It renders after the cards, so it flies after their layout effects ran.
 */
export class StageFlight extends Component<StageFlightProps> {
  private layer = createRef<HTMLDivElement>()
  private flight: Flight | null = null

  getSnapshotBeforeUpdate(previous: StageFlightProps): Passenger[] | null {
    const {boarding} = this.props
    if (!boarding || boarding.id === previous.boarding?.id) return null
    const card = this.layer.current?.parentElement?.querySelector(`.venue-next[data-venue-song-id="${CSS.escape(boarding.song.id)}"]`)
    return card ? boardPassengers(card) : []
  }

  componentDidUpdate(previous: StageFlightProps, _state: unknown, passengers: Passenger[] | null) {
    const {boarding} = this.props
    if (boarding?.id === previous.boarding?.id) return
    const landed = this.flight?.landed ? this.flight : null
    this.clear()
    // The stage text shows in this same commit: the lights hit it as it lands.
    if (landed) this.cue(landed)
    if (boarding && passengers) this.fly(boarding, passengers)
  }

  componentWillUnmount() {
    this.clear()
  }

  private clear() {
    this.flight?.animations.forEach(animation => animation.cancel())
    this.flight?.clones.forEach(clone => clone.remove())
    this.flight = null
  }

  private fly(boarding: Boarding, passengers: Passenger[]) {
    const layer = this.layer.current
    const stage = layer?.parentElement?.querySelector(`.venue-current[data-venue-song-id="${CSS.escape(boarding.song.id)}"]`)
    const flight: Flight = {id: boarding.id, animations: [], clones: [], landed: false, unmatched: [], groups: new Set()}
    this.flight = flight
    const land = () => {
      if (this.flight !== flight) return
      flight.landed = true
      this.props.onLand(boarding.id)
    }
    if (!layer || !stage || passengers.length === 0 || typeof layer.animate !== 'function') {
      land()
      return
    }

    const origin = layer.getBoundingClientRect()
    const targetWords = [...stage.querySelectorAll(`${SONG} .venue-current-title .venue-word-inner`)]
    const words = passengers.filter(({part}) => part === 'word')
    // The same title splits the same way; an edited title flies as one line.
    const perWord = words.length > 0 && words.length === targetWords.length
    const titleTime = (perWord ? Math.min(words.length - 1, 8) : 0) * FLIGHT.stagger
    let names = 0
    const target = ({part, key}: Passenger): {element: Element | null; delay: number} => {
      if (part === 'word') return {element: perWord ? targetWords[Number(key)] : null, delay: Math.min(Number(key), 8) * FLIGHT.stagger}
      if (part === 'title') return {element: perWord ? null : stage.querySelector(`${SONG} .venue-current-title .venue-roll-line`), delay: 0}
      if (part === 'artist') return {element: stage.querySelector(`${SONG} .venue-artist .venue-roll-line`), delay: titleTime + FLIGHT.stagger}
      return {element: stage.querySelector(`[data-venue-musician="${CSS.escape(key)}"]:not([data-venue-awaiting])`), delay: titleTime + SHOW.stagger * (1 + Math.min(names++, 6))}
    }

    const flown = new Set<Element>()
    passengers.forEach(passenger => {
      const {element, delay} = target(passenger)
      if (!element && (passenger.part === 'word' || passenger.part === 'title')) return
      const {box} = passenger
      const clone = document.createElement('span')
      clone.className = 'venue-flight-clone'
      clone.dataset.part = passenger.part
      clone.textContent = passenger.text
      Object.assign(clone.style, {
        left: `${box.rect.left - origin.left}px`,
        top: `${box.rect.top - origin.top}px`,
        width: passenger.part === 'word' ? '' : `${box.rect.width}px`,
        font: box.font,
        lineHeight: `${box.lineHeight}px`,
        letterSpacing: `${box.letterSpacing}px`,
        color: box.color,
      })
      layer.append(clone)
      flight.clones.push(clone)
      if (!element) {
        // This musician left the song: the name fades where it stood.
        flight.animations.push(clone.animate([{opacity: 1}, {opacity: 0}], {duration: SHOW.fade, fill: 'both', easing: cssEase(EASE_OUT)}))
        return
      }
      const to = measureText(element)
      const {transform, scale} = flightTransform(box, to)
      flown.add(element)
      if (passenger.part === 'name') {
        const group = element.closest('[data-venue-instrument]')
        if (group) flight.groups.add(group)
      }
      // The clone is on its own, so its spacing can morph without reflowing anything.
      flight.animations.push(clone.animate([
        {transform: 'none', color: box.color, letterSpacing: `${box.letterSpacing}px`},
        {transform, color: to.color, letterSpacing: `${to.letterSpacing / scale}px`},
      ], {duration: FLIGHT.travel, delay, easing: cssEase(EASE_IN_OUT), fill: 'both'}))
    })
    flight.unmatched = [...stage.querySelectorAll(VISIBLE_NAME)].filter(name => !flown.has(name))
    void Promise.allSettled(flight.animations.map(animation => animation.finished)).then(land)
  }

  /**
   * Landing: the lineup shows (its labels fade in around the names that just
   * landed), the stage lights flash, and any name that did not fly lands in place.
   */
  private cue(flight: Flight) {
    const stage = this.layer.current?.parentElement?.querySelector('.venue-current')
    if (!stage || typeof stage.animate !== 'function') return
    stage.querySelectorAll('[data-venue-lineup] > .venue-label, .venue-instrument-label, [data-venue-lineup] > .venue-support').forEach((label, index) => {
      label.animate([{opacity: 0}, {opacity: 1}], {duration: SHOW.fade, delay: Math.min(index, 6) * SHOW.stagger, easing: cssEase(EASE_OUT), fill: 'backwards'})
    })
    stage.querySelector('.venue-change-wash')?.animate(FLASH, {duration: SHOW.light, easing: 'linear'})
    stage.querySelector('.venue-stage-sweep')?.animate(SWEEP, {duration: SHOW.light, easing: cssEase(EASE_IN_OUT)})
    flight.groups.forEach(group => group.querySelector('.venue-musician-wash')?.animate(FLASH, {duration: SHOW.light, easing: 'linear'}))
    flight.unmatched.filter(name => name.isConnected).forEach((name, index) => {
      const delay = Math.min(index, 6) * SHOW.stagger
      name.animate([{transform: 'translate3d(0, 12px, 0)'}, {transform: 'none'}], {duration: SHOW.rise, delay, easing: LIFT_EASE, fill: 'backwards'})
      name.animate([{opacity: 0, filter: 'blur(6px)'}, {opacity: 1, filter: 'none'}], {duration: SHOW.fade, delay, easing: cssEase(EASE_OUT), fill: 'backwards'})
    })
  }

  render() {
    return <div ref={this.layer} className="venue-flight" aria-hidden="true" />
  }
}
