/**
 * Jam Context Display Component
 * Displays jam information at top of registration form
 */

import type {JamMusicResponseDto, JamResponseDto} from '../types/api.types'


import {useTranslation} from 'react-i18next'

interface JamContextDisplayProps {
  jam: JamResponseDto
}

export function JamContextDisplay({ jam }: JamContextDisplayProps) {
  const { t } = useTranslation()
  return (
    <div className="card bg-base-200 mb-6">
      <div className="card-body">
        {/* Jam Name and Date */}
        <div className="mb-4">
          <h2 className="text-3xl font-bold">{jam.name}</h2>
          <p className="text-base-content/70 mt-2">{jam.date || t('jams.date_tba')}</p>
        </div>

        {/* QR Code */}
        {jam.qrCode && (
          <>
            <div className="divider my-2"></div>
            <div className="flex justify-center mb-4">
              <img
                src={jam.qrCode}
                alt="Jam QR Code"
                className="w-32 h-32 border-2 border-base-300 rounded-lg"
              />
            </div>
          </>
        )}
        {/* Host Info */}
        {jam.hostName && (
          <div className="divider my-2"></div>
        )}
        {jam.hostName && (
          <div className="mb-4">
            <p className="text-sm text-base-content/70">{t('jams.hosted_by')}</p>
            <p className="font-semibold">{jam.hostName}</p>
          </div>
        )}

        {/* Specialties Section */}
        <div className="divider my-2"></div>
        <div>
          <h3 className="font-semibold mb-3">{t('jams.specialties_needed')}</h3>
          <div className="grid grid-cols-2 gap-2">
            {jam.jamMusics && jam.jamMusics.length > 0 ? (
              jam.jamMusics.map((jamMusic: JamMusicResponseDto) => (
                <div
                  key={jamMusic.id}
                  className="p-3 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <p className="font-semibold text-sm">{jamMusic.music?.title || t('schedule.song_tba')}</p>
                  <p className="text-xs text-base-content/70">
                    {jamMusic.music?.artist || t('schedule.artist_tba')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-base-content/70 col-span-2">{t('jams.no_songs_listed')}</p>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="divider my-2"></div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-base-content/70">{t('common.details')}</span>
          <span className="badge badge-outline">{jam.status}</span>
        </div>
      </div>
    </div>
  )
}

export default JamContextDisplay

