import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { getSetting, audit } from '@/lib/admin/db'
import { sendMail, alertsConfigured, DEFAULT_LEAD_ALERTS, type LeadAlertCfg } from '@/lib/lead-alerts'
import { DEFAULT_EMAIL_TEMPLATE, renderLeadEmail, renderSubject, type EmailTemplateCfg } from '@/lib/lead-email-template'
import { SITE_URL, isProduction, envLabel } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET - is Microsoft 365 connected? */
export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  return NextResponse.json({
    configured: alertsConfigured(),
    missing: ['MS_TENANT_ID', 'MS_CLIENT_ID', 'MS_CLIENT_SECRET'].filter((k) => !process.env[k]),
  })
}

/**
 * POST - send a sample alert.
 *
 * Built through exactly the same path as a real alert: the saved template,
 * the same renderer, the same subject rules. A test that renders differently
 * from the real thing is worse than no test at all.
 */
export async function POST() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const cfg = { ...DEFAULT_LEAD_ALERTS, ...((await getSetting<LeadAlertCfg>('lead_alerts')) || {}) }
  const tpl = { ...DEFAULT_EMAIL_TEMPLATE, ...((await getSetting<EmailTemplateCfg>('lead_email_template')) || {}) }

  const sample = {
    id: 0, publicId: 'TEST-0000',
    name: 'Priya Raman', email: 'priya@northfieldclinic.ca', phone: '416 555 0188',
    company: 'Northfield Clinic', formType: 'contact', sourcePage: '/services/web',
    services: ['Web development', 'SEO & Ads'],
    channel: 'Organic Search', source: 'google', medium: 'organic', campaign: '',
    budget: '25k-50k', timeline: 'Within the next month',
    message: 'This is a test alert sent from the admin. No lead was created.',
  }

  const base = SITE_URL.replace(/\/$/, '')
  try {
    await sendMail({
      from: cfg.from,
      to: cfg.to,
      cc: cfg.cc,
      subject: `${isProduction ? '' : `[${envLabel}] `}Test · ${renderSubject(tpl, sample)}`,
      html: renderLeadEmail({
        cfg: tpl,
        lead: sample,
        adminUrl: `${base}/admin/leads`,
        siteUrl: base,
        env: isProduction ? 'production' : 'staging',
        envLabel,
        logoUrl: `${base}/assets/marrelay-mark.png`,
      }),
    })
    await audit(auth.user.email, 'lead_alert_test')
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not send the test.' }, { status: 400 })
  }
}
