import type { Metadata } from 'next'
import ServicesView from './view'
import { getPackageOverrides } from '@/lib/pricing'
import { SERVICES_V3 } from '@/lib/v3-content'
import { OG_IMAGES } from '@/lib/og'

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Web, data, SEO & ads, social and engineering/CAD for startups and small businesses in Canada and the US. Fixed project price, not hourly, Toronto-based.',
  alternates: { canonical: '/services' },
  openGraph: {
    images: OG_IMAGES,
    title: 'Marrelay - Services',
    description: 'Web, data, SEO & ads, social and engineering/CAD. One fixed project price, not by the hour.',
    url: '/services',
  },
}

export default async function Services() {
  const pkgs = await Promise.all(SERVICES_V3.map((s) => getPackageOverrides(s.pricingKey)))
  const items = SERVICES_V3.map((s, i) => ({ key: s.key, full: s.full, intro: s.intro, url: s.url, from: pkgs[i][0]?.price ?? '', tools: s.tools, chips: s.chips }))
  return <ServicesView items={items} />
}
