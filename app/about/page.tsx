/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next'
import Link from 'next/link'
import { getSlot } from '@/lib/media-slots-server'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Marrelay is a founder-led digital studio in Toronto. We started in engineering drawings, grew into web, data, social, and SEO - and kept the honest, hands-on way of working.',
  alternates: { canonical: '/about' },
  openGraph: { url: '/about' },
}

const HISTORY = [
  { n: '01', t: 'Drafting roots', b: 'The studio begins with CAD, blueprints and technical documentation. Precision first.', w: 'The start' },
  { n: '02', t: 'Going digital', b: 'Clients kept asking for websites and branding. We learned to ship pixels as carefully as parts.', w: 'The turn' },
  { n: '03', t: 'Full-stack studio', b: 'Web, data, social and SEO joined the bench. One team, end to end, no handoffs.', w: 'Today' },
  { n: '04', t: 'What’s next', b: 'Growing carefully. Freelance specialists when a project needs them, founders always in the room.', w: 'Tomorrow' },
]

const PRINCIPLES = [
  { n: '01', t: 'You talk to the people doing the work.', b: 'No account managers and no handoffs. If we’re the wrong fit, we say so on the first call and point you somewhere better.' },
  { n: '02', t: 'The price is fixed before we start.', b: 'One page, one number. The number we say is the number you pay, and changes are priced before they’re made.' },
  { n: '03', t: 'You see progress every Friday.', b: 'A working demo, not a status report. Then honest readouts and iteration after launch.' },
  { n: '04', t: 'Everything is yours when we finish.', b: 'Code, files, accounts and keys, transferred at handover. No lock-in, ever.' },
  { n: '05', t: 'Small on purpose.', b: 'We keep the studio lean so every project gets senior attention, not the intern treatment.' },
]

export default async function AboutPage() {
  const image = await getSlot('about-image')
  return (
    <>
      <section className="v-wrap v-top">
        <div className="v-crumb">
          <Link href="/">Home</Link><span>/</span><span className="here">About</span>
        </div>
        <span className="v-label" data-reveal>About the studio</span>
        <h1 className="v-about-h1" data-reveal data-delay="1">We started Marrelay to be the studio we wanted to hire.</h1>
      </section>

      <div className="v-wrap" style={{ marginTop: 'clamp(56px,7vw,96px)' }}>
        <div className="v-about-img" data-reveal="wipe">
          <img src={image} alt="People moving through a Toronto station" />
        </div>
      </div>

      <section className="v-wrap v-sec">
        <div className="v-split">
          <div className="l" data-reveal><span className="v-label">Our story</span></div>
          <div className="r v-story" data-reveal>
            <p>
              The engineering and CAD side came first: four years of drafting and 3D modelling, where &ldquo;almost
              right&rdquo; doesn&apos;t exist. Clients kept asking for help with their websites, then their tracking,
              then their ads. Marrelay is what happened when we said yes.
            </p>
            <p>
              We stay small on purpose. The person on your first call is the person doing the work, and that
              doesn&apos;t change halfway through the project. Founder-led, based in Toronto, hands-on with every
              single project.
            </p>
          </div>
        </div>
      </section>

      <section className="v-wrap v-sec">
        <div className="v-split">
          <div className="l sticky" data-reveal>
            <span className="v-label">Where we come from</span>
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

      <section className="v-wrap v-sec v-sec-b">
        <div className="v-split">
          <div className="l" data-reveal>
            <span className="v-label">How we work</span>
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
