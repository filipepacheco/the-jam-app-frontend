import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Music, Guitar, Star, Calendar } from 'lucide-react'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { musicianService } from '../services'
import type { MusicianProfileWithStats } from '../types/api.types'
import { getInstrumentIcon } from '../lib/schedule/instrumentHelpers'

interface MusicianProfileModalProps {
  musicianId: string
  onClose: () => void
}

export function MusicianProfileModal({ musicianId, onClose }: MusicianProfileModalProps) {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<MusicianProfileWithStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    musicianService.findOne(musicianId).then((data) => {
      if (cancelled) return
      setProfile(data)
      setLoading(false)
    }).catch((err: unknown) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Error')
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [musicianId])

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('musician_profile.title')}
      size="md"
    >
      {loading && (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-md" />
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-error">{error}</div>
      )}

      {profile && !loading && (
        <div className="space-y-5">
          {/* Header: Avatar + Name + Primary Instrument */}
          <div className="flex items-center gap-4">
            <Avatar name={profile.name || ''} size="lg" />
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-base-content truncate">
                {profile.name}
              </h3>
              {profile.instrument && (
                <p className="text-sm text-base-content/70 flex items-center gap-1.5">
                  {getInstrumentIcon(profile.instrument)} {profile.instrument}
                </p>
              )}
              {profile.level && (
                <span className="badge badge-sm badge-ghost mt-1">
                  {t(`schedule.levels.${profile.level}`)}
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1">
                {t('musician_profile.bio')}
              </h4>
              <p className="text-sm text-base-content whitespace-pre-line">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Other Instruments */}
          {profile.otherInstruments && (
            <div>
              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Guitar className="w-3.5 h-3.5" />
                {t('musician_profile.other_instruments')}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.otherInstruments.split(',').map(s => s.trim()).filter(Boolean).map((inst) => (
                  <span key={inst.trim()} className="badge badge-sm badge-outline">
                    {getInstrumentIcon(inst.trim())} {inst.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          {profile.stats && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-base-200 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-base-content/60 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold uppercase">{t('musician_profile.jams_played')}</span>
                </div>
                <p className="text-2xl font-bold text-primary">{profile.stats.totalJams}</p>
              </div>
              <div className="bg-base-200 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-base-content/60 mb-1">
                  <Music className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold uppercase">{t('musician_profile.songs_played')}</span>
                </div>
                <p className="text-2xl font-bold text-primary">{profile.stats.totalSongs}</p>
              </div>
            </div>
          )}

          {/* Instruments played (from stats) */}
          {profile.stats?.instruments && profile.stats.instruments.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Star className="w-3.5 h-3.5" />
                {t('musician_profile.instruments_played')}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.stats.instruments.map((inst) => (
                  <span key={inst} className="badge badge-sm badge-primary badge-outline">
                    {getInstrumentIcon(inst)} {inst}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Member since */}
          {profile.createdAt && (
            <p className="text-xs text-base-content/40 text-center pt-2">
              {t('musician_profile.member_since', {
                date: new Date(profile.createdAt).toLocaleDateString()
              })}
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
