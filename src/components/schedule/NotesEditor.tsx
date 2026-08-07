/**
 * NotesEditor - Shared notes view/edit/add component
 * Used by ScheduleCollapsibleCard
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Pencil } from 'lucide-react'

interface NotesEditorProps {
  notes?: string | null
  jamMusicId: string
  loading?: boolean
  onSave?: (jamMusicId: string, notes: string) => void
}

export function NotesEditor({ notes, jamMusicId, loading = false, onSave }: NotesEditorProps) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(notes || '')

  const displayValue = editing ? editValue : (notes || '')

  if (!notes && !onSave) return null

  if (editing) {
    return (
      <div className="space-y-1">
        <textarea
          value={displayValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="textarea textarea-bordered textarea-xs w-full text-xs"
          rows={2}
          maxLength={2000}
          placeholder={t('schedule.notes_placeholder')}
          aria-label={t('schedule.notes_placeholder')}
          autoFocus
        />
        <div className="flex gap-1 justify-end">
          <button
            className="btn btn-sm min-h-[44px] min-w-[44px] btn-ghost"
            onClick={() => { setEditing(false); setEditValue(notes || '') }}
          >
            {t('common.cancel')}
          </button>
          <button
            className="btn btn-sm min-h-[44px] min-w-[44px] btn-primary"
            disabled={loading}
            onClick={() => {
              onSave?.(jamMusicId, displayValue)
              setEditing(false)
            }}
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    )
  }

  if (notes) {
    return (
      <div className="flex items-start gap-1 text-xs text-base-content/70 bg-base-100 rounded px-2 py-1">
        <FileText className="w-3 h-3 mt-0.5 shrink-0 text-base-content/40" />
        <p className="whitespace-pre-line flex-1 min-w-0">{notes}</p>
        {onSave && (
          <button
            className="btn btn-ghost btn-sm min-h-[44px] min-w-[44px] btn-circle shrink-0"
            onClick={() => { setEditValue(notes || ''); setEditing(true) }}
            title={t('schedule.edit_notes')}
            aria-label={t('schedule.edit_notes')}
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>
    )
  }

  if (onSave) {
    return (
      <button
        className="btn btn-sm min-h-[44px] min-w-[44px] btn-ghost text-base-content/40 gap-1"
        onClick={() => { setEditValue(''); setEditing(true) }}
      >
        <FileText className="w-3 h-3" />
        {t('schedule.add_notes')}
      </button>
    )
  }

  return null
}
