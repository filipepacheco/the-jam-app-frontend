/**
 * API Configuration
 * Central place to configure API endpoints and settings
 */

// Backend API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

/**
 * Site URL for canonical links, SEO, and social sharing.
 * Uses VITE_SITE_URL env var with production fallback.
 */
export const SITE_URL: string = import.meta.env.VITE_SITE_URL || 'https://www.jamapp.com.br'

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
    logout: '/auth/logout',
    me: '/auth/me',
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
  // Note: Reorder now uses /jams/:id/control/reorder via jamControlService

  // Feedback endpoint
  feedback: '/feedback',

  // Spotify integration endpoints
  spotify: {
    import: '/spotify/import',
    export: '/spotify/export',
    track: '/spotify/track',
  },
}


