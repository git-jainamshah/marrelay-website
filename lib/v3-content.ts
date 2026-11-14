/**
 * v3 redesign: shared copy for the home showcase, service pages and pricing.
 *
 * Prices are never hard-coded here. They come from the admin-managed packages
 * table (lib/pricing.ts) with lib/admin/pricing-defaults.ts as the fallback.
 *
 * Tone rules for this file: short, no guarantees, no em dashes. Packages are
 * starting points and the examples under them are examples of work, not a
 * promise of scope. Most projects end up on a custom quote.
 */

export type ServiceKey = 'web' | 'data' | 'seo' | 'social' | 'eng'

export type ServiceV3 = {
  key: ServiceKey
  /** value used by ?service= on the contact form (unchanged) */
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
  /** tool marks shown as icons; the row always ends with "and more" */
  tools: { name: string; src: string }[]
  posterSlot: string
}

const B = '/assets/brands/'
const T = {
  google: { name: 'Google', src: B + 'google-mark.png' },
  microsoft: { name: 'Microsoft', src: B + 'microsoft-mark.png' },
  adobe: { name: 'Adobe', src: B + 'adobe-mark.png' },
  openai: { name: 'OpenAI', src: B + 'openai-mark.png' },
  ga4: { name: 'Google Analytics 4', src: B + 'ga4-mark.png' },
  gtm: { name: 'Google Tag Manager', src: B + 'gtm-mark.png' },
  gsc: { name: 'Search Console', src: B + 'search-console-mark.png' },
  tealium: { name: 'Tealium', src: B + 'tealium-mark.png' },
  onetrust: { name: 'OneTrust', src: B + 'onetrust-mark.png' },
  gads: { name: 'Google Ads', src: B + 'google-ads-mark.png' },
  bing: { name: 'Microsoft Ads', src: B + 'bing-ads-mark.png' },
  autocad: { name: 'AutoCAD', src: B + 'autocad-mark.png' },
  solidworks: { name: 'SolidWorks', src: B + 'solidworks-mark.png' },
  fusion: { name: 'Fusion 360', src: B + 'fusion-mark.png' },
  inventor: { name: 'Inventor', src: B + 'inventor-mark.png' },
}

export const SERVICES_V3: ServiceV3[] = [
  {
    key: 'web', param: 'web', pricingKey: 'web-development', url: '/services/web-development',
    short: 'Web', full: 'Web Development', sub: 'Sites, stores, product UI',
    kicker: 'Web development',
    h1: 'Websites that load fast, read clearly and sell.',
    intro: 'Marketing sites, online stores and product front-ends your team can edit after launch.',
    cta: 'Start a web project',
    hook: 'Live in weeks, not months.',
    chips: ['Marketing sites', 'Online stores', 'Product UI'],
    rows: [
      ['Typical work', 'Marketing sites, landing pages, online stores, web app front-ends.'],
      ['Usually included', 'Design, build, a CMS you can edit, analytics wired in, a performance pass.'],
      ['Time', 'Around two weeks for a landing page. Four to six weeks for a full site.'],
      ['You keep', 'The code, the design files and every account.'],
    ],
    tools: [T.google, T.microsoft, T.adobe, T.openai],
    posterSlot: 'service-web-poster',
  },
  {
    key: 'data', param: 'data', pricingKey: 'data-analytics', url: '/services/data-analytics',
    short: 'Data', full: 'Data & Analytics', sub: 'Tracking, dashboards, reports',
    kicker: 'Data and analytics',
    h1: 'Analytics you can trust, and reports people read.',
    intro: 'Tracking plans, GA4 and Tag Manager, consent, dashboards and a short weekly readout.',
    cta: 'Start a data project',
    hook: 'Numbers you can trust.',
    chips: ['GA4 and Tag Manager', 'Consent Mode', 'Dashboards'],
    rows: [
      ['Typical work', 'Tracking plans, GA4, Tag Manager, server-side tagging, Consent Mode v2.'],
      ['Usually included', 'A dashboard and a one-page weekly report in plain language.'],
      ['Time', 'About a week for an audit. Two to three weeks for a full setup.'],
      ['You keep', 'The documented plan and admin access to every property.'],
    ],
    tools: [T.ga4, T.gtm, T.gsc, T.tealium, T.onetrust],
    posterSlot: 'service-data-poster',
  },
  {
    key: 'seo', param: 'seo', pricingKey: 'seo-ads', url: '/services/seo-ads',
    short: 'SEO & Ads', full: 'SEO & Ads', sub: 'Search, paid, content',
    kicker: 'SEO and paid ads',
    h1: 'Be the first result, not the loudest one.',
    intro: 'Technical SEO, content and paid search, judged on cost per customer and improved week by week.',
    cta: 'Get a growth plan',
    hook: 'Found first, not loudest.',
    chips: ['Technical SEO', 'Google and Microsoft Ads', 'Landing page tests'],
    rows: [
      ['Typical work', 'Technical and content SEO, Google Ads, Microsoft Ads, Meta.'],
      ['Usually included', 'Weekly optimisation notes and a monthly review call.'],
      ['Shape', 'A one-off audit, or a monthly retainer with a three-month minimum.'],
      ['You keep', 'Ad accounts and content, in your name from day one.'],
    ],
    tools: [T.gads, T.bing, T.gsc, T.ga4],
    posterSlot: 'service-seo-poster',
  },
  {
    key: 'social', param: 'social', pricingKey: 'social', url: '/services/social',
    short: 'Social', full: 'Social', sub: 'Content, community, creators',
    kicker: 'Social and community',
    h1: 'A consistent voice and a community that answers back.',
    intro: 'Strategy, content, posting and community for small brands that want to show up every week.',
    cta: "Let's talk social",
    hook: 'Show up every week.',
    chips: ['Content pillars', 'Posting and replies', 'Creator partners'],
    rows: [
      ['Typical work', 'Strategy, content pillars, posting, community replies, creator partnerships.'],
      ['Rhythm', 'A monthly calendar, regular posts and daily community time.'],
      ['Usually included', 'A monthly report and a creative review.'],
      ['You keep', 'Every account, asset and template.'],
    ],
    tools: [T.adobe, T.google, T.openai, T.microsoft],
    posterSlot: 'service-social-poster',
  },
  {
    key: 'eng', param: 'engineering', pricingKey: 'engineering', url: '/services/engineering',
    short: 'Engineering', full: 'Engineering & CAD', sub: 'CAD, drafting, 3D models',
    kicker: 'Engineering and CAD',
    h1: 'Drawings that leave no room to guess.',
    intro: 'Mechanical drafting, production drawings and 3D models for hardware founders, fabricators and contractors. The side of the studio we built first.',
    cta: 'Send a brief',
    hook: 'Drawings, not guesses.',
    chips: ['Production drawings', '3D models', 'Assemblies and BOMs'],
    rows: [
      ['Typical work', 'Production drawings, assemblies, BOMs, 3D models and as-builts.'],
      ['Standards', 'Your title block and standards, with revision tracking.'],
      ['Time', 'A few days per drawing. One to two weeks for a full assembly.'],
      ['Formats', 'DWG, DXF, STEP, STL and PDF, plus native source files.'],
    ],
    tools: [T.autocad, T.solidworks, T.fusion, T.inventor],
    posterSlot: 'service-eng-poster',
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
  { n: '01', title: 'Quick call', body: 'Thirty minutes, no pitch deck. If we are not the right fit, we will say so and point you somewhere better.', when: 'Same week, free' },
  { n: '02', title: 'One-page plan', body: 'Scope, price, timeline and what success looks like, on a single page.', when: 'Within a few days, free' },
  { n: '03', title: 'Build and demo', body: 'Short sprints. A working demo most Fridays, adjustments on Monday.', when: 'Most projects, four to six weeks' },
  { n: '04', title: 'Launch and grow', body: 'Everything handed over. We stay on to measure and improve if you want us to.', when: 'Ongoing, monthly' },
]

/**
 * The pricing stance, used on every pricing block.
 * Small fixed packages exist to make starting easy. Most work is quoted.
 */
export const PRICING_NOTE = {
  kicker: 'How pricing works',
  title: 'Fixed starting points. Custom for everything else.',
  body: 'The packages below are simple, fixed-price ways to start a small project with us. Most clients end up on a custom plan, because real projects have specific asks. Either way the price is agreed on one page before any work begins.',
  examples: 'The items listed under each package are examples of the kind of work it covers, not a fixed checklist.',
  cta: 'Ask for a custom quote',
}

/** Price label for the first (entry) package of a service. */
export function startingPrice(pkgs: { price: string; priceNote?: string }[]) {
  const p = pkgs[0]
  if (!p) return { price: '', unit: '' }
  const note = (p.priceNote || '').trim()
  return { price: p.price, unit: note && note !== 'flat' && note !== 'from' ? note : '' }
}
