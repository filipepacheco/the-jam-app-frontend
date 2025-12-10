/**
 * Service Testing Utilities
 * Helper functions and test data for testing services
 */

import type {
  CreateJamDto,
  CreateMusicDto,
  CreateMusicianDto,
  CreateRegistrationDto,
  CreateScheduleDto,
} from '../../types/api.types'

/**
 * Mock data for testing
 */
export const mockData = {
  /**
   * Mock jam creation data
   */
  createJamData: {
    name: 'Test Friday Jam',
    location: 'Test Music Hall',
    hostName: 'Test Host',
    hostContact: 'test@example.com',
    description: 'Test jam session',
    status: 'ACTIVE' as const,
  } as CreateJamDto,

  /**
   * Mock musician creation data
   */
  createMusicianData: {
    name: 'Test Musician',
    contact: '+1-555-0123',
    instrument: 'Guitar',
    level: 'INTERMEDIATE' as const,
  } as CreateMusicianDto,

  /**
   * Mock music creation data
   */
  createMusicData: {
    title: 'Test Song',
    artist: 'Test Artist',
    genre: 'Rock',
    duration: 180,
  } as CreateMusicDto,

  /**
   * Mock registration creation data
   * Note: musicianId and jamMusicId should be replaced with real IDs
   */
  createRegistrationData: {
    musicianId: 'test-musician-id',
    jamMusicId: 'test-jam-music-id',
  } as unknown as CreateRegistrationDto,

  /**
   * Mock schedule creation data
   * Note: registrationId should be replaced with real ID
   */
  createScheduleData: {
    jamId: 'test-jam-id',
    registrationId: 'test-registration-id',
    order: 1,
    status: 'SCHEDULED' as const,
  } as CreateScheduleDto,
}

/**
 * Mock responses matching API response format
 */
export const mockResponses = {
  jam: {
    data: {
      id: 'jam-123',
      nome: 'Test Friday Jam',
      descricao: 'Test jam session',
      data: '2025-12-06T19:00:00Z',
      qrCode: 'QRCODE123',
      status: 'ACTIVE',
      createdAt: '2025-12-06T10:00:00Z',
      updatedAt: '2025-12-06T10:00:00Z',
    },
    success: true,
  },

  musician: {
    data: {
      id: 'musician-123',
      nome: 'Test Musician',
      instrumento: 'Guitar',
      nivel: 'INTERMEDIATE',
      contato: '+1-555-0123',
      createdAt: '2025-12-06T10:00:00Z',
    },
    success: true,
  },

  music: {
    data: {
      id: 'music-123',
      titulo: 'Test Song',
      artista: 'Test Artist',
      genero: 'Rock',
      duracao: 180,
      createdAt: '2025-12-06T10:00:00Z',
    },
    success: true,
  },

  registration: {
    data: {
      id: 'registration-123',
      musicoId: 'musician-123',
      jamId: 'jam-123',
      jamMusicaId: 'jam-music-123',
      status: 'PENDING',
      createdAt: '2025-12-06T10:00:00Z',
      musico: {
        id: 'musician-123',
        nome: 'Test Musician',
        instrumento: 'Guitar',
        nivel: 'INTERMEDIATE',
        contato: '+1-555-0123',
        createdAt: '2025-12-06T10:00:00Z',
      },
    },
    success: true,
  },

  schedule: {
    data: {
      id: 'schedule-123',
      jamId: 'jam-123',
      ordem: 1,
      status: 'SCHEDULED',
      createdAt: '2025-12-06T10:00:00Z',
      inscricaoId: 'registration-123',
    },
    success: true,
  },
}

/**
 * Format test output for console display
 */
export function formatTestOutput(title: string, data: unknown): string {
  return `\n${'='.repeat(60)}\n📋 ${title}\n${'='.repeat(60)}\n${JSON.stringify(data, null, 2)}\n`
}

/**
 * Test result formatter
 */
export function formatResult(passed: boolean, message: string): string {
  const icon = passed ? '✅' : '❌'
  return `${icon} ${message}`
}

