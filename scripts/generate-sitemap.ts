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
  data: JamResponse[]
  meta: { total: number; skip: number; take: number; hasMore: boolean }
}

async function fetchPublicJams(): Promise<JamResponse[]> {
  const PAGE_SIZE = 100
  const all: JamResponse[] = []
  let skip = 0

  try {
    while (true) {
      const response = await fetch(`${API_URL}/jams?skip=${skip}&take=${PAGE_SIZE}`)
      if (!response.ok) {
        console.warn(`API returned ${response.status} - using static sitemap only`)
        return []
      }
      const json: ApiResponse = await response.json()

      if (!Array.isArray(json.data)) {
        console.warn(`Unexpected response shape: ${JSON.stringify(json).slice(0, 200)}`)
        return []
      }

      all.push(...json.data)

      if (!json.meta?.hasMore) break
      skip += PAGE_SIZE
    }
  } catch (err) {
    console.warn('Failed to fetch jams from API:', (err as Error).message)
    return []
  }

  return all
}

function buildJamUrl(jam: JamResponse): string {
  const path = jam.slug ? `/jams/${jam.slug}` : `/jams/${jam.id}`
  return `${SITE_URL}${path}`
}

function generateUrlEntry(loc: string, options: {
  lastmod?: string
} = {}): string {
  const { lastmod } = options
  return `
  <url>
    <loc>${loc}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ''}
  </url>`
}

async function main() {
  const today = new Date().toISOString().split('T')[0]

  // Static pages (canonical URLs only, no hreflang - SPA serves same content regardless of ?lng=)
  const staticEntries = [
    generateUrlEntry(`${SITE_URL}/`, { lastmod: today }),
    generateUrlEntry(`${SITE_URL}/jams`, { lastmod: today }),
    generateUrlEntry(`${SITE_URL}/about`, { lastmod: today }),
  ]

  // Dynamic jam pages
  const jams = await fetchPublicJams()
  console.log(`Fetched ${jams.length} total jams from API`)

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
    return generateUrlEntry(url, { lastmod })
  })

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
