import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import ContactLeadForm from '@/components/ContactLeadForm'
import { getCompany, getEnabledSocials } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    "Let's book a discovery call. Fill this in and we'll reply within a few hours with a couple of times that work.",
  alternates: { canonical: '/contact' },
  openGraph: { url: '/contact' },
}

const NEXT = [
  { n: '01', t: 'We reply', b: 'Within one business day, with a few times that work.' },
  { n: '02', t: 'A 30-minute call', b: 'We learn the goal and tell you honestly if we’re a fit.' },
  { n: '03', t: 'A one-page proposal', b: 'Scope, fixed price and timeline within three working days.' },
]

export default async function ContactPage() {
  const [company, enabledSocials] = await Promise.all([getCompany(), getEnabledSocials()])
  const email = company.email || 'hello@marrelay.com'
  const where = [company.addressLine1, company.addressLine2].filter(Boolean).join(', ') || 'Toronto, Canada'
  return (
    <section className="v-wrap v-top v-sec-b" id="form">
      <div className="v-crumb">
        <Link href="/">Home</Link><span>/</span><span className="here">Contact</span>
      </div>
      <div className="v-contact">
        <div className="l">
          <span className="v-label" data-reveal>Contact us</span>
          <h1 data-reveal data-delay="1">Let&apos;s talk about your project.</h1>
          <p data-reveal data-delay="2">
            Tell us what you&apos;re building. A founder replies within one business day with a few times for a
            30-minute discovery call.
          </p>
          <div className="v-next" data-reveal data-delay="3">
            {NEXT.map((x) => (
              <div key={x.n}>
                <span className="n">{x.n}</span>
                <div><b>{x.t}</b><span>{x.b}</span></div>
              </div>
            ))}
          </div>
          <div className="v-cinfo" data-reveal>
            <div><span className="v-label">Email</span><a href={`mailto:${email}`}>{email}</a></div>
            <div><span className="v-label">Studio</span><span>{where}</span></div>
            {company.phone && (
              <div><span className="v-label">Phone</span><a href={`tel:${company.phone.replace(/[^+\d]/g, '')}`}>{company.phone}</a></div>
            )}
            {enabledSocials.length > 0 && (
              <div>
                <span className="v-label">Elsewhere</span>
                {enabledSocials.map((s) => (
                  <a key={s.platform} href={s.href} target="_blank" rel="noopener noreferrer">{s.platform} ↗</a>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="r" data-reveal>
          <Suspense fallback={null}>
            <ContactLeadForm />
          </Suspense>
        </div>
      </div>
    </section>
  )
}
