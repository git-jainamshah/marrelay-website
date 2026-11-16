import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
/* Fonts are served from our own bundle, not fetched from Google at build time.
   next/font/google made every deploy depend on six network round trips, and a
   single one timing out failed the whole build, which it did twice. These are
   the same families and the same axes, shipped as npm packages. */
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource-variable/fraunces/standard.css'
import '@fontsource-variable/fraunces/standard-italic.css'
import '@fontsource-variable/dm-sans/standard.css'
import '@fontsource-variable/jetbrains-mono/wght.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
/* standard.css carries both axes, so font-stretch: 125% on the v3 labels works */
import '@fontsource-variable/archivo/standard.css'
import './globals.css'
import './marrelay.css'
// v3 redesign: scoped to the public site via the .v3 wrapper in LayoutWrapper.
// The admin never renders inside .v3, so its look is unaffected.
import './v3.css'
import LayoutWrapper from '@/components/LayoutWrapper'
import { SOCIALS } from '@/lib/social'
import { HeadScripts, BodyStartScripts, FooterScripts } from '@/components/SiteScripts'
import { SITE_URL, isProduction } from '@/lib/env'

// ISR: pages stay statically served (fast) but refresh within 60s, so
// admin changes (scripts, pricing, announcement copy) go live within a minute.
export const revalidate = 60

const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Marrelay - Fixed-Price Web, Data & SEO Studio in Toronto',
    template: 'Marrelay - %s',
  },
  description:
    'Marrelay is a Toronto digital studio. Websites, data, SEO, social and CAD for startups in Canada and the US, at one fixed price. Book a free call.',
  keywords: [
    'Marrelay',
    'Marrelay digital studio',
    'digital studio Toronto',
    'fixed price web design',
    'web development Toronto',
    'startup web design Canada',
    'data analytics setup',
    'SEO and Google Ads agency',
    'social media management',
    'CAD drafting and engineering drawings',
  ],
  authors: [{ name: 'Marrelay' }],
  creator: 'Marrelay',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    siteName: 'Marrelay',
    title: 'Marrelay - Fixed-Price Web, Data & SEO Studio in Toronto',
    description:
      'A Toronto digital studio for startups and small businesses in Canada and the US. Web, data, SEO, social and engineering, at a fixed project price, not by the hour. Weekly demos, and you own everything.',
    type: 'website',
    locale: 'en_CA',
    url: '/',
    images: [{ url: '/assets/marrelay-header.png', width: 1200, height: 630, alt: 'Marrelay - Toronto digital studio' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marrelay - Fixed-Price Web, Data & SEO Studio in Toronto',
    description:
      'A Toronto digital studio for startups in Canada and the US. Web, data, SEO, social and engineering, at a fixed project price, not by the hour.',
    images: ['/assets/marrelay-header.png'],
  },
  // QA and DEV are full copies of the site; letting them be indexed would create
  // duplicate content competing with marrelay.com. Production is unaffected.
  robots: isProduction
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1,
        },
      }
    : { index: false, follow: false, nocache: true },
}

export async function generateMetadata(): Promise<Metadata> {
  // Merge admin-managed SEO settings (site verification tags) when available
  try {
    const { getSetting } = require('@/lib/admin/db') as typeof import('@/lib/admin/db')
    const seo = await getSetting<{ googleVerification?: string; bingVerification?: string }>('seo')
    const verification: Metadata['verification'] = {}
    if (seo?.googleVerification) verification.google = seo.googleVerification
    if (seo?.bingVerification) verification.other = { 'msvalidate.01': seo.bingVerification }
    return { ...baseMetadata, ...(Object.keys(verification).length ? { verification } : {}) }
  } catch {
    return baseMetadata
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

const buildOrgLd = (c: { name: string; email: string; phone?: string; logoIcon: string; logoFull: string }, sameAs: string[]) => ({
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': `${SITE_URL}/#organization`,
  name: c.name,
  alternateName: 'Marrelay Digital Studio',
  description:
    'Marrelay is a Toronto-based digital studio that designs, builds and grows websites, analytics, SEO, social and engineering/CAD work for startups and small businesses across Canada and the United States. Projects run on a fixed budget agreed up front, not hourly billing, and clients own all code, files and accounts.',
  slogan: 'One fixed price, agreed before we start.',
  url: SITE_URL,
  logo: `${SITE_URL}${c.logoIcon || '/assets/marrelay-mark.png'}`,
  image: `${SITE_URL}${c.logoFull || '/assets/marrelay-header.png'}`,
  email: c.email || 'hello@marrelay.com',
  ...(c.phone ? { telephone: c.phone } : {}),
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Toronto',
    addressRegion: 'ON',
    addressCountry: 'CA',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 43.6532, longitude: -79.3832 },
  areaServed: [
    { '@type': 'City', name: 'Toronto' },
    { '@type': 'AdministrativeArea', name: 'Ontario' },
    { '@type': 'Country', name: 'Canada' },
    { '@type': 'Country', name: 'United States' },
  ],
  priceRange: '$$',
  sameAs: sameAs.length ? sameAs : SOCIALS.map((s) => s.href),
  knowsAbout: ['Web development', 'Data and analytics', 'SEO', 'Paid advertising', 'Social media', 'Engineering and CAD drafting'],
  makesOffer: [
    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Web development', url: `${SITE_URL}/services/web-development` } },
    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Data & analytics', url: `${SITE_URL}/services/data-analytics` } },
    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Social media management', url: `${SITE_URL}/services/social` } },
    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'SEO & paid ads', url: `${SITE_URL}/services/seo-ads` } },
    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Engineering & CAD drafting', url: `${SITE_URL}/services/engineering` } },
  ],
})

const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: 'Marrelay',
  alternateName: ['Marrelay Digital Studio'],
  description:
    'Marrelay is a Toronto digital studio that designs, builds and grows websites and digital products for startups and small businesses in Canada and the US, at a fixed project price.',
  inLanguage: 'en',
  publisher: { '@id': `${SITE_URL}/#organization` },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Admin-managed company profile + socials feed the structured data
  const { getCompany, getEnabledSocials } = require('@/lib/site-config') as typeof import('@/lib/site-config')
  const [company, socials] = await Promise.all([getCompany(), getEnabledSocials()])
  const orgLd = buildOrgLd(company, socials.map((s) => s.href))

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={GeistSans.variable}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
        <HeadScripts />
      </head>
      <body className="dot-bg">
        <BodyStartScripts />
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
        <FooterScripts />
      </body>
    </html>
  )
}
