import { NextRequest, NextResponse } from 'next/server'
import { ensureDb } from '@/lib/admin/db'
import { run } from '@/lib/admin/pg'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BOT = /bot|crawler|spider|crawling|slurp|headless|lighthouse|pingdom|semrush|ahrefs|monitoring/i
const KINDS = ['view', 'start', 'field', 'error', 'submit', 'success']

/** Record one form interaction. Public, unauthenticated, fire-and-forget. */
export async function POST(req: NextRequest) {
  const ua = req.headers.get('user-agent') || ''
  if (BOT.test(ua)) return NextResponse.json({ ok: true, skipped: 'bot' })

  const b = await req.json().catch(() => null)
  if (!b?.formId || !KINDS.includes(b?.event)) return NextResponse.json({ ok: false }, { status: 400 })

  const s = (v: unknown, n = 120) => (typeof v === 'string' && v ? v.slice(0, n) : null)
  try {
    await ensureDb()
    await run(
      `INSERT INTO form_events (visitor_id, session_id, form_id, form_type, event, field, path)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [s(b.visitorId, 64), s(b.sessionId, 64), s(b.formId, 60), s(b.formType, 40), s(b.event, 20), s(b.field, 40), s(b.path, 300)]
    )
  } catch { /* analytics must never break a form */ }
  return NextResponse.json({ ok: true })
}
