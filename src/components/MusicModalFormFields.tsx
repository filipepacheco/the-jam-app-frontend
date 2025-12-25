/**
 * Music Modal Form Fields Component
 * Reusable form fields for add/edit/suggest modes
 */

import {GENRES} from '../lib/musicConstants'

import {useTranslation} from 'react-i18next'

interface FormData {
  title: string
  artist: string
  description: string
  link: string
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
  return (
    <>
      {/* Title */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">
            {t('music_form.title')} <span className="text-error">*</span>
          </span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => onChange('title', e.target.value)}
          className="input input-bordered"
          placeholder="e.g., Bluesette"
          required
        />
      </div>

      {/* Artist */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">
            {t('music_form.artist')} <span className="text-error">*</span>
          </span>
        </label>
        <input
          type="text"
          value={formData.artist}
          onChange={(e) => onChange('artist', e.target.value)}
          className="input input-bordered"
          placeholder="e.g., Toots Thielemans"
          required
        />
      </div>

      {/* Description */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">{t('common.description')}</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => onChange('description', e.target.value)}
          className="textarea textarea-bordered"
          placeholder={t('music_form.description_placeholder')}
          rows={3}
        />
        <label className="label">
          <span className="label-text-alt">{t('music_form.description_hint')}</span>
        </label>
      </div>

      {/* Link */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">{t('common.link')}</span>
        </label>
        <input
          type="url"
          value={formData.link}
          onChange={(e) => onChange('link', e.target.value)}
          className="input input-bordered"
          placeholder={t('music_form.link_placeholder')}
        />
        <label className="label">
          <span className="label-text-alt">{t('music_form.link_hint')}</span>
        </label>
      </div>

      {/* Genre */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">
            {t('music_form.genre')} <span className="text-error">*</span>
          </span>
        </label>
        <select
          value={formData.genre}
          onChange={(e) => onChange('genre', e.target.value)}
          className="select select-bordered"
          required
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
        <label className="label">
          <span className="label-text">{t('music_form.duration_label')}</span>
        </label>
        <input
          type="text"
          value={formData.duration}
          onChange={(e) => onChange('duration', e.target.value)}
          className="input input-bordered"
          placeholder={t('music_form.duration_placeholder')}
          pattern="[0-9]+:[0-5][0-9]"
        />
        <label className="label">
          <span className="label-text-alt">{t('music_form.duration_hint')}</span>
        </label>
      </div>

      {/* Needed Instruments Section */}
      <div className="divider my-2">{t('music_form.musicians_needed')}</div>

      <div className="grid grid-cols-2 gap-3">
        {/* Drums */}
        <div className="form-control">
          <label className="label">
            <span className="label-text text-sm">🥁 {t('music_form.drummers')}</span>
          </label>
          <input
            type="number"
            min="0"
            max="5"
            value={formData.neededDrums}
            onChange={(e) => onChange('neededDrums', parseInt(e.target.value) || 0)}
            className="input input-bordered input-sm"
          />
        </div>

        {/* Guitars */}
        <div className="form-control">
          <label className="label">
            <span className="label-text text-sm">🎸 {t('music_form.guitarists')}</span>
          </label>
          <input
            type="number"
            min="0"
            max="5"
            value={formData.neededGuitars}
            onChange={(e) => onChange('neededGuitars', parseInt(e.target.value) || 0)}
            className="input input-bordered input-sm"
          />
        </div>

        {/* Vocals */}
        <div className="form-control">
          <label className="label">
            <span className="label-text text-sm">🎤 {t('music_form.vocalists')}</span>
          </label>
          <input
            type="number"
            min="0"
            max="5"
            value={formData.neededVocals}
            onChange={(e) => onChange('neededVocals', parseInt(e.target.value) || 0)}
            className="input input-bordered input-sm"
          />
        </div>

        {/* Bass */}
        <div className="form-control">
          <label className="label">
            <span className="label-text text-sm">🎸 {t('music_form.bassists')}</span>
          </label>
          <input
            type="number"
            min="0"
            max="5"
            value={formData.neededBass}
            onChange={(e) => onChange('neededBass', parseInt(e.target.value) || 0)}
            className="input input-bordered input-sm"
          />
        </div>

        {/* Keys */}
        <div className="form-control">
          <label className="label">
            <span className="label-text text-sm">🎹 {t('music_form.keyboardists')}</span>
          </label>
          <input
            type="number"
            min="0"
            max="5"
            value={formData.neededKeys}
            onChange={(e) => onChange('neededKeys', parseInt(e.target.value) || 0)}
            className="input input-bordered input-sm"
          />
        </div>
      </div>
    </>
  )
}

