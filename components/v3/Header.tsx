'use client'

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SiteSearch from '@/components/SiteSearch'

/* ------------------------------------------------------------------
   Announcement bar. Copy is admin-managed (Admin → Announcements):
   a default plus per-path overrides, **bold** segments rendered as <b>.
   The per-page copy below is only the fallback when the DB is unreachable.
   ------------------------------------------------------------------ */
type BarCfg = { pill: string; text: string; ctaLabel: string; ctaHref: string; contactHref: string }
type AnnouncementCfg = { default: BarCfg; overrides: (BarCfg & { path: string })[] }

const FALLBACK_DEFAULT: BarCfg = {
  pill: 'New',
  text: 'We just launched a **fixed-price startup sprint**: a landing page in 14 days.',
  ctaLabel: 'See sprint pricing',
  ctaHref: '/pricing',
  contactHref: '/contact',
}
const FALLBACK_BY_PATH: Record<string, BarCfg> = {
  '/services/web-development': { pill: 'Web', text: 'Most launch sites go live in **4–6 weeks**. Landing-page sprints in 14 days.', ctaLabel: 'Start yours', ctaHref: '/contact?service=web', contactHref: '/contact?service=web' },
  '/services/data-analytics': { pill: 'Data', text: 'Most teams get a **clean dashboard + weekly report** within two weeks of kickoff.', ctaLabel: 'Get set up', ctaHref: '/contact?service=data', contactHref: '/contact?service=data' },
  '/services/social': { pill: 'Social', text: 'We become your **in-house content team**, strategy, posts, replies, and creator deals.', ctaLabel: "Let's talk", ctaHref: '/contact?service=social', contactHref: '/contact?service=social' },
  '/services/seo-ads': { pill: 'SEO & Ads', text: 'We move your **cost-per-acquisition down**, week by week, with receipts.', ctaLabel: 'Get a plan', ctaHref: '/contact?service=seo', contactHref: '/contact?service=seo' },
  '/services/engineering': { pill: 'Engineering', text: 'The side of the studio we built **first**, 4 years of CAD, drafting & 3D modelling.', ctaLabel: 'Send a brief', ctaHref: '/contact?service=engineering', contactHref: '/contact?service=engineering' },
  '/contact': { pill: 'Open', text: 'Currently taking on **new projects** - we keep slots limited to stay hands-on.', ctaLabel: 'Grab a slot', ctaHref: '/contact#form', contactHref: '/contact#form' },
}

const renderBold = (s: string) =>
  s.split('**').map((part, i) => (i % 2 === 1 ? <b key={i}>{part}</b> : <span key={i}>{part}</span>))

type CompanyCfg = { name: string; tagline: string; logoIcon: string }
type SocialCfg = { platform: string; label: string; href: string }

/* ------------------------------------------------------------------
   Navigation
   ------------------------------------------------------------------ */
export const SERVICE_NAV = [
  { label: 'Web Development', sub: 'Sites, stores, product UI', href: '/services/web-development' },
  { label: 'Data & Analytics', sub: 'Tracking, dashboards, reports', href: '/services/data-analytics' },
  { label: 'SEO & Ads', sub: 'Search, paid, content', href: '/services/seo-ads' },
  { label: 'Social', sub: 'Content, community, creators', href: '/services/social' },
  { label: 'Engineering & CAD', sub: 'CAD, drafting, 3D models', href: '/services/engineering' },
]
export const CASE_NAV = [
  { label: 'All case studies', sub: 'Overview', href: '/case-studies' },
  { label: 'A website that sells, not just sits there.', sub: 'Web development', href: '/projects/web-development' },
  { label: 'Stop guessing. Measure what works.', sub: 'Data & analytics', href: '/projects/analytics-tagging' },
  { label: 'Drawings that leave no room to guess.', sub: 'Engineering & CAD', href: '/projects/engineering-drawings' },
]
const DROPS = {
  services: { label: 'Services', href: '/services', kicker: 'Services', blurb: 'Five disciplines under one roof. Most clients start with one and add another once it works.', items: SERVICE_NAV },
  cases: { label: 'Case studies', href: '/case-studies', kicker: 'Case studies', blurb: 'Worked examples of how we approach real problems, end to end.', items: CASE_NAV },
} as const
type DropKey = keyof typeof DROPS

const LINKS = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'About us', href: '/about' },
  { label: 'Journal', href: '/blogs' },
  { label: 'Contact us', href: '/contact' },
]
const MOBILE = [
  { label: 'Services', href: '/services' },
  { label: 'Case studies', href: '/case-studies' },
  ...LINKS,
  { label: 'Home', href: '/' },
]

/** Pages that open on a full-bleed dark hero, where the header starts transparent. */
const hasDarkHero = (p: string) => p === '/' || p.startsWith('/services/') || p.startsWith('/projects/') || p.startsWith('/lp/')

export default function Header() {
  const pathname = usePathname() || '/'
  const [announcement, setAnnouncement] = useState<AnnouncementCfg | null>(null)
  const [company, setCompany] = useState<CompanyCfg | null>(null)
  const [socials, setSocials] = useState<SocialCfg[] | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [drop, setDrop] = useState<DropKey | null>(null)
  const [menu, setMenu] = useState(false)

  // Admin-managed config (same public endpoint the previous navbar used).
  useEffect(() => {
    fetch('/api/public/site-config')
      .then((r) => r.json())
      .then((d) => {
        if (d.announcement?.default) setAnnouncement(d.announcement)
        if (d.company?.name) setCompany(d.company)
        if (Array.isArray(d.socials)) setSocials(d.socials)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeAll = useCallback(() => { setMenu(false); setDrop(null) }, [])
  useEffect(() => { closeAll() }, [pathname, closeAll])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAll() }
    const onResize = () => { if (window.innerWidth >= 1120) setMenu(false) }
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => { document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize) }
  }, [closeAll])

  // Lock page scroll while the mobile menu is open (same body class as before).
  useEffect(() => {
    document.body.classList.toggle('m-open', menu)
    return () => document.body.classList.remove('m-open')
  }, [menu])

  const managed = announcement
    ? announcement.overrides?.find((o) => o.path === pathname) || announcement.default
    : null
  const bar = managed || FALLBACK_BY_PATH[pathname] || FALLBACK_DEFAULT

  const brandName = company?.name || 'Marrelay'
  const logo = company?.logoIcon || '/assets/marrelay-mark.png'
  const tagline = company?.tagline || 'Digital studio'

  const isOn = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/'))
  const groupOn = (k: DropKey) =>
    k === 'services' ? pathname.startsWith('/services') : pathname.startsWith('/case-studies') || pathname.startsWith('/projects')

  const tone = drop || menu ? 'is-drop' : hasDarkHero(pathname) && !scrolled ? 'is-dark' : ''
  const openSearch = () => { setMenu(false); setTimeout(() => window.dispatchEvent(new Event('open-site-search')), 40) }

  return (
    <header className={`v-hdr ${tone}${scrolled ? ' scrolled' : ''}`} onMouseLeave={() => setDrop(null)}>
      <div className="v-ann">
        <div className="v-wrap v-ann-row">
          <span>
            {bar.pill && <span className="v-pill">{bar.pill}</span>}
            <span>{renderBold(bar.text)}</span>
          </span>
          {bar.ctaLabel && <Link href={bar.ctaHref || '/pricing'}>{bar.ctaLabel} →</Link>}
        </div>
      </div>

      <nav className="v-wrap v-hdr-row" aria-label="Main">
        <Link href="/" className="v-logo" aria-label={`${brandName} home`}>
          <img src={logo} alt="" width={28} height={28} />
          <span className="v-logo-txt">
            <b>{brandName}</b>
            <small>{tagline}</small>
          </span>
        </Link>

        <div className="v-nav">
          {(Object.keys(DROPS) as DropKey[]).map((k) => (
            <div key={k} className="nav-drop" onMouseEnter={() => setDrop(k)} onFocus={() => setDrop(k)}>
              <Link
                href={DROPS[k].href}
                className={`nav-drop-btn${groupOn(k) ? ' on' : ''}`}
                aria-haspopup="true"
                aria-expanded={drop === k}
              >
                {DROPS[k].label}
                <span className="car" aria-hidden="true"></span>
              </Link>
            </div>
          ))}
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={isOn(l.href) ? 'on' : undefined} onMouseEnter={() => setDrop(null)}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="v-hdr-cta">
          <SiteSearch variant="pill" />
          <Link href={bar.contactHref || '/contact'} className="btn v-book">
            Book a call <span aria-hidden="true">↗</span>
          </Link>
          <button
            type="button"
            className="v-burger"
            aria-label="Open menu"
            aria-expanded={menu}
            data-dl-event="menu_open"
            data-dl-menu="mobile"
            onClick={() => setMenu(true)}
          >
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {drop && (
        /* `nav-drop` + hidden `nav-drop-btn` keep analytics' nav-group attribution for these links */
        <div className="v-drop nav-drop">
          <span className="nav-drop-btn" hidden>{DROPS[drop].label}</span>
          <div className="v-wrap v-drop-in">
            <div className="v-drop-intro">
              <span className="v-label on-dark">{DROPS[drop].kicker}</span>
              <p>{DROPS[drop].blurb}</p>
            </div>
            <div className="v-drop-grid">
              {DROPS[drop].items.map((d) => (
                <Link key={d.href} href={d.href} onClick={() => setDrop(null)}>
                  <b>{d.label}</b>
                  <small>{d.sub}</small>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {menu && (
        <div className="v-menu" role="dialog" aria-modal="true" aria-label="Site menu">
          <div className="v-menu-top">
            <b>Menu</b>
            <button type="button" className="v-menu-close" onClick={() => setMenu(false)}>Close</button>
          </div>
          <button type="button" className="v-menu-search" onClick={openSearch}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>
            Search the site
          </button>
          <div className="v-menu-links">
            {MOBILE.map((l) => (
              <Link key={l.href} href={l.href} className={isOn(l.href) ? 'on' : undefined} onClick={() => setMenu(false)}>
                <span>{l.label}</span>
                <small aria-hidden="true">↗</small>
              </Link>
            ))}
          </div>
          <Link href={bar.contactHref || '/contact'} className="btn btn-light v-book-m" onClick={() => setMenu(false)}>
            Book a call
          </Link>
          <span className="v-menu-mail">
            or email <a href="mailto:hello@marrelay.com">hello@marrelay.com</a>
          </span>
          {socials && socials.length > 0 && (
            <div className="v-menu-soc">
              {socials.map((s) => (
                <a key={s.platform} href={s.href} target="_blank" rel="noopener noreferrer" data-dl-event="social_click" data-dl-platform={s.platform.toLowerCase()}>
                  {s.platform}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  )
}
