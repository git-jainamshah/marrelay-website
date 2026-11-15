import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { ensureDb } from '@/lib/admin/db'
import { q } from '@/lib/admin/pg'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET ?days=30&user=<email> -> sign-in / sign-out / failed events, newest first. Admins only. */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  await ensureDb()
  const daysParam = Number(req.nextUrl.searchParams.get('days'))
  const days = [7, 30, 90, 365].includes(daysParam) ? daysParam : 30
  const user = (req.nextUrl.searchParams.get('user') || '').trim().toLowerCase()

  const params: unknown[] = [String(days)]
  let where = `created_at >= now() - ($1 || ' days')::interval`
  if (user) { params.push(user); where += ` AND lower(user_email) = $${params.length}` }

  const events = await q<any>(
    `SELECT id, user_id, user_email, user_name, event, ip, user_agent, created_at FROM login_events WHERE ${where} ORDER BY id DESC LIMIT 1000`,
    params
  )
  const people = await q<{ user_email: string; user_name: string | null; logins: number; last_login: string | null }>(
    `SELECT user_email, max(user_name) AS user_name,
            count(*) FILTER (WHERE event = 'login')::int AS logins,
            max(created_at) FILTER (WHERE event = 'login') AS last_login
       FROM login_events WHERE created_at >= now() - ($1 || ' days')::interval AND user_email IS NOT NULL
      GROUP BY user_email ORDER BY last_login DESC NULLS LAST`,
    [String(days)]
  )
  return NextResponse.json({ days, events, people })
}
