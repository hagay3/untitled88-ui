import Document, { Html, Head, Main, NextScript } from 'next/document'
import { AppConfig } from '../utils/AppConfig'

class MyDocument extends Document {
  render() {
    return (
      <Html lang={AppConfig.locale}>
        <Head>
          {/* Basic Meta Tags */}
          <meta charSet="utf-8" />
          <meta name="format-detection" content="telephone=no" />
          
          {/* PWA Meta Tags */}
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="application-name" content={AppConfig.site_name} />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content={AppConfig.site_name} />
          
          {/* Theme Colors */}
          <meta name="theme-color" content="#3b82f6" />
          <meta name="msapplication-TileColor" content="#3b82f6" />
          
          {/* Favicon and Icons */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />
          
          {/* Preconnect to External Domains */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          
          {/* Google Fonts */}
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,900;1,400;1,600;1,700;1,900&family=Figtree:wght@300;400;500;600;700;800;900&family=Montagu+Slab:wght@400;500;600;700&family=Fragment+Mono:wght@400&family=Urbanist:wght@400;500;600;700;800;900&display=swap"
            rel="stylesheet"
          />
          
          {/* DNS Prefetch for Performance */}
          <link rel="dns-prefetch" href="//fonts.googleapis.com" />
          <link rel="dns-prefetch" href="//www.google-analytics.com" />
          
          {/* Security Headers */}
          <meta name="referrer" content="strict-origin-when-cross-origin" />
          
          {/* Enhanced Structured Data for SEO and AI Bots */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": AppConfig.site_name,
                "description": AppConfig.description,
                "url": "https://untitled88.com",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web Browser",
                "browserRequirements": "Requires JavaScript. Requires HTML5.",
                "softwareVersion": "1.0",
                "datePublished": "2024-01-01",
                "dateModified": new Date().toISOString().split('T')[0],
                "author": {
                  "@type": "Organization",
                  "name": AppConfig.site_name,
                  "url": "https://untitled88.com",
                  "logo": "https://untitled88.com/logo-untitled88.png"
                },
                "publisher": {
                  "@type": "Organization",
                  "name": AppConfig.site_name,
                  "url": "https://untitled88.com",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://untitled88.com/logo-untitled88.png"
                  }
                },
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock",
                  "validFrom": "2024-01-01"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "4.8",
                  "ratingCount": "150",
                  "bestRating": "5",
                  "worstRating": "1"
                },
                "screenshot": "https://untitled88.com/og-image.png",
                "featureList": [
                  "AI-Powered Email Generation",
                  "Visual Email Builder",
                  "Live Device Preview",
                  "ESP Integrations (Brevo, Mailchimp, Klaviyo)",
                  "Template Library",
                  "Drag & Drop Editor",
                  "Mobile Responsive Design",
                  "Real-time Collaboration"
                ],
                "keywords": AppConfig.keywords,
                "inLanguage": "en-US",
                "copyrightYear": "2024",
                "copyrightHolder": {
                  "@type": "Organization",
                  "name": AppConfig.site_name
                }
              })
            }}
          />
          
          {/* Organization Schema for better AI understanding */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": AppConfig.site_name,
                "url": "https://untitled88.com",
                "logo": "https://untitled88.com/logo-untitled88.png",
                "description": AppConfig.description,
                "foundingDate": "2024",
                "industry": "Email Marketing Software",
                "numberOfEmployees": "10-50",
                "address": {
                  "@type": "PostalAddress",
                  "addressCountry": "US"
                },
                "sameAs": [
                  "https://twitter.com/untitled88",
                  "https://linkedin.com/company/untitled88"
                ],
                "contactPoint": {
                  "@type": "ContactPoint",
                  "contactType": "customer service",
                  "availableLanguage": "English"
                }
              })
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument

