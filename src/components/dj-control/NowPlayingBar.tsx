import { useTranslation } from 'react-i18next'
import { Music, Play, Pause, Square } from 'lucide-react'
import type { LiveStateSongDto, PlaybackState } from '../../types/jamControl.types'

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

const STATE_CONFIG: Record<PlaybackState, { badge: string; Icon: typeof Play; label: string }> = {
  PLAYING: { badge: 'badge-success', Icon: Play, label: 'dj_control.now_playing.playing' },
  PAUSED: { badge: 'badge-warning', Icon: Pause, label: 'dj_control.now_playing.paused' },
  STOPPED: { badge: 'badge-neutral', Icon: Square, label: 'dj_control.now_playing.stopped' },
}

export function NowPlayingBar({ currentSong, playbackState, nextSong }: NowPlayingBarProps) {
  const { t } = useTranslation()
  const config = STATE_CONFIG[playbackState] || STATE_CONFIG.STOPPED
  const { Icon } = config

  if (!currentSong) {
    return (
      <div className="rounded-lg bg-base-200 px-3 py-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-base-content/50 uppercase tracking-wide">
            {t('dj_control.now_playing.ready_to_start', 'Pronto para iniciar')}
          </span>
          <span className={`badge badge-xs ${config.badge} gap-1`}>
            <Icon className="size-2.5" />
            {t(config.label)}
          </span>
        </div>
        {nextSong ? (
          <div>
            <p className="text-sm text-base-content/60">
              {t('dj_control.now_playing.next_up', 'Proxima')}: <span className="font-semibold text-base-content/80">{nextSong.music.title}</span>
            </p>
            <p className="text-xs text-base-content/40">{nextSong.music.artist}</p>
          </div>
        ) : (
          <p className="text-sm text-base-content/40">{t('dj_control.now_playing.idle', 'Nenhuma musica na fila')}</p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-base-200 px-3 py-2.5">
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-base-content/50 uppercase tracking-wide">
          <Music className="size-3" />
          {t('dj_control.timeline.now_playing', 'Tocando agora')}
        </div>
        <span className={`badge badge-xs ${config.badge} gap-1`}>
          <Icon className="size-2.5" />
          {t(config.label)}
        </span>
      </div>
      <p className="text-lg font-bold leading-tight line-clamp-1">{currentSong.music.title}</p>
      <p className="text-sm text-base-content/60">
        {currentSong.music.artist}
        {currentSong.music.duration ? ` - ${formatDuration(currentSong.music.duration)}` : ''}
      </p>
    </div>
  )
}
