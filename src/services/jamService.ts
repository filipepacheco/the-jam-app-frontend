/**
 * Jam Service
 * Handles jam-related API calls
 */

import {apiClient, withLegacyResponse} from '../lib/api'
import type {JamResponseDto, PaginatedResponse} from '../types/api.types'

interface SpecialtySlot {
  specialty: string
  required: number
  registered: number
}

export interface JamDetails {
  id: string
  nome: string
  descricao?: string
  data?: string
  status: 'ACTIVE' | 'INACTIVE' | 'FINISHED'
  specialtySlots: SpecialtySlot[]
  hostId?: string
  hostName?: string
  songCount?: number
  musicianCount?: number
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
 * Returns raw data - not wrapped with withLegacyResponse
 */
export async function getJamDetails(jamId: string): Promise<JamDetails> {
  try {
    const response = await apiClient.get<JamDetails>(`/jams/${jamId}`)

    if (!response.success) {
      throw new Error(response.error || 'Failed to load jam details')
    }

    return response.data as JamDetails
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
    () => apiClient.delete<{ success: boolean }>(`/jams/${id}`),
    'Failed to delete jam',
  )
}
