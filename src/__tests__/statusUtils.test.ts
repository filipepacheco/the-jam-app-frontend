import {describe, expect, it} from 'vitest'

import {getJamStatusTone} from '../lib/statusUtils.ts'
import type {JamStatus} from '../types/api.types.ts'

describe('getJamStatusTone', () => {
  it.each<[JamStatus, 'info' | 'neutral' | 'success' | 'warning']>([
    ['ACTIVE', 'info'],
    ['FINISHED', 'neutral'],
    ['INACTIVE', 'warning'],
    ['LIVE', 'success'],
  ])('projects %s to the shared %s tone', (status, tone) => {
    expect(getJamStatusTone(status)).toBe(tone)
  })

  it('falls back to neutral for a status introduced before the frontend is updated', () => {
    expect(getJamStatusTone('PAUSED' as JamStatus)).toBe('neutral')
  })
})
