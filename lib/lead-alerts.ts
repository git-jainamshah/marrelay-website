/**
 * "New lead" email alerts, sent through Microsoft 365 (Graph API).
 *
 * Why Graph and not SMTP: Microsoft has turned SMTP AUTH off by default on
 * M365 tenants, so an app password is not a reliable route. Graph uses an app
 * registration with the Mail.Send application permission, which keeps working
 * and does not need a user to stay signed in.
 *
 * Needs three environment variables (set in Vercel, not in the repo):
 *   MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET
 * Everything else (on/off, who it goes to) is editable in the admin.
 */
import { getSetting } from '@/lib/admin/db'
import { DEFAULT_EMAIL_TEMPLATE, renderLeadEmail, renderSubject, type EmailTemplateCfg } from '@/lib/lead-email-template'
import { isProduction, envLabel } from '@/lib/env'

export type LeadAlertCfg = {
  enabled: boolean
  /** The mailbox the alert is sent from. Must be a real mailbox in the tenant. */
  from: string
  to: string[]
  cc: string[]
  /** Also alert for leads the site marked as spam. Off by default. */
  includeSpam?: boolean
}

export const DEFAULT_LEAD_ALERTS: LeadAlertCfg = {
  enabled: true,
  from: 'hello@marrelay.com',
  to: ['hello@marrelay.com'],
  cc: ['jainam.shah@marrelay.com', 'binni.shah@marrelay.com', 'email.jainam@gmail.com', 'work.binni@gmail.com'],
  includeSpam: false,
}

export function alertsConfigured() {
  return !!(process.env.MS_TENANT_ID && process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET)
}

/** Client-credentials token for Microsoft Graph. Cached for its lifetime. */
let cached: { token: string; expires: number } | null = null
async function graphToken(): Promise<string> {
  if (cached && cached.expires > Date.now() + 60_000) return cached.token
  const tenant = process.env.MS_TENANT_ID!
  const body = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID!,
    client_secret: process.env.MS_CLIENT_SECRET!,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  })
  const r = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
  })
  const d = await r.json()
  if (!r.ok || !d.access_token) throw new Error(d.error_description || d.error || 'Could not get a Microsoft token.')
  cached = { token: d.access_token, expires: Date.now() + (Number(d.expires_in) || 3600) * 1000 }
  return cached.token
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const addr = (list: string[]) => list.filter(Boolean).map((a) => ({ emailAddress: { address: a.trim() } }))

/** Send one message through Graph as the configured mailbox. */
export async function sendMail(opts: { from: string; to: string[]; cc?: string[]; replyTo?: string; subject: string; html: string }) {
  if (!alertsConfigured()) throw new Error('Microsoft 365 is not connected. Add MS_TENANT_ID, MS_CLIENT_ID and MS_CLIENT_SECRET.')
  if (!opts.from) throw new Error('No sending mailbox is set.')
  if (!opts.to.length && !(opts.cc || []).length) throw new Error('No recipients are set.')

  const token = await graphToken()
  const message: Record<string, unknown> = {
    subject: opts.subject,
    body: { contentType: 'HTML', content: opts.html },
    toRecipients: addr(opts.to),
    ccRecipients: addr(opts.cc || []),
  }
  // Reply goes to the person who enquired, so you can answer straight from the alert.
  if (opts.replyTo) message.replyTo = addr([opts.replyTo])

  const r = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(opts.from)}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, saveToSentItems: true }),
  })
  if (!r.ok) {
    const d = await r.json().catch(() => ({}))
    throw new Error(d?.error?.message || `Microsoft Graph refused the message (${r.status}).`)
  }
}

export type LeadForAlert = {
  id?: number | string
  publicId?: string
  name?: string
  email?: string
  phone?: string
  company?: string
  message?: string
  services?: string[]
  formType?: string
  sourcePage?: string
  channel?: string
  source?: string
  medium?: string
  campaign?: string
}

const FORM_LABELS: Record<string, string> = {
  contact: 'Contact form', 'promo-banner': 'Promo pop-up', offline: 'Offline', pitch: 'Pitch', other: 'Other',
}

export async function notifyNewLead(lead: LeadForAlert, siteUrl: string): Promise<{ sent: boolean; reason?: string }> {
  try {
    const cfg = { ...DEFAULT_LEAD_ALERTS, ...((await getSetting<LeadAlertCfg>('lead_alerts')) || {}) }
    if (!cfg.enabled) return { sent: false, reason: 'Alerts are switched off in the admin.' }
    if (!alertsConfigured()) return { sent: false, reason: 'Microsoft 365 credentials are not set.' }

    const tpl = { ...DEFAULT_EMAIL_TEMPLATE, ...((await getSetting<EmailTemplateCfg>('lead_email_template')) || {}) }
    const base = siteUrl.replace(/\/$/, '')
    const adminUrl = `${base}/admin/leads${lead.id ? `?open=${lead.id}` : ''}`
    const html = renderLeadEmail({
      cfg: tpl, lead, adminUrl, siteUrl: base,
      env: isProduction ? 'production' : 'staging',
      envLabel,
      logoUrl: `${base}/assets/marrelay-mark.png`,
    })
    const subject = (isProduction ? '' : `[${envLabel}] `) + renderSubject(tpl, lead)

    await sendMail({ from: cfg.from, to: cfg.to, cc: cfg.cc, replyTo: lead.email, subject, html })
    return { sent: true }
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : 'Unknown error' }
  }
}
