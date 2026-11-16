import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { getSetting, audit } from '@/lib/admin/db'
import { sendMail, leadAlertHtml, alertsConfigured, DEFAULT_LEAD_ALERTS, type LeadAlertCfg } from '@/lib/lead-alerts'
import { SITE_URL } from '@/lib/env'

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

/** POST - send a sample alert to the configured recipients. */
export async function POST() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const cfg = { ...DEFAULT_LEAD_ALERTS, ...((await getSetting<LeadAlertCfg>('lead_alerts')) || {}) }
  try {
    await sendMail({
      from: cfg.from,
      to: cfg.to,
      cc: cfg.cc,
      subject: 'Test: this is what a new lead looks like',
      html: leadAlertHtml(
        {
          publicId: 'TEST-0000', name: 'Test Person', email: 'test@example.com', phone: '416 555 0123',
          company: 'Example Co', services: ['Web development'], formType: 'contact', sourcePage: '/',
          channel: 'Organic Search', source: 'google', medium: 'organic',
          message: 'This is a test alert sent from the admin. No lead was created.',
        },
        `${SITE_URL.replace(/\/$/, '')}/admin/leads`
      ),
    })
    await audit(auth.user.email, 'lead_alert_test')
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not send the test.' }, { status: 400 })
  }
}
