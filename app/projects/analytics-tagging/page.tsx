import type { Metadata } from 'next'
import AnalyticsTaggingPageView from './view'
import { getSlot } from '@/lib/media-slots-server'
import { OG_IMAGES } from '@/lib/og'

export const metadata: Metadata = {
  title: 'Analytics & Tagging Case Study',
  description:
    'How we rebuild a broken analytics stack into accurate, consent-compliant GA4 and server-side tagging. An illustrative case study.',
  keywords: ['analytics case study', 'GA4 migration', 'server-side tagging', 'Google Tag Manager', 'conversion tracking', 'data analytics agency'],
  alternates: { canonical: '/projects/analytics-tagging' },
  openGraph: { title: 'Marrelay - Analytics & Tagging Case Study', description: 'Stop guessing. Measure what actually works.', url: '/projects/analytics-tagging', images: OG_IMAGES },
}

export default async function AnalyticsTaggingPage() {
  const [bannerVideo, poster] = await Promise.all([getSlot('project-analytics-video'), getSlot('service-data-poster')])
  return <AnalyticsTaggingPageView bannerVideo={bannerVideo} poster={poster} />
}
