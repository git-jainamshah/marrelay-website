import type { Metadata } from 'next'
import WebDevelopmentPageView from './view'
import { getSlot } from '@/lib/media-slots-server'
import { OG_IMAGES } from '@/lib/og'

export const metadata: Metadata = {
  title: 'Web Development Case Study',
  description:
    'How we rebuild a slow, hard-to-edit website into a fast, measurable one the team can run themselves. An illustrative case study.',
  keywords: ['web development case study', 'website redesign', 'conversion optimization', 'Core Web Vitals', 'Next.js agency'],
  alternates: { canonical: '/projects/web-development' },
  openGraph: { title: 'Marrelay - Web Development Case Study', description: 'A website that sells, not just sits there.', url: '/projects/web-development', images: OG_IMAGES },
}

export default async function WebDevelopmentPage() {
  const [bannerVideo, poster] = await Promise.all([getSlot('project-web-video'), getSlot('service-web-poster')])
  return <WebDevelopmentPageView bannerVideo={bannerVideo} poster={poster} />
}
