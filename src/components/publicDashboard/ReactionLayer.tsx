import {useEffect, useRef} from 'react'
import {REACTION_EMOJI, type ReactionFeed} from '../../lib/realtime/jamReactions'
import {EASE_OUT, TEMPO, cssEase} from './venueMotion'
import './venue-display.css'

/** A flood cannot hide the stage: reactions over the cap are dropped. */
export const MAX_FLOATERS = 30
const GENTLE_MAX = 8
// A batch of taps spreads out, so ten claps read as ten, not one clump.
const SPREAD_MS = 600
const FLOAT_MS = 2400 * TEMPO
const GENTLE_MS = 1400

interface ReactionLayerProps {
  feed: ReactionFeed | null | undefined
  gentle: boolean
}

/**
 * The room's reactions rise behind the stage text. Each floater is a plain
 * node animated by WAAPI and removed when it ends; none of it is React state.
 */
export function ReactionLayer({feed, gentle}: ReactionLayerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const layer = ref.current
    if (!feed || !layer || typeof layer.animate !== 'function') return
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const spawn = (emoji: string) => {
      if (layer.childElementCount >= (gentle ? GENTLE_MAX : MAX_FLOATERS)) return
      const node = document.createElement('span')
      node.className = 'venue-reaction'
      node.textContent = emoji
      node.style.left = `${4 + Math.random() * 88}%`
      node.style.fontSize = `${2.25 + Math.random() * 1.5}rem`
      if (gentle) node.style.bottom = `${8 + Math.random() * 30}%`
      layer.append(node)
      const {height} = layer.getBoundingClientRect()
      const animation = gentle
        // Reduced motion: it glows in place, low on the stage, and goes.
        ? node.animate([{opacity: 0}, {opacity: 0.9, offset: 0.3}, {opacity: 0}], {duration: GENTLE_MS, easing: 'ease'})
        : node.animate([
          {transform: 'translate3d(0, 0, 0) scale(0.6) rotate(0deg)', opacity: 0},
          {opacity: 1, offset: 0.12},
          {opacity: 0.85, offset: 0.7},
          {transform: `translate3d(${(Math.random() - 0.5) * 120}px, ${-height * (0.55 + Math.random() * 0.4)}px, 0) scale(1) rotate(${(Math.random() - 0.5) * 30}deg)`, opacity: 0},
        ], {duration: FLOAT_MS * (0.85 + Math.random() * 0.3), easing: cssEase(EASE_OUT)})
      animation.finished.then(() => node.remove(), () => node.remove())
    }
    const unsubscribe = feed.subscribe(({kind, count}) => {
      for (let index = 0; index < count; index++) {
        const timer = setTimeout(() => {
          timers.delete(timer)
          spawn(REACTION_EMOJI[kind])
        }, (index / count) * SPREAD_MS)
        timers.add(timer)
      }
    })
    return () => {
      unsubscribe()
      timers.forEach(timer => clearTimeout(timer))
      layer.replaceChildren()
    }
  }, [feed, gentle])

  return <div ref={ref} className="venue-reactions" aria-hidden="true" />
}
