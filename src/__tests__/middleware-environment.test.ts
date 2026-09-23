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

  it('serves WhatsApp the versioned approved brand image without client rendering', async () => {
    vi.stubEnv('SITE_URL', 'https://stage.jamapp.com.br')
    const response = middleware(new Request('https://stage.jamapp.com.br/', {
      headers: {'user-agent': 'WhatsApp/2.26'},
    }))
    expect(response).toBeInstanceOf(Response)
    const html = await (response as Response).text()
    expect(html).toContain('property="og:image" content="https://stage.jamapp.com.br/brand/v1/social-hybrid-1200x630.png"')
    expect(html).toContain('name="twitter:image" content="https://stage.jamapp.com.br/brand/v1/social-hybrid-1200x630.png"')
  })
})
