/**
 * Geo normalization for media measurement.
 *
 * The lead forms collect country and province/state as DISPLAY NAMES
 * ('Canada', 'Ontario'). Ad platforms want codes:
 *
 *   Google Ads Enhanced Conversions  country = ISO 3166-1 alpha-2, UNHASHED
 *                                    region  = ISO 3166-2 subdivision, UNHASHED
 *   Meta Advanced Matching / CAPI     country = 2-letter lowercase, HASHED
 *                                    st      = 2-letter lowercase, HASHED
 *
 * So a name is converted to a code once, here, and the hashing layer decides
 * which form each destination gets. Unknown input returns '' rather than a
 * guess, because a wrong code is worse for match rate than no code.
 */

import { COUNTRIES as DIAL_COUNTRIES } from './countries'

/** Country display name -> ISO 3166-1 alpha-2, built from the dial-code table. */
const COUNTRY_BY_NAME: Record<string, string> = (() => {
  const out: Record<string, string> = {}
  for (const c of DIAL_COUNTRIES) out[c.name.toLowerCase()] = c.code
  return out
})()

/** Canadian provinces and territories -> ISO 3166-2:CA subdivision. */
const CA_REGIONS: Record<string, string> = {
  'alberta': 'AB',
  'british columbia': 'BC',
  'manitoba': 'MB',
  'new brunswick': 'NB',
  'newfoundland and labrador': 'NL',
  'northwest territories': 'NT',
  'nova scotia': 'NS',
  'nunavut': 'NU',
  'ontario': 'ON',
  'prince edward island': 'PE',
  'quebec': 'QC',
  'saskatchewan': 'SK',
  'yukon': 'YT',
}

/** US states plus DC -> ISO 3166-2:US subdivision. */
const US_REGIONS: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI',
  'wyoming': 'WY',
  // The form labels DC with periods; accept the common spellings.
  'washington d.c.': 'DC',
  'washington dc': 'DC',
  'district of columbia': 'DC',
}

const REGIONS_BY_COUNTRY: Record<string, Record<string, string>> = {
  CA: CA_REGIONS,
  US: US_REGIONS,
}

const key = (v: unknown) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ')

/**
 * Country display name or code -> ISO 3166-1 alpha-2 (uppercase).
 * Accepts a code already ('CA'), a name ('Canada'), and returns '' for
 * placeholders like 'Other' or anything unrecognised.
 */
export function toCountryCode(input: unknown): string {
  const k = key(input)
  if (!k || k === 'other') return ''
  if (/^[a-z]{2}$/.test(k)) {
    const up = k.toUpperCase()
    return DIAL_COUNTRIES.some((c) => c.code === up) ? up : ''
  }
  return COUNTRY_BY_NAME[k] || ''
}

/**
 * Province/state name -> ISO 3166-2 subdivision code, for the countries where
 * we have a real table (CA, US). Everywhere else the plain name is the best we
 * have, so it comes back trimmed rather than empty.
 */
export function toRegionCode(country: unknown, region: unknown): string {
  const r = key(region)
  if (!r) return ''
  const cc = toCountryCode(country)
  const table = REGIONS_BY_COUNTRY[cc]
  if (!table) return String(region ?? '').trim()
  if (table[r]) return table[r]
  // Already a code, e.g. 'ON' typed by hand or arriving from the admin panel.
  const up = r.toUpperCase()
  if (Object.values(table).includes(up)) return up
  return String(region ?? '').trim()
}
