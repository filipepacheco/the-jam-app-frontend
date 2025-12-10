/**
 * Authentication Service
 * Handles login/auto-register with email or phone
 */

import {getToken, setToken} from '../lib/auth'
import {getApiUrl} from '../lib/api/config'
import type {AuthUser} from '../types/auth.types'

interface LoginRequest {
  email?: string
  phone?: string
}

interface LoginResponse {
  userId: string
  name: string
  email: string
  phone: string
  role: 'user'
  token: string
  isNewUser?: boolean
}

interface LogoutResponse {
  success: boolean
}

interface ErrorResponse {
  statusCode: number
  error: string
  message: string
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
    const response = await fetch(getApiUrl('/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email || undefined,
        phone: phone ? cleanPhone(phone) : undefined,
      }),
    })

    if (!response.ok) {
      const error: ErrorResponse = await response.json()
      throw new Error(error.message || 'Login failed. Please try again.')
    }

    const data: LoginResponse = await response.json()

    // Store token
    setToken(data.token)

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
  const token = getToken()

  if (!token) {
    return
  }

  try {
    await fetch(getApiUrl('/auth/logout'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
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

