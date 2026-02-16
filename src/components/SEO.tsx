import {Helmet} from 'react-helmet-async'
import {useAppLanguage} from '../hooks'

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

const SUPPORTED_LANGS = [
  { code: 'pt-BR', param: 'pt' },
  { code: 'en', param: 'en' },
  { code: 'es', param: 'es' },
]

export function SEO({
  title,
  description,
  keywords,
  ogImage = '/og-image.jpg',
  ogType = 'website',
  noindex = false,
  canonical,
  jsonLd,
}: SEOProps) {
  const { currentLang } = useAppLanguage()

  const fullTitle = title ? `${title} | The Jam App` : "The Jam App"
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://www.jamapp.com.br'
  const canonicalUrl = canonical || siteUrl
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`

  // Build base URL without query params for hreflang
  const baseUrl = canonicalUrl.split('?')[0]

  // Determine JSON-LD content
  const jsonLdContent = jsonLd
    ? Array.isArray(jsonLd)
      ? JSON.stringify({ '@context': 'https://schema.org', '@graph': jsonLd })
      : JSON.stringify(jsonLd)
    : null

  return (
    <Helmet>
      <html lang={currentLang === 'pt' ? 'pt-BR' : currentLang} />
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}

      <link rel="canonical" href={canonicalUrl} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Hreflang tags for language alternatives */}
      {SUPPORTED_LANGS.map(({ code, param }) => (
        <link
          key={code}
          rel="alternate"
          hrefLang={code}
          href={`${baseUrl}${baseUrl.includes('?') ? '&' : '?'}lng=${param}`}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={baseUrl} />

      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={currentLang === 'pt' ? 'pt_BR' : currentLang === 'es' ? 'es_ES' : 'en_US'} />
      <meta property="og:site_name" content="The Jam App" />

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
