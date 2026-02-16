/**
 * Musicians Page
 * Displays all musicians in the system with search, filter, and edit capabilities
 * Visible only to hosts
 */

import {useCallback, useEffect, useMemo, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useAuth} from '../../hooks'
import {musicianService} from '../../services'
import useSWR from 'swr'
import type {MusicianLevel, MusicianResponseDto} from '../../types/api.types.ts'
import {EditMusicianModal} from '../../components/EditMusicianModal.tsx'
import {Alert, FullPageSpinner} from '../../components'
import {useTranslation} from 'react-i18next'
import {API_ENDPOINTS} from "../../lib/api"
import {Music, Search} from 'lucide-react'

/** Map level values to badge color variants */
function getLevelBadgeClass(level: string | null | undefined): string {
  switch (level) {
    case 'BEGINNER': return 'badge-info'
    case 'INTERMEDIATE': return 'badge-success'
    case 'ADVANCED': return 'badge-warning'
    case 'PROFESSIONAL': return 'badge-primary'
    default: return 'badge-ghost'
  }
}

/** Format level for display, handling null/undefined */
function formatLevel(level: string | null | undefined, t: (key: string) => string): string {
  if (!level) return t('schedule.levels.not_specified')
  return t(`schedule.levels.${level}`)
}

export function MusiciansPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<MusicianLevel | 'ALL'>('ALL')
  const [editingMusician, setEditingMusician] = useState<MusicianResponseDto | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch musicians with SWR (only when user is host)
  const { data: musicians = [], error: swrError, isLoading, mutate: mutateMusicians } = useSWR<MusicianResponseDto[]>(
    user?.isHost ? API_ENDPOINTS.musicians : null
  )
  const error = swrError?.message ?? null

  // Date formatter using user's locale
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }),
    [i18n.language]
  )

  // Role guard - redirect if not host
  useEffect(() => {
    if (!authLoading && !user?.isHost) {
      navigate('/')
    }
  }, [user?.isHost, authLoading, navigate])

  // Apply search and filter with memoization
  const filteredMusicians = useMemo(() => {
    let filtered = musicians

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          (m.name?.toLowerCase().includes(query) ?? false) ||
          (m.instrument?.toLowerCase().includes(query) ?? false) ||
          (m.contact?.toLowerCase().includes(query) ?? false)
      )
    }

    // Apply level filter
    if (selectedLevel !== 'ALL') {
      filtered = filtered.filter((m) => m.level === selectedLevel)
    }

    return filtered
  }, [searchQuery, selectedLevel, musicians])

  const handleEditMusician = useCallback((musician: MusicianResponseDto) => {
    setEditingMusician(musician)
  }, [])

  const handleUpdateMusician = useCallback(async (updatedMusician: MusicianResponseDto) => {
    try {
      await musicianService.update(updatedMusician.id, {
        name: updatedMusician.name ?? undefined,
        instrument: updatedMusician.instrument ?? undefined,
        level: updatedMusician.level ?? undefined,
        contact: updatedMusician.contact ?? undefined,
      })

      // Refresh musicians data from API
      await mutateMusicians()

      setSuccess(t('jam_management.musicians.update_success'))
      setEditingMusician(null)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      // Error is handled by SWR's swrError, but we can show a toast if needed
    }
  }, [mutateMusicians, t])

  const handleCloseEditModal = () => {
    setEditingMusician(null)
  }

  // Ensure translations for the active language (or its base) are loaded before rendering
  const currentLang = (i18n.language || i18n.resolvedLanguage || '').toString()
  const baseLang = currentLang.split('-')[0]
  const hasBundle = (typeof i18n.hasResourceBundle === 'function')
    ? (i18n.hasResourceBundle(currentLang, 'translation') || i18n.hasResourceBundle(baseLang, 'translation'))
    : true

  if (!hasBundle) {
    return <FullPageSpinner />
  }

  if (authLoading) {
    return <FullPageSpinner />
  }

  if (!user?.isHost) {
    return null
  }

  return (
    <div className="min-h-screen bg-base-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
            <Music className="size-8 text-primary" aria-hidden="true" />
            {t('jam_management.musicians.title')}
          </h1>
          <p className="text-base-content/60">{t('jam_management.musicians.subtitle')}</p>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} title={t('common.error')} />}
        {success && <Alert type="success" message={success} title={t('common.success')} />}

        {/* Search and Filter Bar */}
        <div className="card bg-base-200 mb-6">
          <div className="card-body py-4">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              {/* Search Input */}
              <fieldset className="fieldset flex-1">
                <legend className="fieldset-legend">{t('jam_management.musicians.search_label')}</legend>
                <label className="input w-full">
                  <Search className="size-4 opacity-50" aria-hidden="true" />
                  <input
                    type="search"
                    name="search"
                    autoComplete="off"
                    placeholder={t('jam_management.musicians.search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </label>
              </fieldset>

              {/* Level Filter */}
              <fieldset className="fieldset md:w-64">
                <legend className="fieldset-legend">{t('jam_management.musicians.filter_label')}</legend>
                <select
                  className="select w-full"
                  name="level"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value as MusicianLevel | 'ALL')}
                >
                  <option value="ALL">{t('jam_management.musicians.options.all_levels')}</option>
                  <option value="BEGINNER">{t('schedule.levels.BEGINNER')}</option>
                  <option value="INTERMEDIATE">{t('schedule.levels.INTERMEDIATE')}</option>
                  <option value="ADVANCED">{t('schedule.levels.ADVANCED')}</option>
                  <option value="PROFESSIONAL">{t('schedule.levels.PROFESSIONAL')}</option>
                </select>
              </fieldset>
            </div>

            {/* Results count */}
            <div className="text-sm text-base-content/60 mt-2" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {t('jam_management.musicians.results_count', { shown: filteredMusicians.length, total: musicians.length })}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        ) : filteredMusicians.length === 0 ? (
          <div className="card bg-base-200">
            <div className="card-body text-center">
              <p className="text-base-content/60">
                {musicians.length === 0
                  ? t('jam_management.musicians.no_musicians')
                  : t('jam_management.musicians.no_match')}
              </p>
            </div>
          </div>
        ) : (
          /* Musicians Table */
          <div className="overflow-x-auto rounded-box">
            <table className="table table-zebra w-full bg-base-200">
              <thead>
                <tr className="bg-base-300">
                  <th>{t('jam_management.musicians.table.name')}</th>
                  <th>{t('jam_management.musicians.table.instrument')}</th>
                  <th>{t('jam_management.musicians.table.level')}</th>
                  <th>{t('jam_management.musicians.table.contact')}</th>
                  <th>{t('jam_management.musicians.table.phone')}</th>
                  <th>{t('jam_management.musicians.table.joined')}</th>
                  <th>{t('jam_management.musicians.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMusicians.map((musician) => (
                  <tr key={musician.id} className="hover">
                    <td className="font-semibold">{musician.name || '—'}</td>
                    <td>{musician.instrument || '—'}</td>
                    <td>
                      <span className={`badge ${getLevelBadgeClass(musician.level)}`}>
                        {formatLevel(musician.level, t)}
                      </span>
                    </td>
                    <td>{musician.contact || '—'}</td>
                    <td>{musician.phone || '—'}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {musician.createdAt ? dateFormatter.format(new Date(musician.createdAt)) : '—'}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => handleEditMusician(musician)}
                        aria-label={`${t('jam_management.musicians.actions.edit')} ${musician.name || ''}`}
                      >
                        {t('jam_management.musicians.actions.edit')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingMusician && (
        <EditMusicianModal
          musician={editingMusician}
          onSave={handleUpdateMusician}
          onClose={handleCloseEditModal}
        />
      )}
    </div>
  )
}

export default MusiciansPage
