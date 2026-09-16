import { useTranslation } from 'react-i18next'
import { Music } from 'lucide-react'
import type { LiveStateSongDto, PlaybackState } from '../../types/jamControl.types'
import { DataCard, StatusIndicator, type StatusTone } from '../data-display'
import type {TranslationKey} from '../../locales/catalogue/catalogue'

interface NowPlayingBarProps {
  currentSong: LiveStateSongDto | null
  playbackState: PlaybackState
  nextSong: LiveStateSongDto | null
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// StatusIndicator's convenience tones (live/pending/offline) preserve the same
// semantic mapping used across the app, so playback status stops depending on
// badge color alone and always carries a required visible label.
const STATE_CONFIG: Record<PlaybackState, { status: StatusTone; label: TranslationKey }> = {
  PLAYING: { status: 'live', label: 'dj_control.now_playing.playing' },
  PAUSED: { status: 'pending', label: 'dj_control.now_playing.paused' },
  STOPPED: { status: 'offline', label: 'dj_control.now_playing.stopped' },
}

export function NowPlayingBar({ currentSong, playbackState, nextSong }: NowPlayingBarProps) {
  const { t } = useTranslation()
  const config = STATE_CONFIG[playbackState] || STATE_CONFIG.STOPPED

  if (!currentSong) {
    return (
      <DataCard as="section" density="compact" className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-base-content/70">
            {t('dj_control.now_playing.ready_to_start')}
          </span>
          <StatusIndicator status={config.status} label={t(config.label)} />
        </div>
        {nextSong ? (
          <div>
            <p className="text-sm text-base-content/60">
              {t('dj_control.now_playing.next_up')}: <span className="font-semibold text-base-content">{nextSong.music.title}</span>
            </p>
            <p className="text-xs text-base-content/40">{nextSong.music.artist}</p>
          </div>
        ) : (
          <p className="text-sm text-base-content/40">{t('dj_control.now_playing.idle')}</p>
        )}
      </DataCard>
    )
  }

  return (
    <DataCard as="section" density="compact" selected className="space-y-1">
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-base-content/70">
          <Music className="size-3" aria-hidden="true" />
          {t('dj_control.timeline.now_playing')}
        </div>
        <StatusIndicator status={config.status} label={t(config.label)} />
      </div>
      <p className="ds-wrap-user-content text-lg font-bold leading-tight">{currentSong.music.title}</p>
      <p className="ds-wrap-user-content text-sm text-base-content/60">
        {currentSong.music.artist}
        {currentSong.music.duration ? ` - ${formatDuration(currentSong.music.duration)}` : ''}
      </p>
    </DataCard>
  )
}
