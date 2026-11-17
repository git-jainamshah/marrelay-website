/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    unoptimized: false,
  },
  // Legacy brand asset paths (pre Martek -> Marrelay rename). The production DB
  // settings (company logo/icon), previously shared links and cached social cards
  // may still point at the old filenames, so keep serving them transparently.
  // Baseline security headers. Deliberately no Content-Security-Policy here:
  // GTM, Cookiebot, Meta and the admin all inject scripts at runtime, so a CSP
  // needs to be built against a real inventory of sources and tested, rather
  // than guessed at and shipped.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      { source: '/assets/martek-mark.png', destination: '/assets/marrelay-mark.png' },
      { source: '/assets/martek-group-header.png', destination: '/assets/marrelay-header.png' },
      { source: '/assets/martek-offical-logo.png', destination: '/assets/marrelay-official-logo.png' },
      { source: '/assets/martek-only-logo.png', destination: '/assets/marrelay-only-logo.png' },
    ]
  },
  async redirects() {
    return [
      // Landing pages live under /lp/* so they are easy to identify.
      { source: '/launch', destination: '/lp/launch', permanent: true },
      { source: '/landing-page/launch', destination: '/lp/launch', permanent: true },
    ]
  },
}

module.exports = nextConfig
