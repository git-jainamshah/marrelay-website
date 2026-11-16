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

/** The three things a stranger needs before they will type their phone number. */
const PROOF = [
  'One fixed price, agreed in writing before any work starts',
  'A working demo every Friday, not a status report',
  'You own the code, the files and every account at the end',
]

const STEPS = [
  { n: '01', t: 'Send the form', d: 'Four fields. It takes about a minute.' },
  { n: '02', t: 'A free 30-minute call', d: 'We reply within one business day with a few times that suit you.' },
  { n: '03', t: 'A fixed quote, 30% off', d: 'One page: scope, timeline and price. Then you decide, with no pressure either way.' },
]

const FAQS = [
  {
    q: `What is the catch with ${OFFER.percent}% off?`,
    a: 'None that we hide. The discount buys us work we can show, so we would rather give it than spend the same money on ads. Nothing about the project gets smaller to pay for it: the scope, the timeline and the price are agreed in writing before you pay anything, and the 30% comes off the total you are quoted rather than off a number we quietly raised first.',
  },
  {
    q: 'Does it apply to any service, and is it hourly?',
    a: 'Any service: web, data and analytics, social, SEO and ads, engineering and CAD. If a project spans two of them the discount comes off the whole quote. Nothing here is hourly. You get one number for the whole project before we start, and that is the number you pay.',
  },
  {
    q: 'What do I actually own at the end?',
    a: 'Everything. The code, the design files, the analytics properties and the ad accounts, all in your name. There is no licence to renew and nothing that stops working if you leave.',
  },
  {
    q: 'Where are you, and who does the work?',
    a: 'We are in Toronto and work remotely across Canada and the US. You deal with the same small team from your first email through to handover, so you are never passed from a salesperson to a stranger once the quote is signed.',
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
      {/* HERO - the offer and the form share the first screen */}
      <section className="lp-hero" id="top">
        <img src={slots['lp-launch-hero']} alt="City skyline at night" />
        <div className="scrim" />
        <div className="v-wrap lp-hero-inner">
          <div className="lp-pitch">
            <div className="meta" data-reveal>
              <span>Digital studio</span>
              <span>Toronto · Canada &amp; US</span>
            </div>
            <h1>
              <span data-reveal="line" data-delay="1"><span>Get <em className="lp-pc">{OFFER.percent}%</em> off</span></span>
              <span data-reveal="line" data-delay="2"><span>your first project.</span></span>
            </h1>
            <p className="lp-sub" data-reveal data-delay="3">
              Websites, analytics, ads, social and CAD drawings. Tell us what you need and we will reply within one
              business day to put a free call in the diary. Your quote comes back as one fixed price with the{' '}
              {OFFER.percent}% already taken off.
            </p>
            <ul className="lp-proof" data-reveal data-delay="4">
              {PROOF.map((t) => <li key={t}>{t}</li>)}
            </ul>
            <p className="lp-why" data-reveal data-delay="5">
              <b>Why {OFFER.percent}%?</b> We are new. We would rather spend our first projects building work we can
              show than spend the same money on ads.
            </p>
          </div>

          <div className="lp-form" data-reveal data-delay="2">
            <div className="v-start lp-form-card">
              <div className="r">
                <Suspense fallback={null}>
                  <LeadForm
                    idPrefix="lp"
                    formId="launch-offer-form"
                    formType={OFFER.formType}
                    location="lp-launch"
                    heading={<>Claim your <span className="it">{OFFER.percent}%</span></>}
                    blurb="Four quick fields. We reply within one business day to set up a free call, and nothing is owed until you accept a quote."
                    submitLabel={`Claim my ${OFFER.percent}%`}
                    contextNote={`[${OFFER.percent}% offer] Submitted from the launch offer page.`}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT IT SAVES - every number computed from the live pricing table */}
      <section id="saving" className="v-wrap v-sec lp-sec">
        <div className="lp-lead" data-reveal>
          <h2 className="v-h2">What the {OFFER.percent}% actually saves you.</h2>
          <p className="v-body">
            These are our starting packages, straight off the pricing pages, with the discount applied. Bigger
            projects get quoted on the call, and the same {OFFER.percent}% comes off those too.
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

      {/* HOW IT WORKS - three beats, one row */}
      <section className="v-wrap v-sec lp-sec">
        <div className="lp-lead" data-reveal>
          <h2 className="v-h2">From form to fixed quote.</h2>
        </div>
        <div className="lp-steps" data-reveal>
          {STEPS.map((st) => (
            <div key={st.n} className="lp-step">
              <span className="n">{st.n}</span>
              <span className="t">{st.t}</span>
              <span className="d">{st.d}</span>
            </div>
          ))}
        </div>
        <p className="lp-closing" data-reveal>
          <Link href="#top">The form is back at the top</Link> whenever you are ready. Nothing is owed until you
          accept a quote.
        </p>
      </section>

      {/* FAQ */}
      <section className="v-wrap v-sec v-sec-b lp-sec">
        <div className="lp-lead" data-reveal>
          <h2 className="v-h2">Before you ask.</h2>
        </div>
        <Faq items={FAQS} />
      </section>
    </>
  )
}
