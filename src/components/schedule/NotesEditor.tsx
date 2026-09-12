/**
 * NotesEditor - Shared notes view/edit/add component
 * Used by both ScheduleCollapsibleCard and ScheduleCompactCard
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Pencil } from 'lucide-react'
import { Action, IconAction } from '../Action'

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
          <Action
            variant="quiet"
            onClick={() => { setEditing(false); setEditValue(notes || '') }}
          >
            <Action.Label>{t('common.cancel')}</Action.Label>
          </Action>
          <Action
            variant="primary"
            state={loading ? 'disabled' : 'idle'}
            onClick={() => {
              onSave?.(jamMusicId, displayValue)
              setEditing(false)
            }}
          >
            <Action.Label>{t('common.save')}</Action.Label>
          </Action>
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
          <IconAction
            variant="quiet"
            className="shrink-0"
            label={t('schedule.edit_notes')}
            onClick={() => { setEditValue(notes || ''); setEditing(true) }}
          >
            <Pencil className="w-3 h-3" />
          </IconAction>
        )}
      </div>
    )
  }

  if (onSave) {
    return (
      <Action
        variant="quiet"
        className="text-base-content/40"
        onClick={() => { setEditValue(''); setEditing(true) }}
      >
        <Action.Icon><FileText className="w-3 h-3" /></Action.Icon>
        <Action.Label>{t('schedule.add_notes')}</Action.Label>
      </Action>
    )
  }

  return null
}
