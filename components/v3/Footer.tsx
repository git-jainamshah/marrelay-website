'use client'

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SOCIALS } from '@/lib/social'
import { SERVICE_NAV } from './Header'

type Company = {
  name: string; tagline: string; addressLine1: string; addressLine2: string
  email: string; phone: string; logoIcon: string
}
type Social = { platform: string; href: string }

const COMPANY_FALLBACK: Company = {
  name: 'Marrelay', tagline: 'Digital studio', addressLine1: 'Toronto, ON', addressLine2: 'Canada',
  email: 'hello@marrelay.com', phone: '', logoIcon: '/assets/marrelay-mark.png',
}

const CASES = [
  { label: 'Web Development', href: '/projects/web-development' },
  { label: 'Data & Analytics', href: '/projects/analytics-tagging' },
  { label: 'Engineering & CAD', href: '/projects/engineering-drawings' },
]

/**
 * Site footer + the "Have a project in mind?" band above it.
 * Company profile and socials are admin-managed (Admin → Company / Socials),
 * read from the same public endpoint as before.
 */
export default function Footer() {
  const pathname = usePathname() || '/'
  const [company, setCompany] = useState<Company>(COMPANY_FALLBACK)
  const [socials, setSocials] = useState<Social[]>(SOCIALS.map((s) => ({ platform: s.name, href: s.href })))

  useEffect(() => {
    fetch('/api/public/site-config')
      .then((r) => r.json())
      .then((d) => {
        if (d.company?.name) setCompany({ ...COMPANY_FALLBACK, ...d.company })
        if (Array.isArray(d.socials)) setSocials(d.socials)
      })
      .catch(() => {})
  }, [])

  const email = company.email || 'hello@marrelay.com'
  const address = [company.addressLine1, company.addressLine2].filter(Boolean).join(', ')
  const openSearch = () => window.dispatchEvent(new Event('open-site-search'))

  return (
    <>
      {pathname !== '/contact' && (
        <section className="v-dark v-band">
          <div className="v-wrap v-band-in">
            <h2 data-reveal>
              Have a project in mind? Let&apos;s talk.
            </h2>
            <div className="v-band-r" data-reveal data-delay="1">
              <a href={`mailto:${email}`} className="mail">{email}</a>
              <Link href="/contact" className="btn btn-light btn-sm">
                Contact us <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      <footer className="v-dark">
        <div className="v-wrap v-foot-in">
          <div className="v-foot-cols">
            <div>
              <span className="v-label">Services</span>
              {SERVICE_NAV.map((s) => <Link key={s.href} href={s.href}>{s.label}</Link>)}
            </div>
            <div>
              <span className="v-label">Case studies</span>
              {CASES.map((s) => <Link key={s.href} href={s.href}>{s.label}</Link>)}
            </div>
            <div>
              <span className="v-label">Studio</span>
              <Link href="/about">About us</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/blogs">Journal</Link>
              <Link href="/contact">Contact us</Link>
            </div>
            <div>
              <span className="v-label">Contact</span>
              <a href={`mailto:${email}`}>{email}</a>
              {company.phone && <a href={`tel:${company.phone.replace(/[^+\d]/g, '')}`}>{company.phone}</a>}
              {address && <span className="addr">{address}</span>}
              {socials.map((s) => (
                <a key={s.platform} href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.platform} ↗
                </a>
              ))}
            </div>
          </div>

          <div className="v-wordmark" aria-hidden="true">
            <img src={company.logoIcon || '/assets/marrelay-mark.png'} alt="" />
            <span>{company.name}</span>
          </div>

          <div className="v-foot-base">
            <span>© {new Date().getFullYear()} {company.name}. Founder-led digital studio, Toronto.</span>
            <div>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <button type="button" onClick={openSearch}>Search</button>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
