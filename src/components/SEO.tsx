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
  jsonLd?: Record<string, unknown>
}

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
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://jamapp.com.br'
  const canonicalUrl = canonical || siteUrl
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`

  return (
    <Helmet>
      <html lang={currentLang} />
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}

      <link rel="canonical" href={canonicalUrl} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:locale" content={currentLang === 'pt' ? 'pt_BR' : currentLang} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImageUrl} />

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  )
}
