import {useTranslation} from 'react-i18next'
import {InstrumentGroup} from './InstrumentGroup'
import {groupMusiciansByInstrument} from '../../utils/musicianUtils'
import type {DashboardSongDto} from '../../types/api.types'
import {useVenueChangeMotion} from './useVenueChangeMotion'
import {splitWords} from './venueWords'
import './venue-display.css'

interface NextSongCardProps {
  song: DashboardSongDto | null
}

// This domain wrapper keeps the next lineup visible alongside the stage.
export function NextSongCard({song}: NextSongCardProps) {
  const {t} = useTranslation()
  const {ref: cardRef, motionEnabled} = useVenueChangeMotion(song)

  return (
    <section ref={cardRef} className="venue-next" data-venue-motion={motionEnabled ? 'running' : 'paused'} aria-label={t('publicDashboard.upNextLabel')}>
      <span className="venue-change-wash" aria-hidden="true" />
      <div>
        <p className="venue-label text-secondary">
          <span className="venue-next-symbol" aria-hidden="true">⏭️</span>
          {t('publicDashboard.upNextLabel')}
        </p>
        <div className="venue-song-stage">
          <div data-venue-song>
            <h3 className="venue-next-title venue-roll ds-wrap-user-content">
              <span className="venue-roll-line">{splitWords(song?.title ?? t('publicDashboard.nextToBeAnnounced'))}</span>
            </h3>
            {song && (
              <p className="venue-support venue-roll ds-wrap-user-content">
                <span className="venue-roll-line">{song.artist}</span>
              </p>
            )}
          </div>
          <div className="venue-song-ghost" data-venue-ghost aria-hidden="true" />
        </div>
      </div>
      <div data-venue-lineup>
        <p className="venue-label">{t(song ? 'publicDashboard.getReady' : 'publicDashboard.yourTurnNext')}</p>
        {song && song.musicians.length > 0 ? (
          <div className="venue-musicians venue-musicians--next">
            {Object.entries(groupMusiciansByInstrument(song.musicians)).map(([instrument, musicians]) => (
              <InstrumentGroup key={instrument} instrument={instrument} musicians={musicians} size="md" />
            ))}
          </div>
        ) : <p className="venue-support">{t(song ? 'publicDashboard.lineupPending' : 'publicDashboard.chooseNextSong')}</p>}
      </div>
    </section>
  )
}
