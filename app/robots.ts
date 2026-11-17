import { MetadataRoute } from 'next'
import { isProduction, SITE_URL } from '@/lib/env'

export default async function robots(): Promise<MetadataRoute.Robots> {
  // QA and DEV must never be crawled: an indexed qa.marrelay.com would be a full
  // duplicate of the production site and would compete with it in search.
  if (!isProduction) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  // Admin-managed extra rules (graceful fallback when DB is unavailable)
  let extraDisallow: string[] = []
  try {
    const { getSetting } = require('@/lib/admin/db') as typeof import('@/lib/admin/db')
    const cfg = await getSetting<{ extraDisallow: string[] }>('robots_txt')
    if (cfg?.extraDisallow) extraDisallow = cfg.extraDisallow
  } catch {
    // no DB - defaults only
  }

  // AI crawlers split into two families, and the distinction decides whether we
  // appear in AI answers at all:
  //
  //   training  GPTBot, ClaudeBot, Google-Extended, CCBot ...  no citations, no traffic
  //   citation  the agents below                              these are what cite and link us
  //
  // Cloudflare prepends a managed block to this file that disallows a long list
  // of TRAINING agents, which is the policy we want. The risk is that the list is
  // maintained by Cloudflare, not by us, so a future update could quietly add a
  // citation agent and drop us out of AI answers with no deploy on our side.
  //
  // Naming them here is the guard. Per RFC 9309 the most specific match wins, and
  // where an allow and a disallow are equivalent the allow is used, so an explicit
  // "Allow: /" for these agents survives a managed "Disallow: /" being added above.
  // /api/ stays closed to them, same as everyone else.
  const CITATION_AGENTS = [
    'OAI-SearchBot',    // OpenAI, powers ChatGPT search citations
    'ChatGPT-User',     // OpenAI, fetches a page when a user asks for it
    'Claude-SearchBot', // Anthropic, Claude's search index
    'Claude-User',      // Anthropic, user-initiated fetch
    'PerplexityBot',    // Perplexity, indexing for citations
    'Perplexity-User',  // Perplexity, user-initiated fetch
  ]

  return {
    rules: [
      ...CITATION_AGENTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: ['/api/', ...extraDisallow],
      })),
      {
        userAgent: '*',
        allow: '/',
        // '/admin' is intentionally NOT listed here - listing it in robots.txt would
        // advertise its existence. It's protected by auth + X-Robots-Tag + meta noindex
        // and excluded from the sitemap instead.
        //
        // '/_next/' must NOT be blocked. Google needs the CSS and JS bundles under
        // /_next/static/ to render the page; blocking them makes Googlebot evaluate a
        // partially-rendered page and shows up as "Blocked by robots.txt" in Search
        // Console. /_next/image is the image optimiser, needed for Google Images.
        disallow: ['/api/', ...extraDisallow],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
