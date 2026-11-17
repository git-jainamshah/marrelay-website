/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next'
import Link from 'next/link'
import { getSlot } from '@/lib/media-slots-server'

export const metadata: Metadata = {
  title: 'About Marrelay',
  description:
    'Marrelay is a Toronto digital studio that quotes one fixed price for a project instead of billing by the hour. Here is why we started it.',
  alternates: { canonical: '/about' },
  openGraph: { url: '/about' },
}

const FAQ = [
  {
    q: 'What is Marrelay?',
    a: 'Marrelay is a Toronto digital studio. We design, build and grow websites and digital products for startups and small businesses across Canada and the US, for a price agreed before the work starts. We work remotely, with one small team on every project.',
  },
  {
    q: 'Why does Marrelay charge a fixed price instead of an hourly rate?',
    a: 'Because an hourly rate bills you for the overrun. Work scoped in hours tends to run past the hours, and the client absorbs the difference while nobody carries a cost for a loose estimate. A fixed price moves that risk to us, which is where we think it belongs. If you ask for something outside the agreed scope, we price it before we build it.',
  },
  {
    q: 'What does Marrelay do?',
    a: 'Web development, data and analytics, SEO and paid ads, social, and engineering and CAD drafting.',
  },
  {
    q: 'Where is Marrelay based?',
    a: 'Toronto, Canada. We work remotely and take on projects across Canada and the US, and further afield when the fit is right.',
  },
]

const PRINCIPLES = [
  {
    n: '01',
    t: 'You talk to the people doing the work.',
    b: 'No account managers, no handoffs. If we are the wrong fit, we will say so on the first call and point you somewhere better.',
  },
  {
    n: '02',
    t: 'Everything is yours at the end.',
    b: 'Code, files, accounts and keys, handed over when we finish. Nothing quietly stops working the day you stop paying us.',
  },
  {
    n: '03',
    t: 'We stay small.',
    b: 'Fewer projects at once, and senior attention on each one. That is the trade, and we made it on purpose.',
  },
]

export default async function AboutPage() {
  const image = await getSlot('about-image')
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <section className="v-wrap v-top">
        <div className="v-crumb">
          <Link href="/">Home</Link><span>/</span><span className="here">About</span>
        </div>
        <span className="v-kick">About the studio</span>
        <h1 className="v-about-h1" data-reveal data-delay="1">
          We started Marrelay to put a fixed price back on tech work.
        </h1>
        <p className="v-about-lede" data-reveal data-delay="2">
          Almost everyone in this industry bills by the hour. Almost every project runs long. The client pays for
          both. We think that is backwards.
        </p>
      </section>

      <div className="v-wrap" style={{ marginTop: 'clamp(56px,7vw,96px)' }}>
        <div className="v-about-img" data-reveal="wipe">
          <img src={image} alt="People moving through a Toronto station" />
        </div>
      </div>

      <section className="v-wrap v-sec">
        <div className="v-split">
          <div className="l" data-reveal><span className="v-kick">Why we started</span></div>
          <div className="r v-story" data-reveal>
            <p>
              We spent years building websites for other people, and then wiring up the analytics behind them. That
              second part meant we were usually the ones who could see what a project had really cost by the end.
            </p>
            <p>
              The pattern rarely changed. Work gets scoped in hours. The hours run out before the work is finished.
              The timeline moves, the invoices keep arriving, and the client quietly covers the difference. Nobody
              sets out to do that. It is just what happens when the clock is the product.
            </p>
            <p>
              We thought someone should go back to naming a price and standing behind it. So in 2026 we started
              Marrelay with that one thing fixed, and built the rest of the studio around it.
            </p>
            <p>
              Fixed-price work used to be ordinary in this industry. We would like it to be ordinary again.
            </p>
          </div>
        </div>
      </section>

      <section className="v-wrap v-sec v-statement" data-reveal>
        <p>
          One number, agreed before anything starts. If the work takes longer than we thought, that is our problem,
          not yours.
        </p>
      </section>

      <section className="v-wrap v-sec">
        <div className="v-split">
          <div className="l" data-reveal>
            <span className="v-kick">How we work</span>
          </div>
          <div className="r" style={{ borderTop: '1px solid var(--v-ink)' }}>
            {PRINCIPLES.map((p) => (
              <div key={p.n} className="v-prin" data-reveal>
                <span className="n">{p.n}</span>
                <span className="t">{p.t}</span>
                <span className="b">{p.b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="v-wrap v-sec v-sec-b">
        <div className="v-split">
          <div className="l sticky" data-reveal>
            <span className="v-kick">Common questions</span>
            <h2 className="v-h2-sm">The short version.</h2>
          </div>
          <div className="r" data-reveal style={{ borderTop: '1px solid var(--v-ink)' }}>
            {FAQ.map((f) => (
              <div key={f.q} className="v-prin">
                <span className="t">{f.q}</span>
                <span className="b">{f.a}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 48 }} data-reveal>
          <Link href="/contact" className="btn btn-dark">Book a discovery call <span aria-hidden="true">→</span></Link>
          <Link href="/services" className="btn btn-ghost">See what we do</Link>
        </div>
      </section>
    </>
  )
}
