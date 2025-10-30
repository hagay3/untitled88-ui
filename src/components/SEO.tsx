import Head from 'next/head'
import { AppConfig } from '@/utils/AppConfig'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: string
  noindex?: boolean
  canonical?: string
}

export default function SEO({
  title = AppConfig.title,
  description = AppConfig.description,
  keywords = AppConfig.keywords,
  image = AppConfig.image,
  url = AppConfig.url,
  type = AppConfig.type,
  noindex = false,
  canonical
}: SEOProps) {
  const fullTitle = title === AppConfig.title ? title : `${title} | ${AppConfig.site_name}`
  const fullUrl = url.startsWith('http') ? url : `${AppConfig.url}${url}`

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={AppConfig.author} />
      
      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical || fullUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={AppConfig.site_name} />
      <meta property="og:locale" content={AppConfig.locale} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={AppConfig.twitter} />
      <meta name="twitter:creator" content={AppConfig.twitter} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />
      
      {/* Geo Tags */}
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      
      {/* Mobile Optimization */}
      <meta name="HandheldFriendly" content="true" />
      <meta name="MobileOptimized" content="width" />
      
      {/* Preload Critical Resources */}
      <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
    </Head>
  )
}
