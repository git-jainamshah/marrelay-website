/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next'
import Link from 'next/link'
import { getSlot } from '@/lib/media-slots-server'

export const metadata: Metadata = {
  title: 'About Marrelay',
  description:
    'Marrelay is a Toronto digital studio for startups and small businesses in Canada and the US. Web, data, SEO, social and engineering, for one fixed project price, not by the hour. Here is how we work.',
  alternates: { canonical: '/about' },
  openGraph: { url: '/about' },
}

const FAQ = [
  {
    q: 'What is Marrelay?',
    a: 'Marrelay is a Toronto-based digital studio. We design, build and grow websites and digital products for startups and small businesses across Canada and the US. We work remotely, with one small, senior team on every project.',
  },
  {
    q: 'What does Marrelay do?',
    a: 'Five disciplines under one team: web development, data and analytics, SEO and paid ads, social, and engineering and CAD drafting. The people who build your site also set up the tracking and run the ads, so nothing gets lost between agencies.',
  },
  {
    q: 'How does Marrelay price projects?',
    a: 'You hire Marrelay for a project, not for hours. We agree a fixed price on one page before any work begins, and it does not change with the hours the work takes. You still get a timeline, and we deliver to it.',
  },
  {
    q: 'Where is Marrelay based?',
    a: 'Toronto, Canada. We do not keep a physical office; we work remotely and take on projects across Canada and the US, and further afield when the fit is right.',
  },
  {
    q: 'Who is Marrelay for?',
    a: 'Startups and small businesses that want one small, senior team to take a project end to end, for a price agreed up front, and to own everything at the finish.',
  },
]

const HISTORY = [
  { n: '01', t: 'Drafting roots', b: 'The studio begins with CAD, blueprints and technical documentation. Precision first.', w: 'The start' },
  { n: '02', t: 'Going digital', b: 'Clients kept asking for websites and branding. We learned to ship pixels as carefully as parts.', w: 'The turn' },
  { n: '03', t: 'Full-stack studio', b: 'Web, data, social and SEO joined the bench. One team, end to end, no handoffs.', w: 'Today' },
  { n: '04', t: 'What’s next', b: 'Growing carefully. Trusted specialists when a project needs them, the people who pitched you always in the room.', w: 'Tomorrow' },
]

const PRINCIPLES = [
  { n: '01', t: 'You talk to the people doing the work.', b: 'No account managers and no handoffs. If we’re the wrong fit, we say so on the first call and point you somewhere better.' },
  { n: '02', t: 'The price is fixed before we start.', b: 'One page, one number. You hire us for the project, not by the hour, so the number we say is the number you pay however long the work takes. Changes are priced before they’re made.' },
  { n: '03', t: 'You see progress every Friday.', b: 'A working demo, not a status report. Then honest readouts and iteration after launch.' },
  { n: '04', t: 'Everything is yours when we finish.', b: 'Code, files, accounts and keys, transferred at handover. No lock-in, ever.' },
  { n: '05', t: 'Small on purpose.', b: 'We keep the studio lean so every project gets senior attention, not the intern treatment.' },
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
        <h1 className="v-about-h1" data-reveal data-delay="1">We started Marrelay to be the studio we wanted to hire.</h1>
        <p className="v-about-lede" data-reveal data-delay="2">
          Marrelay is a Toronto digital studio. We design, build and grow websites and digital products for startups
          and small businesses across Canada and the US, for one fixed project price, not by the hour.
        </p>
      </section>

      <div className="v-wrap" style={{ marginTop: 'clamp(56px,7vw,96px)' }}>
        <div className="v-about-img" data-reveal="wipe">
          <img src={image} alt="People moving through a Toronto station" />
        </div>
      </div>

      <section className="v-wrap v-sec">
        <div className="v-split">
          <div className="l" data-reveal><span className="v-kick">Our story</span></div>
          <div className="r v-story" data-reveal>
            <p>
              The engineering and CAD side came first: years of drafting and 3D modelling, where &ldquo;almost
              right&rdquo; doesn&apos;t exist. That habit, scope it up front and check it at every gate, is how we
              approach a website, an analytics setup or an ad account now.
            </p>
            <p>
              We stay small on purpose. The person on your first call is the person doing the work, and that
              doesn&apos;t change halfway through the project. Based in Toronto, working remotely with clients across
              Canada and the US, with the same hands on every project.
            </p>
          </div>
        </div>
      </section>

      <section className="v-wrap v-sec">
        <div className="v-split">
          <div className="l sticky" data-reveal>
            <span className="v-kick">Where we come from</span>
            <p className="v-body">
              We build digital things the way a draftsperson builds a drawing set: scoped up front, checked at every
              gate, and delivered so you can actually use it without us.
            </p>
          </div>
          <div className="r v-steps sm">
            {HISTORY.map((h) => (
              <div key={h.n} className="v-step" data-reveal>
                <span className="n">{h.n}</span>
                <div className="b">
                  <span className="t">{h.t}</span>
                  <span className="d">{h.b}</span>
                  <span className="w">{h.w}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="v-wrap v-sec">
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
      </section>

      <section className="v-wrap v-sec v-sec-b">
        <div className="v-split">
          <div className="l" data-reveal>
            <span className="v-kick">How we work</span>
            <p className="v-body">No mission-statement poetry, just the rules we actually run projects by. If we ever break one, call us on it.</p>
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
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 48 }} data-reveal>
          <Link href="/contact" className="btn btn-dark">Book a discovery call <span aria-hidden="true">→</span></Link>
          <Link href="/services" className="btn btn-ghost">See what we do</Link>
        </div>
      </section>
    </>
  )
}
