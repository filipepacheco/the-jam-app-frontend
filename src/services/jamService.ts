/**
 * Jam Service
 * Handles jam-related API calls
 */

import {apiClient} from '../lib/api'
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

interface ApiResponse<T> {
  data: T
  status: number
}

/**
 * Fetch all jams from the API
 * @param skip - Number of records to skip (default: 0)
 * @param take - Number of records to return (default: 100)
 * @returns Promise with array of jams wrapped in ApiResponse
 */
export async function findAll(skip = 0, take = 100): Promise<ApiResponse<JamResponseDto[]>> {
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
      // New paginated response format
      jams = responseData.data
    } else if (Array.isArray(responseData)) {
      // Legacy array format (fallback)
      jams = responseData
    } else {
      jams = []
    }

    return {
      data: jams,
      status: 200,
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Connection error. Please try again.')
  }
}

/**
 * Fetch a single jam by ID
 * @param id - Jam ID
 * @returns Promise with jam wrapped in ApiResponse
 */
export async function findOne(id: string): Promise<ApiResponse<JamResponseDto>> {
  try {
    const response = await apiClient.get<JamResponseDto>(`/jams/${id}`)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to load jam')
    }

    return {
      data: response.data as JamResponseDto,
      status: 200,
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Connection error. Please try again.')
  }
}

/**
 * Create a new jam
 * @param jamData - Jam data to create
 * @returns Promise with created jam wrapped in ApiResponse
 */
export async function create(jamData: Partial<JamResponseDto>): Promise<ApiResponse<JamResponseDto>> {
  try {
    const response = await apiClient.post<JamResponseDto>('/jams', jamData)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to create jam')
    }

    return {
      data: response.data as JamResponseDto,
      status: 201,
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Connection error. Please try again.')
  }
}

/**
 * Get jam details by ID
 * @param jamId - Jam ID
 * @returns Jam details with specialty slots and availability
 * @throws Error with user-friendly message
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
 * Extracts specialty information with current availability
 * @param jamId - Jam ID
 * @returns Array of specialty slots
 */
export async function getJamSpecialties(jamId: string): Promise<SpecialtySlot[]> {
  const jam = await getJamDetails(jamId)
  return jam.specialtySlots
}

/**
 * Get most needed specialty for a jam
 * Returns the specialty with the most available slots
 * @param jamId - Jam ID
 * @returns Specialty name with most slots, or null if none available
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
 * @param id - Jam ID
 * @param jamData - Partial jam data to update
 * @returns Promise with updated jam
 */
export async function update(id: string, jamData: Partial<JamResponseDto>): Promise<ApiResponse<JamResponseDto>> {
  try {
    const response = await apiClient.patch<JamResponseDto>(`/jams/${id}`, jamData)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to update jam')
    }

    return {
      data: response.data as JamResponseDto,
      status: 200,
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Connection error. Please try again.')
  }
}

/**
 * Delete a jam
 * @param id - Jam ID
 * @returns Promise with confirmation
 */
export async function deleteFn(id: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    const response = await apiClient.delete<{ success: boolean }>(`/jams/${id}`)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete jam')
    }

    return {
      data: response.data || { success: true },
      status: 200,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    throw new Error(message)
  }
}

