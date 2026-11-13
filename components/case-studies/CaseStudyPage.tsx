/* eslint-disable @next/next/no-img-element */
import { ReactNode } from 'react'
import Link from 'next/link'
import AccentSetter from '@/components/AccentSetter'
import { BgVideo, SlotMedia, isVideo } from '@/components/v3/Media'
import MediaCard from '@/components/v3/MediaCard'
import { CASES_V3 } from '@/lib/v3-content'
import { SLOT_DEFS } from '@/lib/media-slots'

const slotDefault = (key: string) => SLOT_DEFS.find((s) => s.key === key)?.defaultPath ?? ''

export interface CaseStudyData {
  slug: string
  accentClass: string
  contactQuery: string
  category: string
  crumb: string
  h1: ReactNode
  summary: string
  heroStats: { v: ReactNode; k: string }[]
  challengeKicker: string
  challenge: string[]
  approachIntro: string
  approach: { title: string; text: string; time: string }[]
  buildIntro: string
  build: { title: string; text: string; tags: string[] }[]
  outcomeTagline: string
  outcomeH3: ReactNode
  outcomeText: string
  outcomeMetrics: { v: ReactNode; sup?: string; k: string }[]
  quote: string
  quoteAttribution: string
  ctaH2: ReactNode
  ctaText: string
  /** page-specific interactive demo */
  interactive?: ReactNode
  interactiveTitle?: ReactNode
  /** for SEO JSON-LD + meta */
  seoName: string
  seoDescription: string
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.marrelay.com'

export default function CaseStudyPage({ data, media, poster }: { data: CaseStudyData; media: string; poster?: string }) {
  const contactHref = `/contact?service=${data.contactQuery}`
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Case Studies', item: `${SITE}/case-studies` },
      { '@type': 'ListItem', position: 3, name: data.category, item: `${SITE}/projects/${data.slug}` },
    ],
  }
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: data.seoName,
    about: data.category,
    creator: { '@type': 'Organization', name: 'Marrelay' },
    description: data.seoDescription,
    keywords: `${data.category}, case study, ${data.contactQuery} agency`,
    // Honest signal: these are illustrative examples, not delivered client work.
    disambiguatingDescription: 'Illustrative example engagement created to show how Marrelay approaches this kind of work.',
  }

  const idx = Math.max(0, CASES_V3.findIndex((c) => c.url === `/projects/${data.slug}`))
  const heroPoster = poster || slotDefault(CASES_V3[idx].poster)
  const nav = [
    { k: 'Previous', arrow: '←', c: CASES_V3[(idx + CASES_V3.length - 1) % CASES_V3.length] },
    { k: 'Next', arrow: '→', c: CASES_V3[(idx + 1) % CASES_V3.length] },
  ]

  return (
    <>
      <AccentSetter accentClass={data.accentClass} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* HERO */}
      <section className="v-phero tall svc-hero">
        {heroPoster && <img src={heroPoster} alt="" />}
        {isVideo(media) ? <BgVideo src={media} poster={heroPoster} /> : media && <img src={media} alt="" />}
        <div className="scrim"></div>
        <div className="v-wrap inner" style={{ gap: 28 }}>
          <span className="v-label" data-reveal>Case study · {data.category} · Worked example</span>
          <h1 data-reveal data-delay="1" style={{ maxWidth: '11em' }}>{data.h1}</h1>
          <div className="v-meta-grid" data-reveal data-delay="2">
            {data.heroStats.map((s, i) => (
              <div key={i}><span className="v-label">{s.k}</span><span>{s.v}</span></div>
            ))}
            <div><span className="v-label">Format</span><span>Worked example</span></div>
          </div>
        </div>
      </section>

      {/* LEDE */}
      <section className="v-wrap v-sec">
        <p data-reveal style={{ fontSize: 'clamp(26px,3.2vw,48px)', lineHeight: 1.15, letterSpacing: '-.04em', maxWidth: '22em' }}>
          {data.summary}
        </p>
        <p className="v-note" style={{ marginTop: 24 }} data-reveal>An imagined scenario · not a past project or a promise of results</p>
      </section>

      {/* THE SCENARIO */}
      <section className="v-wrap v-sec">
        <div className="v-split">
          <div className="l" data-reveal><span className="v-label">{data.challengeKicker}</span></div>
          <div className="r" data-reveal style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {data.challenge.map((p, i) => (
              <p key={i} style={{ fontSize: 18, lineHeight: 1.65, color: 'var(--v-ink-2)' }}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* INTERACTIVE SKETCH (existing widget) */}
      {data.interactive && (
        <section className="v-wrap v-sec">
          <div className="v-head" data-reveal>
            <div>
              <span className="v-label">Interactive sketch</span>
              <h2 className="v-h2-sm">{data.interactiveTitle ?? 'A quick interactive sketch'}</h2>
            </div>
            <p className="v-body">
              Have a play. It&apos;s a rough, made-up illustration of the kind of thing we&apos;d explore with you, not a
              real deliverable or a fixed method.
            </p>
          </div>
          <div className="v-sketch" data-reveal>{data.interactive}</div>
        </section>
      )}

      {/* THE APPROACH */}
      <section className="v-wrap v-sec">
        <div className="v-split">
          <div className="l sticky" data-reveal>
            <span className="v-label">The approach</span>
            <p className="v-body">{data.approachIntro}</p>
          </div>
          <div className="r v-steps sm">
            {data.approach.map((st, i) => (
              <div key={i} className="v-step" data-reveal>
                <span className="n">0{i + 1}</span>
                <div className="b">
                  <span className="t">{st.title}</span>
                  <span className="d">{st.text}</span>
                  <span className="w">{st.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT WE'D BUILD */}
      <section className="v-wrap v-sec">
        <div className="v-split">
          <div className="l" data-reveal>
            <span className="v-label">What we&apos;d build</span>
            <p className="v-body">{data.buildIntro}</p>
          </div>
          <div className="r v-rows">
            {data.build.map((d) => (
              <div key={d.title} className="v-row" data-reveal>
                <span className="k">{d.title}</span>
                <span className="v">{d.text}</span>
                {d.tags.length > 0 && <span className="tags">{d.tags.map((t) => <span key={t}>{t}</span>)}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUTCOME */}
      <section className="v-wrap v-sec">
        <div className="v-head" data-reveal>
          <div>
            <span className="v-label">{data.outcomeTagline}</span>
            <h2 className="v-h2-sm">{data.outcomeH3}</h2>
          </div>
          <p className="v-body" style={{ maxWidth: '30em' }}>{data.outcomeText}</p>
        </div>
        <div className="v-outcomes">
          {data.outcomeMetrics.map((o, i) => (
            <div key={i} data-reveal data-delay={String(i + 1)}>
              <b>{o.v}{o.sup}</b>
              <span>{o.k}</span>
            </div>
          ))}
        </div>
        <p className="v-note" style={{ marginTop: 24 }}>Made-up example figures · the kind of outcome we&apos;d aim for, not a promise or a real result</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 40 }} data-reveal>
          <Link href={contactHref} className="btn btn-dark">Start a project like this <span aria-hidden="true">→</span></Link>
          <Link href="/pricing" className="btn btn-ghost">See pricing</Link>
        </div>
      </section>

      {/* MORE CASE STUDIES */}
      <section className="v-wrap v-sec v-sec-b">
        <div className="v-head" style={{ alignItems: 'baseline', marginBottom: 28 }} data-reveal>
          <span className="v-label">More case studies</span>
          <Link href="/case-studies" className="v-link">All case studies →</Link>
        </div>
        <div className="v-work-grid v-cs-nav">
          {nav.map(({ k, arrow, c }) => (
            <MediaCard key={k} href={c.url} data-reveal="wipe">
              <div className="m">
                <SlotMedia src={slotDefault(c.slot)} poster={slotDefault(c.poster)} />
                <div className="ov">
                  <div className="hd"><span className="v-label">{k}</span><span className="v-label">{c.cat}</span></div>
                  <div className="ft"><span>{c.title}</span><span className="ac">{arrow}</span></div>
                </div>
              </div>
            </MediaCard>
          ))}
        </div>
      </section>
    </>
  )
}
