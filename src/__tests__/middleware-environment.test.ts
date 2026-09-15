import {afterEach, describe, expect, it, vi} from 'vitest'
import middleware from '../../middleware'

const googlebotRequest = () => new Request('https://staging.jamapp.com.br/', {
  headers: {'user-agent': 'Googlebot'},
})

describe('Vercel middleware environment headers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('prevents indexing outside production', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')

    const response = middleware(googlebotRequest())

    expect(response).toBeInstanceOf(Response)
    expect((response as Response).headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
  })

  it('keeps production crawler responses indexable', () => {
    vi.stubEnv('VERCEL_ENV', 'production')

    const response = middleware(googlebotRequest())

    expect(response).toBeInstanceOf(Response)
    expect((response as Response).headers.has('X-Robots-Tag')).toBe(false)
  })
})
