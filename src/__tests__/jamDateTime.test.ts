import {afterEach, describe, expect, it, vi} from 'vitest'
import {jamDateTimeToForm, jamFormToDateTime} from '../lib/jamDateTime'

afterEach(() => vi.unstubAllEnvs())

describe('Jam date and time conversion', () => {
  it('round trips a host-entered evening time through an ISO API timestamp', () => {
    vi.stubEnv('TZ', 'America/Sao_Paulo')

    const timestamp = jamFormToDateTime('2026-09-24', '20:00')

    expect(timestamp).toBe('2026-09-24T23:00:00.000Z')
    expect(jamDateTimeToForm(timestamp)).toEqual({date: '2026-09-24', time: '20:00'})
  })

  it('retains the local calendar date when UTC is already on the next day', () => {
    vi.stubEnv('TZ', 'America/Sao_Paulo')

    expect(jamDateTimeToForm('2026-09-25T02:30:00.000Z')).toEqual({date: '2026-09-24', time: '23:30'})
  })
})
