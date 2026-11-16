/**
 * The launch-offer campaign, in one place.
 *
 * The landing page at /lp/launch reads everything from here, and every figure
 * it shows is worked out from the real package prices in the pricing table,
 * so changing a price in the admin changes the page. Nothing is hard-coded
 * twice, and there is no claim on the page that is not computed from these.
 */

export const OFFER = {
  /** The discount, as a whole percentage. Change it here and the page follows. */
  percent: 30,
  label: '30% off',
  /** What the discount applies to, in the plainest words we can manage. */
  appliesTo: 'your first project with us',
  formType: 'launch-offer',
} as const

export const OFFER_MULTIPLIER = (100 - OFFER.percent) / 100

/** "$8,400" -> 8400. "from $180" -> 180. "Custom" -> null. */
export function parsePrice(v: string): number | null {
  const m = String(v ?? '').replace(/,/g, '').match(/\$\s*(\d+(?:\.\d+)?)/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) && n > 0 ? n : null
}

/** 5880 -> "$5,880". Rounded to the nearest dollar; we never invent cents. */
export function money(n: number): string {
  return `$${Math.round(n).toLocaleString('en-CA')}`
}

export type OfferRow = {
  key: string
  service: string
  pkg: string
  /** Present only when the regular price is a real number we could parse. */
  regular: string
  discounted: string
  saving: string
  /** "flat", "from", "one-time" and so on, straight from the pricing table. */
  note: string
  href: string
}

type Pkg = { name: string; price: string; priceNote?: string }

/**
 * The package we quote on the offer page: the first one that is a real number
 * and is not a monthly retainer, because the offer is written for project work.
 */
export function offerPackage(pkgs: Pkg[]): Pkg | null {
  const usable = pkgs.filter((p) => parsePrice(p.price) !== null && (p.priceNote || '').trim() !== '/mo')
  return usable[0] || null
}

export function offerRow(
  key: string, service: string, href: string, pkgs: Pkg[],
): OfferRow | null {
  const pkg = offerPackage(pkgs)
  if (!pkg) return null
  const base = parsePrice(pkg.price)
  if (base === null) return null
  const now = base * OFFER_MULTIPLIER
  const note = (pkg.priceNote || '').trim()
  return {
    key,
    service,
    pkg: pkg.name,
    regular: money(base),
    discounted: money(now),
    saving: money(base - now),
    note: note === 'flat' ? '' : note,
    href,
  }
}
