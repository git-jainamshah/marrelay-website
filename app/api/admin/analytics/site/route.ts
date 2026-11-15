import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/admin/auth'
import { ensureDb } from '@/lib/admin/db'
import { q, q1 } from '@/lib/admin/pg'
import { easternDayKey } from '@/lib/admin/dates'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const num = (v: unknown) => Number(v) || 0
function delta(cur: number, prev: number): number | null {
  if (prev === 0) return cur > 0 ? 100 : null
  return Math.round(((cur - prev) / prev) * 100)
}

/** GET ?days=7|30|90 - first-party site analytics for the admin dashboard. */
export async function GET(req: NextRequest) {
  const auth = await requireUser()
  if ('error' in auth) return auth.error
  await ensureDb()

  const d = Number(req.nextUrl.searchParams.get('days'))
  const days = [7, 30, 90].includes(d) ? d : 30
  const win = `created_at >= now() - ('${days}' || ' days')::interval`
  const prevWin = `created_at >= now() - ('${days * 2}' || ' days')::interval AND created_at < now() - ('${days}' || ' days')::interval`

  const totals = await q1<any>(
    `SELECT COUNT(*)::int AS views,
            COUNT(DISTINCT visitor_id)::int AS users,
            COUNT(DISTINCT session_id)::int AS sessions
       FROM page_views WHERE ${win}`
  )
  const prev = await q1<any>(
    `SELECT COUNT(*)::int AS views,
            COUNT(DISTINCT visitor_id)::int AS users,
            COUNT(DISTINCT session_id)::int AS sessions
       FROM page_views WHERE ${prevWin}`
  )

  // Bounces: sessions with a single page view.
  const bounce = await q1<any>(
    `SELECT COUNT(*)::int AS c FROM (
       SELECT session_id FROM page_views WHERE ${win} AND session_id IS NOT NULL
       GROUP BY session_id HAVING COUNT(*) = 1) t`
  )

  // Leads in the same window, so sessions can be read against outcomes.
  const leads = await q1<any>(`SELECT COUNT(*)::int AS c FROM leads WHERE deleted_at IS NULL AND ${win}`)

  // Daily series, bucketed in Eastern time to match the rest of the admin.
  const rows = await q<{ created_at: any; session_id: string | null; visitor_id: string | null }>(
    `SELECT created_at, session_id, visitor_id FROM page_views WHERE ${win}`
  )
  const byDay = new Map<string, { views: number; s: Set<string>; u: Set<string> }>()
  for (const r of rows) {
    const k = easternDayKey(r.created_at)
    if (!k) continue
    const e = byDay.get(k) || { views: 0, s: new Set<string>(), u: new Set<string>() }
    e.views++
    if (r.session_id) e.s.add(r.session_id)
    if (r.visitor_id) e.u.add(r.visitor_id)
    byDay.set(k, e)
  }
  const series: { date: string; views: number; sessions: number; users: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(Date.now() - i * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Toronto' })
    const e = byDay.get(key)
    series.push({ date: key, views: e?.views ?? 0, sessions: e?.s.size ?? 0, users: e?.u.size ?? 0 })
  }

  /** Group by one column, counting distinct sessions (not raw views). */
  const group = async (col: string, limit = 12) =>
    (await q<{ label: string | null; value: number }>(
      `SELECT ${col} AS label, COUNT(DISTINCT session_id)::int AS value
         FROM page_views WHERE ${win} GROUP BY ${col} ORDER BY value DESC LIMIT ${limit}`
    )).map((r) => ({ label: r.label || 'Not set', value: num(r.value) }))

  const pages = (await q<{ label: string; value: number }>(
    `SELECT path AS label, COUNT(*)::int AS value FROM page_views WHERE ${win} GROUP BY path ORDER BY value DESC LIMIT 12`
  )).map((r) => ({ label: r.label, value: num(r.value) }))

  const landing = (await q<{ label: string; value: number }>(
    `SELECT path AS label, COUNT(*)::int AS value FROM (
       SELECT DISTINCT ON (session_id) session_id, path FROM page_views
        WHERE ${win} AND session_id IS NOT NULL ORDER BY session_id, id ASC) t
     GROUP BY path ORDER BY value DESC LIMIT 10`
  )).map((r) => ({ label: r.label, value: num(r.value) }))

  const referrers = (await q<{ label: string; value: number }>(
    `SELECT referrer AS label, COUNT(DISTINCT session_id)::int AS value FROM page_views
      WHERE ${win} AND referrer IS NOT NULL AND referrer <> '' GROUP BY referrer ORDER BY value DESC LIMIT 10`
  )).map((r) => {
    let host = r.label
    try { host = new URL(r.label).hostname.replace(/^www\./, '') } catch { /* keep raw */ }
    return { label: host, value: num(r.value) }
  })

  const sessions = num(totals?.sessions)
  return NextResponse.json({
    days,
    kpis: {
      users: num(totals?.users), sessions, views: num(totals?.views),
      deltaUsers: delta(num(totals?.users), num(prev?.users)),
      deltaSessions: delta(sessions, num(prev?.sessions)),
      deltaViews: delta(num(totals?.views), num(prev?.views)),
      prevUsers: num(prev?.users), prevSessions: num(prev?.sessions), prevViews: num(prev?.views),
      viewsPerSession: sessions ? Math.round((num(totals?.views) / sessions) * 10) / 10 : 0,
      bounceRate: sessions ? Math.round((num(bounce?.c) / sessions) * 100) : 0,
      leads: num(leads?.c),
      conversionRate: sessions ? Math.round((num(leads?.c) / sessions) * 1000) / 10 : 0,
    },
    series,
    byChannel: await group('channel'),
    bySource: await group('source', 10),
    byDevice: await group('device', 5),
    byCountry: await group('country', 10),
    pages, landing, referrers,
  })
}
