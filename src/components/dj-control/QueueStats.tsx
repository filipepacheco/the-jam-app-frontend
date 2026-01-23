/**
 * Queue Stats Component V2
 * Displays statistics about the song queue
 * Uses new LiveStateResponseDto structure
 */

import {useTranslation} from 'react-i18next'
import type {LiveStateResponseDto, LiveStateSongDto} from '../../types/jamControl.types'

interface QueueStatsProps {
  liveState: LiveStateResponseDto | null
}

function formatTime(seconds: number): string {
  if (seconds === 0) return '0:00'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function QueueStats({ liveState }: QueueStatsProps) {
  const { t } = useTranslation()

  if (!liveState) {
    return (
      <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow">
        <div className="card-body p-4">
          <p className="text-sm text-base-content/70">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  const { currentSong, nextSongs, previousSongs } = liveState

  const totalSongs = previousSongs.length + (currentSong ? 1 : 0) + nextSongs.length
  const completedCount = previousSongs.length
  const currentCount = currentSong ? 1 : 0
  const upcomingCount = nextSongs.length

  // Calculate total duration
  const calculateDuration = (songs: LiveStateSongDto[]) => {
    return songs.reduce((acc, song) => {
      return acc + (song.music?.duration || 0)
    }, 0)
  }

  const totalDuration = calculateDuration(previousSongs) +
    (currentSong ? currentSong.music.duration || 0 : 0) +
    calculateDuration(nextSongs)

  const remainingDuration = (currentSong ? currentSong.music.duration || 0 : 0) + calculateDuration(nextSongs)

  const completedDuration = calculateDuration(previousSongs)

  return (
    <div className="space-y-4">
      {/* Main Stats Card */}
      <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow">
        <div className="card-body p-4">
          <h3 className="font-bold text-lg mb-4">{t('dj_control.stats.title_with_emoji')}</h3>

          <div className="space-y-3">
            {/* Total Songs */}
            <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
              <span className="text-sm font-medium">{t('dj_control.stats.total_songs')}</span>
              <span className="badge badge-lg badge-primary">{totalSongs}</span>
            </div>

            {/* Completed */}
            <div className="flex justify-between items-center p-2">
              <span className="text-xs">{t('dj_control.stats.completed_with_icon')}</span>
              <span className="text-xs font-bold">{completedCount}</span>
            </div>

            {/* Current */}
            {currentCount > 0 && (
              <div className="flex justify-between items-center p-2">
                <span className="text-xs">{t('dj_control.stats.now_playing_with_icon')}</span>
                <span className="text-xs font-bold">{currentCount}</span>
              </div>
            )}

            {/* Upcoming */}
            <div className="flex justify-between items-center p-2">
              <span className="text-xs">{t('dj_control.stats.upcoming_with_icon')}</span>
              <span className="text-xs font-bold">{upcomingCount}</span>
            </div>

            {/* Playback Status */}
            <div className="flex justify-between items-center p-2">
              <span className="text-xs">{t('dj_control.stats.status')}:</span>
              <span className="text-xs badge badge-outline">
                {liveState.playbackState === 'PLAYING' && '▶️ Playing'}
                {liveState.playbackState === 'PAUSED' && '⏸️ Paused'}
                {liveState.playbackState === 'STOPPED' && '⏹️ Stopped'}
              </span>
            </div>
          </div>

          <hr className="my-4 border-base-300" />

          <div className="flex justify-between text-sm">
            <h3 className="font-bold text-sm">{t('dj_control.stats.duration_with_emoji')}</h3>
            <span className="font-bold">{formatTime(totalDuration)}</span>
          </div>

          <progress
            className="progress progress-primary"
            value={totalDuration ? (completedDuration / totalDuration) * 100 : 0}
            max="100"
          ></progress>

          <div className="flex justify-between text-xs text-base-content/70">
            <span>{t('dj_control.stats.remaining')}</span>
            <span>{formatTime(remainingDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
