import {useTranslation} from 'react-i18next'
import {InstrumentGroup} from './InstrumentGroup'
import {groupMusiciansByInstrument} from '../../utils/musicianUtils'
import type {DashboardSongDto, PlaybackState} from '../../types/api.types'
import {useVenueChangeMotion} from './useVenueChangeMotion'
import './venue-display.css'

interface CurrentSongCardProps {
  song: DashboardSongDto | null
  playbackState?: PlaybackState
}

// Distance-readable domain wrapper; see public-dashboard-migration.md.
export function CurrentSongCard({song, playbackState = 'PLAYING'}: CurrentSongCardProps) {
  const {t} = useTranslation()
  const {ref: cardRef, motionEnabled} = useVenueChangeMotion(song)
  // Level bars and stage lights mean music is sounding; a paused song keeps
  // its title and lineup but the stage goes still.
  const sounding = Boolean(song) && playbackState === 'PLAYING'

  return (
    <section ref={cardRef} className="venue-current" data-live={Boolean(song)} data-venue-motion={motionEnabled ? 'running' : 'paused'} aria-label={t('publicDashboard.onStage')}>
      {sounding && (
        <div className="venue-stage-fx" aria-hidden="true">
          <span className="venue-stage-halo" />
          <span className="venue-stage-sweep" />
          <span className="venue-stage-ring" />
          <span className="venue-stage-ring" />
          {Array.from({length: 12}, (_, index) => <span key={index} className="venue-stage-spark" />)}
        </div>
      )}
      <span className="venue-change-wash" aria-hidden="true" />
      <p className="venue-label">
        {sounding && <span className="venue-live-beat" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></span>}
        {song
          ? t(playbackState === 'PAUSED' ? 'schedule.statuses.paused' : 'publicDashboard.nowPlaying')
          : t('publicDashboard.startingSoon')}
      </p>
      <div data-venue-song>
        <h2 className="venue-current-title ds-wrap-user-content">
          {song?.title ?? t('publicDashboard.waitingForPerformance')}
        </h2>
        <p className="venue-artist ds-wrap-user-content">
          {song?.artist ?? t('publicDashboard.waitingForPerformanceHelp')}
        </p>
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
