import {afterEach, describe, expect, it, vi} from 'vitest'
import {readFileSync} from 'node:fs'
import {PNG} from 'pngjs'
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
    expect(html).toContain('property="og:image" content="https://stage.jamapp.com.br/brand/v1/social-hybrid-1200x630-v2.png"')
    expect(html).toContain('name="twitter:image" content="https://stage.jamapp.com.br/brand/v1/social-hybrid-1200x630-v2.png"')
  })
  it('gives Google the approved favicon and organization logo on an indexable homepage', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('SITE_URL', 'https://jamapp.com.br')
    const response = middleware(new Request('https://jamapp.com.br/', {
      headers: {'user-agent': 'Googlebot'},
    })) as Response
    const html = await response.text()
    const browserHtml = readFileSync('index.html', 'utf8')
    for (const document of [html, browserHtml]) {
      expect(document).toContain('href="/brand/v1/favicon-96.png"')
      expect(document).toContain('href="/brand/v1/apple-touch-icon.png"')
      expect(document).not.toContain('icons8-concert')
    }
    expect(response.headers.has('X-Robots-Tag')).toBe(false)
    const json = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)
    expect(json).not.toBeNull()
    const graph = JSON.parse(json![1])['@graph']
    expect(graph).toContainEqual(expect.objectContaining({
      '@type': 'Organization', logo: {
        '@type': 'ImageObject', url: 'https://jamapp.com.br/brand/v1/logo.svg',
      },
    }))
    const favicon = PNG.sync.read(readFileSync('public/brand/v1/favicon-96.png'))
    expect([favicon.width, favicon.height]).toEqual([96, 96])
    expect(readFileSync('public/brand/v1/logo.svg', 'utf8')).toContain('fill-rule="evenodd"')
  })

})
