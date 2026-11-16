import { NextRequest, NextResponse } from 'next/server'
import { audit } from '@/lib/admin/db'
import { q1, run } from '@/lib/admin/pg'
import { requireLeadsEditor } from '@/lib/admin/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost']
/** Fields inside the `extra` JSON that may be corrected later. */
const EXTRA_FIELDS = ['companyUrl', 'companyProvince', 'companyCountry', 'companyRemote', 'budget', 'timeline', 'referral', 'referralDetail'] as const

const str = (v: unknown, n = 300) => (v === null || v === undefined ? '' : String(v).trim().slice(0, n))

/**
 * Update a lead. Contact and qualification details can be corrected as you
 * learn more; the original enquiry message and the acquisition data are left
 * alone on purpose, so the record of what the client actually sent stays true.
 * Leads are permanent - there is deliberately no DELETE.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireLeadsEditor()
  if ('error' in auth) return auth.error
  const body = await req.json().catch(() => ({}))
  const id = Number(params.id)
  const row = await q1<any>('SELECT * FROM leads WHERE id = $1', [id])
  if (!row) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 })

  const status = STATUSES.includes(body.status) ? body.status : row.status
  const notes = body.notes === undefined ? row.notes : String(body.notes).slice(0, 5000)

  // Contact details, editable as you work the lead.
  const name = 'name' in body ? str(body.name, 200) : row.name
  const email = 'email' in body ? str(body.email, 200).toLowerCase() : row.email
  const phone = 'phone' in body ? str(body.phone, 60) : row.phone
  const company = 'company' in body ? str(body.company, 200) : row.company
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'That email address does not look right.' }, { status: 400 })
  }

  // Qualification details live in the `extra` JSON blob.
  let extra: Record<string, unknown> = {}
  try { extra = JSON.parse(row.extra || '{}') } catch { extra = {} }
  if (body.extra && typeof body.extra === 'object') {
    for (const k of EXTRA_FIELDS) {
      if (k in body.extra) extra[k] = str((body.extra as any)[k], 300)
    }
    if (Array.isArray((body.extra as any).services)) {
      extra.services = (body.extra as any).services.map((s: unknown) => str(s, 40)).filter(Boolean).slice(0, 12)
    }
  }

  /* Reassignment. `null` deliberately means unassigned, so it has to be
     distinguished from "field not supplied" - hence the `in` check rather
     than a truthiness test. */
  let ownerId: number | null = row.owner_user_id ?? null
  if ('ownerUserId' in body) {
    if (body.ownerUserId === null || body.ownerUserId === '') {
      ownerId = null
    } else {
      const owner = await q1<{ id: number }>(
        'SELECT id FROM users WHERE id = $1 AND active = 1', [Number(body.ownerUserId)]
      )
      if (!owner) return NextResponse.json({ error: 'That user does not exist or is not active.' }, { status: 400 })
      ownerId = owner.id
    }
  }

  await run(
    `UPDATE leads SET status = $1, notes = $2, owner_user_id = $3, name = $4, email = $5, phone = $6,
       company = $7, extra = $8, updated_at = now() WHERE id = $9`,
    [status, notes, ownerId, name, email, phone, company, JSON.stringify(extra), id]
  )

  if (ownerId !== (row.owner_user_id ?? null)) {
    await audit(auth.user.email, 'lead_reassign', `#${id} → ${ownerId ?? 'unassigned'}`)
  }
  await audit(auth.user.email, 'lead_update', `#${id} → ${status}`)

  const updated = await q1<any>(
    `SELECT l.*, u.first_name || ' ' || u.last_name AS owner_name
       FROM leads l LEFT JOIN users u ON u.id = l.owner_user_id WHERE l.id = $1`, [id]
  )
  return NextResponse.json({ ok: true, lead: updated })
}
