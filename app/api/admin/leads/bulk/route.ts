import { NextRequest, NextResponse } from 'next/server'
import { audit } from '@/lib/admin/db'
import { q1, run } from '@/lib/admin/pg'
import { requireLeadsEditor } from '@/lib/admin/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost']

/**
 * Apply one change to many leads at once: hand them to someone else, or move
 * them all to a status. Only the fields supplied are touched.
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireLeadsEditor()
  if ('error' in auth) return auth.error
  const body = await req.json().catch(() => ({}))

  const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter(Number.isInteger).slice(0, 500) : []
  if (!ids.length) return NextResponse.json({ error: 'No leads were selected.' }, { status: 400 })

  const sets: string[] = []
  const vals: unknown[] = []

  if ('ownerUserId' in body) {
    let ownerId: number | null = null
    if (body.ownerUserId !== null && body.ownerUserId !== '') {
      const owner = await q1<{ id: number }>('SELECT id FROM users WHERE id = $1 AND active = 1', [Number(body.ownerUserId)])
      if (!owner) return NextResponse.json({ error: 'That user does not exist or is not active.' }, { status: 400 })
      ownerId = owner.id
    }
    vals.push(ownerId)
    sets.push(`owner_user_id = $${vals.length}`)
  }

  if ('status' in body) {
    if (!STATUSES.includes(body.status)) return NextResponse.json({ error: 'Unknown status.' }, { status: 400 })
    vals.push(body.status)
    sets.push(`status = $${vals.length}`)
  }

  if (!sets.length) return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 })

  vals.push(ids)
  await run(`UPDATE leads SET ${sets.join(', ')}, updated_at = now() WHERE id = ANY($${vals.length}::int[])`, vals)

  const what = [
    'ownerUserId' in body ? `owner → ${body.ownerUserId ?? 'unassigned'}` : '',
    'status' in body ? `status → ${body.status}` : '',
  ].filter(Boolean).join(', ')
  await audit(auth.user.email, 'lead_bulk_update', `${ids.length} leads: ${what}`)

  return NextResponse.json({ ok: true, count: ids.length })
}
