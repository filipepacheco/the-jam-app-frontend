/**
 * Musicians Page
 * Displays all musicians in the system with search, filter, and edit capabilities
 * Visible only to hosts
 */

import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useAuth} from '../hooks'
import {musicianService} from '../services'
import type {MusicianLevel, MusicianResponseDto} from '../types/api.types'
import {EditMusicianModal} from '../components/EditMusicianModal'
import {ErrorAlert, SuccessAlert} from '../components'
import {useTranslation} from 'react-i18next'

export function MusiciansPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
   const { user, isLoading: authLoading } = useAuth()

   // State
   const [musicians, setMusicians] = useState<MusicianResponseDto[]>([])
   const [filteredMusicians, setFilteredMusicians] = useState<MusicianResponseDto[]>([])
   const [searchQuery, setSearchQuery] = useState('')
   const [selectedLevel, setSelectedLevel] = useState<MusicianLevel | 'ALL'>('ALL')
   const [editingMusician, setEditingMusician] = useState<MusicianResponseDto | null>(null)
   const [isLoading, setIsLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)
   const [success, setSuccess] = useState<string | null>(null)

   // Role guard - redirect if not host
   useEffect(() => {
     if (!authLoading && !user?.isHost) {
       navigate('/')
     }
   }, [user?.isHost, authLoading, navigate])

   // Fetch all musicians on mount
   useEffect(() => {
     const fetchMusicians = async () => {
       setIsLoading(true)
       setError(null)

       try {
         const result = await musicianService.findAll()
         setMusicians(result.data ?? [])
         setFilteredMusicians(result.data ?? [])
       } catch (err) {
        setError(err instanceof Error ? err.message : t('jam_management.musicians.failed_to_load'))
       } finally {
         setIsLoading(false)
       }
     }

     if (user?.isHost) {
       fetchMusicians()
     }
   }, [user?.isHost])

   // Apply search and filter
   useEffect(() => {
     let filtered = musicians

     // Apply search filter
     if (searchQuery.trim()) {
       const query = searchQuery.toLowerCase()
       filtered = filtered.filter(
         (m) =>
           m.name.toLowerCase().includes(query) ||
           m.instrument.toLowerCase().includes(query) ||
           (m.contact?.toLowerCase().includes(query) ?? false)
       )
     }

     // Apply level filter
     if (selectedLevel !== 'ALL') {
       filtered = filtered.filter((m) => m.level === selectedLevel)
     }

     setFilteredMusicians(filtered)
   }, [searchQuery, selectedLevel, musicians])

   const handleEditMusician = (musician: MusicianResponseDto) => {
     setEditingMusician(musician)
   }

   const handleUpdateMusician = async (updatedMusician: MusicianResponseDto) => {
     try {
       await musicianService.update(updatedMusician.id, {
         name: updatedMusician.name,
         instrument: updatedMusician.instrument,
         level: updatedMusician.level,
         contact: updatedMusician.contact,
       })

       // Update local state
       setMusicians((prev) =>
         prev.map((m) => (m.id === updatedMusician.id ? updatedMusician : m))
       )

      setSuccess(t('jam_management.musicians.update_success'))
       setEditingMusician(null)

       // Clear success message after 3 seconds
       setTimeout(() => setSuccess(null), 3000)
     } catch (err) {
      setError(err instanceof Error ? err.message : t('jam_management.musicians.update_failed'))
     }
   }

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
     // Show a small loader until translations are ready to avoid i18next missingKey logs
     return (
       <div className="min-h-screen flex items-center justify-center bg-base-100">
         <div className="loading loading-spinner loading-lg"></div>
       </div>
     )
   }

   if (authLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-base-100">
         <div className="loading loading-spinner loading-lg"></div>
       </div>
     )
   }

   if (!user?.isHost) {
     return null
   }

   return (
     <div className="min-h-screen bg-base-100 p-4 md:p-8">
       <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🎵 {t('jam_management.musicians.title')}</h1>
          <p className="text-base-content/70">{t('jam_management.musicians.subtitle')}</p>
        </div>

        {/* Alerts */}
        {error && <ErrorAlert message={error} title={t('common.error')} />}
        {success && <SuccessAlert message={success} title={t('common.success')} />}

        {/* Search and Filter Bar */}
        <div className="card bg-base-200 mb-6">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Input */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">{t('jam_management.musicians.search_label')}</span>
                </label>
                <input
                  type="text"
                  placeholder={t('jam_management.musicians.search_placeholder')}
                  className="input input-bordered"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Level Filter */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">{t('jam_management.musicians.filter_label')}</span>
                </label>
                <select
                  className="select select-bordered"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value as MusicianLevel | 'ALL')}
                >
                  <option value="ALL">{t('jam_management.musicians.options.all_levels')}</option>
                  <option value="BEGINNER">{t('schedule.levels.BEGINNER')}</option>
                  <option value="INTERMEDIATE">{t('schedule.levels.INTERMEDIATE')}</option>
                  <option value="ADVANCED">{t('schedule.levels.ADVANCED')}</option>
                  <option value="PROFESSIONAL">{t('schedule.levels.PROFESSIONAL')}</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="text-sm text-base-content/70 mt-4">
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
              <p className="text-base-content/70">
                {musicians.length === 0
                  ? t('jam_management.musicians.no_musicians')
                  : t('jam_management.musicians.no_match')}
              </p>
            </div>
          </div>
        ) : (
          /* Musicians Table */
          <div className="overflow-x-auto">
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
                    <td className="font-semibold">{musician.name}</td>
                    <td>{musician.instrument}</td>
                    <td>
                      <div className="badge badge-primary">
                        {t(`schedule.levels.${musician.level}`)}
                      </div>
                    </td>
                    <td>{musician.contact}</td>
                    <td>{musician.phone || '—'}</td>
                    <td>{new Date(musician.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => handleEditMusician(musician)}
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
