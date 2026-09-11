/**
 * Sync/verify derived config that must stay in step with the app's actual output.
 *
 * Currently: the CSP `script-src` hashes in vercel.json must match the SHA-256
 * of every inline <script> in index.html. These are two representations of the
 * same thing in two files, with nothing connecting them - they silently drifted
 * once already (the anti-FOUC theme script was edited, the hash was not, and
 * CSP blocked the very script it exists to allow).
 *
 * Usage:
 *   npx tsx scripts/sync-site-config.ts          # rewrite vercel.json
 *   npx tsx scripts/sync-site-config.ts --check  # verify only, non-zero exit on drift
 *
 * Verification is deliberately separate from generation: CI checks and fails,
 * a developer regenerates locally and commits the reviewed diff. An
 * auto-rewriting build would let the shipped file differ from the one in git.
 */

import { createHash } from 'crypto'
import { existsSync, readFileSync, statSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { ROUTES as ROUTE_DEFS } from '../site.config'

const ROOT = resolve(import.meta.dirname, '..')
const SOURCE_INDEX = resolve(ROOT, 'index.html')
const BUILT_INDEX = resolve(ROOT, 'dist', 'index.html')
const VERCEL_JSON = resolve(ROOT, 'vercel.json')

const checkOnly = process.argv.includes('--check')

/**
 * Prefer the built index.html - it is literally what ships - and fall back to
 * the source when there is no build yet (so CI can verify without building
 * first). Vite currently emits the inline script byte-identically, so the two
 * agree; if a future plugin ever transforms it, the built file wins.
 */
function readIndexHtml(): { html: string; from: string; stale: boolean } {
  const source = readFileSync(SOURCE_INDEX, 'utf-8')
  if (!existsSync(BUILT_INDEX)) {
    return { html: source, from: 'index.html (no build found)', stale: false }
  }

  const built = readFileSync(BUILT_INDEX, 'utf-8')
  // A dist/ older than index.html means the build predates the current source,
  // so hashing it would bake in a hash for a script that no longer ships.
  const stale = statSync(BUILT_INDEX).mtimeMs < statSync(SOURCE_INDEX).mtimeMs
  return { html: built, from: 'dist/index.html', stale }
}

/**
 * Types the HTML spec treats as executable JavaScript. Anything else - most
 * importantly `application/ld+json`, which react-helmet injects for structured
 * data - is a data block: never executed, so never gated by a script-src hash.
 * Hashing those would also guarantee false drift, since the JSON-LD content
 * changes per page and per language.
 */
const EXECUTABLE_SCRIPT_TYPES = new Set(['', 'module', 'text/javascript', 'application/javascript'])

/** SHA-256 of every inline, executable <script> block, in CSP hash-source format. */
function inlineScriptHashes(html: string): string[] {
  const matches = html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)
  return Array.from(matches)
    .filter((m) => {
      const type = m[1].match(/\btype\s*=\s*["']([^"']*)["']/)?.[1].trim().toLowerCase() ?? ''
      return EXECUTABLE_SCRIPT_TYPES.has(type)
    })
    .map((m) => {
      const digest = createHash('sha256').update(m[2], 'utf-8').digest('base64')
      return `sha256-${digest}`
    })
}

interface VercelConfig {
  headers?: { source: string; headers: { key: string; value: string }[] }[]
  rewrites?: { source: string; destination: string }[]
  [key: string]: unknown
}

/**
 * A rewrite source like '/host/:path*' as a regex. Vercel's `:param` matches a
 * single segment, `:param*` matches one or more.
 */
function rewriteSourceToRegex(source: string): RegExp {
  const pattern = source
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':') && segment.endsWith('*')) return '.+'
      if (segment.startsWith(':')) return '[^/]+'
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    })
    .join('/')
  return new RegExp(`^${pattern}$`)
}

/** A concrete sample path for a route pattern, e.g. '/jams/:jamId' -> '/jams/_'. */
function samplePath(pattern: string): string {
  return pattern.replace(/:[A-Za-z0-9_]+\*?/g, '_')
}

/**
 * Every route the SPA serves needs a vercel.json rewrite to index.html, or a
 * direct visit / hard refresh 404s instead of loading the app. Verified rather
 * than generated: the hand-written wildcards ('/host/:path*') intentionally
 * collapse many routes into one rewrite, which a generator would flatten.
 */
function routesMissingRewrites(config: VercelConfig): string[] {
  const regexes = (config.rewrites ?? []).map((r) => rewriteSourceToRegex(r.source))
  return ROUTE_DEFS
    .filter((route) => route.pattern !== '/') // '/' is served directly, no rewrite needed
    .filter((route) => !regexes.some((re) => re.test(samplePath(route.pattern))))
    .map((route) => route.pattern)
}

function findCspHeader(config: VercelConfig) {
  for (const entry of config.headers ?? []) {
    for (const header of entry.headers) {
      if (header.key === 'Content-Security-Policy') return header
    }
  }
  return null
}

/**
 * Swap the sha256 tokens inside the script-src directive, editing the raw file
 * text in place. Deliberately NOT a JSON.parse/stringify round-trip: that
 * reformats every hand-written line in vercel.json, burying a one-token change
 * in a hundred lines of whitespace churn no reviewer can read past.
 */
function withScriptSrcHashes(rawJson: string, cspValue: string, hashes: string[]): string {
  // Anchor on the exact CSP value we validated from the parsed JSON, not on the
  // first `script-src` in the file - otherwise adding a second policy (e.g. a
  // Report-Only header) would silently edit the wrong one.
  if (!rawJson.includes(cspValue)) {
    throw new Error('Could not locate the Content-Security-Policy value in the raw vercel.json text')
  }

  const scriptSrc = cspValue.match(/script-src[^;]*/)
  if (!scriptSrc) throw new Error('Could not locate the script-src directive in vercel.json')

  const directive = scriptSrc[0]
  const tokens = Array.from(directive.matchAll(/'sha256-[A-Za-z0-9+/=]+'/g))
  const replacement = hashes.map((h) => `'${h}'`).join(' ')

  let updatedDirective: string
  if (tokens.length > 0) {
    // Replace the span from the first to the last existing hash, so the
    // surrounding sources ('self', https://... ) keep their original order.
    const start = tokens[0].index
    const end = tokens[tokens.length - 1].index + tokens[tokens.length - 1][0].length
    updatedDirective = directive.slice(0, start) + replacement + directive.slice(end)
  } else {
    updatedDirective = directive.replace(/^script-src/, `script-src ${replacement}`)
  }

  // Rebuild the whole CSP value, then swap that exact value in the raw text -
  // so the edit is scoped to this one header even if another policy exists.
  const updatedCspValue = cspValue.replace(directive, updatedDirective)
  return rawJson.replace(cspValue, updatedCspValue)
}

function main() {
  const { html, from, stale } = readIndexHtml()
  const hashes = inlineScriptHashes(html)

  if (hashes.length === 0) {
    console.error(`No inline <script> found in ${from} - refusing to strip CSP hashes.`)
    process.exit(1)
  }

  if (stale) {
    console.error(
      'dist/index.html is older than index.html - the build predates the current source.\n' +
        'Refusing to trust it: run `npm run build` first, then re-run this script.',
    )
    process.exit(1)
  }

  const raw = readFileSync(VERCEL_JSON, 'utf-8')
  const config: VercelConfig = JSON.parse(raw)
  const cspHeader = findCspHeader(config)

  if (!cspHeader) {
    console.error('No Content-Security-Policy header found in vercel.json.')
    process.exit(1)
  }

  const currentHashes = Array.from(
    cspHeader.value.match(/script-src[^;]*/)?.[0].matchAll(/'(sha256-[A-Za-z0-9+/=]+)'/g) ?? [],
    (m) => m[1],
  )

  const inSync =
    currentHashes.length === hashes.length && hashes.every((h) => currentHashes.includes(h))

  console.log(`Read inline scripts from: ${from}`)
  console.log(`  computed:   ${hashes.join(', ')}`)
  console.log(`  vercel.json: ${currentHashes.join(', ') || '(none)'}`)

  // Route coverage is always verified, never rewritten - see routesMissingRewrites.
  const uncovered = routesMissingRewrites(config)
  if (uncovered.length > 0) {
    console.error(
      `\nThese routes from site.config.ts have no matching vercel.json rewrite:\n` +
        uncovered.map((p) => `  ${p}`).join('\n') +
        `\nWithout a rewrite to /index.html, visiting or refreshing them 404s instead of loading the app.` +
        `\nFix: add a rewrite to vercel.json covering each path above.`,
    )
    process.exit(1)
  }
  console.log(`Route coverage: all ${ROUTE_DEFS.length - 1} rewritable routes have a vercel.json rewrite.`)

  if (inSync) {
    console.log('CSP script-src hashes are in sync.')
    return
  }

  if (checkOnly) {
    console.error(
      '\nCSP script-src hashes are OUT OF SYNC with index.html.\n' +
        'The inline script changed but vercel.json was not updated - CSP will block it in production.\n' +
        'Fix: run `npm run sync:site-config` and commit the vercel.json change.',
    )
    process.exit(1)
  }

  const updated = withScriptSrcHashes(raw, cspHeader.value, hashes)
  // Sanity-check we produced valid JSON before overwriting the real file
  JSON.parse(updated)
  writeFileSync(VERCEL_JSON, updated, 'utf-8')
  console.log('\nUpdated vercel.json with the current hashes. Review and commit the diff.')
}

main()
