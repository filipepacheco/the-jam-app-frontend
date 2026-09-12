/**
 * Music Modal Form Fields Component
 * Responsive form fields with consistent layout
 */

import { GENRES } from '../lib/musicConstants'
import { useTranslation } from 'react-i18next'
import { Field } from './Field'

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
        <Field
          id="music-title"
          label={t('common.form_labels.title')}
          required
          requiredLabel={t('common.required', 'required')}
        >
          <Field.Input
            value={formData.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="e.g., Bluesette…"
          />
        </Field>

        {/* Artist */}
        <Field
          id="music-artist"
          label={t('common.form_labels.artist')}
          required
          requiredLabel={t('common.required', 'required')}
        >
          <Field.Input
            value={formData.artist}
            onChange={(e) => onChange('artist', e.target.value)}
            placeholder="e.g., Toots Thielemans…"
          />
        </Field>
      </div>

      {/* Optional Fields Section */}
      <div className="space-y-4">
        {/* Description */}
        <Field id="music-description" label={t('common.description')} hint={t('music_form.description_hint')}>
          <Field.Textarea
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            className="min-h-[80px]"
            placeholder={t('music_form.description_placeholder')}
          />
        </Field>

        {/* Link */}
        <Field id="music-link" label={t('common.link')} hint={t('music_form.link_hint')}>
          <Field.Input
            value={formData.link}
            onChange={(e) => onChange('link', e.target.value)}
            placeholder={t('music_form.link_placeholder')}
          />
        </Field>

        {/* Info */}
        <Field id="music-info" label={t('music_form.info_label')} hint={t('music_form.info_hint')}>
          <Field.Textarea
            value={formData.info}
            onChange={(e) => onChange('info', e.target.value)}
            className="min-h-[80px]"
            placeholder={t('music_form.info_placeholder')}
          />
        </Field>

        {/* Genre & Duration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Genre */}
          <Field id="music-genre" label={t('common.form_labels.genre')}>
            <Field.Select
              value={formData.genre}
              onChange={(e) => onChange('genre', e.target.value)}
            >
              <option value="">{t('music_form.select_genre')}</option>
              {GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </Field.Select>
          </Field>

          {/* Duration */}
          <Field id="music-duration" label={t('music_form.duration_label')} hint={t('music_form.duration_hint')}>
            <Field.Input
              value={formData.duration}
              onChange={(e) => onChange('duration', e.target.value)}
              placeholder={t('music_form.duration_placeholder')}
              pattern="[0-9]+:[0-5][0-9]"
            />
          </Field>
        </div>
      </div>

      {/* Needed Instruments Section */}
      <div className="border-t border-base-300 pt-4">
        <h4 className="font-medium text-base mb-3 text-center">
          {t('music_form.musicians_needed')}
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {instruments.map(({ key, emoji, label }) => (
            <Field key={key} id={`music-${key}`} label={<>{emoji} {label}</>}>
              <Field.Input
                type="number"
                min="0"
                max="5"
                value={formData[key]}
                onChange={(e) => onChange(key, parseInt(e.target.value) || 0)}
              />
            </Field>
          ))}
        </div>
      </div>
    </div>
  )
}
