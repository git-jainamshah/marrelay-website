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

export function leadAlertHtml(lead: LeadForAlert, adminUrl: string) {
  const row = (label: string, value?: string) =>
    value ? `<tr><td style="padding:7px 14px 7px 0;color:#6A6964;font-size:13px;white-space:nowrap;vertical-align:top">${esc(label)}</td><td style="padding:7px 0;font-size:14px;color:#0E0E0D">${esc(value)}</td></tr>` : ''

  const where = [lead.channel, lead.source, lead.medium].filter(Boolean).join(' / ')
  return `<!DOCTYPE html><html><body style="margin:0;background:#F2F1EC;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
  <div style="background:#0E0E0D;color:#F2F1EC;padding:18px 22px">
    <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;opacity:.7">New lead · ${esc(FORM_LABELS[lead.formType || ''] || lead.formType || 'Website')}</div>
    <div style="font-size:22px;margin-top:6px">${esc(lead.name || 'Someone')} got in touch</div>
  </div>
  <div style="background:#ffffff;padding:20px 22px;border:1px solid #D8D6CE;border-top:0">
    <table style="border-collapse:collapse;width:100%">
      ${row('Name', lead.name)}
      ${row('Email', lead.email)}
      ${row('Phone', lead.phone)}
      ${row('Company', lead.company)}
      ${row('Wants', (lead.services || []).join(', '))}
      ${row('Page', lead.sourcePage)}
      ${row('Came from', where)}
      ${row('Campaign', lead.campaign)}
      ${row('Reference', lead.publicId)}
    </table>
    ${lead.message ? `<div style="margin-top:16px;padding-top:14px;border-top:1px solid #D8D6CE">
      <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6A6964;margin-bottom:6px">Message</div>
      <div style="font-size:14px;line-height:1.55;color:#0E0E0D;white-space:pre-wrap">${esc(lead.message)}</div></div>` : ''}
    <div style="margin-top:20px">
      <a href="${esc(adminUrl)}" style="display:inline-block;background:#D7262C;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:999px;font-size:14px">Open in the admin</a>
    </div>
    ${lead.email ? `<p style="font-size:12px;color:#6A6964;margin:16px 0 0">Reply to this email and it goes straight to ${esc(lead.email)}.</p>` : ''}
  </div>
  <p style="font-size:11px;color:#8B8A85;text-align:center;margin:16px 0 0">Sent by the Marrelay website when a new lead arrives.</p>
</div></body></html>`
}

/**
 * Fire a "new lead" alert. Never throws: a mail problem must not stop a lead
 * being saved. Returns why it did not send, for logging.
 */
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
