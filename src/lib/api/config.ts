/**
 * API Configuration
 * Central place to configure API endpoints and settings
 */

// Backend API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

/**
 * API Configuration object
 * Contains base URL and timeout settings
 */
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
}

/**
 * API Endpoints
 * Maps all API endpoints used throughout the application
 */
export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    refreshToken: '/auth/refresh',
  },

  // Jams endpoints
  jams: {
    list: '/jams',
    detail: (id: string) => `/jams/${id}`,
    create: '/jams',
    update: (id: string) => `/jams/${id}`,
    delete: (id: string) => `/jams/${id}`,
  },

  // Musicians (Músicos) endpoints
  musicians: '/musicos',
  musicianById: (id: string) => `/musicos/${id}`,

  // Music/Songs (Músicas) endpoints
  music: '/musicas',
  musicById: (id: string) => `/musicas/${id}`,
  linkMusicToJam: (musicId: string, jamId: string) => `/musicas/${musicId}/link-jam/${jamId}`,

  // Registrations (Inscrições) endpoints
  registrations: '/inscricoes',
  registrationById: (id: string) => `/inscricoes/${id}`,
  // Schedules (Escalas) endpoints
  schedules: '/escalas',
  scheduleById: (id: string) => `/escalas/${id}`,
  reorderSchedules: (jamId: string) => `/escalas/jam/${jamId}/reorder`,
}

/**
 * Helper function to get API base URL
 * @returns API base URL
 */
export function getApiBaseUrl(): string {
  return API_CONFIG.baseURL
}

/**
 * Validate that required environment variables are set
 * @throws Error if VITE_API_URL is invalid
 */
export function validateEnvironment(): void {
  if (!API_CONFIG.baseURL) {
    throw new Error('API_BASE_URL is not configured. Please set VITE_API_URL environment variable.')
  }
}

export { API_BASE_URL }

