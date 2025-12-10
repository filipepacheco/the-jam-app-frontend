/**
 * Jam Service
 * Handles jam-related API calls
 */

import {getToken} from '../lib/auth'
import {getApiUrl} from '../lib/api/config'
import type {JamResponseDto} from '../types/api.types'

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

interface ErrorResponse {
  statusCode: number
  error: string
  message: string
}

interface ApiResponse<T> {
  data: T
  status: number
}

/**
 * Fetch all jams from the API
 * @returns Promise with array of jams wrapped in ApiResponse
 */
export async function findAll(): Promise<ApiResponse<JamResponseDto[]>> {
  const token = getToken()

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(getApiUrl('/jams'), {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const error: ErrorResponse = await response.json()
      throw new Error(error.message || 'Failed to load jams')
    }

    const data: JamResponseDto[] = await response.json()

    return {
      data,
      status: response.status,
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
  const token = getToken()

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(getApiUrl(`/jams/${id}`), {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Jam not found')
      }
      const error: ErrorResponse = await response.json()
      throw new Error(error.message || 'Failed to load jam')
    }

    const data: JamResponseDto = await response.json()

    return {
      data,
      status: response.status,
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
  const token = getToken()

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(getApiUrl('/jams'), {
      method: 'POST',
      headers,
      body: JSON.stringify(jamData),
    })

    if (!response.ok) {
      const error: ErrorResponse = await response.json()
      throw new Error(error.message || 'Failed to create jam')
    }

    const data: JamResponseDto = await response.json()

    return {
      data,
      status: response.status,
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
  const token = getToken()

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(getApiUrl(`/jams/${jamId}`), {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Jam not found')
      }
      const error: ErrorResponse = await response.json()
      throw new Error(error.message || 'Failed to load jam details')
    }

    const data: JamDetails = await response.json()

    return data
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
 * Get available slots for a specific specialty
 * @param jamId - Jam ID
 * @param specialty - Specialty name
 * @returns Number of available slots
 */
export async function getAvailableSlots(jamId: string, specialty: string): Promise<number> {
  const slots = await getJamSpecialties(jamId)
  const slot = slots.find((s) => s.specialty.toLowerCase() === specialty.toLowerCase())

  if (!slot) {
    return 0
  }

  return Math.max(0, slot.required - slot.registered)
}

/**
 * Check if specialty has available slots
 * @param jamId - Jam ID
 * @param specialty - Specialty name
 * @returns True if slots available
 */
export async function hasAvailableSlots(jamId: string, specialty: string): Promise<boolean> {
  const available = await getAvailableSlots(jamId, specialty)
  return available > 0
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
  const token = getToken()

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(getApiUrl(`/jams/${id}`), {
      method: 'PATCH',
      headers,
      body: JSON.stringify(jamData),
    })

    if (!response.ok) {
      const error: ErrorResponse = await response.json()
      throw new Error(error.message || 'Failed to update jam')
    }

    const data: JamResponseDto = await response.json()

    return {
      data,
      status: response.status,
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
  const token = getToken()

  try {
    const response = await fetch(getApiUrl(`/jams/${id}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      const error: ErrorResponse = await response.json()
      throw new Error(error.message || 'Failed to delete jam')
    }

    return {
      data: { success: true },
      status: response.status,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    throw new Error(message)
  }
}
