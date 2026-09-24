import {useEffect, useLayoutEffect, useRef, useState, type ReactNode} from 'react'
import {useTranslation} from 'react-i18next'
import {getInstrumentEmoji} from '../../utils/instrumentEmojis'
import {useInstrumentLabel} from './instrumentLabel'
import type {JoinMoment} from './useJoinSpotlight'
import {FLASH, LIFT_EASE, SHOW} from './useVenueChangeMotion'
import {EASE_IN_OUT, EASE_OUT, TEMPO, cssEase} from './venueMotion'
import './venue-display.css'

// The name holds the room, then flies to its lineup slot. Milliseconds at TEMPO 1.
const JOIN = {hold: 2200 * TEMPO, flight: 700 * TEMPO, fade: 240 * TEMPO, cut: 160}
// Reduced motion: the announcement crossfades and nothing travels.
const GENTLE = {enter: 200, exit: 120}
const NAMES = '\u0001'

interface JoinSpotlightProps {
  moment: JoinMoment | null
  /** The stage is applauding: wait, or clear the floor at once. */
  paused: boolean
  gentle: boolean
  onDone: (id: number) => void
}

/** Announces new sign-ups over the programme column, never over the QR code. */
export function JoinSpotlight({moment, paused, gentle, onDone}: JoinSpotlightProps) {
  const [showing, setShowing] = useState<number | null>(null)
  if (moment && !paused && showing !== moment.id) setShowing(moment.id)
  // A moment that has not started waits for the applause to end.
  if (!moment || (paused && moment.id !== showing)) return null
  return <JoinAnnouncement key={moment.id} moment={moment} paused={paused} gentle={gentle} onDone={onDone} />
}

function JoinAnnouncement({moment, paused, gentle, onDone}: JoinSpotlightProps & {moment: JoinMoment}) {
  const {t, i18n} = useTranslation()
  const instrumentLabel = useInstrumentLabel()
  const ref = useRef<HTMLDivElement>(null)
  const leave = useRef<(quick: boolean) => void>(() => {})

  const list = new Intl.ListFormat(i18n?.resolvedLanguage, {type: 'conjunction'})
  const names = moment.joins.map(({musician}) => musician.name)
  const listed = moment.extra > 0 ? [...names, t('publicDashboard.andMore', {count: moment.extra})] : names
  const [before, after = ''] = t('publicDashboard.joinHeadline', {count: names.length + moment.extra, names: NAMES}).split(NAMES)
  // Each flying name is its own box; the words around it fade in place.
  let flying = 0
  const headline = list.formatToParts(listed).map((part, index) => part.type === 'element' && flying < moment.joins.length
    ? <span key={index} className="venue-join-name" data-join-key={moment.joins[flying++].key}>{part.value}</span>
    : <span key={index} className="venue-join-rest">{part.value}</span>)

  const [first] = moment.joins
  const titles = [...new Set(moment.joins.map(({title}) => `“${title}”`))]
  const detail: ReactNode = moment.joins.length === 1 && moment.extra === 0
    ? <><span aria-hidden="true">{getInstrumentEmoji(first.musician.instrument)}</span>{' '}{t('publicDashboard.joinDetail', {instrument: instrumentLabel(first.musician.instrument), title: titles[0]})}</>
    : t('publicDashboard.joinSongs', {titles: list.format(titles)})

  useLayoutEffect(() => {
    const root = ref.current
    if (!root || typeof root.animate !== 'function') {
      const timer = setTimeout(() => onDone(moment.id), JOIN.hold)
      return () => clearTimeout(timer)
    }
    const running: Animation[] = []
    let alive = true
    let leaving = false
    const play = (element: Element | null, frames: Keyframe[], timing: KeyframeAnimationOptions) => {
      if (!element) return null
      const animation = element.animate(frames, {easing: cssEase(EASE_OUT), fill: 'both', ...timing})
      running.push(animation)
      return animation
    }
    const find = (selector: string) => root.querySelector(selector)
    const findAll = (selector: string) => [...root.querySelectorAll<HTMLElement>(selector)]

    if (gentle) {
      play(root, [{opacity: 0}, {opacity: 1}], {duration: GENTLE.enter, easing: 'ease'})
    } else {
      // Lift and fade separately: the spring may overshoot, opacity and blur must not.
      const card = find('.venue-join-card')
      play(find('.venue-join-scrim'), [{opacity: 0}, {opacity: 1}], {duration: SHOW.fade})
      play(card, [{transform: 'translate3d(0, 32px, 0) scale(0.9)'}, {transform: 'none'}], {duration: SHOW.rise, easing: LIFT_EASE})
      play(card, [{opacity: 0, filter: 'blur(8px)'}, {opacity: 1, filter: 'none'}], {duration: SHOW.fade})
      ;[find('.venue-join-label'), find('.venue-join-headline'), find('.venue-join-detail')].forEach((line, index) => {
        play(line, [{opacity: 0, transform: 'translate3d(0, 16px, 0)'}, {opacity: 1, transform: 'none'}], {duration: SHOW.rise, delay: (index + 1) * SHOW.stagger})
      })
    }

    leave.current = (quick: boolean) => {
      if (leaving || !alive) return
      leaving = true
      const exits: Animation[] = []
      const landings: Element[] = []
      const fadeOut = (element: Element | null, duration: number) => {
        const animation = play(element, [{opacity: 1}, {opacity: 0}], {duration})
        if (animation) exits.push(animation)
      }
      if (gentle || quick) {
        fadeOut(root, gentle ? GENTLE.exit : JOIN.cut)
      } else {
        const programme = root.closest('.venue-programme') ?? document
        findAll('.venue-join-name').forEach(name => {
          const join = moment.joins.find(({key}) => key === name.dataset.joinKey)
          const slot = join && programme.querySelector(`[data-venue-song-id="${CSS.escape(join.songId)}"] [data-venue-musician="${CSS.escape(join.musician.id)}"]`)
          if (!slot) {
            fadeOut(name, JOIN.fade)
            return
          }
          // FLIP: match the slot's text box, so the real name takes over in place.
          const from = name.getBoundingClientRect()
          const to = slot.getBoundingClientRect()
          const fromStyle = getComputedStyle(name)
          const toStyle = getComputedStyle(slot)
          const fromSize = parseFloat(fromStyle.fontSize)
          const toSize = parseFloat(toStyle.fontSize)
          const scale = toSize / fromSize
          const leading = (style: CSSStyleDeclaration, size: number) => ((parseFloat(style.lineHeight) || size * 1.2) - size) / 2
          const x = to.left - from.left
          const y = to.top + leading(toStyle, toSize) - from.top - scale * leading(fromStyle, fromSize)
          const flight = play(name, [
            {transform: 'none', color: fromStyle.color},
            {transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`, color: toStyle.color},
          ], {duration: JOIN.flight, easing: cssEase(EASE_IN_OUT)})
          if (flight) {
            exits.push(flight)
            landings.push(slot)
          }
        })
        ;[find('.venue-join-surface'), find('.venue-join-label'), find('.venue-join-detail'), ...findAll('.venue-join-rest')]
          .forEach(element => fadeOut(element, JOIN.fade))
        fadeOut(find('.venue-join-scrim'), JOIN.flight)
      }
      void Promise.allSettled(exits.map(animation => animation.finished)).then(() => {
        if (!alive) return
        landings.forEach(slot => slot.closest('[data-venue-instrument]')?.querySelector('.venue-musician-wash')
          ?.animate(FLASH, {duration: SHOW.light, easing: 'linear'}))
        onDone(moment.id)
      })
    }
    const timer = setTimeout(() => leave.current(false), JOIN.hold)
    return () => {
      alive = false
      clearTimeout(timer)
      running.forEach(animation => animation.cancel())
    }
  }, [moment, gentle, onDone])

  useEffect(() => {
    if (paused) leave.current(true)
  }, [paused])

  return (
    <div ref={ref} className="venue-join" role="status">
      <div className="venue-join-scrim" aria-hidden="true" />
      <div className="venue-join-card">
        <span className="venue-join-surface" aria-hidden="true" />
        <p className="venue-label venue-join-label">{t('publicDashboard.joinLabel')}</p>
        <p className="venue-join-headline ds-wrap-user-content">
          {before && <span className="venue-join-rest">{before}</span>}
          {headline}
          {after && <span className="venue-join-rest">{after}</span>}
        </p>
        <p className="venue-support venue-join-detail ds-wrap-user-content">{detail}</p>
      </div>
    </div>
  )
}
