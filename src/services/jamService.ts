/**
 * Jam Service
 * Handles jam-related API calls
 */

import {apiClient, unwrapResponse} from '../lib/api'
import i18n from '../i18n'
import type {JamResponseDto, JamStatus, PaginatedResponse} from '../types/api.types'

export interface SpecialtySlot {
  specialty: string
  required: number
  registered: number
}

export interface JamDetails {
  id: string
  name: string
  description?: string
  date?: string
  status: JamStatus
  hostId?: string
  hostName?: string
  songCount?: number
  musicianCount?: number
  specialtySlots: SpecialtySlot[]
}

/**
 * Build specialty slots from a JamResponseDto by examining neededX fields
 * on each music item and counting approved registrations per instrument.
 */
function buildSpecialtySlots(jam: JamResponseDto): SpecialtySlot[] {
  const required: Record<string, number> = {}
  const registered: Record<string, number> = {}

  // Sum up needed instrument counts and approved registrations from schedules
  for (const s of jam.schedules ?? []) {
    const m = s.music
    if (m?.neededDrums) required['drums'] = (required['drums'] ?? 0) + m.neededDrums
    if (m?.neededGuitars) required['guitars'] = (required['guitars'] ?? 0) + m.neededGuitars
    if (m?.neededVocals) required['vocals'] = (required['vocals'] ?? 0) + m.neededVocals
    if (m?.neededBass) required['bass'] = (required['bass'] ?? 0) + m.neededBass
    if (m?.neededKeys) required['keys'] = (required['keys'] ?? 0) + m.neededKeys

    for (const reg of s.registrations ?? []) {
      if (reg.status === 'APPROVED' && reg.instrument) {
        const inst = reg.instrument.toLowerCase()
        registered[inst] = (registered[inst] ?? 0) + 1
      }
    }
  }

  const allInstruments = new Set([...Object.keys(required), ...Object.keys(registered)])
  return Array.from(allInstruments).map((specialty) => ({
    specialty,
    required: required[specialty] ?? 0,
    registered: registered[specialty] ?? 0,
  }))
}

/**
 * Fetch all jams from the API
 * Has custom pagination logic - not wrapped with unwrapResponse (hand-rolled
 * success-check + try/catch, same shape unwrapResponse now centralizes).
 */
export async function findAll(skip = 0, take = 100): Promise<JamResponseDto[]> {
  const responseData = await unwrapResponse(
    () => apiClient.get<PaginatedResponse<JamResponseDto> | JamResponseDto[]>(
      `/jams?skip=${skip}&take=${take}`
    ),
    i18n.t('errors.generic_error'),
  )

  // Normalisation kept deliberately: the live API returns the array directly
  // (with pagination in the envelope's `meta`), but this also tolerates a
  // nested {data, meta} body rather than throwing on an unexpected shape.
  if (responseData && 'data' in responseData && 'meta' in responseData) {
    return responseData.data
  }
  if (Array.isArray(responseData)) {
    return responseData
  }
  return []
}

/**
 * Fetch a single jam by ID
 */
export function findOne(id: string): Promise<JamResponseDto> {
  return unwrapResponse(
    () => apiClient.get<JamResponseDto>(`/jams/${id}`),
    i18n.t('errors.failed_to_load_jam'),
  )
}

/**
 * Create a new jam
 */
export function create(jamData: Partial<JamResponseDto>): Promise<JamResponseDto> {
  return unwrapResponse(
    () => apiClient.post<JamResponseDto>('/jams', jamData),
    'Failed to create jam',
  )
}

/**
 * Get jam details by ID
 * Fetches the raw JamResponseDto and maps to JamDetails with computed specialty slots.
 */
export async function getJamDetails(jamId: string): Promise<JamDetails> {
  const jam = await unwrapResponse(
    () => apiClient.get<JamResponseDto>(`/jams/${jamId}`),
    i18n.t('errors.failed_to_load_jam'),
  )

  return {
    id: jam.id,
    name: jam.name,
    description: jam.description,
    date: jam.date,
    status: jam.status,
    hostName: jam.hostName,
    specialtySlots: buildSpecialtySlots(jam),
  }
}

/**
 * Update a jam
 */
export function update(id: string, jamData: Partial<JamResponseDto>): Promise<JamResponseDto> {
  return unwrapResponse(
    () => apiClient.patch<JamResponseDto>(`/jams/${id}`, jamData),
    'Failed to update jam',
  )
}

/**
 * Delete a jam
 */
export function deleteFn(id: string): Promise<JamResponseDto> {
  return unwrapResponse(
    () => apiClient.delete<JamResponseDto>(`/jams/${id}`),
    'Failed to delete jam',
  )
}
