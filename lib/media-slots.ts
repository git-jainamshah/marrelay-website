/**
 * MEDIA SLOTS - the single source of truth for every media spot on the site.
 *
 * A slot is a named place on a page (hero video, banner, card image...).
 * Its VALUE is just a file path. The admin panel re-points slots to any file
 * in Storage by writing the mapping to the database (settings key
 * "media_slots") - no file copying, so it works on serverless too. The same
 * file can serve any number of slots.
 *
 * Site pages resolve values server-side via getSlot()/getSlots() with the
 * default below as fallback, so the site never breaks without a database.
 */

export type SlotDef = {
  key: string
  page: string        // human page name for the admin panel
  pageUrl: string
  section: string     // human section name within the page
  kind: 'photo' | 'video'
  defaultPath: string
}

export const SLOT_DEFS: SlotDef[] = [
  // ---- Home ----
  { key: 'home-hero-video', page: 'Home page', pageUrl: '/', section: 'Studio loop video (plays behind the Launch Sprint band)', kind: 'video', defaultPath: '/assets/hero-loop.mp4' },
  { key: 'home-proof-image', page: 'Home page', pageUrl: '/', section: 'Why work with us - photo', kind: 'photo', defaultPath: '/assets/office-dark-hero.png' },
  { key: 'home-minicta-image', page: 'Home page', pageUrl: '/', section: 'Lead form section - photo', kind: 'photo', defaultPath: '/assets/contact-us-form.jpg' },
  { key: 'home-hero-poster', page: 'Home page', pageUrl: '/', section: 'Hero poster photo (shows while the video loads)', kind: 'photo', defaultPath: '/assets/city-night.jpg' },
  { key: 'home-sprint-image', page: 'Home page', pageUrl: '/', section: 'Launch Sprint banner - background photo', kind: 'photo', defaultPath: '/assets/arch-curve.jpg' },
  { key: 'home-journal-image', page: 'Home page', pageUrl: '/', section: 'Journal - featured article photo', kind: 'photo', defaultPath: '/assets/blog-banner.jpg' },
  // ---- Service pages (hero background; also used by the home services showcase) ----
  { key: 'service-web-hero', page: 'Service: Web Development', pageUrl: '/services/web-development', section: 'Studio loop video (plays behind the Launch Sprint band)', kind: 'video', defaultPath: '/assets/web-dev-bg.mp4' },
  { key: 'service-web-poster', page: 'Service: Web Development', pageUrl: '/services/web-development', section: 'Hero poster photo', kind: 'photo', defaultPath: '/assets/city-blue.jpg' },
  { key: 'service-data-hero', page: 'Service: Data & Analytics', pageUrl: '/services/data-analytics', section: 'Studio loop video (plays behind the Launch Sprint band)', kind: 'video', defaultPath: '/assets/analytics-bg.mp4' },
  { key: 'service-data-poster', page: 'Service: Data & Analytics', pageUrl: '/services/data-analytics', section: 'Hero poster photo', kind: 'photo', defaultPath: '/assets/city-night.jpg' },
  { key: 'service-seo-poster', page: 'Service: SEO & Ads', pageUrl: '/services/seo-ads', section: 'Hero photo', kind: 'photo', defaultPath: '/assets/arch-curve.jpg' },
  { key: 'service-social-poster', page: 'Service: Social', pageUrl: '/services/social', section: 'Hero photo', kind: 'photo', defaultPath: '/assets/crowd.jpg' },
  { key: 'service-eng-hero', page: 'Service: Engineering & CAD', pageUrl: '/services/engineering', section: 'Studio loop video (plays behind the Launch Sprint band)', kind: 'video', defaultPath: '/assets/engineering-drawings-bg.mp4' },
  { key: 'service-eng-poster', page: 'Service: Engineering & CAD', pageUrl: '/services/engineering', section: 'Hero poster photo', kind: 'photo', defaultPath: '/assets/arch-tunnel.jpg' },
  // ---- About ----
  { key: 'about-image', page: 'About page', pageUrl: '/about', section: 'Full-width photo', kind: 'photo', defaultPath: '/assets/crowd.jpg' },
  // ---- Contact ----
  { key: 'contact-form-image', page: 'Contact page', pageUrl: '/contact', section: 'Form side photo', kind: 'photo', defaultPath: '/assets/contact-us-form.jpg' },
  // ---- Services overview ----
  { key: 'services-banner', page: 'Services overview page', pageUrl: '/services', section: 'Top banner', kind: 'photo', defaultPath: '/assets/business-services-banner-bg.jpg' },
  // ---- Blog ----
  { key: 'blogs-banner', page: 'Blog page', pageUrl: '/blogs', section: 'Top banner', kind: 'photo', defaultPath: '/assets/blogs-banner-bg.jpg' },
  { key: 'blog-card-1', page: 'Blog page', pageUrl: '/blogs', section: 'Blog card 1 image', kind: 'photo', defaultPath: '/assets/blog-1.jpg' },
  { key: 'blog-card-2', page: 'Blog page', pageUrl: '/blogs', section: 'Blog card 2 image', kind: 'photo', defaultPath: '/assets/blog-2.jpg' },
  { key: 'blog-card-3', page: 'Blog page', pageUrl: '/blogs', section: 'Blog card 3 image', kind: 'photo', defaultPath: '/assets/blog-3.jpg' },
  // ---- Case studies ----
  { key: 'case-studies-banner', page: 'Case Studies page', pageUrl: '/case-studies', section: 'Top banner image', kind: 'photo', defaultPath: '/assets/sample-project-bg.jpg' },
  // ---- Project pages ----
  { key: 'project-web-video', page: 'Project: Web Development', pageUrl: '/projects/web-development', section: 'Top banner video', kind: 'video', defaultPath: '/assets/web-dev-bg.mp4' },
  { key: 'project-analytics-video', page: 'Project: Analytics & Tagging', pageUrl: '/projects/analytics-tagging', section: 'Top banner video', kind: 'video', defaultPath: '/assets/analytics-bg.mp4' },
  { key: 'project-eng-video', page: 'Project: Engineering Drawings', pageUrl: '/projects/engineering-drawings', section: 'Top banner video', kind: 'video', defaultPath: '/assets/engineering-drawings-bg.mp4' },
]
