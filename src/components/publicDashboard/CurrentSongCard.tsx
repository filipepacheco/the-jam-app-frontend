import {lazy, Suspense, useLayoutEffect, useState, type CSSProperties, type RefObject} from 'react'
import {useTranslation} from 'react-i18next'
import {InstrumentGroup} from './InstrumentGroup'
import {groupMusiciansByInstrument} from '../../utils/musicianUtils'
import type {DashboardSongDto, PlaybackState} from '../../types/api.types'
import {useVenueChangeMotion} from './useVenueChangeMotion'
import {splitWords} from './venueWords'
import {APPLAUSE_SHIFT, sceneShift, useSceneShift} from './venueScene'
import {ReactionLayer} from './ReactionLayer'
import {useClapCount} from './useAudienceReactions'
import type {ReactionFeed} from '../../lib/realtime/jamReactions'
import './venue-display.css'

const ConfettiWrapper = lazy(() => import('./ConfettiWrapper'))

interface CurrentSongCardProps {
  song: DashboardSongDto | null
  playbackState?: PlaybackState
  /** The Jam is over: the stage rolls its last song out and the finale in. */
  finished?: boolean
  /** The band that just finished: the stage applauds it before the next song. */
  applause?: DashboardSongDto | null
  /** Sign-ups the join spotlight will fly into this lineup. */
  awaiting?: ReadonlySet<string>
  /** The up-next flight carrying this song here; its text waits until it lands. */
  boarding?: number | null
  /** The room's reactions: they float up behind the stage text. */
  reactions?: ReactionFeed | null
}

/** "Yuri, Alexandra and Marina"; a big band ends in "and 3 more". */
function performerNames(song: DashboardSongDto, language: string | undefined, more: (count: number) => string) {
  const names = [...new Map(song.musicians.filter(({name}) => name).map(({id, name}) => [id, name])).values()]
  const shown = names.length > 4 ? [...names.slice(0, 3), more(names.length - 3)] : names
  return new Intl.ListFormat(language, {type: 'conjunction'}).format(shown)
}

// A short burst behind the text, sized to the stage and colored by the theme.
function StageConfetti({stage}: {stage: RefObject<HTMLElement | null>}) {
  const [burst, setBurst] = useState<{width: number; height: number; colors: string[]} | null>(null)
  useLayoutEffect(() => {
    const element = stage.current
    if (!element) return
    const {width, height} = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    const colors = ['--color-primary', '--color-secondary', '--color-accent', '--color-warning']
      .map(token => style.getPropertyValue(token).trim())
      .filter(Boolean)
    setBurst({width, height, colors})
  }, [stage])
  if (!burst) return null
  return (
    <Suspense fallback={null}>
      <ConfettiWrapper show width={burst.width} height={burst.height} numberOfPieces={160} tweenDuration={1200} {...(burst.colors.length > 0 ? {colors: burst.colors} : {})} />
    </Suspense>
  )
}

// Distance-readable domain wrapper; see public-dashboard-migration.md.
export function CurrentSongCard({song: liveSong, playbackState = 'PLAYING', finished = false, applause = null, awaiting, boarding = null, reactions = null}: CurrentSongCardProps) {
  const {t, i18n} = useTranslation()
  const song = finished || applause ? null : liveSong
  // The applauded band stays in the lineup while the title thanks it.
  const lineupSong = applause ?? song
  const {ref: cardRef, motionEnabled} = useVenueChangeMotion(lineupSong, applause ? `applause:${applause.id}` : finished ? 'finale' : undefined, boarding)
  // Level bars and stage lights mean music is sounding. A paused song keeps
  // its title and lineup; the lights fade and the meter settles flat.
  const sounding = Boolean(song) && playbackState === 'PLAYING'
  const shift = useSceneShift(applause ? APPLAUSE_SHIFT : sceneShift(song?.id ?? null))
  const claps = useClapCount(reactions, applause?.id ?? null)

  const title = applause
    ? t('publicDashboard.applauseFor', {names: performerNames(applause, i18n?.resolvedLanguage, count => t('publicDashboard.andMore', {count}))})
    : finished ? t('publicDashboard.jamFinished') : song?.title ?? t('publicDashboard.waitingForPerformance')
  const artist = applause
    ? `${applause.title} · ${applause.artist}`
    : finished ? t('publicDashboard.thankYou') : song?.artist ?? t('publicDashboard.waitingForPerformanceHelp')

  return (
    <section ref={cardRef} className="venue-current" data-venue-song-id={lineupSong?.id} data-live={Boolean(song)} data-playback={applause ? 'applause' : sounding ? 'sounding' : 'still'} data-venue-motion={motionEnabled ? 'running' : 'paused'} data-venue-boarding={typeof boarding === 'number' ? '' : undefined} style={{'--venue-scene-shift': shift} as CSSProperties} aria-label={t('publicDashboard.onStage')}>
      {lineupSong && (
        <div className="venue-stage-fx" aria-hidden="true">
          <span className="venue-stage-beam" />
          <span className="venue-stage-beam" />
          <span className="venue-stage-halo" />
          <span className="venue-stage-sweep" />
          {applause && motionEnabled && <StageConfetti key={applause.id} stage={cardRef} />}
        </div>
      )}
      <ReactionLayer feed={reactions} gentle={!motionEnabled} />
      <span className="venue-change-wash" aria-hidden="true" />
      {!finished && (
        <p className="venue-label">
          {lineupSong && <span className="venue-live-beat" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></span>}
          {applause
            ? <>
                {t('publicDashboard.applauseLabel')}
                {claps > 0 && <span key={claps} className="venue-claps"><span aria-hidden="true">👏</span> {t('publicDashboard.applauseClaps', {count: claps})}</span>}
              </>
            : song
              ? t(playbackState === 'PAUSED' ? 'schedule.statuses.paused' : 'publicDashboard.nowPlaying')
              : t('publicDashboard.startingSoon')}
        </p>
      )}
      {/* Each line is its own mask; the ghost holds the outgoing song during a roll. */}
      <div className="venue-song-stage">
        <div data-venue-song>
          <h2 className="venue-current-title venue-roll ds-wrap-user-content">
            <span className="venue-roll-line">{splitWords(title)}</span>
          </h2>
          <p className="venue-artist venue-roll ds-wrap-user-content">
            <span className="venue-roll-line">{artist}</span>
          </p>
        </div>
        <div className="venue-song-ghost" data-venue-ghost aria-hidden="true" />
      </div>
      {lineupSong && (
        <div className="venue-lineup" data-venue-lineup>
          <p className="venue-label">{t('publicDashboard.onStage')}</p>
          {lineupSong.musicians.length > 0 ? (
            <div className="venue-musicians">
              {Object.entries(groupMusiciansByInstrument(lineupSong.musicians)).map(([instrument, musicians]) => (
                <InstrumentGroup key={instrument} instrument={instrument} musicians={musicians} size="lg" songId={lineupSong.id} awaiting={awaiting} />
              ))}
            </div>
          ) : <p className="venue-support">{t('publicDashboard.lineupPending')}</p>}
        </div>
      )}
    </section>
  )
}
