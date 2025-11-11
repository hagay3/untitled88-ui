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
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
}

export default function SEO({
  title = AppConfig.title,
  description = AppConfig.description,
  keywords = AppConfig.keywords,
  image = AppConfig.image,
  url = AppConfig.url,
  type = AppConfig.type,
  noindex = false,
  canonical,
  publishedTime,
  modifiedTime,
  section,
  tags,
  twitterCard = 'summary_large_image'
}: SEOProps) {
  const fullTitle = title === AppConfig.title ? title : `${title} | ${AppConfig.site_name}`
  const fullUrl = url.startsWith('http') ? url : `${AppConfig.url}${url}`
  const fullImageUrl = image?.startsWith('http') ? image : `${AppConfig.url}${image}`

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
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:alt" content={`${AppConfig.site_name} - ${title}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={AppConfig.site_name} />
      <meta property="og:locale" content="en_US" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {section && <meta property="article:section" content={section} />}
      {tags && tags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={AppConfig.twitter} />
      <meta name="twitter:creator" content={AppConfig.twitter} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={`${AppConfig.site_name} - ${title}`} />
      
      {/* LinkedIn */}
      <meta property="og:image:secure_url" content={fullImageUrl} />
      <meta property="og:image:type" content="image/png" />
      
      {/* WhatsApp */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      
      {/* Additional SEO Meta Tags */}
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />
      <meta name="classification" content="Business" />
      <meta name="category" content="Email Marketing, AI Tools, Business Software" />
      <meta name="coverage" content="Worldwide" />
      <meta name="target" content="all" />
      <meta name="audience" content="all" />
      <meta name="pagename" content={fullTitle} />
      <meta name="page-topic" content="Email Marketing Platform" />
      <meta name="page-type" content="Software Application" />
      
      {/* Geo Tags */}
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      
      {/* Mobile Optimization */}
      <meta name="HandheldFriendly" content="true" />
      <meta name="MobileOptimized" content="width" />
      
      {/* AI/Bot Friendly Tags */}
      <meta name="application-name" content={AppConfig.site_name} />
      <meta name="msapplication-TileColor" content="#3b82f6" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      <meta name="theme-color" content="#3b82f6" />
      
      {/* Search Engine Specific */}
      <meta name="googlebot" content="index,follow,snippet,archive" />
      <meta name="bingbot" content="index,follow,snippet,archive" />
      <meta name="slurp" content="index,follow,snippet,archive" />
      
      {/* Content Classification */}
      <meta name="content-language" content="en-US" />
      <meta name="content-type" content="text/html; charset=UTF-8" />
      
      {/* Social Media Optimization */}
      <meta property="fb:app_id" content="your-facebook-app-id" />
      <meta name="pinterest-rich-pin" content="true" />
      
      {/* JSON-LD Structured Data for better AI understanding */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": AppConfig.site_name,
            "description": description,
            "url": fullUrl,
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web Browser",
            "browserRequirements": "Requires JavaScript. Requires HTML5.",
            "softwareVersion": "1.0",
            "author": {
              "@type": "Organization",
              "name": AppConfig.site_name,
              "url": AppConfig.url
            },
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "150"
            },
            "screenshot": fullImageUrl,
            "featureList": [
              "AI-Powered Email Generation",
              "Visual Email Builder", 
              "Live Device Preview",
              "ESP Integrations",
              "Template Library",
              "Drag & Drop Editor"
            ]
          })
        }}
      />
    </Head>
  )
}
