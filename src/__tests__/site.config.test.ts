import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { ROUTES, matchRoute } from '../../site.config'

/**
 * Route conformance check: every path App.tsx registers must exist in the
 * shared ROUTES list, and vice versa. This is the mechanism that would have
 * caught the historical bug where /about was added to App.tsx but not to
 * middleware.ts's route table, causing a 3-day Googlebot indexing gap.
 *
 * Reads App.tsx as source text rather than rendering the router - this is a
 * conformance check on what routes are *declared*, not a behavioral test of
 * routing itself.
 */
describe('site.config ROUTES conformance', () => {
  const appTsxPath = resolve(import.meta.dirname, '../App.tsx')
  const appTsxSource = readFileSync(appTsxPath, 'utf-8')

  const appRoutePaths = Array.from(
    appTsxSource.matchAll(/<Route\s+path="([^"]+)"/g),
    (match) => match[1],
  ).filter((path) => path !== '*') // catch-all 404 isn't a real route to track

  it('finds at least one route in App.tsx (sanity check the regex still matches)', () => {
    expect(appRoutePaths.length).toBeGreaterThan(0)
  })

  it('has every App.tsx route path represented in ROUTES', () => {
    const routePatterns = new Set(ROUTES.map((r) => r.pattern))
    const missing = appRoutePaths.filter((path) => !routePatterns.has(path))
    expect(missing).toEqual([])
  })

  it('has every ROUTES pattern represented in App.tsx', () => {
    const appPathSet = new Set(appRoutePaths)
    const missing = ROUTES.map((r) => r.pattern).filter((pattern) => !appPathSet.has(pattern))
    expect(missing).toEqual([])
  })
})

describe('matchRoute', () => {
  it('matches home and browse', () => {
    expect(matchRoute('/')).toEqual({ kind: 'home' })
    expect(matchRoute('/jams')).toEqual({ kind: 'browse' })
    expect(matchRoute('/jams/')).toEqual({ kind: 'browse' })
  })

  it('matches about', () => {
    expect(matchRoute('/about')).toEqual({ kind: 'about' })
  })

  it('matches jam sub-routes before the bare jam-detail route', () => {
    expect(matchRoute('/jams/abc123/dashboard')).toEqual({ kind: 'jam-dashboard', identifier: 'abc123' })
    expect(matchRoute('/jams/abc123/register')).toEqual({ kind: 'jam-register', identifier: 'abc123' })
    expect(matchRoute('/jams/abc123')).toEqual({ kind: 'jam-detail', identifier: 'abc123' })
  })

  it('matches short codes', () => {
    expect(matchRoute('/j/xyz')).toEqual({ kind: 'short-code', code: 'xyz' })
  })

  it('matches an unreserved top-level segment as a slug', () => {
    expect(matchRoute('/my-jam-slug')).toEqual({ kind: 'slug', slug: 'my-jam-slug' })
  })

  it('does not treat reserved static route segments as slugs', () => {
    expect(matchRoute('/login')).toBeNull()
    expect(matchRoute('/musicians')).toBeNull()
    expect(matchRoute('/robots.txt')).toBeNull()
  })

  it('reserves every segment the pre-site.config middleware reserved', () => {
    // Guards against the derivation silently dropping a reserved path: any of
    // these resolving to a slug sends a bot into a jam lookup that 404s.
    const previouslyReserved = [
      'login', 'register', 'profile', 'music', 'musicians',
      'host', 'auth', 'privacy', 'robots.txt', 'sitemap.xml',
      'llms.txt', 'og-image.jpg',
    ]
    const leaked = previouslyReserved.filter((segment) => matchRoute(`/${segment}`) !== null)
    expect(leaked).toEqual([])
  })

  it('reserves a static route\'s namespace prefix even without a bare route at that exact path', () => {
    // /host has no route of its own - only /host/dashboard, /host/create-jam etc. -
    // but the bare path must still not be misread as a jam slug.
    expect(matchRoute('/host')).toBeNull()
    expect(matchRoute('/auth')).toBeNull()
  })

  it('does not treat a segment containing a dot as a slug', () => {
    expect(matchRoute('/sitemap.xml')).toBeNull()
    expect(matchRoute('/some.file.ext')).toBeNull()
  })

  it('returns null for unmatched multi-segment paths', () => {
    expect(matchRoute('/host/dashboard')).toBeNull()
  })
})
