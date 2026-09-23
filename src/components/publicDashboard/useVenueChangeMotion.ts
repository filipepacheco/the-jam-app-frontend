import {useEffect, useRef, useState} from 'react'
import {spring} from 'framer-motion'
import {useReducedMotion} from '../../hooks/useReducedMotion'
import {groupMusiciansByInstrument} from '../../utils/musicianUtils'
import type {DashboardSongDto} from '../../types/api.types'

function describeSong(song: DashboardSongDto | null) {
  return {
    song: JSON.stringify([song?.id, song?.title, song?.artist]),
    instruments: new Map(Object.entries(groupMusiciansByInstrument(song?.musicians)).map(([instrument, musicians]) => [
      instrument,
      JSON.stringify(musicians.map(({id, name}) => [id, name]).sort(([a], [b]) => a.localeCompare(b))),
    ])),
  }
}

// Show cues deliberately outlast ordinary controls: viewers watch from across
// a venue. Sample a real spring once, then let the compositor play the frames.
const SHOW = {title: 1000, burst: 1300, next: 720, musician: 650, stagger: 50}
const entranceSpring = spring({keyframes: [0, 1], stiffness: 170, damping: 18, mass: 1})
const springProgress = Array.from({length: 61}, (_, index) =>
  index === 60 ? 1 : entranceSpring.next(index * SHOW.title / 60).value,
)

function entranceFrames(distance: number, scale: number, tilt = 0): Keyframe[] {
  return springProgress.map(progress => ({
    opacity: Math.min(1, 0.2 + progress),
    transform: `translate3d(0, ${(1 - progress) * distance}px, 0) scale(${scale + (1 - scale) * progress}) rotateX(${(1 - progress) * tilt}deg)`,
  }))
}

/** Compare audience-visible values, so a fresh polling object isn't a new event. */
export function useVenueChangeMotion(song: DashboardSongDto | null) {
  const ref = useRef<HTMLElement>(null)
  const previous = useRef<ReturnType<typeof describeSong> | null>(null)
  const animations = useRef<Animation[]>([])
  const {prefersReducedMotion} = useReducedMotion()
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  const motionEnabled = !prefersReducedMotion && pageVisible

  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  useEffect(() => {
    const next = describeSong(song)
    const last = previous.current
    previous.current = next
    if (!motionEnabled) {
      animations.current.forEach(animation => animation.cancel())
      return
    }
    const root = ref.current
    if (!last || !root || document.hidden || typeof root.animate !== 'function') return

    const songChanged = last.song !== next.song
    const changedInstruments = new Set([...last.instruments.keys(), ...next.instruments.keys()].filter(
      instrument => last.instruments.get(instrument) !== next.instruments.get(instrument),
    ))
    if (!songChanged && changedInstruments.size === 0) return

    // A newer event replaces the previous cue; nothing queues behind live data.
    animations.current.forEach(animation => animation.cancel())
    animations.current = []
    const style = getComputedStyle(root)
    const easing = style.getPropertyValue('--ds-ease-out').trim()
    const animate = (element: Element | null, frames: Keyframe[], duration: number, delay = 0, curve = easing) => {
      if (element) animations.current.push(element.animate(frames, {duration, easing: curve, delay, fill: 'backwards'}))
    }
    const highlight: Keyframe[] = [{opacity: 0}, {opacity: 1, offset: 0.15}, {opacity: 0}]
    const isStage = root.classList.contains('venue-current')

    if (songChanged) {
      animate(root.querySelector('[data-venue-song]'), entranceFrames(isStage ? 72 : 38, isStage ? 0.86 : 0.94, isStage ? 12 : 0), isStage ? SHOW.title : SHOW.next, 0, 'linear')
      animate(root.querySelector('.venue-change-wash'), highlight, isStage ? SHOW.burst : SHOW.next)
      root.querySelectorAll('[data-venue-instrument]').forEach((group, index) => {
        animate(group, entranceFrames(32, 0.92), SHOW.musician, 180 + Math.min(index, 6) * SHOW.stagger, 'linear')
      })

      if (isStage && song) {
        animate(root.querySelector('.venue-stage-sweep'), [
          {opacity: 0, transform: 'translateX(-150%) rotate(-18deg)'},
          {opacity: 0.85, offset: 0.25},
          {opacity: 0, transform: 'translateX(450%) rotate(-18deg)'},
        ], SHOW.burst)
        root.querySelectorAll('.venue-stage-ring').forEach((ring, index) => {
          animate(ring, [
            {opacity: 0.8, transform: 'translate(-50%, -50%) scale(0.25)'},
            {opacity: 0, transform: 'translate(-50%, -50%) scale(2)'},
          ], SHOW.burst, index * 160)
        })
        const {width, height} = root.getBoundingClientRect()
        root.querySelectorAll('.venue-stage-spark').forEach((spark, index) => {
          const angle = (index / 12) * Math.PI * 2
          const x = Math.cos(angle) * width * 0.48
          const y = Math.sin(angle) * height * 0.55
          animate(spark, [
            {opacity: 0, transform: 'translate(0, 0) scale(0.5) rotate(0deg)'},
            {opacity: 1, offset: 0.1},
            {opacity: 0, transform: `translate(${x}px, ${y}px) scale(1) rotate(${index % 2 ? 240 : -240}deg)`},
          ], SHOW.burst, index % 3 * 35)
        })
      }
    } else {
      let visibleChanges = 0
      root.querySelectorAll<HTMLElement>('[data-venue-instrument]').forEach(group => {
        if (!changedInstruments.has(group.dataset.venueInstrument ?? '')) return
        visibleChanges += 1
        animate(group, entranceFrames(36, 0.9), SHOW.musician, 0, 'linear')
        animate(group.querySelector('.venue-musician-wash'), highlight, SHOW.burst)
      })
      // If an entire instrument group disappeared, mark the remaining lineup.
      if (visibleChanges < changedInstruments.size) {
        animate(root.querySelector('[data-venue-lineup]'), entranceFrames(18, 0.98), SHOW.musician, 0, 'linear')
      }
    }
  }, [song, motionEnabled])

  useEffect(() => () => animations.current.forEach(animation => animation.cancel()), [])
  return {ref, motionEnabled}
}
