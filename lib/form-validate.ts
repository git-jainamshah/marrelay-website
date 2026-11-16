/**
 * Shared email and phone handling for every form on the site, so the contact
 * form, the promo sign-up and anything added later behave the same way.
 */

/* ---------------- email ---------------- */

/** Pragmatic check: one @, a dot in the domain, no spaces. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/

/** What gets stored and sent: trimmed, lower case, inner spaces removed. */
export function normalizeEmail(v: string): string {
  return String(v ?? '').replace(/\s+/g, '').toLowerCase()
}

export function isValidEmail(v: string): boolean {
  return EMAIL_RE.test(normalizeEmail(v))
}

/** A nudge for the obvious typos, shown as a hint rather than an error. */
const DOMAIN_TYPOS: Record<string, string> = {
  'gmai.com': 'gmail.com', 'gmial.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gnail.com': 'gmail.com',
  'hotmai.com': 'hotmail.com', 'hotmial.com': 'hotmail.com', 'outlok.com': 'outlook.com',
  'yahooo.com': 'yahoo.com', 'yaho.com': 'yahoo.com', 'iclod.com': 'icloud.com',
}
export function emailSuggestion(v: string): string | null {
  const e = normalizeEmail(v)
  const at = e.lastIndexOf('@')
  if (at < 0) return null
  const domain = e.slice(at + 1)
  const fix = DOMAIN_TYPOS[domain]
  return fix ? `${e.slice(0, at)}@${fix}` : null
}

/* ---------------- phone ---------------- */

export type Country = { code: string; name: string; dial: string; min: number; max: number }

/** Common destinations first; the list stays short enough to scan. */
export const COUNTRIES: Country[] = [
  { code: 'CA', name: 'Canada', dial: '+1', min: 10, max: 10 },
  { code: 'US', name: 'United States', dial: '+1', min: 10, max: 10 },
  { code: 'GB', name: 'United Kingdom', dial: '+44', min: 9, max: 10 },
  { code: 'IN', name: 'India', dial: '+91', min: 10, max: 10 },
  { code: 'AU', name: 'Australia', dial: '+61', min: 9, max: 9 },
  { code: 'NZ', name: 'New Zealand', dial: '+64', min: 8, max: 10 },
  { code: 'IE', name: 'Ireland', dial: '+353', min: 7, max: 9 },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', min: 8, max: 9 },
  { code: 'SG', name: 'Singapore', dial: '+65', min: 8, max: 8 },
  { code: 'DE', name: 'Germany', dial: '+49', min: 7, max: 11 },
  { code: 'FR', name: 'France', dial: '+33', min: 9, max: 9 },
  { code: 'NL', name: 'Netherlands', dial: '+31', min: 9, max: 9 },
  { code: 'ES', name: 'Spain', dial: '+34', min: 9, max: 9 },
  { code: 'IT', name: 'Italy', dial: '+39', min: 9, max: 11 },
  { code: 'ZA', name: 'South Africa', dial: '+27', min: 9, max: 9 },
  { code: 'BR', name: 'Brazil', dial: '+55', min: 10, max: 11 },
  { code: 'MX', name: 'Mexico', dial: '+52', min: 10, max: 10 },
  { code: 'JP', name: 'Japan', dial: '+81', min: 9, max: 10 },
  { code: 'CN', name: 'China', dial: '+86', min: 11, max: 11 },
  { code: 'PK', name: 'Pakistan', dial: '+92', min: 10, max: 10 },
  { code: 'BD', name: 'Bangladesh', dial: '+880', min: 10, max: 10 },
  { code: 'PH', name: 'Philippines', dial: '+63', min: 10, max: 10 },
  { code: 'NG', name: 'Nigeria', dial: '+234', min: 10, max: 10 },
  { code: 'KE', name: 'Kenya', dial: '+254', min: 9, max: 9 },
  { code: 'OTHER', name: 'Other', dial: '+', min: 6, max: 15 },
]

export const DEFAULT_COUNTRY = 'CA'
export const countryByCode = (code: string) => COUNTRIES.find((c) => c.code === code) || COUNTRIES[0]

export const digitsOf = (v: string) => String(v ?? '').replace(/\D/g, '')

/**
 * Group the digits the way the country is usually written. Purely cosmetic:
 * what gets stored is the dial code plus the digits.
 */
export function formatNational(digits: string, code: string): string {
  const d = digitsOf(digits)
  if (code === 'CA' || code === 'US') {
    if (d.length <= 3) return d
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`
  }
  if (code === 'IN') return d.length <= 5 ? d : `${d.slice(0, 5)} ${d.slice(5, 10)}`
  if (code === 'GB') return d.length <= 4 ? d : `${d.slice(0, 4)} ${d.slice(4, 10)}`
  // Everything else: groups of three, which reads better than one long run.
  return d.replace(/(\d{3})(?=\d)/g, '$1 ').trim()
}

export function isValidPhone(digits: string, code: string): boolean {
  const n = digitsOf(digits).length
  const c = countryByCode(code)
  return n >= c.min && n <= c.max
}

/** What the lead record stores, in E.164: "+14165550123". */
export function toStoredPhone(digits: string, code: string): string {
  const c = countryByCode(code)
  const d = digitsOf(digits)
  if (!d) return ''
  return `+${digitsOf(c.dial)}${d}`
}

/**
 * Any stored phone written as E.164: "+14165550123". Leads saved before this
 * existed hold all sorts of formatting, so it works from the digits rather
 * than trusting the shape.
 */
export function toE164(v: unknown): string {
  const d = digitsOf(v as string)
  return d ? `+${d}` : ''
}

/** Tidy a value for display: no runs of whitespace, no stray ends. */
export function tidy(v: unknown): string {
  return String(v ?? '').replace(/[ \s]+/g, ' ').trim()
}

/** Same, but keeps deliberate line breaks (for a message body). */
export function tidyMultiline(v: unknown): string {
  return String(v ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/[ ]*\n[ ]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
