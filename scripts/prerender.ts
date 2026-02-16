/**
 * Post-build Prerendering Script
 *
 * Serves the dist/ directory locally, visits each route with Puppeteer,
 * and saves the fully-rendered HTML back to disk.
 *
 * Usage: npx tsx scripts/prerender.ts
 */

import { createServer } from 'http'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, join, extname } from 'path'

const DIST_DIR = resolve(import.meta.dirname, '..', 'dist')
const PORT = 45678
const ROUTES = ['/', '/jams', '/login', '/register']
const NOINDEX_ROUTES = ['/login', '/register']

// Simple static file server for the dist directory
function startServer(): Promise<ReturnType<typeof createServer>> {
  return new Promise((res) => {
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.woff2': 'font/woff2',
      '.woff': 'font/woff',
      '.ttf': 'font/ttf',
    }

    const server = createServer((req, res2) => {
      let url = req.url || '/'
      // Strip query strings
      url = url.split('?')[0]
      let filePath = join(DIST_DIR, url)

      // If it's a directory or no extension, try index.html in that dir first
      if (!extname(filePath)) {
        const dirIndex = join(filePath, 'index.html')
        if (existsSync(dirIndex)) {
          filePath = dirIndex
        } else {
          filePath = join(DIST_DIR, 'index.html')
        }
      }

      try {
        const content = readFileSync(filePath)
        const ext = extname(filePath)
        res2.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' })
        res2.end(content)
      } catch {
        // Fallback to index.html for SPA routing
        const indexContent = readFileSync(join(DIST_DIR, 'index.html'))
        res2.writeHead(200, { 'Content-Type': 'text/html' })
        res2.end(indexContent)
      }
    })

    server.listen(PORT, () => {
      console.log(`Static server running on http://localhost:${PORT}`)
      res(server)
    })
  })
}

async function prerenderRoute(
  browser: import('puppeteer').Browser,
  route: string
): Promise<void> {
  const page = await browser.newPage()

  try {
    // Capture console errors for debugging
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    page.on('pageerror', err => {
      errors.push(err.message)
    })

    await page.goto(`http://localhost:${PORT}${route}`, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    // Wait for content to appear in #root
    const rendered = await page.waitForFunction(
      () => (document.querySelector('#root')?.children.length ?? 0) > 0,
      { timeout: 10000 }
    ).then(() => true).catch(() => false)

    if (!rendered) {
      console.warn(`  WARNING: #root empty for ${route}. Errors:`)
      errors.forEach(e => console.warn(`    ${e}`))
    }

    // Extra delay for async rendering to settle
    await new Promise(r => setTimeout(r, 1000))

    let html = await page.content()

    // Add noindex to auth pages
    if (NOINDEX_ROUTES.includes(route)) {
      html = html.replace('<head>', '<head><meta name="robots" content="noindex, nofollow" />')
    }

    // Determine output path
    const outputDir = route === '/' ? DIST_DIR : join(DIST_DIR, route)
    const outputPath = join(outputDir, 'index.html')

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    writeFileSync(outputPath, html, 'utf-8')
    const sizeKb = (Buffer.byteLength(html) / 1024).toFixed(1)
    console.log(`  Prerendered: ${route} -> ${sizeKb} KB ${rendered ? '(OK)' : '(EMPTY)'}`)
  } finally {
    await page.close()
  }
}

async function main() {
  console.log('Starting prerender...')
  console.log(`Dist directory: ${DIST_DIR}`)
  console.log(`Routes to prerender: ${ROUTES.join(', ')}`)

  // Verify dist exists
  if (!existsSync(join(DIST_DIR, 'index.html'))) {
    console.error('Error: dist/index.html not found. Run vite build first.')
    process.exit(1)
  }

  const server = await startServer()

  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.default.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  })

  try {
    for (const route of ROUTES) {
      await prerenderRoute(browser, route)
    }
    console.log(`\nPrerendering complete! ${ROUTES.length} routes processed.`)
  } finally {
    await browser.close()
    server.close()
  }
}

main().catch((err) => {
  console.error('Prerender failed (non-fatal):', err.message || err)
  console.error('The build will continue with non-prerendered HTML.')
  // Exit 0 so the build continues - prerendering is an enhancement, not a requirement
})
