/**
 * Dynamic Sitemap Generator
 *
 * Runs after vite build to fetch all public jams from the API
 * and add their URLs to the sitemap.
 *
 * Usage: npx tsx scripts/generate-sitemap.ts
 */

const SITE_URL = process.env.VITE_SITE_URL || 'https://www.jamapp.com.br'
const API_URL = process.env.VITE_API_URL || 'https://karaoke-jam-backend.vercel.app'
const DIST_DIR = './dist'

interface JamResponse {
  id: string
  slug?: string | null
  name: string
  date?: string | null
  status: string
  deletedAt?: string | null
}

interface ApiResponse {
  data: JamResponse[] | { data: JamResponse[] }
  success: boolean
}

async function fetchPublicJams(): Promise<JamResponse[]> {
  try {
    const response = await fetch(`${API_URL}/jams?skip=0&take=500`)
    if (!response.ok) {
      console.warn(`API returned ${response.status} - using static sitemap only`)
      return []
    }
    const json: ApiResponse = await response.json()
    if (!json.success) return []

    // Handle both paginated and array responses
    const data = json.data
    if (Array.isArray(data)) return data
    if (data && 'data' in data && Array.isArray(data.data)) return data.data
    return []
  } catch (err) {
    console.warn('Failed to fetch jams from API:', (err as Error).message)
    return []
  }
}

function buildJamUrl(jam: JamResponse): string {
  const path = jam.slug ? `/jams/${jam.slug}` : `/jams/${jam.id}`
  return `${SITE_URL}${path}`
}

function generateUrlEntry(loc: string, options: {
  changefreq?: string
  priority?: number
  lastmod?: string
  hreflang?: boolean
} = {}): string {
  const { changefreq = 'weekly', priority = 0.6, lastmod, hreflang = true } = options
  const hreflangTags = hreflang ? `
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${loc}${loc.includes('?') ? '&' : '?'}lng=pt"/>
    <xhtml:link rel="alternate" hreflang="en" href="${loc}${loc.includes('?') ? '&' : '?'}lng=en"/>
    <xhtml:link rel="alternate" hreflang="es" href="${loc}${loc.includes('?') ? '&' : '?'}lng=es"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>` : ''

  return `
  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ''}${hreflangTags}
  </url>`
}

async function main() {
  const today = new Date().toISOString().split('T')[0]

  // Static pages
  const staticEntries = [
    generateUrlEntry(`${SITE_URL}/`, {
      changefreq: 'daily',
      priority: 1.0,
      lastmod: today,
    }),
    generateUrlEntry(`${SITE_URL}/jams`, {
      changefreq: 'daily',
      priority: 0.8,
      lastmod: today,
    }),
  ]

  // Dynamic jam pages
  const jams = await fetchPublicJams()

  // Keep FINISHED jams for 30 days after completion so recently-indexed URLs
  // remain in the sitemap and Google doesn't treat them as abandoned soft-404s.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const activeJams = jams.filter(j => {
    if (j.deletedAt) return false
    if (j.status !== 'FINISHED') return true
    // Include recently finished jams
    const jamDate = j.date ? new Date(j.date) : null
    return jamDate ? jamDate > thirtyDaysAgo : false
  })

  console.log(`Found ${activeJams.length} jams for sitemap (includes recently finished)`)

  const jamEntries = activeJams.map(jam => {
    const url = buildJamUrl(jam)
    const lastmod = jam.date ? jam.date.split('T')[0] : today
    const isFinished = jam.status === 'FINISHED'
    return generateUrlEntry(url, {
      changefreq: isFinished ? 'never' : 'weekly',
      priority: isFinished ? 0.3 : 0.6,
      lastmod,
    })
  })

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${staticEntries.join('\n')}
${jamEntries.join('\n')}
</urlset>
`

  const fs = await import('fs')
  const path = await import('path')
  const outputPath = path.resolve(DIST_DIR, 'sitemap.xml')
  fs.writeFileSync(outputPath, sitemap, 'utf-8')
  console.log(`Sitemap written to ${outputPath} with ${staticEntries.length + jamEntries.length} URLs`)
}

main().catch(console.error)
