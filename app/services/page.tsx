import type { Metadata } from 'next'
import ServicesView from './view'
import { getPackageOverrides } from '@/lib/pricing'
import { SERVICES_V3 } from '@/lib/v3-content'

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Web development, data & analytics, social media, SEO & ads, and engineering/CAD for small and mid-size businesses. Fixed-price, founder-led, Toronto-based.',
  alternates: { canonical: '/services' },
  openGraph: {
    title: 'Marrelay - Services',
    description: 'Web, data, social, SEO & ads, and engineering/CAD. Fixed-price and founder-led.',
    url: '/services',
  },
}

export default async function Services() {
  const pkgs = await Promise.all(SERVICES_V3.map((s) => getPackageOverrides(s.pricingKey)))
  const items = SERVICES_V3.map((s, i) => ({ key: s.key, full: s.full, intro: s.intro, url: s.url, from: pkgs[i][0]?.price ?? '', tools: s.tools, chips: s.chips }))
  return <ServicesView items={items} />
}
