/**
 * Site config: routes and crawler-facing metadata (JSON-LD structure), shared
 * across three runtimes - the browser bundle, Vercel Edge Middleware, and the
 * Node build scripts (prerender.ts, generate-sitemap.ts). Deliberately pure
 * TypeScript: no DOM, no React, no Node built-ins, no environment reads - every
 * value that legitimately differs per runtime (site URL, translated text) is a
 * parameter, not read internally. See docs/adr/0001-crawler-presentation-single-source.md.
 *
 * Human-readable title/description text is NOT unified here - middleware.ts
 * serves Portuguese-only text to bots, the client serves i18n-translated text
 * to real users. Only JSON-LD structure (schema types, field shape) unifies.
 */

// ============================================================================
// Routes
// ============================================================================

export type RouteKind =
  | 'home'
  | 'browse'
  | 'about'
  | 'jam-detail'
  | 'jam-dashboard'
  | 'jam-register'
  | 'short-code'
  | 'slug'
  | 'static'

export interface RouteDef {
  /** React-Router-style path pattern, e.g. '/jams/:jamId/dashboard' */
  pattern: string
  kind: RouteKind
  /** Visited by scripts/prerender.ts at build time */
  prerender?: boolean
  /** Included as a static entry in scripts/generate-sitemap.ts */
  sitemap?: boolean
}

/**
 * Every route App.tsx registers, except the catch-all 404. Single source for
 * middleware.ts's bot-routing, vercel.json's rewrites, prerender.ts's route
 * list, and generate-sitemap.ts's static entries. A build-time conformance
 * test asserts this list and App.tsx's <Routes> never disagree - the
 * mechanism that would have caught the historical /about indexing gap.
 */
export const ROUTES: RouteDef[] = [
  { pattern: '/', kind: 'home', prerender: true, sitemap: true },
  { pattern: '/jams', kind: 'browse', prerender: true, sitemap: true },
  { pattern: '/about', kind: 'about', prerender: true, sitemap: true },
  { pattern: '/login', kind: 'static', prerender: true },
  { pattern: '/register', kind: 'static', prerender: true },
  { pattern: '/auth/callback', kind: 'static' },
  { pattern: '/auth/spotify/callback', kind: 'static' },
  { pattern: '/j/:code', kind: 'short-code' },
  { pattern: '/jams/:jamId', kind: 'jam-detail' },
  { pattern: '/jams/:jamId/register', kind: 'jam-register' },
  { pattern: '/jams/:jamId/dashboard', kind: 'jam-dashboard' },
  { pattern: '/music', kind: 'static' },
  { pattern: '/profile', kind: 'static' },
  { pattern: '/musicians', kind: 'static' },
  { pattern: '/host/jams/:id/songs', kind: 'static' },
  { pattern: '/host/dashboard', kind: 'static' },
  { pattern: '/host/create-jam', kind: 'static' },
  { pattern: '/host/jams/:id/edit', kind: 'static' },
  { pattern: '/host/jams/:id/manage', kind: 'static' },
  { pattern: '/host/feedback', kind: 'static' },
  { pattern: '/:slug', kind: 'slug' },
]

/**
 * First path segment of every 'static' route (e.g. 'host' for
 * '/host/dashboard'), reserved so a bare namespace path like /host is never
 * mistaken for a jam slug - even though only its sub-paths are real routes.
 * Routes with their own matchRoute branch (home, browse, about, jam-detail,
 * jam-dashboard, jam-register, short-code) don't need this: they're
 * intercepted before the slug fallback runs at all.
 * Derived from ROUTES so it can't drift from the route list itself.
 */
export const RESERVED_SLUG_SEGMENTS: ReadonlySet<string> = new Set([
  ...ROUTES
    .filter((r) => r.kind === 'static')
    .map((r) => r.pattern.split('/')[1])
    .filter((segment): segment is string => Boolean(segment)),
  // Served as files/assets rather than app routes, so they have no ROUTES entry
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
  'og-image.jpg',
  // Reserved without a current route: keeps the path free for a future page and
  // stops a bot hitting /privacy from triggering a jam lookup for "privacy".
  'privacy',
])

export type RouteMatch =
  | { kind: 'home' }
  | { kind: 'browse' }
  | { kind: 'about' }
  | { kind: 'jam-detail'; identifier: string }
  | { kind: 'jam-dashboard'; identifier: string }
  | { kind: 'jam-register'; identifier: string }
  | { kind: 'short-code'; code: string }
  | { kind: 'slug'; slug: string }
  | null

/**
 * Classifies a pathname the same way ROUTES describes it. Used by
 * middleware.ts to decide what kind of bot-facing HTML to generate for a
 * request - not a general-purpose router (React Router owns real navigation).
 */
export function matchRoute(pathname: string): RouteMatch {
  if (pathname === '/') return { kind: 'home' }
  if (pathname === '/jams' || pathname === '/jams/') return { kind: 'browse' }
  if (pathname === '/about' || pathname === '/about/') return { kind: 'about' }

  const dashboardMatch = pathname.match(/^\/jams\/([^/]+)\/dashboard\/?$/)
  if (dashboardMatch) return { kind: 'jam-dashboard', identifier: dashboardMatch[1] }

  const registerMatch = pathname.match(/^\/jams\/([^/]+)\/register\/?$/)
  if (registerMatch) return { kind: 'jam-register', identifier: registerMatch[1] }

  const jamMatch = pathname.match(/^\/jams\/([^/]+)\/?$/)
  if (jamMatch) return { kind: 'jam-detail', identifier: jamMatch[1] }

  const shortMatch = pathname.match(/^\/j\/([^/]+)\/?$/)
  if (shortMatch) return { kind: 'short-code', code: shortMatch[1] }

  const slugMatch = pathname.match(/^\/([^/]+)\/?$/)
  if (slugMatch) {
    const segment = slugMatch[1]
    if (RESERVED_SLUG_SEGMENTS.has(segment)) return null
    if (segment.includes('.')) return null
    return { kind: 'slug', slug: segment }
  }

  return null
}

// ============================================================================
// Jam paths
// ============================================================================

/** Minimum a jam needs for its URL to be derivable. */
export interface JamLike {
  id: string
  slug?: string | null
  shortCode?: string | null
}

/**
 * Internal path for a jam detail page. Prefers the slug to the UUID for
 * SEO-friendly URLs. Lives here rather than in src/utils so the Edge
 * middleware and the Node build scripts can share one definition with the
 * browser bundle - all three build jam URLs.
 */
export function getJamPath(jam: JamLike): string {
  return `/jams/${jam.slug || jam.id}`
}

/** Internal path for a jam's public dashboard. */
export function getJamDashboardPath(jam: JamLike): string {
  return `/jams/${jam.slug || jam.id}/dashboard`
}

/** Short path for QR codes and manual typing; falls back to /jams/:id. */
export function getJamShortPath(jam: JamLike): string {
  if (jam.shortCode) return `/j/${jam.shortCode}`
  return `/jams/${jam.id}`
}

// ============================================================================
// JSON-LD builders
// ============================================================================

type JsonLd = Record<string, unknown>

/** Lean jam shape both the edge fetch and the client's richer object satisfy. */
export interface JamData {
  name: string
  description: string | null
  slug: string | null
  shortCode: string | null
  status: string
  hostName: string | null
  location: string | null
  date: string | null
}

const ORG_NAME = 'Jam App'
const ORG_ALT_NAME = 'The Jam App'

function ogImageUrl(siteUrl: string): string {
  return `${siteUrl}/og-image.jpg`
}

function organizationLogo(siteUrl: string) {
  return {
    '@type': 'ImageObject',
    url: `${siteUrl}/web/icons8-concert-color-512.png`,
    width: 512,
    height: 512,
  }
}

/** Languages the app supports - fixed, not per-request, so not a parameter. */
const SUPPORTED_LANGUAGES = ['pt-BR', 'en', 'es']

export interface HomeJsonLdContent {
  description: string
  /**
   * Organization.description - a distinct string from the page description in
   * the bot-facing copy, so it gets its own parameter rather than reusing
   * `description` (which would silently rewrite indexed text).
   */
  organizationDescription: string
  featureList: string[]
  /** This page's language - 'pt-BR' from middleware (always), the real user's current language from the client. */
  pageLanguage: string
}

export function buildHomeJsonLd(siteUrl: string, content: HomeJsonLdContent): JsonLd[] {
  const { description, organizationDescription, featureList, pageLanguage } = content
  return [
    {
      '@type': 'WebSite',
      name: ORG_NAME,
      alternateName: ORG_ALT_NAME,
      url: siteUrl,
      description,
      inLanguage: pageLanguage,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/jams?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebApplication',
      name: ORG_NAME,
      alternateName: ORG_ALT_NAME,
      url: siteUrl,
      description,
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      inLanguage: SUPPORTED_LANGUAGES,
      image: ogImageUrl(siteUrl),
      featureList,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'BRL',
        availability: 'https://schema.org/OnlineOnly',
      },
      author: {
        '@type': 'Organization',
        name: ORG_NAME,
        url: siteUrl,
      },
    },
    {
      '@type': 'Organization',
      name: ORG_NAME,
      alternateName: ORG_ALT_NAME,
      url: siteUrl,
      description: organizationDescription,
      logo: organizationLogo(siteUrl),
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        url: siteUrl,
      },
    },
  ]
}

/**
 * Human-readable breadcrumb labels. Passed in rather than hardcoded because
 * breadcrumb names are display text, which stays split per the ADR: middleware
 * passes Portuguese, the client passes i18n-translated strings.
 */
export interface BreadcrumbLabels {
  home: string
  browse: string
}

export interface BrowseJsonLdContent {
  /** CollectionPage name, e.g. 'Explorar Jam Sessions'. */
  name: string
  description: string
  /**
   * Both labels are supplied: the breadcrumb crumb for this page is often
   * shorter than `name` ('Jam Sessions' vs 'Explorar Jam Sessions'), and
   * reusing `name` for it silently rewrites already-indexed breadcrumb text.
   */
  breadcrumbs: BreadcrumbLabels
}

export function buildBrowseJsonLd(siteUrl: string, content: BrowseJsonLdContent): JsonLd[] {
  const { name, description, breadcrumbs } = content
  return [
    {
      '@type': 'CollectionPage',
      name,
      description,
      url: `${siteUrl}/jams`,
      isPartOf: {
        '@type': 'WebSite',
        name: ORG_NAME,
        url: siteUrl,
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: breadcrumbs.home, item: siteUrl },
        { '@type': 'ListItem', position: 2, name: breadcrumbs.browse, item: `${siteUrl}/jams` },
      ],
    },
  ]
}

export interface AboutJsonLdContent {
  /** Page name, e.g. 'Sobre o Jam App' - used for the AboutPage node. */
  name: string
  description: string
  contactEmail: string
  breadcrumbs: {
    home: string
    /** Breadcrumb label for this page, often shorter than `name` (e.g. 'Sobre'). */
    about: string
  }
}

export function buildAboutJsonLd(siteUrl: string, content: AboutJsonLdContent): JsonLd[] {
  const { name, description, contactEmail, breadcrumbs } = content
  return [
    {
      '@type': 'AboutPage',
      name,
      description,
      url: `${siteUrl}/about`,
      mainEntity: {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: ORG_NAME,
        alternateName: ORG_ALT_NAME,
        url: siteUrl,
        description,
        logo: organizationLogo(siteUrl),
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          email: contactEmail,
          availableLanguage: ['Portuguese', 'English', 'Spanish'],
        },
        areaServed: {
          '@type': 'Country',
          name: 'Brazil',
        },
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: breadcrumbs.home, item: siteUrl },
        { '@type': 'ListItem', position: 2, name: breadcrumbs.about, item: `${siteUrl}/about` },
      ],
    },
  ]
}

const JAM_EVENT_STATUS_MAP: Record<string, string> = {
  ACTIVE: 'https://schema.org/EventScheduled',
  INACTIVE: 'https://schema.org/EventPostponed',
  LIVE: 'https://schema.org/EventScheduled',
  FINISHED: 'https://schema.org/EventPast',
}

/**
 * MusicEvent JSON-LD for a jam page. startDate is required for Google Event
 * rich results, so when jam.date is missing this deliberately returns just a
 * breadcrumb (no MusicEvent) rather than publishing an incomplete one.
 */
export interface JamJsonLdContent {
  fallbackDescription: string
  breadcrumbs: BreadcrumbLabels
}

export function buildJamJsonLd(
  jam: JamData,
  canonicalUrl: string,
  siteUrl: string,
  content: JamJsonLdContent,
): JsonLd[] {
  const { fallbackDescription, breadcrumbs } = content

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: breadcrumbs.home, item: siteUrl },
      { '@type': 'ListItem', position: 2, name: breadcrumbs.browse, item: `${siteUrl}/jams` },
      { '@type': 'ListItem', position: 3, name: jam.name, item: canonicalUrl },
    ],
  }

  if (!jam.date) {
    return [breadcrumb]
  }

  const event: JsonLd = {
    '@type': 'MusicEvent',
    name: jam.name,
    url: canonicalUrl,
    description: jam.description ?? fallbackDescription,
    eventStatus: JAM_EVENT_STATUS_MAP[jam.status] ?? 'https://schema.org/EventScheduled',
    eventAttendanceMode: jam.location
      ? 'https://schema.org/OfflineEventAttendanceMode'
      : 'https://schema.org/OnlineEventAttendanceMode',
    image: ogImageUrl(siteUrl),
    organizer: {
      '@type': 'Organization',
      name: jam.hostName ?? ORG_NAME,
      url: siteUrl,
    },
    startDate: new Date(jam.date).toISOString(),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: canonicalUrl,
    },
    location: jam.location
      ? { '@type': 'Place', name: jam.location }
      : { '@type': 'VirtualLocation', url: canonicalUrl },
  }

  return [event, breadcrumb]
}
