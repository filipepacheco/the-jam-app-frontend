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
}

export function SEO({
  title,
  description,
  keywords,
  ogImage = '/og-image.jpg', // Default OG image
  ogType = 'website',
  noindex = false,
  canonical,
}: SEOProps) {
  const { currentLang } = useAppLanguage()

  // Build full title with site name
  const fullTitle = title ? `${title} | Let's Jam` : "Let's Jam - Karaoke Jam Management"

  // Build canonical URL
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://letsjam.app' // Configure in .env
  const canonicalUrl = canonical || siteUrl

  // Build OG image URL (absolute)
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={currentLang} />
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph (Facebook, LinkedIn) */}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:locale" content={currentLang === 'pt' ? 'pt_BR' : currentLang} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImageUrl} />
    </Helmet>
  )
}
