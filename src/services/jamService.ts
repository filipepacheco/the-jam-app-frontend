/**
 * Jam Service
 * Handles jam-related API calls
 */

import {apiClient, withLegacyResponse} from '../lib/api'
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

  // Sum up needed instrument counts from all jam musics
  for (const jm of jam.jamMusics ?? []) {
    const m = jm.music
    if (m.neededDrums) required['drums'] = (required['drums'] ?? 0) + m.neededDrums
    if (m.neededGuitars) required['guitars'] = (required['guitars'] ?? 0) + m.neededGuitars
    if (m.neededVocals) required['vocals'] = (required['vocals'] ?? 0) + m.neededVocals
    if (m.neededBass) required['bass'] = (required['bass'] ?? 0) + m.neededBass
    if (m.neededKeys) required['keys'] = (required['keys'] ?? 0) + m.neededKeys
  }

  // Count approved registrations per instrument
  for (const reg of jam.registrations ?? []) {
    if (reg.status === 'APPROVED' && reg.instrument) {
      const inst = reg.instrument.toLowerCase()
      registered[inst] = (registered[inst] ?? 0) + 1
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
 * Has custom pagination logic - not wrapped with withLegacyResponse
 */
export async function findAll(skip = 0, take = 100) {
  try {
    const response = await apiClient.get<PaginatedResponse<JamResponseDto> | JamResponseDto[]>(
      `/jams?skip=${skip}&take=${take}`
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to load jams')
    }

    // Handle both paginated response (new) and array response (legacy)
    const responseData = response.data
    let jams: JamResponseDto[]

    if (responseData && 'data' in responseData && 'meta' in responseData) {
      jams = responseData.data
    } else if (Array.isArray(responseData)) {
      jams = responseData
    } else {
      jams = []
    }

    return { data: jams, status: 200 }
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Connection error. Please try again.')
  }
}

/**
 * Fetch a single jam by ID
 */
export function findOne(id: string) {
  return withLegacyResponse(
    () => apiClient.get<JamResponseDto>(`/jams/${id}`),
    'Failed to load jam',
  )
}

/**
 * Create a new jam
 */
export function create(jamData: Partial<JamResponseDto>) {
  return withLegacyResponse(
    () => apiClient.post<JamResponseDto>('/jams', jamData),
    'Failed to create jam',
    201,
  )
}

/**
 * Get jam details by ID
 * Fetches the raw JamResponseDto and maps to JamDetails with computed specialty slots.
 */
export async function getJamDetails(jamId: string): Promise<JamDetails> {
  try {
    const response = await apiClient.get<JamResponseDto>(`/jams/${jamId}`)

    if (!response.success) {
      throw new Error(response.error || 'Failed to load jam details')
    }

    const jam = response.data as JamResponseDto
    return {
      id: jam.id,
      name: jam.name,
      description: jam.description,
      date: jam.date,
      status: jam.status,
      hostName: jam.hostName,
      specialtySlots: buildSpecialtySlots(jam),
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Connection error. Please try again.')
  }
}

/**
 * Get specialty slots for a jam
 */
export async function getJamSpecialties(jamId: string): Promise<SpecialtySlot[]> {
  const jam = await getJamDetails(jamId)
  return jam.specialtySlots
}

/**
 * Get most needed specialty for a jam
 */
export async function getMostNeededSpecialty(jamId: string): Promise<string | null> {
  const slots = await getJamSpecialties(jamId)

  const available = slots
    .map((slot) => ({
      specialty: slot.specialty,
      availableSlots: Math.max(0, slot.required - slot.registered),
    }))
    .filter((item) => item.availableSlots > 0)
    .sort((a, b) => b.availableSlots - a.availableSlots)

  return available.length > 0 ? available[0].specialty : null
}

/**
 * Update a jam
 */
export function update(id: string, jamData: Partial<JamResponseDto>) {
  return withLegacyResponse(
    () => apiClient.patch<JamResponseDto>(`/jams/${id}`, jamData),
    'Failed to update jam',
  )
}

/**
 * Delete a jam
 */
export function deleteFn(id: string) {
  return withLegacyResponse(
    () => apiClient.delete<JamResponseDto>(`/jams/${id}`),
    'Failed to delete jam',
  )
}
