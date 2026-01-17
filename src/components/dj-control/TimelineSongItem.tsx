/**
 * Timeline Song Item Component
 * Individual song entry in the DJ timeline
 */

import {memo, useState} from 'react'
import type {ScheduleResponseDto} from '../../types/api.types'
import {useTranslation} from 'react-i18next'

interface TimelineSongItemProps {
  schedule: ScheduleResponseDto
  status: 'completed' | 'current' | 'upcoming' | 'suggested'
  onRemove: () => void
  onApprove?: () => void
  loading: boolean
}

export const TimelineSongItem = memo(function TimelineSongItem({
  schedule,
  status,
  onRemove,
  onApprove,
  loading,
}: TimelineSongItemProps) {
  const { t } = useTranslation()
  const [showMusicians, setShowMusicians] = useState(false)
  const song = schedule.music
  const musicianCount = schedule.registrations?.length || 0
  const duration = song?.duration ? formatDuration(song.duration) : '--:--'


  return (
    <div className="w-full">
      <div className="flex flex-col ">
        {/* Song Title and Position */}
        <div className="flex items-start justify-between ">
          <div className="flex-1">
            <h4 className="font-bold text-base">{song?.title || t('dj_control.song_item.unknown_song')}</h4>
            <p className="text-sm text-base-content/70">{song?.artist || t('dj_control.song_item.unknown_artist')}</p>
          </div>
        </div>

        {/* Song Meta */}
        <div className="flex flex-wrap items-center">

          <span className="text-xs text-base-content/60">⏱️ {duration}</span>

          {musicianCount > 0 && (
            <button
              onClick={() => setShowMusicians(true)}
              className="btn btn-xs btn-ghost  text-xs text-base-content/60 hover:text-base-content"
              title={t('dj_control.song_item.view_musicians')}
            >
              👤 {musicianCount}
            </button>
          )}
        </div>

        {/* Actions */}
        {status !== 'completed' && (
          <div className="flex ">
            <button
              onClick={onRemove}
              className="btn btn-xs btn-ghost"
              disabled={loading}
              title={t('dj_control.song_item.remove_from_queue')}
            >
              {t('dj_control.song_item.remove_with_icon')}
            </button>

            {status === 'suggested' && onApprove && (
              <button
                onClick={onApprove}
                className="btn btn-xs btn-success"
                disabled={loading}
                title={t('dj_control.song_item.approve_song')}
              >
                {t('dj_control.song_item.approve_with_icon')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Musicians Modal */}
      {showMusicians && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">{t('dj_control.song_item.musicians_modal_title', { songTitle: song?.title })}</h3>
            <div className="space-y-2">
              {schedule.registrations && schedule.registrations.length > 0 ? (
                schedule.registrations.map((reg) => (
                  <div key={reg.id} className="flex items-center gap-3 p-3 bg-base-200 rounded">
                    <span className="text-2xl">
                      {getInstrumentEmoji(reg.musician?.instrument || reg.instrument || 'Unknown')}
                    </span>
                    <div>
                      <p className="font-semibold">{reg.musician?.name || 'Unknown'}</p>
                      <p className="text-xs text-base-content/70">
                        {reg.musician?.instrument || reg.instrument || 'Unknown Instrument'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-base-content/70">{t('dj_control.timeline.no_musicians')}</p>
              )}
            </div>
            <div className="modal-action mt-6">
              <button
                onClick={() => setShowMusicians(false)}
                className="btn btn-primary"
              >
                {t('dj_control.song_item.close')}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setShowMusicians(false)}
          ></div>
        </div>
      )}
    </div>
  )
})

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Simple emoji mapping for instruments
function getInstrumentEmoji(instrument: string): string {
  const map: Record<string, string> = {
    vocals: '🎤',
    voice: '🎤',
    singer: '🎤',
    guitar: '🎸',
    bass: '🎸',
    piano: '🎹',
    keyboard: '🎹',
    drums: '🥁',
    drums2: '🥁',
    percussion: '🥁',
    violin: '🎻',
    strings: '🎻',
    trumpet: '🎺',
    saxophone: '🎷',
    flute: '🪘',
    harmonica: '🎙️',
  }
  return map[instrument?.toLowerCase() || ''] || '🎵'
}
