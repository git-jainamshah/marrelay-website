/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next'
import Link from 'next/link'
import { getSlot } from '@/lib/media-slots-server'

export const metadata: Metadata = {
  title: 'About Marrelay',
  description:
    'Marrelay is a Toronto digital studio working on one fixed project price instead of an hourly rate. Web, data and analytics, SEO and ads, social, and engineering drafting, for startups and small businesses in Canada and the US.',
  alternates: { canonical: '/about' },
  openGraph: { url: '/about' },
}

const FAQ = [
  {
    q: 'What is Marrelay?',
    a: 'Marrelay is a Toronto-based digital studio. We design, build and grow websites and digital products for startups and small businesses across Canada and the US. We work remotely, with one small, senior team on every project, for a price agreed before the work starts.',
  },
  {
    q: 'Why does Marrelay charge a fixed price instead of an hourly rate?',
    a: 'Because an hourly rate bills you for the overrun. Projects scoped in hours tend to run past the hours, and the client absorbs the difference while the agency carries no cost for a loose estimate. A fixed price moves that risk onto us, which is where we think it belongs. It also means the scoping conversation at the start has to be honest, so we ask more questions than you may expect.',
  },
  {
    q: 'What does Marrelay do?',
    a: 'Web development, data and analytics implementation, SEO and paid ads, and social are done in house, by us. Engineering and CAD drafting we scope and stand behind, with the drafting done by a specialist we work with. Either way you get one contract and one point of contact.',
  },
  {
    q: 'How does Marrelay price projects?',
    a: 'You hire us for a project, not for hours. We put the scope and one number on a single page before any work begins, and that number does not change because the work took longer than we thought. If you ask for something outside the agreed scope, we price it before we build it.',
  },
  {
    q: 'Where is Marrelay based?',
    a: 'Toronto, Canada. We do not keep a physical office. We work remotely and take on projects across Canada and the US, and further afield when the fit is right.',
  },
  {
    q: 'Who is Marrelay for?',
    a: 'Startups and small businesses that want one small, senior team to take a project end to end, for a price agreed up front, and to own everything at the finish.',
  },
]

const FIXED = [
  {
    t: 'The number comes before the work.',
    b: 'Scope and price on one page. You approve it, and that is what you pay. It does not move because the hours did.',
  },
  {
    t: 'We ask more questions than you expect.',
    b: 'A fixed price only works if the scope is honest at the start, so the first call goes deeper than most. If the budget does not match what you are describing, we would rather tell you then than three invoices in.',
  },
  {
    t: 'New requests get priced before they get built.',
    b: 'Want something outside what we agreed? We tell you what it costs and you decide. Nothing turns up on an invoice that you have not already seen and approved.',
  },
]

const PRINCIPLES = [
  {
    n: '01',
    t: 'You talk to the people doing the work.',
    b: 'No account managers and no handoffs. If we are the wrong fit for what you need, we will say so on the first call and point you somewhere better.',
  },
  {
    n: '02',
    t: 'You see something working, not a status report.',
    b: 'Progress you can click and react to, on a regular cadence, rather than a document telling you that progress happened.',
  },
  {
    n: '03',
    t: 'Everything is yours when we finish.',
    b: 'Code, files, accounts and keys, all transferred at handover. No lock-in, and nothing that quietly stops working the day you stop paying us.',
  },
  {
    n: '04',
    t: 'Small on purpose.',
    b: 'We keep the studio small so the work gets senior attention. It also means we take fewer projects at a time, which is a trade we have made deliberately.',
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
          both. We think that is backwards, so we quote one price for the whole project and we hold it.
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
              Marrelay began in 2026. The work behind it is older. We came up building websites and then implementing
              the digital analytics behind them, the tracking and measurement that lets whoever is paying for the
              traffic see what it actually did.
            </p>
            <p>
              That second half is where we kept watching the same thing happen. A project gets scoped in hours. The
              hours run out before the work is finished, because they usually do. The timeline moves, the invoices
              keep arriving, and the client quietly absorbs the difference. Nobody is being dishonest about it. The
              model just does not reward anyone for getting the estimate right.
            </p>
            <p>
              Fixed-price work used to be normal, and we think there is a real need for it again. So we built the
              studio we would have wanted to hire, with the part we disagreed with taken out.
            </p>
          </div>
        </div>
      </section>

      <section className="v-wrap v-sec v-statement" data-reveal>
        <p>
          One number, agreed before anything starts. If the work takes longer than we thought, that is our problem,
          not your change order.
        </p>
      </section>

      <section className="v-wrap v-sec">
        <div className="v-split">
          <div className="l sticky" data-reveal>
            <span className="v-kick">How the price works</span>
            <p className="v-body">
              A fixed price is only worth anything if it survives contact with the project. Here is what we hold
              ourselves to so that it does.
            </p>
          </div>
          <div className="r" style={{ borderTop: '1px solid var(--v-ink)' }}>
            {FIXED.map((f) => (
              <div key={f.t} className="v-prin" data-reveal>
                <span className="t">{f.t}</span>
                <span className="b">{f.b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="v-wrap v-sec">
        <div className="v-split">
          <div className="l sticky" data-reveal>
            <span className="v-kick">What we do</span>
            <h2 className="v-h2-sm">Ours, and honestly ours.</h2>
          </div>
          <div className="r" data-reveal>
            <div className="v-stance">
              <div><h3>In house</h3></div>
              <div>
                <p>
                  Web development, data and analytics implementation, SEO and paid ads, and social. The people who
                  build the site are the same people who set up its tracking and run the ads on it, so nothing gets
                  lost in a handoff between two agencies that have never spoken.
                </p>
              </div>
            </div>
            <div className="v-stance">
              <div><h3>With a specialist</h3></div>
              <div>
                <p>
                  Engineering and CAD drafting. We are not going to pretend this one sits in house. We scope it, we
                  stand behind the delivery and the deadline, and the drafting itself is done by a specialist we
                  work with. You still get one contract, one price and one person to call.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="v-wrap v-sec">
        <div className="v-split">
          <div className="l" data-reveal>
            <span className="v-kick">How we work</span>
            <p className="v-body">
              Not a mission statement. These are the rules we actually run projects by, and if we ever break one,
              call us on it.
            </p>
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
