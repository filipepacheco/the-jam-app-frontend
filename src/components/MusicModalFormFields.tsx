/**
 * Music Modal Form Fields Component
 * Responsive form fields with consistent layout
 */

import { GENRES } from '../lib/musicConstants'
import { useTranslation } from 'react-i18next'

interface FormData {
  title: string
  artist: string
  description: string
  link: string
  info: string
  genre: string
  duration: string
  neededDrums: number
  neededGuitars: number
  neededVocals: number
  neededBass: number
  neededKeys: number
}

interface MusicModalFormFieldsProps {
  formData: FormData
  onChange: (field: keyof FormData, value: string | number) => void
}

export function MusicModalFormFields({
  formData,
  onChange,
}: MusicModalFormFieldsProps) {
  const { t } = useTranslation()

  const instruments = [
    { key: 'neededDrums', emoji: '🥁', label: t('music_form.drummers') },
    { key: 'neededGuitars', emoji: '🎸', label: t('music_form.guitarists') },
    { key: 'neededVocals', emoji: '🎤', label: t('music_form.vocalists') },
    { key: 'neededBass', emoji: '🎸', label: t('music_form.bassists') },
    { key: 'neededKeys', emoji: '🎹', label: t('music_form.keyboardists') },
  ] as const

  return (
    <div className="space-y-5">
      {/* Required Fields Section */}
      <div className="space-y-4">
        {/* Title */}
        <div className="form-control">
          <label className="label py-1" htmlFor="music-title">
            <span className="label-text font-medium">
              {t('common.form_labels.title')} <span className="text-error">*</span>
            </span>
          </label>
          <input
            id="music-title"
            type="text"
            value={formData.title}
            onChange={(e) => onChange('title', e.target.value)}
            className="input input-bordered w-full"
            placeholder="e.g., Bluesette…"
          />
        </div>

        {/* Artist */}
        <div className="form-control">
          <label className="label py-1" htmlFor="music-artist">
            <span className="label-text font-medium">
              {t('common.form_labels.artist')} <span className="text-error">*</span>
            </span>
          </label>
          <input
            id="music-artist"
            type="text"
            value={formData.artist}
            onChange={(e) => onChange('artist', e.target.value)}
            className="input input-bordered w-full"
            placeholder="e.g., Toots Thielemans…"
          />
        </div>
      </div>

      {/* Optional Fields Section */}
      <div className="space-y-4">
        {/* Description */}
        <div className="form-control">
          <label className="label py-1" htmlFor="music-description">
            <span className="label-text font-medium">{t('common.description')}</span>
          </label>
          <textarea
            id="music-description"
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            className="textarea textarea-bordered w-full min-h-[80px]"
            placeholder={t('music_form.description_placeholder')}
          />
          <label className="label py-0">
            <span className="label-text-alt text-xs">{t('music_form.description_hint')}</span>
          </label>
        </div>

        {/* Link */}
        <div className="form-control">
          <label className="label py-1" htmlFor="music-link">
            <span className="label-text font-medium">{t('common.link')}</span>
          </label>
          <input
            id="music-link"
            type="text"
            value={formData.link}
            onChange={(e) => onChange('link', e.target.value)}
            className="input input-bordered w-full"
            placeholder={t('music_form.link_placeholder')}
          />
          <label className="label py-0">
            <span className="label-text-alt text-xs">{t('music_form.link_hint')}</span>
          </label>
        </div>

        {/* Info */}
        <div className="form-control">
          <label className="label py-1" htmlFor="music-info">
            <span className="label-text font-medium">{t('music_form.info_label')}</span>
          </label>
          <textarea
            id="music-info"
            value={formData.info}
            onChange={(e) => onChange('info', e.target.value)}
            className="textarea textarea-bordered w-full min-h-[80px]"
            placeholder={t('music_form.info_placeholder')}
          />
          <label className="label py-0">
            <span className="label-text-alt text-xs">{t('music_form.info_hint')}</span>
          </label>
        </div>

        {/* Genre & Duration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Genre */}
          <div className="form-control">
            <label className="label py-1" htmlFor="music-genre">
              <span className="label-text font-medium">
                {t('common.form_labels.genre')}
              </span>
            </label>
            <select
              id="music-genre"
              value={formData.genre}
              onChange={(e) => onChange('genre', e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="">{t('music_form.select_genre')}</option>
              {GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div className="form-control">
            <label className="label py-1" htmlFor="music-duration">
              <span className="label-text font-medium">{t('music_form.duration_label')}</span>
            </label>
            <input
              id="music-duration"
              type="text"
              value={formData.duration}
              onChange={(e) => onChange('duration', e.target.value)}
              className="input input-bordered w-full"
              placeholder={t('music_form.duration_placeholder')}
              pattern="[0-9]+:[0-5][0-9]"
            />
            <label className="label py-0">
              <span className="label-text-alt text-xs">{t('music_form.duration_hint')}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Needed Instruments Section */}
      <div className="border-t border-base-300 pt-4">
        <h4 className="font-medium text-base mb-3 text-center">
          {t('music_form.musicians_needed')}
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {instruments.map(({ key, emoji, label }) => (
            <div key={key} className="form-control">
              <label className="label py-1" htmlFor={`music-${key}`}>
                <span className="label-text text-sm">
                  {emoji} {label}
                </span>
              </label>
              <input
                id={`music-${key}`}
                type="number"
                min="0"
                max="5"
                value={formData[key]}
                onChange={(e) => onChange(key, parseInt(e.target.value) || 0)}
                className="input input-bordered input-sm w-full"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
