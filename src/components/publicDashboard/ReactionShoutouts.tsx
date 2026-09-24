import {useEffect, useState} from 'react'
import {AnimatePresence, motion} from 'framer-motion'
import {useTranslation} from 'react-i18next'
import {REACTION_EMOJI, type ReactionFeed, type ReactionKind} from '../../lib/realtime/jamReactions'
import type {TranslationKey} from '../../locales/catalogue/catalogue'
import {DURATION, EASE_OUT, TEMPO} from './venueMotion'
import './venue-display.css'

/** Lines on the stage at once: a new one sends the oldest away. */
export const MAX_SHOUTOUTS = 3
/** How long a line stays after its last reaction. */
export const SHOUTOUT_MS = 4000

const LINES = {
  clap: 'publicDashboard.shoutoutClap',
  fire: 'publicDashboard.shoutoutFire',
  heart: 'publicDashboard.shoutoutHeart',
  rock: 'publicDashboard.shoutoutRock',
} as const satisfies Record<ReactionKind, TranslationKey>
const NAME = '\u0001'

interface Shoutout {
  key: string
  kind: ReactionKind
  name: string | null
  until: number
  /** Reactions since the line showed: each one pops the emoji. */
  hits: number
}

const stalest = (lines: Shoutout[]) => lines.reduce((oldest, line) => line.until < oldest.until ? line : oldest)

interface ReactionShoutoutsProps {
  feed: ReactionFeed | null | undefined
  gentle: boolean
}

/**
 * Names the room's reactions on the stage: "Lipe amou isso! ❤️". A person
 * who reacts again keeps one line, which stays longer; guests share one
 * "A Plateia" line for each kind.
 */
export function ReactionShoutouts({feed, gentle}: ReactionShoutoutsProps) {
  const {t} = useTranslation()
  const [lines, setLines] = useState<Shoutout[]>([])

  useEffect(() => {
    if (!feed) return
    return feed.subscribe(({kind, name = null}) => {
      const key = `${kind}${NAME}${name ?? ''}`
      const until = Date.now() + SHOUTOUT_MS
      setLines(current => {
        if (current.some(line => line.key === key)) {
          return current.map(line => line.key === key ? {...line, until, hits: line.hits + 1} : line)
        }
        // Full: the line with the oldest last reaction leaves, not the first one shown.
        const leaving = current.length < MAX_SHOUTOUTS ? null : stalest(current)
        return [...current.filter(line => line !== leaving), {key, kind, name, until, hits: 0}]
      })
    })
  }, [feed])

  // One timer, for the line that leaves first.
  useEffect(() => {
    if (lines.length === 0) return
    const next = Math.min(...lines.map(({until}) => until))
    const timer = setTimeout(() => setLines(current => current.filter(({until}) => until > Date.now())), Math.max(0, next - Date.now()))
    return () => clearTimeout(timer)
  }, [lines])

  // A line rises in at the bottom and the stack glides up; the oldest drifts off the top.
  const motionProps = gentle
    ? {
        initial: {opacity: 0},
        animate: {opacity: 1, transition: {duration: DURATION.fade, ease: 'easeOut' as const}},
        exit: {opacity: 0, transition: {duration: DURATION.exit, ease: 'easeOut' as const}},
      }
    : {
        // y and scale, not a transform string: they compose with the layout glide.
        initial: {opacity: 0, y: 16, scale: 0.96},
        animate: {opacity: 1, y: 0, scale: 1, transition: {duration: DURATION.enter * TEMPO, ease: EASE_OUT}},
        exit: {opacity: 0, y: -8, transition: {duration: DURATION.exit * TEMPO, ease: EASE_OUT}},
        transition: {layout: {duration: DURATION.enter * TEMPO, ease: EASE_OUT}},
      }

  return (
    <ul className="venue-shoutouts">
      <AnimatePresence initial={false} mode="popLayout">
        {lines.map(({key, kind, name, hits}) => {
          const [before, after = ''] = t(LINES[kind], {name: NAME}).split(NAME)
          return (
            <motion.li key={key} layout={!gentle} className="venue-shoutout ds-wrap-user-content" {...motionProps}>
              <span>
                {before}
                <strong className="venue-shoutout-name">{name ?? t('publicDashboard.shoutoutCrowd')}</strong>
                {after}
              </span>
              <span key={hits} className="venue-shoutout-emoji" aria-hidden="true">{REACTION_EMOJI[kind]}</span>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}
