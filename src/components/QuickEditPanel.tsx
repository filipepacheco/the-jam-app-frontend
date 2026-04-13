/**
 * Quick Edit Panel
 * Inline expandable edit form for music cards.
 * Contains all fields from the edit modal so no separate modal is needed.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, X, Loader2 } from 'lucide-react'
import type { MusicResponseDto, UpdateMusicDto } from '../types/api.types'
import { GENRES } from '../lib/musicConstants'
import { getInstrumentIcon } from '../lib/schedule/instrumentHelpers'

interface QuickEditPanelProps {
  music: MusicResponseDto
  onSave: (id: string, data: UpdateMusicDto) => Promise<boolean>
  onCancel: () => void
}

interface InstrumentStepperProps {
  instrumentKey: string
  label: string
  value: number
  onChange: (value: number) => void
}

function InstrumentStepper({ instrumentKey, label, value, onChange }: InstrumentStepperProps) {
  return (
    <div className="flex items-center gap-0.5">
      <span className="text-base shrink-0">{getInstrumentIcon(instrumentKey)}</span>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="btn btn-sm min-h-[44px] min-w-[44px] btn-square btn-ghost"
        aria-label={`Decrease ${label}`}
        disabled={value <= 0}
      >
        -
      </button>
      <span className="w-5 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(10, value + 1))}
        className="btn btn-sm min-h-[44px] min-w-[44px] btn-square btn-ghost"
        aria-label={`Increase ${label}`}
        disabled={value >= 10}
      >
        +
      </button>
    </div>
  )
}

export function QuickEditPanel({ music, onSave, onCancel }: QuickEditPanelProps) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState(music.title)
  const [artist, setArtist] = useState(music.artist)
  const [description, setDescription] = useState(music.description || '')
  const [link, setLink] = useState(music.link || '')
  const [info, setInfo] = useState(music.info || '')
  const [genre, setGenre] = useState(music.genre || '')

  const initialMinutes = music.duration ? Math.floor(music.duration / 60) : 0
  const initialSeconds = music.duration ? music.duration % 60 : 0
  const [minutes, setMinutes] = useState(initialMinutes)
  const [seconds, setSeconds] = useState(initialSeconds)

  const [drums, setDrums] = useState(music.neededDrums || 0)
  const [guitars, setGuitars] = useState(music.neededGuitars || 0)
  const [vocals, setVocals] = useState(music.neededVocals || 0)
  const [bass, setBass] = useState(music.neededBass || 0)
  const [keys, setKeys] = useState(music.neededKeys || 0)

  const handleSave = useCallback(async () => {
    if (!title.trim() || !artist.trim()) return
    setSaving(true)
    const duration = minutes * 60 + seconds
    const data: UpdateMusicDto = {
      title: title.trim(),
      artist: artist.trim(),
      description: description.trim() || undefined,
      link: link.trim() || undefined,
      info: info.trim() || undefined,
      genre: genre || undefined,
      duration: duration > 0 ? duration : undefined,
      neededDrums: drums,
      neededGuitars: guitars,
      neededVocals: vocals,
      neededBass: bass,
      neededKeys: keys,
    }
    await onSave(music.id, data)
    setSaving(false)
  }, [music.id, title, artist, description, link, info, genre, minutes, seconds, drums, guitars, vocals, bass, keys, onSave])

  return (
    <div className="border-t border-base-300 pt-3 mt-2 space-y-3">
      {/* Title */}
      <div>
        <label className="text-xs text-base-content/60 mb-1 block">
          {t('music_form.title')} *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input input-sm input-bordered w-full"
          placeholder={t('music_form.title_placeholder')}
          required
        />
      </div>

      {/* Artist */}
      <div>
        <label className="text-xs text-base-content/60 mb-1 block">
          {t('music_form.artist')} *
        </label>
        <input
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          className="input input-sm input-bordered w-full"
          placeholder={t('music_form.artist_placeholder')}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs text-base-content/60 mb-1 block">
          {t('music_form.description')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="textarea textarea-bordered textarea-sm w-full"
          placeholder={t('music_form.description_placeholder')}
          rows={3}
        />
      </div>

      {/* Link */}
      <div>
        <label className="text-xs text-base-content/60 mb-1 block">
          {t('music_form.link')}
        </label>
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="input input-sm input-bordered w-full"
          placeholder={t('music_form.link_placeholder')}
        />
      </div>

      {/* Info */}
      <div>
        <label className="text-xs text-base-content/60 mb-1 block">
          {t('music_form.info_label')}
        </label>
        <textarea
          value={info}
          onChange={(e) => setInfo(e.target.value)}
          className="textarea textarea-bordered textarea-sm w-full"
          placeholder={t('music_form.info_placeholder')}
          rows={3}
        />
      </div>

      {/* Genre and Duration row */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-base-content/60 mb-1 block">
            {t('common.form_labels.genre')}
          </label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="select select-sm select-bordered w-full"
          >
            <option value="">{t('music_form.select_genre')}</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[120px]">
          <label className="text-xs text-base-content/60 mb-1 block">
            {t('music_library.table.duration')}
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={99}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
              className="input input-sm input-bordered w-12 text-center tabular-nums px-1"
              aria-label={t('music_library.quick_edit.minutes')}
            />
            <span className="text-base-content/60 font-bold">:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={seconds.toString().padStart(2, '0')}
              onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              className="input input-sm input-bordered w-12 text-center tabular-nums px-1"
              aria-label={t('music_library.quick_edit.seconds')}
            />
          </div>
        </div>
      </div>

      {/* Instruments - icon only, compact row */}
      <div>
        <label className="text-xs text-base-content/60 mb-2 block">
          {t('music_form.musicians_needed')}
        </label>
        <div className="flex flex-wrap gap-3">
          <InstrumentStepper instrumentKey="drums" label={t('schedule.instruments.drums')} value={drums} onChange={setDrums} />
          <InstrumentStepper instrumentKey="guitars" label={t('schedule.instruments.guitars')} value={guitars} onChange={setGuitars} />
          <InstrumentStepper instrumentKey="vocals" label={t('schedule.instruments.vocals')} value={vocals} onChange={setVocals} />
          <InstrumentStepper instrumentKey="bass" label={t('schedule.instruments.bass')} value={bass} onChange={setBass} />
          <InstrumentStepper instrumentKey="keys" label={t('schedule.instruments.keys')} value={keys} onChange={setKeys} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="btn btn-sm btn-ghost gap-1"
        >
          <X className="size-3.5" />
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={() => { void handleSave() }}
          disabled={saving || !title.trim() || !artist.trim()}
          className="btn btn-sm btn-primary gap-1"
        >
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          {t('common.save')}
        </button>
      </div>
    </div>
  )
}
