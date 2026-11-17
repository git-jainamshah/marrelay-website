/**
 * Default Open Graph / Twitter card image.
 *
 * Next.js REPLACES the `openGraph` object when a page declares its own, it does
 * not deep-merge it with the root layout's. So any page that sets
 * `openGraph: { url: '/x' }` silently drops the inherited image and shares as a
 * blank card. Every page spreads this in rather than relying on inheritance.
 *
 * Blog posts are the exception: they generate their own card through the
 * `opengraph-image` file convention.
 */
export const OG_IMAGES = [
  {
    url: '/assets/marrelay-header.png',
    width: 1200,
    height: 630,
    alt: 'Marrelay - Toronto digital studio',
  },
]
