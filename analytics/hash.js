/**
 * =====================================================================
 * MARRELAY ANALYTICS - PII HASHING
 * =====================================================================
 * SHA-256 hashing (Web Crypto) for personally identifiable info before it
 * ever touches the dataLayer. Values are normalized the way Google Ads
 * Enhanced Conversions and Meta CAPI expect, THEN hashed. Only hashes
 * leave this module - never raw PII.
 *
 * WHAT GETS HASHED AND WHAT DOES NOT
 * ----------------------------------
 * Email, phone, first name and last name are hashed for every destination.
 *
 * Region and country are different, and the two platforms disagree:
 *   Google Ads Enhanced Conversions wants them UNHASHED, as codes
 *     (address.region = ISO 3166-2, address.country = ISO 3166-1 alpha-2)
 *   Meta Advanced Matching wants them HASHED, as 2-letter lowercase codes
 * So both forms are published and GTM maps whichever the tag needs. No raw
 * free-text name ever goes out; a region/country is resolved to a code first.
 *
 * KEY STABILITY
 * -------------
 * Every key that existed before is still emitted under the same name, because
 * GTM dataLayer variables point at them. New keys are added alongside.
 * =====================================================================
 */

import { toCountryCode, toRegionCode } from '@/lib/geo-codes'

function isBrowser() {
  return typeof window !== 'undefined' && typeof crypto !== 'undefined' && !!crypto.subtle
}

/** Lowercase + trim; collapse internal whitespace. */
export function normText(v) {
  return String(v || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Person name -> lowercase, accents folded, punctuation dropped.
 * 'José  García-Lopez' -> 'jose garcialopez'. Both Google and Meta strip
 * special characters from names, so folding them here lifts the match rate
 * for accented and hyphenated names. Plain ASCII names are unaffected.
 */
export function normName(v) {
  return String(v || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip combining accents
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')          // drop digits, punctuation, hyphens
    .trim()
    .replace(/\s+/g, ' ')
}

/** Email: trim + lowercase. (Gmail dot/plus stripping intentionally NOT done - keep it standard.) */
export function normEmail(v) {
  return String(v || '').trim().toLowerCase()
}

/**
 * Phone -> E.164-ish digits. Keeps a leading +, strips everything else.
 * Assumes North American (+1) when no country code is present and 10 digits.
 */
export function normPhone(v) {
  let s = String(v || '').replace(/[^\d+]/g, '')
  if (!s) return ''
  if (s.startsWith('+')) return s
  const digits = s.replace(/\D/g, '')
  if (digits.length === 10) return '+1' + digits // NANP default
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits
  return '+' + digits
}

/** SHA-256 -> lowercase hex. Returns '' on empty input or non-browser. */
export async function sha256(value) {
  const v = String(value || '')
  if (!v || !isBrowser()) return ''
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v))
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return ''
  }
}

/**
 * Build the hashed user_data object for a lead. Every value is normalized
 * then SHA-256'd. Empty inputs are omitted so match rates stay clean.
 *
 * @param {Object} [input]
 * @param {string} [input.email]
 * @param {string} [input.phone]
 * @param {string} [input.firstName]
 * @param {string} [input.lastName]
 * @param {string} [input.region]   province/state, name or code
 * @param {string} [input.country]  country, name or ISO2 code
 * @param {string} [input.city]
 * @param {string} [input.postalCode]
 * @returns {Promise<object>} hashed + plain user_data, ready for the dataLayer
 */
export async function buildUserData(input = {}) {
  const { email, phone, firstName, lastName, region, country, city, postalCode } = input

  // Resolve geo to codes BEFORE hashing, so Meta receives 'on'/'ca' (what it
  // matches on) rather than 'ontario'/'canada' (what it does not).
  const countryCode = toCountryCode(country)                 // 'CA'
  const regionCode = toRegionCode(country, region)           // 'ON'

  const [em, ph, fn, ln, rg, co, ct, pc] = await Promise.all([
    sha256(normEmail(email)),
    sha256(normPhone(phone)),
    sha256(normName(firstName)),
    sha256(normName(lastName)),
    sha256(regionCode.toLowerCase()),
    sha256(countryCode.toLowerCase()),
    sha256(normText(city)),
    sha256(normText(postalCode).replace(/\s/g, '')),
  ])

  const out = {}

  /* ---- existing keys, names unchanged (GTM variables point at these) ---- */
  if (em) out.sha256_email = em
  if (ph) out.sha256_phone_number = ph
  if (fn) out.sha256_first_name = fn
  if (ln) out.sha256_last_name = ln
  if (rg) out.sha256_region = rg        // Meta 'st'
  if (co) out.sha256_country = co       // Meta 'country'

  /* ---- Google Ads Enhanced Conversions canonical key ---- */
  // Google's own dataLayer key is sha256_email_address. Same digest as above,
  // published under the name its auto-mapping looks for.
  if (em) out.sha256_email_address = em

  /* ---- Meta extras, only when the form collected them ---- */
  if (ct) out.sha256_city = ct
  if (pc) out.sha256_zip = pc

  /* ---- Google address block: hashed names, UNHASHED geo codes ---- */
  const address = {}
  if (fn) address.sha256_first_name = fn
  if (ln) address.sha256_last_name = ln
  if (city) address.city = normText(city)
  if (regionCode) address.region = regionCode          // plain, e.g. 'ON'
  if (postalCode) address.postal_code = String(postalCode).trim()
  if (countryCode) address.country = countryCode       // plain, e.g. 'CA'
  if (Object.keys(address).length) out.address = address

  return out
}

/** Split a full name into first / last for hashing. */
export function splitName(full) {
  const parts = String(full || '').trim().split(/\s+/)
  if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}
