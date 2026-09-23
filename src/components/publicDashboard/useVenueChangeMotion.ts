import {useEffect, useLayoutEffect, useRef, useState} from 'react'
import {spring} from 'framer-motion'
import {useReducedMotion} from '../../hooks/useReducedMotion'
import {groupMusiciansByInstrument, normalizeInstrument} from '../../utils/musicianUtils'
import type {DashboardSongDto} from '../../types/api.types'

type Lineup = Map<string, Map<string, string>>

function describeSong(song: DashboardSongDto | null) {
  const lineup: Lineup = new Map(Object.entries(groupMusiciansByInstrument(song?.musicians)).map(([instrument, musicians]) => [
    normalizeInstrument(instrument),
    new Map(musicians.map(({id, name}) => [id, name ?? ''])),
  ]))
  return {song: JSON.stringify([song?.id, song?.title, song?.artist]), lineup}
}

function sameMembers(a?: Map<string, string>, b?: Map<string, string>) {
  if (!a || !b) return a === b
  return a.size === b.size && [...a].every(([id, name]) => b.get(id) === name)
}

// Show cues deliberately outlast ordinary controls: viewers read them from
// across a venue. The outgoing song leaves quickly; the new one lands slowly.
// The next card follows the stage a beat later, so the eye reads stage first.
const PROFILE = {
  stage: {lead: 0, exit: 260, enter: 950, overlap: 30, line: 90, lineup: 300},
  next: {lead: 160, exit: 220, enter: 750, overlap: 30, line: 70, lineup: 240},
}
const SHOW = {rise: 700, fade: 500, stagger: 70, light: 1400}
const EASE = {
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)', // expo-out: arrives fast, settles long
  exit: 'cubic-bezier(0.5, 0, 0.75, 0)', // quart-in: leaves without lingering
  travel: 'cubic-bezier(0.65, 0, 0.35, 1)', // a light crossing the stage
}

// Names land with a little life: a real spring (about 5% overshoot) sampled
// once into CSS linear(), so the compositor plays it. Older engines settle on expo-out.
const LIFT_EASE = (() => {
  if (typeof CSS === 'undefined' || !CSS.supports?.('transition-timing-function', 'linear(0, 1)')) return EASE.enter
  const generator = spring({keyframes: [0, 1], stiffness: 240, damping: 21, mass: 1})
  const stops = Array.from({length: 40}, (_, index) => generator.next(index * SHOW.rise / 40).value.toFixed(3))
  return `linear(${[...stops, 1].join(', ')})`
})()

// 130%, not 100%: the mask's descender padding would otherwise show glyph tops.
const LINE_IN: Keyframe[] = [{transform: 'translate3d(0, 130%, 0)'}, {transform: 'none'}]
const LINE_OUT: Keyframe[] = [{transform: 'none', opacity: 1}, {transform: 'translate3d(0, -130%, 0)', opacity: 0}]
const FLASH: Keyframe[] = [
  {opacity: 0, easing: 'cubic-bezier(0.33, 1, 0.68, 1)'},
  {opacity: 1, offset: 0.22, easing: 'cubic-bezier(0.33, 0, 0.67, 1)'},
  {opacity: 0},
]

/**
 * Announces audience-visible changes: the outgoing song rolls up out of its
 * line masks while the new one rises in, then the lineup lands name by name.
 * Compares visible values, so a fresh polling object isn't a new event.
 */
export function useVenueChangeMotion(song: DashboardSongDto | null) {
  const ref = useRef<HTMLElement>(null)
  const previous = useRef<ReturnType<typeof describeSong> | null>(null)
  const snapshot = useRef<HTMLElement | null>(null)
  const animations = useRef<Animation[]>([])
  const cue = useRef(0)
  const {prefersReducedMotion} = useReducedMotion()
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  const motionEnabled = !prefersReducedMotion && pageVisible

  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  // Layout effect: the cue must own the first frame of the new content, or the
  // new title flashes in place before it rolls in.
  useLayoutEffect(() => {
    const root = ref.current
    const outgoing = snapshot.current
    const next = describeSong(song)
    const last = previous.current
    previous.current = next

    const stop = () => {
      cue.current += 1
      animations.current.forEach(animation => animation.cancel())
      animations.current = []
      root?.querySelector('[data-venue-ghost]')?.replaceChildren()
      if (root) delete root.dataset.venueCue
    }
    if (!motionEnabled) {
      stop()
      return
    }
    if (!root || document.hidden || typeof root.animate !== 'function') return

    const songChanged = !last || last.song !== next.song
    const changedInstruments = [...new Set([...(last?.lineup.keys() ?? []), ...next.lineup.keys()])]
      .filter(instrument => !sameMembers(last?.lineup.get(instrument), next.lineup.get(instrument)))
    if (!songChanged && changedInstruments.length === 0) return

    // A newer event replaces the previous cue; nothing queues behind live data.
    stop()
    const id = cue.current
    const isStage = root.classList.contains('venue-current')
    const {lead, exit, enter, overlap, line, lineup} = isStage ? PROFILE.stage : PROFILE.next
    const animate = (element: Element | null, frames: Keyframe[], timing: KeyframeAnimationOptions) => {
      if (element) animations.current.push(element.animate(frames, {easing: EASE.enter, fill: 'backwards', ...timing}))
    }
    // Lift and fade separately: the spring may overshoot, but opacity and blur must not.
    const land = (element: Element, delay: number, distance = 20) => {
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
        enterAt += 160
      } else if (outgoing && ghost) {
        outgoing.removeAttribute('data-venue-song')
        ghost.replaceChildren(outgoing)
        const lines = outgoing.querySelectorAll('.venue-roll-line')
        lines.forEach((element, index) => {
          animate(element, LINE_OUT, {duration: exit, delay: lead + index * 40, easing: EASE.exit, fill: 'forwards'})
        })
        // The new song waits until the old lines have cleared: two titles
        // sharing a mask read as one jumbled word from across the room.
        enterAt += exit + (lines.length - 1) * 40 - overlap
      }
      root.querySelectorAll('[data-venue-song] .venue-roll-line').forEach((element, index) => {
        animate(element, LINE_IN, {duration: enter, delay: enterAt + index * line})
      })
      root.querySelectorAll('[data-venue-instrument], [data-venue-lineup] > .venue-support').forEach((element, index) => {
        land(element, enterAt + lineup + Math.min(index, 6) * SHOW.stagger)
      })

      if (!intro) {
        animate(root.querySelector('.venue-change-wash'), FLASH, {duration: SHOW.light, delay: lead, easing: 'linear'})
        if (isStage && song) {
          animate(root.querySelector('.venue-stage-sweep'), [
            {opacity: 0, transform: 'translate3d(-160%, 0, 0) rotate(-16deg)'},
            {opacity: 1, offset: 0.4},
            {opacity: 0, transform: 'translate3d(420%, 0, 0) rotate(-16deg)'},
          ], {duration: SHOW.light, delay: lead + 80, easing: EASE.travel})
        }
      }
    } else {
      // Same song, edited lineup: only the arriving names move.
      let marked = 0
      root.querySelectorAll<HTMLElement>('[data-venue-instrument]').forEach(group => {
        const instrument = group.dataset.venueInstrument ?? ''
        if (!changedInstruments.includes(instrument)) return
        marked += 1
        animate(group.querySelector('.venue-musician-wash'), FLASH, {duration: SHOW.light, easing: 'linear'})
        const before = last?.lineup.get(instrument)
        const after = next.lineup.get(instrument)
        if (!before) {
          land(group, 0)
          return
        }
        let arrivals = 0
        group.querySelectorAll<HTMLElement>('[data-venue-musician]').forEach(name => {
          const musician = name.dataset.venueMusician ?? ''
          if (before.get(musician) !== after?.get(musician)) land(name, arrivals++ * SHOW.stagger, 12)
        })
      })
      // A whole instrument group left: settle the remaining lineup instead.
      if (marked < changedInstruments.length) {
        animate(root.querySelector('[data-venue-lineup]'), [{opacity: 0.5}, {opacity: 1}], {duration: SHOW.fade})
      }
    }

    if (animations.current.length === 0) return
    // Line masks clip only while a cue runs, so resting text never loses a descender.
    root.dataset.venueCue = ''
    void Promise.allSettled(animations.current.map(animation => animation.finished)).then(() => {
      if (cue.current !== id) return
      root.querySelector('[data-venue-ghost]')?.replaceChildren()
      delete root.dataset.venueCue
      animations.current = []
    })
  }, [song, motionEnabled])

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
