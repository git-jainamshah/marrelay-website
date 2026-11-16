/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { getSlots } from '@/lib/media-slots-server'
import { getPackageOverrides } from '@/lib/pricing'
import { SERVICES_V3 } from '@/lib/v3-content'
import { OFFER, offerRow, type OfferRow } from '@/lib/launch-offer'
import LeadForm from '@/components/home/LeadForm'
import Faq from '@/components/v3/Faq'

export const metadata: Metadata = {
  title: '30% off your first project',
  description:
    'A flat 30% off your first project with Marrelay. Web, data and analytics, social, SEO and ads, engineering and CAD. One fixed price agreed before we start. Toronto, working across Canada and the US.',
  alternates: { canonical: '/lp/launch' },
  openGraph: {
    title: 'Marrelay - 30% off your first project',
    description: 'A flat 30% off your first project, across every service. One fixed price, agreed before we start.',
    url: '/lp/launch',
    images: [{ url: '/assets/marrelay-header.png', width: 1200, height: 630, alt: 'Marrelay 30% offer' }],
  },
  // Paid-social landing. Kept out of the index so it does not compete with core pages.
  robots: { index: false, follow: true },
}

const STEPS = [
  { n: '01', t: 'Send the form', d: 'Four fields. Name, email, phone and what you need. It takes about a minute.', w: 'Today' },
  { n: '02', t: 'A free 30-minute call', d: 'We reply within one business day with a few times. No pitch deck, no pressure.', w: 'Within 1 business day' },
  { n: '03', t: 'A fixed quote, 30% already off', d: 'One page. The scope, the timeline and the price, with the discount applied to the total.', w: '2 to 3 days after the call' },
  { n: '04', t: 'We build, you see it weekly', d: 'A working demo every Friday. At the end you keep the code, the files and every account.', w: 'From week one' },
]

const FAQS = [
  {
    q: `What is the catch with ${OFFER.percent}% off?`,
    a: 'None that we hide. We are a young studio and we would rather spend the first projects building work we can show than spend it on ads. The scope, the timeline and the price are all agreed in writing before you pay anything, and the discount comes off the total you are quoted.',
  },
  {
    q: 'Does the discount apply to any service?',
    a: 'Yes. Web, data and analytics, social, SEO and ads, and engineering and CAD. If a project spans two of them, the discount comes off the whole quote, not one part of it.',
  },
  {
    q: 'Is this hourly or a fixed price?',
    a: 'Fixed. You get one number for the whole project before we start, and that is the number you pay. If you ask for something outside the agreed scope we quote that separately, and you decide.',
  },
  {
    q: 'What do I actually own at the end?',
    a: 'Everything. The code, the design files, the analytics properties and the ad accounts, all in your name. There is no licence to renew and nothing that stops working if you leave.',
  },
  {
    q: 'Where are you, and who does the work?',
    a: 'We are in Toronto and work remotely with clients across Canada and the US. The person who answers your first email is the person who builds the project.',
  },
]

export default async function LaunchPage() {
  const [slots, ...svcPkgs] = await Promise.all([
    getSlots(),
    ...SERVICES_V3.map((s) => getPackageOverrides(s.pricingKey)),
  ])

  // Every figure below is worked out from the live pricing table, so the page
  // can never quote a saving that disagrees with the pricing pages.
  const rows = SERVICES_V3
    .map((s, i) => offerRow(s.key, s.full, s.url, svcPkgs[i]))
    .filter((r): r is OfferRow => r !== null)

  return (
    <>
      {/* HERO */}
      <section className="v-phero full v-hero lp-hero" id="top">
        <img src={slots['lp-launch-hero']} alt="City skyline at night" />
        <div className="scrim" />
        <div className="v-wrap inner">
          <div className="meta" data-reveal>
            <span>Offer</span>
            <span>Toronto · Canada &amp; US</span>
          </div>
          <h1>
            <span data-reveal="line" data-delay="1"><span>Get <em className="lp-pc">{OFFER.percent}%</em> off</span></span>
            <span data-reveal="line" data-delay="2"><span>your first project.</span></span>
            <span data-reveal="line" data-delay="3"><span className="v-muted">Every service. One fixed price.</span></span>
          </h1>
          <div className="foot" data-reveal data-delay="4">
            <p>
              A flat {OFFER.percent}% comes off {OFFER.appliesTo}, whichever service it is. You get one number for the
              whole job before we start, a working demo every Friday, and everything in your name at the end.
            </p>
            <div className="ctas">
              <Link href="#claim" className="btn btn-light">Claim your {OFFER.percent}% <span aria-hidden="true">→</span></Link>
              <Link href="#saving" className="btn btn-ghost-light">See what that saves</Link>
              <span className="v-cta-note">Free call first, then a fixed quote on one page. No obligation.</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATEMENT */}
      <section className="v-wrap v-sec v-statement">
        <p data-reveal>
          The discount comes off the total, not off the care.{' '}
          <span className="v-muted">
            Same scope, same weekly demos, same handover. The only difference is the number at the bottom of the quote.
          </span>
        </p>
      </section>

      {/* WHAT IT SAVES - every number computed from the live pricing table */}
      <section id="saving" className="v-wrap v-sec">
        <div className="v-head" data-reveal>
          <div>
            <span className="v-kick"><i>01</i>What {OFFER.percent}% actually saves</span>
            <h2 className="v-h2"><span>Real prices,</span><span>{OFFER.percent}% lighter.</span></h2>
          </div>
          <p className="v-body">
            These are our starting packages, straight off the pricing pages, with the discount applied. Bigger projects
            are quoted on the call, and the same {OFFER.percent}% comes off those too.
          </p>
        </div>

        <div className="lp-rates" data-reveal>
          <div className="lp-rate-head" aria-hidden="true">
            <span>Service</span><span>Starting package</span><span>Regular</span><span>With {OFFER.percent}% off</span><span>You keep</span>
          </div>
          {rows.map((r) => (
            <Link key={r.key} href={r.href} className="lp-rate">
              <span className="sv">{r.service}</span>
              <span className="pk">{r.pkg}{r.note && <i> · {r.note}</i>}</span>
              <span className="was"><s>{r.regular}</s></span>
              <span className="now">{r.discounted}</span>
              <span className="save">{r.saving}<i aria-hidden="true">→</i></span>
            </Link>
          ))}
        </div>
        <p className="lp-rates-note">
          Prices in Canadian dollars. The discount applies to the project total on your first project with us.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section className="v-wrap v-sec">
        <div className="v-split">
          <div className="l sticky" data-reveal>
            <span className="v-kick"><i>02</i>How it works</span>
            <h2 className="v-h2">Four steps to a fixed quote.</h2>
            <p className="v-body">
              You will know the price, the timeline and who is doing the work before you pay anything. If the quote is
              not right for you, that is a fine place to stop.
            </p>
            <Link href="#claim" className="v-link">Start at step one →</Link>
          </div>
          <div className="r v-steps">
            {STEPS.map((st) => (
              <div key={st.n} className="v-step" data-reveal>
                <span className="n">{st.n}</span>
                <div className="b">
                  <span className="t">{st.t}</span>
                  <span className="d">{st.d}</span>
                  <span className="w">{st.w}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLAIM */}
      <section id="claim" className="v-wrap v-sec">
        <div className="v-start lp-claim" data-reveal>
          <div className="l">
            <span className="v-kick"><i>03</i>Claim the offer</span>
            <h2>Tell us what you need.</h2>
            <p>
              Four fields is all we need to get started. We reply within one business day with a few times for a free
              30-minute call, and your {OFFER.percent}% is noted on the file from the moment this lands.
            </p>
            <ul className="lp-assure">
              <li>A fixed price, agreed before any work starts</li>
              <li>A working demo every Friday</li>
              <li>You own the code, the files and the accounts</li>
              <li>No retainer to sign and nothing to cancel</li>
            </ul>
            <Link href="/contact" className="v-link">Rather send a full brief? Contact page →</Link>
          </div>
          <div className="r">
            <Suspense fallback={null}>
              <LeadForm
                idPrefix="lp"
                formId="launch-offer-form"
                formType={OFFER.formType}
                location="lp-launch"
                submitLabel={`Claim my ${OFFER.percent}%`}
                contextNote={`[${OFFER.percent}% offer] Submitted from the launch offer page.`}
              />
            </Suspense>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="v-wrap v-sec v-sec-b">
        <div className="v-head" data-reveal>
          <div>
            <span className="v-kick"><i>04</i>Before you ask</span>
            <h2 className="v-h2">The honest answers.</h2>
          </div>
        </div>
        <Faq items={FAQS} />
        <p className="lp-closing" data-reveal>
          Still deciding? <Link href="#claim">Claim the {OFFER.percent}%</Link> and ask on the call. Nothing is owed
          until you accept a quote.
        </p>
      </section>
    </>
  )
}
