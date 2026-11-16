import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { getSetting } from '@/lib/admin/db'
import { DEFAULT_EMAIL_TEMPLATE, renderLeadEmail, renderSubject, scoreLead, type EmailTemplateCfg } from '@/lib/lead-email-template'
import { SITE_URL, envLabel } from '@/lib/env'
import type { LeadForAlert } from '@/lib/lead-alerts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** A believable lead to render the preview against. */
const SAMPLE_LEAD: LeadForAlert & { budget: string; timeline: string } = {
  id: 0, publicId: 'MR-2026-0142',
  name: 'Priya Raman', email: 'priya@northfieldclinic.ca', phone: '416 555 0188',
  company: 'Northfield Clinic', formType: 'contact', sourcePage: '/services/web',
  services: ['Web development', 'SEO & Ads'],
  channel: 'Organic Search', source: 'google', medium: 'organic', campaign: '',
  budget: '25k-50k', timeline: 'Within the next month',
  message: 'We are opening a second location in the spring and our current site cannot handle online booking. We would like a rebuild with booking built in, and help getting found locally. Can we talk this week?',
}

/** GET ?env=production|staging - the email exactly as it would be sent. */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const env = req.nextUrl.searchParams.get('env') === 'staging' ? 'staging' : 'production'
  const cfg = { ...DEFAULT_EMAIL_TEMPLATE, ...((await getSetting<EmailTemplateCfg>('lead_email_template')) || {}) }

  // Let the page preview unsaved edits by passing them in.
  const over = req.nextUrl.searchParams.get('cfg')
  const merged: EmailTemplateCfg = over ? { ...cfg, ...JSON.parse(over) } : cfg

  const base = SITE_URL.replace(/\/$/, '')
  const html = renderLeadEmail({
    cfg: merged, lead: SAMPLE_LEAD, adminUrl: `${base}/admin/leads`, siteUrl: base,
    env, envLabel: env === 'staging' ? envLabel || 'Development' : undefined,
    logoUrl: `${base}/assets/marrelay-mark.png`,
  })

  if (req.nextUrl.searchParams.get('format') === 'json') {
    return NextResponse.json({ html, subject: renderSubject(merged, SAMPLE_LEAD), score: scoreLead(SAMPLE_LEAD) })
  }
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' } })
}
