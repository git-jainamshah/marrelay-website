/* eslint-disable @next/next/no-img-element */
import { ReactNode } from 'react'
import Link from 'next/link'
import AccentSetter from '@/components/AccentSetter'
import ViewItem from '@/analytics/ViewItem'
import type { FaqItem } from './FaqList'
import Faq from '@/components/v3/Faq'
import { getSlots } from '@/lib/media-slots-server'
import { SERVICES_V3, serviceByParam } from '@/lib/v3-content'
import ToolsRow from '@/components/v3/ToolsRow'
import PricingStance from '@/components/v3/PricingStance'

export interface Deliverable {
  icon: ReactNode
  title: ReactNode
  text: string
  tags: string[]
}

export interface FlowStep {
  title: ReactNode
  text: string
  time: string
}

export interface PriceCard {
  variant: 'c-starter' | 'c-growth' | 'c-scale'
  featured?: boolean
  tag?: string
  name: string
  h3: ReactNode
  desc: string
  price: string
  priceNote: string
  billing: string
  items: string[]
  ctaLabel: string
}

export interface ServiceData {
  accentClass: string
  contactQuery: string
  crumb: string
  tagNo: string
  tagLabel: string
  h1: ReactNode
  lede: ReactNode
  miniStats: { v: ReactNode; k: string }[]
  stage: ReactNode
  includedIntro: string
  deliverables: Deliverable[]
  flowTitle: ReactNode
  flowIntro: string
  flow: FlowStep[]
  workIntro?: string
  caseStudy?: {
    placeholder: string
    tagline: ReactNode
    h3: ReactNode
    text: string
    metrics: { v: ReactNode; k: string }[]
    author: { av: string; name: string; role: string }
  }
  /** plain-text FAQ answers reused for FAQPage JSON-LD */
  faqPlain?: { q: string; a: string }[]
  pricingTitle: ReactNode
  pricingIntro: string
  cards: PriceCard[]
  faqKicker: string
  faqTitle: ReactNode
  faqs: FaqItem[]
  ctaH2: ReactNode
  ctaText: string
  signoff: string
}

const SERVICE_SLUG: Record<string, string> = {
  web: 'web-development', data: 'data-analytics', social: 'social', seo: 'seo-ads', engineering: 'engineering',
}
const SITE = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.marrelay.com'

export default async function ServicePage({ data }: { data: ServiceData }) {
  const contactHref = `/contact?service=${data.contactQuery}`
  const slug = SERVICE_SLUG[data.contactQuery] || data.contactQuery
  const v3 = serviceByParam(data.contactQuery) ?? SERVICES_V3[0]
  const slots = await getSlots()
  const poster = slots[v3.posterSlot]

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Services', item: `${SITE}/services` },
      { '@type': 'ListItem', position: 3, name: data.crumb, item: `${SITE}/services/${slug}` },
    ],
  }

  return (
    <>
      <AccentSetter accentClass={data.accentClass} />
      <ViewItem serviceKey={data.contactQuery} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* HERO */}
      <section className="v-phero svc-hero">
        <img src={poster} alt="" />
        <div className="scrim"></div>
        <div className="v-wrap inner">
          <nav className="v-tabs" aria-label="Services" data-reveal>
            {SERVICES_V3.map((s) => (
              <Link key={s.key} href={s.url} className={s.key === v3.key ? 'on' : undefined} aria-current={s.key === v3.key ? 'page' : undefined}>
                {s.full}
              </Link>
            ))}
          </nav>
          <span className="v-kick on-dark" data-reveal>{v3.kicker}</span>
          <h1 data-reveal data-delay="1">{v3.h1}</h1>
          <div className="foot" data-reveal data-delay="2">
            <p>{v3.intro}</p>
            <Link href={contactHref} className="btn btn-light">{v3.cta} <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      {/* THE SHORT VERSION */}
      <section className="v-wrap v-sec">
        <div className="v-split">
          <div className="l" data-reveal>
            <span className="v-kick"><i>01</i>The short version</span>
            <h2 className="v-h2-sm">What this looks like.</h2>
          </div>
          <div className="r">
            <div className="v-rows">
              {v3.rows.map(([k, v]) => (
                <div key={k} className="v-row" data-reveal>
                  <span className="k">{k}</span>
                  <span className="v">{v}</span>
                </div>
              ))}
            </div>
            <ToolsRow tools={v3.tools} />
          </div>
        </div>
      </section>

      {/* EXAMPLES OF WORK (compact: title + one line) */}
      <section className="v-wrap v-sec">
        <div className="v-split">
          <div className="l sticky" data-reveal>
            <span className="v-kick"><i>02</i>Examples of work</span>
            <h2 className="v-h2-sm">The kind of thing we do.</h2>
            <p className="v-body">A few examples, not a menu. Most projects mix a couple of these.</p>
          </div>
          <div className="r v-rows compact">
            {data.deliverables.map((d, i) => (
              <div key={i} className="v-row" data-reveal>
                <span className="k">{d.title}</span>
                <span className="v">{d.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="v-wrap v-sec">
        <div className="v-split">
          <div className="l sticky" data-reveal>
            <span className="v-kick"><i>03</i>How it works</span>
            <h2 className="v-h2-sm">{data.flowTitle}</h2>
          </div>
          <div className="r v-steps sm">
            {data.flow.map((f, i) => (
              <div key={i} className="v-step" data-reveal>
                <span className="n">0{i + 1}</span>
                <div className="b">
                  <span className="t">{f.title}</span>
                  <span className="d">{f.text}</span>
                  <span className="w">{f.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PACKAGES (admin-managed prices) */}
      <section className="v-wrap v-sec" id="pricing">
        <div className="v-head" style={{ marginBottom: 28 }} data-reveal>
          <div>
            <span className="v-kick"><i>04</i>Pricing</span>
            <h2 className="v-h2-sm">Ways to start.</h2>
          </div>
          <span className="v-body" style={{ fontSize: 14, color: 'var(--v-mut-2)' }}>Prices in CAD. Every project starts with a free call.</span>
        </div>
        <PricingStance contactHref={contactHref} />
        <div className="v-tiers" style={{ marginTop: 28 }}>
          {data.cards.map((c, i) => (
            <div key={i} className={`v-tier${c.featured ? ' feat' : ''}`} data-reveal data-delay={String(i + 1)}>
              <div className="top">
                <span className="nm">{c.name}</span>
                {c.billing && <span className="bl">{c.billing}</span>}
              </div>
              <div className="pr"><b>{c.price}</b>{c.priceNote && <small>{c.priceNote}</small>}</div>
              <span className="ds">{c.desc}</span>
              <span className="v-kick" style={{ marginTop: 4 }}>Examples of work</span>
              <ul>{c.items.map((item) => <li key={item}>{item}</li>)}</ul>
              <Link href={contactHref} className="cta tbtn">{c.ctaLabel.replace(/\s*→\s*$/, '')} →</Link>
            </div>
          ))}
        </div>
      </section>

      {/* QUESTIONS */}
      <section className="v-wrap v-sec v-sec-b">
        <div className="v-split">
          <div className="l" data-reveal>
            <span className="v-kick"><i>05</i>Questions</span>
            <h2 className="v-h2-sm">Asked often.</h2>
            <p className="v-body">
              Not covered? <Link href={contactHref} className="v-link" style={{ fontSize: 'inherit' }}>Ask on the call →</Link>
            </p>
          </div>
          <div className="r" data-reveal>
            <Faq items={data.faqs.slice(0, 5)} />
          </div>
        </div>
      </section>
    </>
  )
}
