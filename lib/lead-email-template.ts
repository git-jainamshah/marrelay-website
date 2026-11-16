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
import { displayHost } from '@/lib/env'

export type EmailTemplateCfg = {
  subject: string
  intro: string
  footerNote: string
  buttonLabel: string
  showScore: boolean
}

export const DEFAULT_EMAIL_TEMPLATE: EmailTemplateCfg = {
  subject: 'New lead: {{name}}{{company_paren}} · {{form}}',
  intro: '',
  footerNote: 'Internal alert · Follow up from the lead dashboard.',
  buttonLabel: 'View lead',
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

/** Five segments, filled to the score. No images, so every client shows it. */
function scoreBars(score: number, accent: string) {
  let out = ''
  for (let i = 1; i <= 5; i++) {
    const on = score >= i - 0.25
    out += `<td width="16" style="width:16px;height:3px;line-height:3px;font-size:0;background:${on ? accent : '#E6E6E3'}">&nbsp;</td>`
    if (i < 5) out += '<td width="3" style="width:3px;font-size:0;line-height:3px">&nbsp;</td>'
  }
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${out}</tr></table>`
}

/** When the lead arrived, in Eastern time, the way the design shows it. */
function receivedAt(d = new Date()) {
  const date = d.toLocaleDateString('en-US', { timeZone: 'America/Toronto', month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { timeZone: 'America/Toronto', hour: 'numeric', minute: '2-digit' })
  return `${date} · ${time}`
}

export function renderLeadEmail(opts: {
  cfg: EmailTemplateCfg
  lead: LeadForAlert & { budget?: string; timeline?: string }
  adminUrl: string
  siteUrl: string
  env: 'production' | 'staging'
  envLabel?: string
  logoUrl: string
  receivedLabel?: string
}) {
  const { cfg, lead, adminUrl, siteUrl, env, logoUrl } = opts
  const vars = templateVars(lead)
  const sc = scoreLead(lead)
  const staging = env === 'staging'
  const ACCENT = '#D7262C'
  const INK = '#111111'
  const MUT = '#6B6B68'
  const RULE = '#EEEEEB'
  const GROUND = '#F4F4F2'
  const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif"

  const title = lead.company || lead.name || 'New enquiry'
  const sub = lead.company && lead.name ? lead.name : ''

  /**
   * One label/value row.
   *
   * Percentage columns, not a media query: Gmail's app strips <style> for
   * accounts it does not host, so anything that depends on a media query
   * renders one way there and another way everywhere else. Percentages give
   * the same two-column layout at every width, on every client.
   */
  const row = (label: string, value?: string, mono = false) => {
    if (!value) return ''
    return `<tr>
      <td width="30%" valign="top" style="width:30%;padding:10px 10px 10px 0;border-bottom:1px solid ${RULE};font-family:${FONT};font-size:12px;line-height:1.45;color:${MUT}">${esc(label)}</td>
      <td width="70%" valign="top" style="width:70%;padding:10px 0;border-bottom:1px solid ${RULE};font-family:${FONT};font-size:14px;line-height:1.45;color:${INK}${mono ? ";font-family:'SF Mono',Menlo,Consolas,monospace;font-size:13px;letter-spacing:.04em" : ''}">${value}</td>
    </tr>`
  }
  const link = (href: string, text: string) => `<a href="${esc(href)}" style="color:${INK};text-decoration:none">${esc(text)}</a>`

  // "(direct)" and "(none)" are placeholders, not information.
  const clean = (v?: string) => (!v || /^\((direct|none|not set)\)$/i.test(v) ? '' : v)
  const where = [clean(lead.channel), clean(lead.source)].filter(Boolean).join(' / ')

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">
<title>${esc(renderSubject(cfg, lead))}</title>
<style>
  /* Progressive enhancement only. Every rule that matters is inline, because
     the Gmail app drops this block entirely for non-Google accounts. */
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; text-size-adjust: 100%; }
  a { text-decoration: none; }
  @media only screen and (max-width: 420px) {
    .pad { padding-left: 20px !important; padding-right: 20px !important; }
    .h1 { font-size: 22px !important; }
  }
</style></head>
<body style="margin:0;padding:0;background:${GROUND};-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(title)} · priority ${sc.score}/5 · ${esc(vars.budget || 'no budget given')}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${GROUND}" style="background:${GROUND};width:100%;margin:0;padding:0">
<tr><td align="center" style="padding:28px 12px">

  <!-- fluid container: never wider than 680, never forced wider than the screen -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:680px;font-family:${FONT}">

    ${staging ? `<tr><td align="center" style="padding:0 0 12px;font-family:${FONT};font-size:10px;line-height:1.5;letter-spacing:.1em;text-transform:uppercase;color:#8A6A00">
      Test lead · ${esc(opts.envLabel || 'Development')} environment</td></tr>` : ''}

    <tr><td bgcolor="#FFFFFF" style="background:#FFFFFF;border:1px solid #E6E6E3">

      <!-- header: left cell takes the slack so the right cell is pushed out -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="pad" style="padding:16px 28px;border-bottom:1px solid ${RULE}">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="middle" width="24" style="width:24px"><img src="${esc(logoUrl)}" width="20" height="22" alt="" style="display:block;border:0;width:20px;height:22px"></td>
            <td valign="middle" style="padding-left:10px;font-family:${FONT};font-size:14px;font-weight:bold;letter-spacing:-.01em;color:${INK};white-space:nowrap">Marrelay</td>
            <td valign="middle" align="right" style="font-family:${FONT};font-size:10px;line-height:1.5;letter-spacing:.1em;text-transform:uppercase;color:${MUT};white-space:nowrap">New lead</td>
          </tr></table>
        </td></tr>

        <tr><td class="pad" style="padding:26px 28px 28px">

          <p style="margin:0 0 6px;font-family:${FONT};font-size:12px;line-height:1.5;color:${MUT}">${esc(vars.form)} · ${esc(opts.receivedLabel || receivedAt())}</p>
          <h1 class="h1" style="margin:0;font-family:${FONT};font-size:25px;line-height:1.2;font-weight:bold;letter-spacing:-.02em;color:${INK}">${esc(title)}</h1>
          ${sub ? `<p style="margin:4px 0 0;font-family:${FONT};font-size:14px;line-height:1.5;color:${MUT}">${esc(sub)}</p>` : ''}

          ${cfg.showScore ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px"><tr>
            <td valign="middle">${scoreBars(sc.score, ACCENT)}</td>
            <td valign="middle" style="padding-left:12px;font-family:${FONT};font-size:12px;line-height:1.5;color:#4A4A47;white-space:nowrap">
              <span style="color:${INK};font-weight:bold">Priority ${sc.score}/5</span> · ${esc(sc.label)}</td>
          </tr></table>
          <p style="margin:8px 0 0;font-family:${FONT};font-size:11px;line-height:1.5;color:${MUT}">${esc(sc.reasons.join(' · '))}</p>` : ''}

          ${cfg.intro ? `<p style="margin:18px 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:#4A4A47">${esc(fill(cfg.intro, vars))}</p>` : ''}

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:20px;border-top:1px solid ${RULE};border-collapse:collapse">
            ${row('Name', esc(lead.name))}
            ${row('Email', lead.email ? link(`mailto:${lead.email}`, lead.email) : '')}
            ${row('Phone', lead.phone ? link(`tel:${lead.phone}`, lead.phone) : '')}
            ${row('Page', esc(lead.sourcePage))}
            ${row('Source', esc(where))}
            ${row('Campaign', esc(clean(lead.campaign)))}
            ${row('Lead #', esc(vars.reference), true)}
            ${row('Wants', esc((lead.services || []).join(', ')))}
            ${row('Timeline', esc(vars.timeline))}
            ${row('Budget', esc(vars.budget))}
            ${lead.message ? row('Message', `<span style="color:#4A4A47">${esc(lead.message)}</span>`) : ''}
          </table>

          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px"><tr>
            <td bgcolor="${INK}" style="background:${INK}">
              <a href="${esc(adminUrl)}" style="display:inline-block;font-family:${FONT};background:${INK};color:#FFFFFF;font-size:14px;font-weight:bold;text-decoration:none;padding:13px 26px;letter-spacing:.01em">${esc(cfg.buttonLabel || 'View lead')}</a>
            </td>
          </tr></table>

        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:12px 2px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="62%" valign="top" style="width:62%;font-family:${FONT};font-size:11px;line-height:1.6;color:${MUT}">${esc(fill(cfg.footerNote || '', vars))}</td>
        <td width="38%" valign="top" align="right" style="width:38%;font-family:${FONT};font-size:11px;line-height:1.6"><a href="${esc(siteUrl)}" style="color:${ACCENT};text-decoration:none;font-weight:bold">${esc(displayHost(siteUrl))}</a></td>
      </tr></table>
    </td></tr>

  </table>

</td></tr></table>
</body></html>`
}
