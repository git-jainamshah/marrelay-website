/**
 * The "new lead" email. Branded like the site, with an importance score so
 * the most valuable enquiries are obvious at a glance in a phone inbox.
 *
 * Two looks, decided by the environment:
 *  - production: clean Marrelay branding
 *  - staging (dev / qa): the same, with a loud banner so nobody mistakes a
 *    test lead for a real one
 */
import { LeadForAlert } from '@/lib/lead-alerts'

export type EmailTemplateCfg = {
  subject: string
  intro: string
  footerNote: string
  buttonLabel: string
  showScore: boolean
}

export const DEFAULT_EMAIL_TEMPLATE: EmailTemplateCfg = {
  subject: 'New lead: {{name}}{{company_paren}} · {{form}}',
  intro: '{{name}} just got in touch through the {{form_lower}}. Reply to this email and it goes straight to them.',
  footerNote: 'Sent automatically by the Marrelay website when a new lead arrives.',
  buttonLabel: 'Open this lead in the admin',
  showScore: true,
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const FORM_LABELS: Record<string, string> = {
  contact: 'Contact form', 'promo-banner': 'Promo pop-up', offline: 'Offline', pitch: 'Pitch', other: 'Website',
}

/* ---------------- importance score ---------------- */

/** Pull a dollar figure out of whatever the budget field says. */
export function budgetValue(budget?: string): number {
  if (!budget) return 0
  const text = String(budget).toLowerCase().replace(/,/g, '')
  // Take the highest number mentioned, so "10k-25k" scores on 25k.
  const nums = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(k|m)?/g)].map((m) => {
    const n = parseFloat(m[1])
    return m[2] === 'k' ? n * 1000 : m[2] === 'm' ? n * 1000000 : n
  })
  if (!nums.length) return 0
  const max = Math.max(...nums)
  // A bare "25" in a budget field almost always means 25k.
  return max < 1000 && /\bk\b|budget|000/.test(text) === false && max >= 5 ? max * 1000 : max
}

/** How soon do they want it? Higher is more urgent. */
export function urgencyValue(timeline?: string): number {
  const t = String(timeline || '').toLowerCase()
  if (!t) return 0
  if (/asap|urgent|immediate|right away|this week|yesterday/.test(t)) return 2
  if (/month|4 week|few week|soon|next week/.test(t)) return 1.5
  if (/quarter|3 month|2 month/.test(t)) return 1
  if (/year|later|no rush|exploring|not sure/.test(t)) return 0.25
  return 0.5
}

export type LeadScore = { score: number; label: string; reasons: string[] }

/**
 * Importance out of 5: mostly the money, lifted by urgency and by the signals
 * that separate a real enquiry from a tyre-kicker (a company, a phone number,
 * a written message).
 */
export function scoreLead(lead: LeadForAlert & { budget?: string; timeline?: string }): LeadScore {
  const money = budgetValue(lead.budget)
  const reasons: string[] = []

  let s = 0
  if (money >= 50000) { s += 3; reasons.push('Budget 50k+') }
  else if (money >= 25000) { s += 2.5; reasons.push('Budget 25k+') }
  else if (money >= 10000) { s += 2; reasons.push('Budget 10k+') }
  else if (money >= 5000) { s += 1.5; reasons.push('Budget 5k+') }
  else if (money > 0) { s += 1; reasons.push('Small budget') }
  else reasons.push('No budget given')

  const u = urgencyValue(lead.timeline)
  if (u >= 2) { s += 1.5; reasons.push('Wants it urgently') }
  else if (u >= 1.5) { s += 1; reasons.push('Within weeks') }
  else if (u >= 1) { s += 0.5; reasons.push('This quarter') }
  else if (u > 0 && u < 0.5) reasons.push('No rush')

  if (lead.company) { s += 0.5; reasons.push('From a company') }
  if (lead.message && lead.message.trim().length > 80) { s += 0.5; reasons.push('Wrote a real message') }
  if (!lead.phone) { s -= 0.5; reasons.push('No phone number') }

  const score = Math.max(1, Math.min(5, Math.round(s * 2) / 2))
  const label = score >= 4.5 ? 'Very high' : score >= 3.5 ? 'High' : score >= 2.5 ? 'Medium' : score >= 1.5 ? 'Low' : 'Very low'
  return { score, label, reasons }
}

/* ---------------- template ---------------- */

function fill(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '')
}

export function templateVars(lead: LeadForAlert & { budget?: string; timeline?: string }) {
  const form = FORM_LABELS[lead.formType || ''] || 'Website'
  return {
    name: lead.name || 'Someone',
    company: lead.company || '',
    company_paren: lead.company ? ` (${lead.company})` : '',
    email: lead.email || '',
    phone: lead.phone || '',
    form,
    form_lower: form.toLowerCase(),
    budget: lead.budget || '',
    timeline: lead.timeline || '',
    reference: lead.publicId || '',
  }
}

export function renderSubject(cfg: EmailTemplateCfg, lead: LeadForAlert & { budget?: string; timeline?: string }) {
  return fill(cfg.subject || DEFAULT_EMAIL_TEMPLATE.subject, templateVars(lead))
}

/** Five dots, filled to the score. Works in every mail client (no images). */
function scoreDots(score: number) {
  let out = ''
  for (let i = 1; i <= 5; i++) {
    const full = score >= i
    const half = !full && score >= i - 0.5
    out += `<span style="display:inline-block;width:11px;height:11px;border-radius:999px;margin-right:4px;background:${full ? '#D7262C' : half ? 'linear-gradient(90deg,#D7262C 50%,#D8D6CE 50%)' : '#D8D6CE'}"></span>`
  }
  return out
}

export function renderLeadEmail(opts: {
  cfg: EmailTemplateCfg
  lead: LeadForAlert & { budget?: string; timeline?: string }
  adminUrl: string
  siteUrl: string
  env: 'production' | 'staging'
  envLabel?: string
  logoUrl: string
}) {
  const { cfg, lead, adminUrl, siteUrl, env, logoUrl } = opts
  const vars = templateVars(lead)
  const sc = scoreLead(lead)
  const staging = env === 'staging'

  const row = (label: string, value?: string, strong = false) =>
    value ? `<tr>
      <td style="padding:9px 16px 9px 0;color:#6A6964;font-size:12px;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;vertical-align:top;border-bottom:1px solid #E7E5DE">${esc(label)}</td>
      <td style="padding:9px 0;font-size:${strong ? '15px' : '14px'};color:#0E0E0D;${strong ? 'font-weight:600;' : ''}border-bottom:1px solid #E7E5DE">${value}</td></tr>` : ''

  const link = (href: string, text: string) => `<a href="${esc(href)}" style="color:#0E0E0D;text-decoration:underline">${esc(text)}</a>`
  const where = [lead.channel, lead.source, lead.medium].filter(Boolean).join(' / ')

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(renderSubject(cfg, lead))}</title></head>
<body style="margin:0;padding:0;background:#F2F1EC;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(vars.name)}${vars.company ? ` from ${esc(vars.company)}` : ''} · importance ${sc.score}/5 · ${esc(vars.budget || 'no budget given')}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F1EC;padding:28px 14px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#FFFFFF;border:1px solid #D8D6CE">

  ${staging ? `<tr><td style="background:#3F4C9B;color:#FFFFFF;padding:10px 24px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase">
    ${esc(opts.envLabel || 'Staging')} environment · test lead, not a real enquiry</td></tr>` : ''}

  <!-- header -->
  <tr><td style="background:#0E0E0D;padding:22px 24px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><img src="${esc(logoUrl)}" width="30" height="30" alt="Marrelay" style="display:block;border:0"></td>
      <td style="padding-left:11px;vertical-align:middle">
        <div style="color:#F2F1EC;font-family:Helvetica,Arial,sans-serif;font-size:17px;font-weight:600;letter-spacing:-.01em">Marrelay</div>
        <div style="color:#8B8A85;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:.1em;text-transform:uppercase">New lead</div>
      </td>
      <td align="right" style="color:#8B8A85;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:.08em;text-transform:uppercase">${esc(vars.form)}</td>
    </tr></table>
  </td></tr>

  <!-- name + score -->
  <tr><td style="padding:26px 24px 0;font-family:Helvetica,Arial,sans-serif">
    <div style="font-size:26px;line-height:1.15;letter-spacing:-.02em;color:#0E0E0D;font-weight:600">${esc(vars.name)}</div>
    ${vars.company ? `<div style="font-size:15px;color:#6A6964;margin-top:3px">${esc(vars.company)}</div>` : ''}
    <p style="font-size:14px;line-height:1.6;color:#2B2B30;margin:14px 0 0">${esc(fill(cfg.intro || '', vars))}</p>
  </td></tr>

  ${cfg.showScore ? `<tr><td style="padding:18px 24px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F1EC;border:1px solid #E7E5DE">
      <tr><td style="padding:14px 16px;font-family:Helvetica,Arial,sans-serif">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#6A6964">Importance</td>
          <td align="right" style="font-size:13px;color:#0E0E0D;font-weight:600">${sc.score} / 5 · ${esc(sc.label)}</td>
        </tr></table>
        <div style="margin-top:9px">${scoreDots(sc.score)}</div>
        <div style="font-size:11.5px;color:#6A6964;margin-top:9px">${esc(sc.reasons.join(' · '))}</div>
      </td></tr>
    </table>
  </td></tr>` : ''}

  <!-- details -->
  <tr><td style="padding:20px 24px 0;font-family:Helvetica,Arial,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      ${row('Email', lead.email ? link(`mailto:${lead.email}`, lead.email) : '', true)}
      ${row('Phone', lead.phone ? link(`tel:${lead.phone}`, lead.phone) : '', true)}
      ${row('Budget', esc(vars.budget))}
      ${row('Timeline', esc(vars.timeline))}
      ${row('Wants', esc((lead.services || []).join(', ')))}
      ${row('Page', esc(lead.sourcePage))}
      ${row('Came from', esc(where))}
      ${row('Campaign', esc(lead.campaign))}
      ${row('Reference', esc(vars.reference))}
    </table>
  </td></tr>

  ${lead.message ? `<tr><td style="padding:18px 24px 0;font-family:Helvetica,Arial,sans-serif">
    <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#6A6964;margin-bottom:7px">Their message</div>
    <div style="font-size:14px;line-height:1.6;color:#0E0E0D;white-space:pre-wrap;border-left:2px solid #D7262C;padding-left:13px">${esc(lead.message)}</div>
  </td></tr>` : ''}

  <!-- cta -->
  <tr><td style="padding:24px;font-family:Helvetica,Arial,sans-serif">
    <a href="${esc(adminUrl)}" style="display:inline-block;background:#D7262C;color:#FFFFFF;text-decoration:none;padding:13px 24px;border-radius:999px;font-size:14px;font-weight:600">${esc(cfg.buttonLabel || 'Open in the admin')}</a>
  </td></tr>

  <!-- footer -->
  <tr><td style="background:#0E0E0D;padding:18px 24px;font-family:Helvetica,Arial,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="color:#8B8A85;font-size:11.5px;line-height:1.6">
        ${esc(fill(cfg.footerNote || '', vars))}<br>
        <a href="${esc(siteUrl)}" style="color:#F2F1EC;text-decoration:none">${esc(siteUrl.replace(/^https?:\/\//, ''))}</a>
      </td>
      <td align="right" style="color:#8B8A85;font-size:11px;letter-spacing:.08em;text-transform:uppercase">Toronto</td>
    </tr></table>
  </td></tr>

</table>
</td></tr></table>
</body></html>`
}
