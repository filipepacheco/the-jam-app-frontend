import {useEffect, useLayoutEffect, useRef, useState} from 'react'
import {spring} from 'framer-motion'
import {useReducedMotion} from '../../hooks/useReducedMotion'
import {groupMusiciansByInstrument, normalizeInstrument} from '../../utils/musicianUtils'
import type {DashboardSongDto} from '../../types/api.types'
import {EASE_IN_OUT, EASE_OUT, TEMPO, cssEase} from './venueMotion'
import {FLIGHT} from './venueFlight'

type Lineup = Map<string, Map<string, string>>

function describeSong(song: DashboardSongDto | null, variant = '') {
  const lineup: Lineup = new Map(Object.entries(groupMusiciansByInstrument(song?.musicians)).map(([instrument, musicians]) => [
    normalizeInstrument(instrument),
    new Map(musicians.map(({id, name}) => [id, name ?? ''])),
  ]))
  return {song: JSON.stringify([variant, song?.id, song?.title, song?.artist]), lineup}
}

function sameMembers(a?: Map<string, string>, b?: Map<string, string>) {
  if (!a || !b) return a === b
  return a.size === b.size && [...a].every(([id, name]) => b.get(id) === name)
}

// Show cues deliberately outlast ordinary controls: viewers read them from
// across a venue. The outgoing song clears fast; the new one lands slowly,
// word by word. The next card follows the stage a beat later, so the eye
// reads stage first. Every show timing is in milliseconds at TEMPO 1.
const paced = <T extends Record<string, number>>(timing: T) =>
  Object.fromEntries(Object.entries(timing).map(([key, ms]) => [key, ms * TEMPO])) as T
const PROFILE = {
  stage: paced({lead: 0, exit: 260, leave: 40, enter: 950, overlap: 110, line: 90, word: 80, lineup: 300}),
  next: paced({lead: 160, exit: 220, leave: 40, enter: 750, overlap: 90, line: 70, word: 60, lineup: 240}),
}
export const SHOW = paced({rise: 700, fade: 500, stagger: 70, light: 1400, intro: 160})
// Reduced motion keeps the change legible with opacity alone: fewer and gentler, not zero.
const GENTLE = {exit: 120, enter: 200}
const EASE = {out: cssEase(EASE_OUT), travel: cssEase(EASE_IN_OUT)}

// Names land with a bounce: a real spring (about 12% overshoot, it's a show)
// sampled once into CSS linear(), so the compositor plays it. Stiffness and
// damping scale with TEMPO, which stretches the spring in time without
// changing its bounce. Older engines settle on EASE.out.
export const LIFT_EASE = (() => {
  if (typeof CSS === 'undefined' || !CSS.supports?.('transition-timing-function', 'linear(0, 1)')) return EASE.out
  const generator = spring({keyframes: [0, 1], stiffness: 240 / TEMPO ** 2, damping: 17 / TEMPO, mass: 1})
  const stops = Array.from({length: 40}, (_, index) => generator.next(index * SHOW.rise / 40).value.toFixed(3))
  return `linear(${[...stops, 1].join(', ')})`
})()

// 130%, not 100%: the mask's descender padding would otherwise show glyph tops.
const LINE_IN: Keyframe[] = [{transform: 'translate3d(0, 130%, 0)'}, {transform: 'none'}]
const LINE_OUT: Keyframe[] = [{transform: 'none', opacity: 1}, {transform: 'translate3d(0, -130%, 0)', opacity: 0}]
const FADE_IN: Keyframe[] = [{opacity: 0}, {opacity: 1}]
const FADE_OUT: Keyframe[] = [{opacity: 1}, {opacity: 0}]
export const SWEEP: Keyframe[] = [
  {opacity: 0, transform: 'translate3d(-160%, 0, 0) rotate(-16deg)'},
  {opacity: 1, offset: 0.4},
  {opacity: 0, transform: 'translate3d(420%, 0, 0) rotate(-16deg)'},
]
export const FLASH: Keyframe[] = [
  {opacity: 0, easing: EASE.out},
  {opacity: 1, offset: 0.22, easing: 'ease'},
  {opacity: 0},
]

/** Nobody watches a hidden tab: show cues stop until it is visible again. */
export function usePageVisible() {
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])
  return pageVisible
}

/**
 * Announces audience-visible changes: the outgoing song rolls up out of its
 * line masks, then the new one rises in and the lineup lands name by name.
 * Compares visible values, so a fresh polling object isn't a new event.
 * `variant` marks a different stage message for the same song, such as the
 * finale or the applause, which keeps the band's lineup in place.
 * `boarding` marks the song change that the up-next flight carries: the stage
 * waits for the flight to land its text, and the up-next card lets it leave.
 * `onSettle` runs once a change has fully played (or at once, with no cue).
 */
export function useVenueChangeMotion(song: DashboardSongDto | null, {variant, boarding, onSettle}: {variant?: string; boarding?: number | null; onSettle?: () => void} = {}) {
  const ref = useRef<HTMLElement>(null)
  const settled = useRef(onSettle)
  useLayoutEffect(() => {
    settled.current = onSettle
  })
  const previous = useRef<ReturnType<typeof describeSong> | null>(null)
  const boarded = useRef<number | null>(null)
  const snapshot = useRef<HTMLElement | null>(null)
  const animations = useRef<Animation[]>([])
  const cue = useRef(0)
  const {prefersReducedMotion} = useReducedMotion()
  const pageVisible = usePageVisible()
  const motionEnabled = !prefersReducedMotion && pageVisible

  // Layout effect: the cue must own the first frame of the new content, or the
  // new title flashes in place before it rolls in.
  useLayoutEffect(() => {
    const root = ref.current
    const outgoing = snapshot.current
    const next = describeSong(song, variant)
    const last = previous.current
    previous.current = next
    const settle = () => settled.current?.()

    const stop = () => {
      cue.current += 1
      animations.current.forEach(animation => animation.cancel())
      animations.current = []
      root?.querySelector('[data-venue-ghost]')?.replaceChildren()
      if (root) delete root.dataset.venueCue
    }
    if (!pageVisible) {
      stop()
      settle()
      return
    }
    if (!root || document.hidden || typeof root.animate !== 'function') {
      settle()
      return
    }

    const songChanged = !last || last.song !== next.song
    const changedInstruments = [...new Set([...(last?.lineup.keys() ?? []), ...next.lineup.keys()])]
      .filter(instrument => !sameMembers(last?.lineup.get(instrument), next.lineup.get(instrument)))
    if (!songChanged && changedInstruments.length === 0) return
    const gentle = prefersReducedMotion
    // The first paint is a flourish, so reduced motion simply shows the display.
    if (gentle && !last) {
      settle()
      return
    }

    // A newer event replaces the previous cue; nothing queues behind live data.
    stop()
    const id = cue.current
    const isStage = root.classList.contains('venue-current')
    const applause = variant?.startsWith('applause:') ?? false
    // Only the change that starts a boarding belongs to the flight.
    const flight = songChanged && !gentle && typeof boarding === 'number' && boarding !== boarded.current
    if (flight) boarded.current = boarding
    const arrival = flight && isStage
    const departure = flight && !isStage
    const profile = isStage ? PROFILE.stage : PROFILE.next
    const {lead, line, word, lineup} = profile
    const exit = gentle ? GENTLE.exit : profile.exit
    const animate = (element: Element | null, frames: Keyframe[], timing: KeyframeAnimationOptions) => {
      if (element) animations.current.push(element.animate(frames, {easing: EASE.out, fill: 'backwards', ...timing}))
    }
    // Lift and fade separately: the spring may overshoot, but opacity and blur must not.
    const land = (element: Element, delay: number, distance = 20) => {
      if (gentle) {
        animate(element, FADE_IN, {duration: GENTLE.enter, delay, easing: 'ease'})
        return
      }
      animate(element, [{transform: `translate3d(0, ${distance}px, 0)`}, {transform: 'none'}], {duration: SHOW.rise, delay, easing: LIFT_EASE})
      animate(element, [{opacity: 0, filter: 'blur(6px)'}, {opacity: 1, filter: 'none'}], {duration: SHOW.fade, delay})
    }

    if (songChanged) {
      const intro = !last
      const ghost = root.querySelector('[data-venue-ghost]')
      let enterAt = lead
      if (intro) {
        // First paint of the display: the card rises before its lines roll in.
        animate(root, [{opacity: 0, transform: 'translate3d(0, 24px, 0)'}, {opacity: 1, transform: 'none'}], {duration: SHOW.rise, delay: lead})
        enterAt += SHOW.intro
      } else if (departure) {
        // The flight carries the old text away; the new song follows once it lifts off.
        enterAt += FLIGHT.travel * 0.45
      } else if (outgoing && ghost) {
        outgoing.removeAttribute('data-venue-song')
        ghost.replaceChildren(outgoing)
        const lines = outgoing.querySelectorAll('.venue-roll-line')
        lines.forEach((element, index) => {
          animate(element, gentle ? FADE_OUT : LINE_OUT, {duration: exit, delay: lead + (gentle ? 0 : index * profile.leave), fill: 'forwards'})
        })
        // Strong ease-out clears most of the travel early, so the new song can
        // start before the exit ends without two titles sharing a mask.
        enterAt += gentle ? exit : exit + (lines.length - 1) * profile.leave - profile.overlap
      }
      let wordsAt = 0
      // An arriving song's text waits hidden for the flight; nothing rises.
      if (!arrival) root.querySelectorAll('[data-venue-song] .venue-roll-line').forEach((element, index) => {
        if (gentle) {
          animate(element, FADE_IN, {duration: GENTLE.enter, delay: enterAt, easing: 'ease'})
          return
        }
        const words = element.querySelectorAll('.venue-word-inner')
        if (words.length === 0) {
          animate(element, LINE_IN, {duration: profile.enter, delay: enterAt + index * line + wordsAt})
          return
        }
        // Titles rise word by word; later lines wait for the last word.
        words.forEach((part, order) => animate(part, LINE_IN, {duration: profile.enter, delay: enterAt + index * line + Math.min(order, 8) * word}))
        wordsAt = Math.min(words.length - 1, 8) * word
      })
      // The applauded band's lineup fades out (CSS); only a new lineup lands. An
      // arriving lineup waits hidden with the text and shows when the flight lands.
      if (!arrival && !applause) {
        root.querySelectorAll('[data-venue-instrument], [data-venue-lineup] > .venue-support').forEach((element, index) => {
          land(element, gentle ? enterAt : enterAt + wordsAt + lineup + Math.min(index, 6) * SHOW.stagger)
        })
      }

      // The flight's landing brings the stage lights (StageFlight).
      if (!intro && !arrival) {
        // Applause flashes like stage strobes: three quick pulses, not one bloom.
        animate(root.querySelector('.venue-change-wash'), FLASH, applause
          ? {duration: SHOW.light * 0.5, iterations: 3, delay: lead, easing: 'linear'}
          : {duration: SHOW.light, delay: lead, easing: 'linear'})
        if (isStage && song && !gentle) {
          animate(root.querySelector('.venue-stage-sweep'), SWEEP, {duration: SHOW.light, delay: lead + 80, easing: EASE.travel})
        }
      }
    } else {
      // Same song, edited lineup: only the arriving names move.
      let marked = 0
      root.querySelectorAll<HTMLElement>('[data-venue-instrument]').forEach(group => {
        const instrument = group.dataset.venueInstrument ?? ''
        if (!changedInstruments.includes(instrument)) return
        marked += 1
        // A spotlighted sign-up flashes its group when it lands, not now.
        if (!group.querySelector('[data-venue-awaiting]')) {
          animate(group.querySelector('.venue-musician-wash'), FLASH, {duration: SHOW.light, easing: 'linear'})
        }
        const before = last?.lineup.get(instrument)
        const after = next.lineup.get(instrument)
        if (!before) {
          land(group, 0)
          return
        }
        let arrivals = 0
        group.querySelectorAll<HTMLElement>('[data-venue-musician]').forEach(name => {
          const musician = name.dataset.venueMusician ?? ''
          // A spotlighted sign-up flies in from the announcement instead.
          if (before.get(musician) !== after?.get(musician) && !name.hasAttribute('data-venue-awaiting')) land(name, arrivals++ * SHOW.stagger, 12)
        })
      })
      // A whole instrument group left: settle the remaining lineup instead.
      if (marked < changedInstruments.length) {
        animate(root.querySelector('[data-venue-lineup]'), [{opacity: 0.5}, {opacity: 1}], {duration: SHOW.fade})
      }
    }

    if (animations.current.length === 0) {
      settle()
      return
    }
    // Line masks clip only while a cue runs, so resting text never loses a descender.
    root.dataset.venueCue = ''
    void Promise.allSettled(animations.current.map(animation => animation.finished)).then(() => {
      if (cue.current !== id) return
      root.querySelector('[data-venue-ghost]')?.replaceChildren()
      delete root.dataset.venueCue
      animations.current = []
      settle()
    })
  }, [song, variant, boarding, prefersReducedMotion, pageVisible])

  // Keep a copy of the resting song lines for the next roll. This runs after
  // every commit, so a language switch never leaves a stale outgoing copy.
  useLayoutEffect(() => {
    const lines = ref.current?.querySelector('[data-venue-song]')
    snapshot.current = lines ? lines.cloneNode(true) as HTMLElement : null
  })

  useEffect(() => () => {
    cue.current += 1
    animations.current.forEach(animation => animation.cancel())
    animations.current = []
    previous.current = null
  }, [])
  return {ref, motionEnabled}
}
