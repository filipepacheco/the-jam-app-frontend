import {useTranslation} from 'react-i18next'
import {useReducedMotion} from '../../hooks/useReducedMotion'
import {REACTION_EMOJI, REACTIONS, type ReactionKind} from '../../lib/realtime/jamReactions'
import type {TranslationKey} from '../../locales/catalogue/catalogue'
import {useReactionSender} from './useReactionSender'

/** Room the fixed bar takes at the bottom of the page, for the FAB and the content. */
export const REACTION_BAR_SPACE = 112

const LABELS = {
  clap: 'jams.reactions.clap',
  fire: 'jams.reactions.fire',
  heart: 'jams.reactions.heart',
  rock: 'jams.reactions.rock',
} as const satisfies Record<ReactionKind, TranslationKey>

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'

interface ReactionBarProps {
  jamId: string
  /** Send to the venue display. Review stories keep this off: taps stay local. */
  live?: boolean
}

/**
 * While the Jam is live, the audience taps reactions that float up on the
 * venue display. Anonymous: a tap sends only its kind, never who tapped.
 */
export function ReactionBar({jamId, live = true}: ReactionBarProps) {
  const {t} = useTranslation()
  const {prefersReducedMotion} = useReducedMotion()
  const send = useReactionSender(jamId, live)

  const react = (kind: ReactionKind, button: HTMLButtonElement) => {
    send(kind)
    if ('vibrate' in navigator) navigator.vibrate(10)
    if (typeof button.animate !== 'function') return
    if (prefersReducedMotion) {
      button.animate([{opacity: 0.55}, {opacity: 1}], {duration: 200, easing: 'ease'})
      return
    }
    // The emoji rises from the button, so the tap is seen at once.
    const burst = document.createElement('span')
    burst.textContent = REACTION_EMOJI[kind]
    burst.setAttribute('aria-hidden', 'true')
    Object.assign(burst.style, {position: 'absolute', left: '50%', top: '0', pointerEvents: 'none', fontSize: '1.75rem', lineHeight: '1'})
    button.append(burst)
    const drift = (Math.random() - 0.5) * 32
    burst.animate([
      {transform: 'translate3d(-50%, 0, 0) scale(0.8)', opacity: 1},
      {transform: `translate3d(calc(-50% + ${drift}px), -72px, 0) scale(1.3)`, opacity: 0},
    ], {duration: 700, easing: EASE_OUT}).finished.then(() => burst.remove(), () => burst.remove())
  }

  return (
    <div
      role="group"
      aria-label={t('jams.reactions.title')}
      className="fixed inset-x-0 bottom-0 z-[9990] border-t border-base-300 bg-base-100/95 px-4 pt-2 backdrop-blur pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
        <p className="text-sm font-semibold text-base-content/70" aria-hidden="true">{t('jams.reactions.title')}</p>
        <div className="flex gap-3">
          {REACTIONS.map(kind => (
            <button
              key={kind}
              type="button"
              className="ds-focusable relative grid size-14 place-items-center rounded-full bg-base-200 text-2xl transition-transform duration-150 active:scale-[0.96]"
              aria-label={t(LABELS[kind])}
              onClick={event => react(kind, event.currentTarget)}
            >
              <span aria-hidden="true">{REACTION_EMOJI[kind]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
