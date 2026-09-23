import {useTranslation} from 'react-i18next'
import {InstrumentGroup} from './InstrumentGroup'
import {groupMusiciansByInstrument} from '../../utils/musicianUtils'
import type {DashboardSongDto, PlaybackState} from '../../types/api.types'
import {useVenueChangeMotion} from './useVenueChangeMotion'
import './venue-display.css'

interface CurrentSongCardProps {
  song: DashboardSongDto | null
  playbackState?: PlaybackState
  /** The Jam is over: the stage rolls its last song out and the finale in. */
  finished?: boolean
}

// Distance-readable domain wrapper; see public-dashboard-migration.md.
export function CurrentSongCard({song: liveSong, playbackState = 'PLAYING', finished = false}: CurrentSongCardProps) {
  const {t} = useTranslation()
  const song = finished ? null : liveSong
  const {ref: cardRef, motionEnabled} = useVenueChangeMotion(song, finished ? 'finale' : undefined)
  // Level bars and stage lights mean music is sounding. A paused song keeps
  // its title and lineup; the lights fade and the meter settles flat.
  const sounding = Boolean(song) && playbackState === 'PLAYING'

  return (
    <section ref={cardRef} className="venue-current" data-live={Boolean(song)} data-playback={sounding ? 'sounding' : 'still'} data-venue-motion={motionEnabled ? 'running' : 'paused'} aria-label={t('publicDashboard.onStage')}>
      {song && (
        <div className="venue-stage-fx" aria-hidden="true">
          <span className="venue-stage-halo" />
          <span className="venue-stage-sweep" />
        </div>
      )}
      <span className="venue-change-wash" aria-hidden="true" />
      {!finished && (
        <p className="venue-label">
          {song && <span className="venue-live-beat" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></span>}
          {song
            ? t(playbackState === 'PAUSED' ? 'schedule.statuses.paused' : 'publicDashboard.nowPlaying')
            : t('publicDashboard.startingSoon')}
        </p>
      )}
      {/* Each line is its own mask; the ghost holds the outgoing song during a roll. */}
      <div className="venue-song-stage">
        <div data-venue-song>
          <h2 className="venue-current-title venue-roll ds-wrap-user-content">
            <span className="venue-roll-line">{finished ? t('publicDashboard.jamFinished') : song?.title ?? t('publicDashboard.waitingForPerformance')}</span>
          </h2>
          <p className="venue-artist venue-roll ds-wrap-user-content">
            <span className="venue-roll-line">{finished ? t('publicDashboard.thankYou') : song?.artist ?? t('publicDashboard.waitingForPerformanceHelp')}</span>
          </p>
        </div>
        <div className="venue-song-ghost" data-venue-ghost aria-hidden="true" />
      </div>
      {song && (
        <div className="venue-lineup" data-venue-lineup>
          <p className="venue-label">{t('publicDashboard.onStage')}</p>
          {song.musicians.length > 0 ? (
            <div className="venue-musicians">
              {Object.entries(groupMusiciansByInstrument(song.musicians)).map(([instrument, musicians]) => (
                <InstrumentGroup key={instrument} instrument={instrument} musicians={musicians} size="lg" />
              ))}
            </div>
          ) : <p className="venue-support">{t('publicDashboard.lineupPending')}</p>}
        </div>
      )}
    </section>
  )
}
