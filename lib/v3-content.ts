/**
 * v3 redesign: static copy shared by the home showcase, service pages and
 * pricing page. Prices are NOT here: they always come from the admin-managed
 * packages table (lib/pricing.ts), with lib/admin/pricing-defaults.ts as the
 * offline fallback.
 */

export type ServiceKey = 'web' | 'data' | 'seo' | 'social' | 'eng'

export type ServiceV3 = {
  key: ServiceKey
  /** value used by ?service= on the contact form (unchanged from before) */
  param: string
  /** packages page_key in the admin pricing table */
  pricingKey: string
  url: string
  short: string
  full: string
  sub: string
  kicker: string
  h1: string
  intro: string
  cta: string
  hook: string
  chips: string[]
  rows: [string, string][]
  tools: string
  logos: string[]
  /** media slot keys (lib/media-slots.ts) */
  heroSlot?: string
  posterSlot: string
}

const B = '/assets/brands/'

export const SERVICES_V3: ServiceV3[] = [
  {
    key: 'web', param: 'web', pricingKey: 'web-development', url: '/services/web-development',
    short: 'Web', full: 'Web Development', sub: 'Sites, stores, product UI',
    kicker: 'Services · Web development',
    h1: 'Websites that load fast, read clearly and sell.',
    intro: 'Marketing sites, online stores and product front-ends, built so your team can edit them after launch.',
    cta: 'Start a web project',
    hook: 'Live in 14 days.',
    chips: ['Marketing sites', 'Shopify stores', 'Product UI', 'A CMS you can edit'],
    rows: [
      ['What we build', 'Marketing websites, landing pages, Shopify stores, web app front-ends.'],
      ['Included', 'Design, development, CMS setup, content migration, analytics, performance and accessibility pass.'],
      ['Timeline', '14 days for a landing page. 4–6 weeks for a full site.'],
      ['You own', 'The repository, design files, and every hosting and CMS account.'],
    ],
    tools: 'Next.js · Figma · Webflow · Shopify · Contentful · WordPress',
    logos: [B + 'nextjs.png', B + 'figma.png', B + 'webflow.png', B + 'shopify.png', B + 'contentful.png', B + 'wordpress.png'],
    heroSlot: 'service-web-hero', posterSlot: 'service-web-poster',
  },
  {
    key: 'data', param: 'data', pricingKey: 'data-analytics', url: '/services/data-analytics',
    short: 'Data', full: 'Data & Analytics', sub: 'Tracking, dashboards, reports',
    kicker: 'Services · Data & analytics',
    h1: 'Analytics you can trust, and reports people read.',
    intro: 'Tracking plans, GA4 and Tag Manager, Consent Mode, dashboards and a one-page weekly readout.',
    cta: 'Start a data project',
    hook: 'Numbers you can trust.',
    chips: ['GA4 + Tag Manager', 'Server-side tagging', 'Consent Mode v2', 'Weekly one-pager'],
    rows: [
      ['What we set up', 'Event tracking plan, GA4, Google Tag Manager, server-side tagging, Consent Mode v2.'],
      ['Reporting', 'A custom dashboard and a one-page weekly report in plain language.'],
      ['Timeline', '1 week for an audit. 2–3 weeks for a full setup.'],
      ['You own', 'Documented tracking plan and admin access to every property.'],
    ],
    tools: 'GA4 · Tag Manager · Search Console · Looker',
    logos: [B + 'ga4-mark.png', B + 'gtm-mark.png', B + 'search-console-mark.png'],
    heroSlot: 'service-data-hero', posterSlot: 'service-data-poster',
  },
  {
    key: 'seo', param: 'seo', pricingKey: 'seo-ads', url: '/services/seo-ads',
    short: 'SEO & Ads', full: 'SEO & Ads', sub: 'Search, paid, content',
    kicker: 'Services · SEO & paid ads',
    h1: 'Be the first result, not the loudest one.',
    intro: 'Technical SEO, content and paid search, measured against cost per customer and improved week by week.',
    cta: 'Get a growth plan',
    hook: 'Found first, not loudest.',
    chips: ['Technical SEO', 'Google & Meta ads', 'Landing page tests', 'Weekly optimisation'],
    rows: [
      ['Channels', 'Technical and content SEO, Google Ads, Microsoft Ads, Meta.'],
      ['Reporting', 'Weekly optimisation notes and a monthly review call.'],
      ['Engagement', 'One-off audit or a monthly retainer, 3-month minimum.'],
      ['You own', 'Ad accounts and content, in your name from day one.'],
    ],
    tools: 'Google Ads · Search Console · Meta',
    logos: [B + 'google-ads-mark.png', B + 'search-console-mark.png'],
    posterSlot: 'service-seo-poster',
  },
  {
    key: 'social', param: 'social', pricingKey: 'social', url: '/services/social',
    short: 'Social', full: 'Social', sub: 'Content, community, creators',
    kicker: 'Services · Social & community',
    h1: 'A consistent voice and a community that answers back.',
    intro: 'Strategy, content, posting and community management for small brands that want to show up every week.',
    cta: "Let's talk social",
    hook: 'Show up every week.',
    chips: ['Content pillars', '12+ posts a month', 'Community replies', 'Creator partners'],
    rows: [
      ['What we do', 'Strategy, content pillars, posting, community replies, creator partnerships.'],
      ['Cadence', '12+ posts a month and daily community management.'],
      ['Reporting', 'Monthly performance report and creative review.'],
      ['You own', 'Every account, asset and template.'],
    ],
    tools: 'Instagram · LinkedIn · TikTok',
    logos: [],
    posterSlot: 'service-social-poster',
  },
  {
    key: 'eng', param: 'engineering', pricingKey: 'engineering', url: '/services/engineering',
    short: 'Engineering', full: 'Engineering & CAD', sub: 'CAD, drafting, 3D models',
    kicker: 'Services · Engineering & CAD',
    h1: 'Drawings that leave no room to guess.',
    intro: 'Mechanical drafting, production drawings and 3D models for hardware founders, fabricators and contractors. The side of the studio we built first.',
    cta: 'Send a brief',
    hook: 'Drawings, not guesses.',
    chips: ['Production drawings', '3D models', 'Assemblies + BOMs', 'DWG · STEP · PDF'],
    rows: [
      ['What we produce', 'Production drawings, assemblies, BOMs, 3D models and as-builts.'],
      ['Standards', 'Your title block and standards, with revision tracking.'],
      ['Turnaround', '2–4 days per drawing. 1–2 weeks for a full assembly.'],
      ['Formats', 'DWG, DXF, STEP, STL and PDF, plus native source files.'],
    ],
    tools: 'AutoCAD · SolidWorks · Fusion 360',
    logos: [B + 'autocad-mark.png', B + 'solidworks-mark.png', B + 'fusion-mark.png'],
    heroSlot: 'service-eng-hero', posterSlot: 'service-eng-poster',
  },
]

export const serviceByParam = (param: string) => SERVICES_V3.find((s) => s.param === param)

/** Case studies: copy for cards and navigation. The pages keep their own detailed content. */
export const CASES_V3 = [
  { key: 'web', cat: 'Web development', url: '/projects/web-development', slot: 'project-web-video', poster: 'service-web-poster',
    title: 'A website that sells, not just sits there.', desc: 'Rebuilding a slow, hard-to-edit site into a fast one the team can run themselves.' },
  { key: 'data', cat: 'Data & analytics', url: '/projects/analytics-tagging', slot: 'project-analytics-video', poster: 'service-data-poster',
    title: 'Stop guessing. Measure what works.', desc: 'Turning an untrusted analytics stack into accurate GA4 and server-side tagging.' },
  { key: 'eng', cat: 'Engineering & CAD', url: '/projects/engineering-drawings', slot: 'project-eng-video', poster: 'service-eng-poster',
    title: 'Drawings that leave no room to guess.', desc: 'Precise CAD documentation that cuts rework and helps small shops win bigger jobs.' },
]

export const PROCESS_V3 = [
  { n: '01', title: 'Quick call', body: 'Thirty minutes, no pitch deck. If we can’t help, we’ll tell you who can.', when: 'Same week · free' },
  { n: '02', title: 'One-page plan', body: 'Scope, price, timeline and what success looks like, on a single page.', when: '3 working days · free' },
  { n: '03', title: 'Build and demo', body: 'One-week sprints. A working demo every Friday, adjustments on Monday.', when: '4–6 weeks · most projects' },
  { n: '04', title: 'Launch and grow', body: 'Everything handed over. We stay on to measure and improve, if you want us to.', when: 'Ongoing · monthly' },
]

/** Price label "from $X" / "$X /mo" for the first (entry) package of a service. */
export function startingPrice(pkgs: { price: string; priceNote?: string }[]) {
  const p = pkgs[0]
  if (!p) return { price: '', unit: '' }
  const note = (p.priceNote || '').trim()
  return { price: p.price, unit: note && note !== 'flat' && note !== 'from' ? note : '' }
}
