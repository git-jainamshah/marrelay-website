import type { Metadata } from 'next'
import EngineeringDrawingsPageView from './view'
import { getSlot } from '@/lib/media-slots-server'

export const metadata: Metadata = {
  title: 'Engineering & CAD Case Study',
  description:
    'How Marrelay turns vague sketches into precise, GD&T-toleranced CAD/CAM drawings that cut rework and help small manufacturers win bigger, precision work. An illustrative case study.',
  keywords: ['CAD case study', 'CAM drawings', 'GD&T', 'engineering drawings', 'design for manufacturing', 'CAD services'],
  alternates: { canonical: '/projects/engineering-drawings' },
  openGraph: { title: 'Marrelay - Engineering & CAD Case Study', description: 'Shop-floor drawings that leave no room to guess.', url: '/projects/engineering-drawings' },
}

export default async function EngineeringDrawingsPage() {
  const [bannerVideo, poster] = await Promise.all([getSlot('project-eng-video'), getSlot('service-eng-poster')])
  return <EngineeringDrawingsPageView bannerVideo={bannerVideo} poster={poster} />
}
