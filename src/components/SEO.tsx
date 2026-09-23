/**
 * SEO Component
 *
 * Design-system review (issue #50): this component renders only `<Helmet>`
 * document metadata (title, meta, link and JSON-LD). It has no visible
 * element and no interactive control, so no canonical family applies.
 */
import {Helmet} from 'react-helmet-async'
import {useAppLanguage} from '../hooks'
import {SITE_URL} from '../lib/api'
import {toOpenGraphLocale} from '../lib/i18n/applicationLocale'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  ogType?: 'website' | 'article'
  noindex?: boolean
  canonical?: string
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

export function SEO({
  title,
  description,
  keywords,
  ogImage = '/brand/v1/social-hybrid-1200x630.png',
  ogType = 'website',
  noindex = false,
  canonical,
  jsonLd,
}: SEOProps) {
  const { currentLang } = useAppLanguage()

  const fullTitle = title ? `${title} | Jam App` : 'Jam App'
  const siteUrl = SITE_URL
  const canonicalUrl = canonical || (typeof window !== 'undefined' ? `${siteUrl}${window.location.pathname}` : siteUrl)
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`

  // Strip query params for x-default hreflang
  const baseUrl = canonicalUrl.split('?')[0]

  // Determine JSON-LD content
  const jsonLdContent = jsonLd
    ? Array.isArray(jsonLd)
      ? JSON.stringify({ '@context': 'https://schema.org', '@graph': jsonLd })
      : JSON.stringify(jsonLd)
    : null

  return (
    <Helmet>
      <html lang={currentLang} />
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}

      <link rel="canonical" href={canonicalUrl} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <link rel="alternate" hrefLang="x-default" href={baseUrl} />

      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={toOpenGraphLocale(currentLang)} />
      <meta property="og:site_name" content="Jam App" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImageUrl} />

      {jsonLdContent && (
        <script type="application/ld+json">
          {jsonLdContent}
        </script>
      )}
    </Helmet>
  )
}
