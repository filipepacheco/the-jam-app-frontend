/**
 * Authentication Service
 * Handles login/auto-register with email or phone
 */

import {apiClient} from '../lib/api'
import type {AuthUser} from '../types/auth.types'

interface LoginResponse {
  userId: string
  name: string
  email: string
  phone: string
  role: 'user'
  token: string
  isNewUser?: boolean
}

/**
 * Login or auto-register with email or phone
 * @param email - User email (optional)
 * @param phone - User phone (optional)
 * @returns User data and token
 * @throws Error with user-friendly message
 */
export async function loginOrRegister(
  email?: string,
  phone?: string
): Promise<{ user: AuthUser; isNewUser: boolean; token: string }> {
  // Validate input
  if (!email && !phone) {
    throw new Error('Please provide an email or phone number')
  }

  if (email && !isValidEmail(email)) {
    throw new Error('Please enter a valid email address')
  }

  if (phone && !isValidPhone(phone)) {
    throw new Error('Please enter a valid phone number (10+ digits)')
  }

  try {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email: email || undefined,
      phone: phone ? cleanPhone(phone) : undefined,
    })

    if (!response.success) {
      throw new Error(response.error || 'Login failed. Please try again.')
    }

    const data = response.data as LoginResponse

    // Convert to AuthUser format
    const user: AuthUser = {
      id: data.userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: 'user',
      isHost: false,
    }

    return {
      user,
      token: data.token,
      isNewUser: data.isNewUser || false,
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Connection error. Please try again.')
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout', {})
  } catch (err) {
    console.error('Logout error:', err)
    // Proceed with client-side logout even if API call fails
  }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone format (10+ digits)
 */
function isValidPhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, '')
  return digitsOnly.length >= 10
}

/**
 * Clean phone number (remove non-digits)
 */
function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

