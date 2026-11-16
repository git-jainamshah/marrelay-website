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

export type { Country } from './countries'
export { COUNTRIES, COUNTRIES_SORTED, DEFAULT_COUNTRY, countryByCode } from './countries'

import { countryByCode } from './countries'

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

/* ---------------- live validation messages ---------------- */

/**
 * A field's live state. `idle` is a field nobody has touched yet: it shows
 * nothing at all, so an untouched form is quiet rather than covered in red.
 */
export type FieldState = { status: 'idle' | 'ok' | 'error'; message?: string }

const IDLE: FieldState = { status: 'idle' }
const OK: FieldState = { status: 'ok' }
const err = (message: string): FieldState => ({ status: 'error', message })

export function checkRequired(v: string, label: string): FieldState {
  const t = tidy(v)
  if (!t) return IDLE
  if (t.length < 2) return err(`${label} looks too short.`)
  return OK
}

export function checkName(v: string): FieldState {
  const t = tidy(v)
  if (!t) return IDLE
  if (t.length < 2) return err('Please enter your full name.')
  if (!/[A-Za-zÀ-ɏ]/.test(t)) return err('Please enter your name in letters.')
  return OK
}

export function checkEmail(v: string): FieldState {
  const t = normalizeEmail(v)
  if (!t) return IDLE
  if (!t.includes('@')) return err('Add the @ part, like you@company.com.')
  if (!isValidEmail(t)) return err('That email address is not complete yet.')
  // A likely typo is a nudge, not a blocker: the address may well be right.
  const fix = emailSuggestion(t)
  if (fix) return { status: 'ok', message: `Did you mean ${fix}?` }
  return OK
}

export function checkPhone(digits: string, code: string): FieldState {
  const d = digitsOf(digits)
  const c = countryByCode(code)
  if (!d) return IDLE
  if (d.length < c.min) {
    const left = c.min - d.length
    return err(`${left} more digit${left === 1 ? '' : 's'} for a ${c.name} number.`)
  }
  if (d.length > c.max) return err(`That is longer than a ${c.name} number.`)
  return OK
}

export function checkMessage(v: string, min = 10): FieldState {
  const t = tidyMultiline(v)
  if (!t) return IDLE
  if (t.length < min) return err(`A sentence or two helps us reply properly.`)
  return OK
}

/** A field that is optional but, once filled, has to look right. */
export function checkUrl(v: string): FieldState {
  const t = tidy(v)
  if (!t) return IDLE
  if (!/^(https?:\/\/)?[\w-]+(\.[\w-]+)+/.test(t)) return err('That does not look like a web address.')
  return OK
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
