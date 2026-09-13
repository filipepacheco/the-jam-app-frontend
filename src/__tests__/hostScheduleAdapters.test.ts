import {describe, expect, it, vi} from 'vitest'
import type {JamResponseDto} from '../types/api.types'

const services = vi.hoisted(() => ({
  updateJamMusic: vi.fn(),
  updatePerformance: vi.fn(),
  createPerformance: vi.fn(),
  removePerformance: vi.fn(),
  updateRegistration: vi.fn(),
  removeRegistration: vi.fn(),
}))

vi.mock('../services', () => ({
  musicService: {updateJamMusic: services.updateJamMusic},
  scheduleService: {
    update: services.updatePerformance,
    create: services.createPerformance,
    remove: services.removePerformance,
  },
  registrationService: {
    update: services.updateRegistration,
    remove: services.removeRegistration,
  },
}))

import {createHostScheduleOperationsAdapter} from '../lib/schedule/hostScheduleAdapters'

const jam: JamResponseDto = {
  id: 'jam-1',
  name: 'Test jam',
  hostName: 'Host',
  status: 'ACTIVE',
  createdAt: '2026-09-24T18:00:00.000Z',
  updatedAt: '2026-09-24T18:00:00.000Z',
  schedules: [],
  jamMusics: [],
}

describe('Host Schedule production operations adapter', () => {
  it('maps a resolved API failure to a controller failure', async () => {
    services.updateJamMusic.mockResolvedValue({success: false, data: null, error: 'Not allowed'})
    const operations = createHostScheduleOperationsAdapter(vi.fn().mockResolvedValue(jam))

    await expect(operations.updateNotes({
      jamId: 'jam-1',
      jamMusicId: 'jam-music-1',
      notes: 'Lower key',
    })).resolves.toEqual({ok: false, error: {message: 'Not allowed'}})
  })

  it('maps refreshed backend data into an authoritative controller snapshot', async () => {
    const operations = createHostScheduleOperationsAdapter(vi.fn().mockResolvedValue(jam))

    await expect(operations.refresh('jam-1')).resolves.toEqual({
      ok: true,
      snapshot: {jamId: 'jam-1', performances: []},
    })
  })
})
