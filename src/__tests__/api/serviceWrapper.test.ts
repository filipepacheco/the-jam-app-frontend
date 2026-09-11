import { describe, expect, it } from 'vitest'
import { unwrapResponse, unwrapPaginatedResponse } from '../../lib/api/serviceWrapper'
import i18n from '../../i18n'
import type { ApiResponse } from '../../types/api.types'

describe('unwrapResponse', () => {
  it('returns the data directly, not wrapped, on success', async () => {
    const result = await unwrapResponse(async () => ({
      success: true,
      data: { id: '1' },
    } as ApiResponse<{ id: string }>))

    expect(result).toEqual({ id: '1' })
  })

  it('throws with the backend-provided error message when success is false', async () => {
    await expect(
      unwrapResponse(async () => ({
        success: false,
        error: 'Backend said no',
      } as ApiResponse<unknown>))
    ).rejects.toThrow('Backend said no')
  })

  it('throws with the explicit defaultError when success is false and the backend gives no message', async () => {
    await expect(
      unwrapResponse(
        async () => ({ success: false } as ApiResponse<unknown>),
        'Failed to load jam'
      )
    ).rejects.toThrow('Failed to load jam')
  })

  it('falls back to the localized generic_error key when success is false and no defaultError is passed', async () => {
    await expect(
      unwrapResponse(async () => ({ success: false } as ApiResponse<unknown>))
    ).rejects.toThrow(i18n.t('errors.generic_error'))
  })

  it('rethrows Error instances raised by the apiCall unchanged', async () => {
    await expect(
      unwrapResponse(async () => {
        throw new Error('network exploded')
      })
    ).rejects.toThrow('network exploded')
  })

  it('converts non-Error rejections into the localized connection error', async () => {
    await expect(
      unwrapResponse(async () => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw 'not an Error instance'
      })
    ).rejects.toThrow(i18n.t('errors.connection_error'))
  })
})

describe('unwrapPaginatedResponse', () => {
  it('returns {data, meta} on success', async () => {
    const meta = { total: 2, skip: 0, take: 20, hasMore: false }
    const result = await unwrapPaginatedResponse(async () => ({
      success: true,
      data: [{ id: '1' }, { id: '2' }],
      meta,
    } as ApiResponse<{ id: string }[]>))

    expect(result).toEqual({ data: [{ id: '1' }, { id: '2' }], meta })
  })

  it('throws on success:false with the same message priority as unwrapResponse', async () => {
    await expect(
      unwrapPaginatedResponse(async () => ({
        success: false,
        error: 'Pagination backend error',
      } as ApiResponse<unknown[]>))
    ).rejects.toThrow('Pagination backend error')
  })
})
