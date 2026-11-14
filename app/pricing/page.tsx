import { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/env'
import { getPackageOverrides } from '@/lib/pricing'
import { SERVICES_V3 } from '@/lib/v3-content'
import Faq from '@/components/v3/Faq'
import PricingStance from '@/components/v3/PricingStance'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Fixed-price packages for web development, data & analytics, social, SEO & ads, and engineering. Pick a starting point and get a 1-page proposal in 3 working days. No sales calls.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Marrelay - Pricing',
    description:
      'Fixed-price packages for web development, data & analytics, social, SEO & ads, and engineering. No sales calls required.',
    url: '/pricing',
  },
}

/**
 * The one and only pricing page.
 *
 * This used to be duplicated: a styled section at /#pricing on the homepage and
 * an older, differently-designed page here. Both are now this single URL, so
 * every internal link, the sitemap and search engines point at one destination.
 */

const FAQS = [
  {
    q: 'Can I customise a package?',
    a: 'Yes. Every package is a starting point, not a box. Tell us what the project actually needs and we will scope it and send a fixed price for that scope.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Major credit cards and bank transfers. Larger projects are split into milestone payments so you are never paying far ahead of delivered work.',
  },
  {
    q: 'Do you offer ongoing support?',
    a: 'Every package includes a post-launch support window. After that, monthly maintenance and retainer plans are available if you want us to stay on.',
  },
  {
    q: 'How long do projects typically take?',
    a: 'Landing-page sprints run 14 days. Most full sites go live in 4 to 6 weeks. You get a dated timeline with your quote before any money changes hands.',
  },
]

export default async function PricingPage() {
  // Admin-managed packages: the "home" set is the three main plans,
  // each service page's set feeds the by-service list.
  const [plans, ...svc] = await Promise.all([
    getPackageOverrides('home'),
    ...SERVICES_V3.map((x) => getPackageOverrides(x.pricingKey)),
  ])

  // FAQPage structured data - lets the questions appear directly in search results.
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Pricing', item: `${SITE_URL}/pricing` },
    ],
  }

  const pkgParam = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <section className="v-wrap v-top v-phead" id="pricing">
        <h1 className="v-big" data-reveal>Pricing</h1>
        <p data-reveal data-delay="1">
          Small fixed packages to start with, and a custom plan for everything else. Either way, the price is agreed
          on one page before any work begins.
        </p>
      </section>

      <section className="v-wrap" style={{ paddingTop: 'clamp(56px,7vw,96px)' }}>
        <PricingStance />
        <div className="v-tiers lg" style={{ marginTop: 28 }}>
          {plans.map((t, i) => (
            <div key={t.idx} className={`v-tier${t.featured ? ' feat' : ''}`} data-reveal data-delay={String(i + 1)}>
              <div className="top">
                <span className="nm">{t.name}</span>
                {t.billing && <span className="bl">{t.billing}</span>}
              </div>
              <div className="pr"><b>{t.price}</b>{t.priceNote && <small>{t.priceNote}</small>}</div>
              {t.description && <span className="ds">{t.description}</span>}
              <span className="v-kick" style={{ marginTop: 4 }}>Examples of work</span>
              <ul>{(t.items ?? []).map((it, j) => <li key={j}>{it}</li>)}</ul>
              <Link href={`/contact?package=${pkgParam(t.name)}`} className="cta tbtn">
                {(t.ctaLabel ?? 'Get started').replace(/\s*→\s*$/, '')} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="v-wrap v-sec">
        <div className="v-split">
          <div className="l" data-reveal>
            <span className="v-kick">By service</span>
            <p className="v-body">Starting points for single-discipline work. Details on each service page.</p>
          </div>
          <div className="r v-rows v-bylist">
            {SERVICES_V3.map((x, i) => (
              <Link key={x.key} href={`${x.url}#pricing`} data-reveal>
                <span className="nm">{x.full}</span>
                <span className="ti">{svc[i].map((p) => p.name).join(' · ')}</span>
                {svc[i][0] && <span className="fr">from {svc[i][0].price}</span>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="v-wrap v-sec v-sec-b">
        <div className="v-split">
          <div className="l" data-reveal>
            <span className="v-kick">Questions</span>
            <h2 className="v-h2-sm">Before you ask.</h2>
            <p className="v-body">
              Nothing here is a trick question. Still unclear?{' '}
              <Link href="/contact" className="v-link" style={{ fontSize: 'inherit' }}>Talk to us →</Link>
            </p>
          </div>
          <div className="r" data-reveal>
            <Faq items={FAQS} />
          </div>
        </div>
      </section>
    </>
  )
}
