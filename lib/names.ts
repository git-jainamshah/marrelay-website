/**
 * Names, stored three ways.
 *
 * Every lead keeps first, last and full. Enhanced conversions and most ad
 * platforms hash given and family name separately, so deriving them at export
 * time from a single string is lossy and late. We take them at the form where
 * the person actually knows which is which, and we still store the full name
 * because that is what a human reads in the pipeline and the alert email.
 *
 * A lead can still arrive with only a full name (a direct API post, an older
 * cached form), so the split below is a fallback, never the primary path.
 */

const collapse = (v: unknown) => String(v ?? '').replace(/[\s ]+/g, ' ').trim()

/**
 * Split a full name when that is all we were given. The last whitespace-separated
 * token becomes the family name, which is right for most Latin-script names and
 * wrong for some. It is a fallback: forms send first and last separately.
 */
export function splitName(full: string): { first: string; last: string } {
  const t = collapse(full)
  if (!t) return { first: '', last: '' }
  const parts = t.split(' ')
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] }
}

export function joinName(first: unknown, last: unknown): string {
  return [collapse(first), collapse(last)].filter(Boolean).join(' ')
}

/**
 * Work out all three forms from whatever a caller sent. First and last win when
 * present; otherwise they are derived from the full name.
 */
export function resolveName(input: { firstName?: unknown; lastName?: unknown; name?: unknown }): {
  first: string
  last: string
  full: string
} {
  const first = collapse(input.firstName)
  const last = collapse(input.lastName)
  const given = collapse(input.name)

  if (first || last) return { first, last, full: joinName(first, last) || given }
  if (given) {
    const s = splitName(given)
    return { first: s.first, last: s.last, full: given }
  }
  return { first: '', last: '', full: '' }
}
