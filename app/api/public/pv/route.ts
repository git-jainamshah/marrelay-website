import { NextRequest, NextResponse } from 'next/server'
import { ensureDb } from '@/lib/admin/db'
import { run } from '@/lib/admin/pg'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BOT = /bot|crawler|spider|crawling|slurp|bingpreview|headless|lighthouse|pingdom|gtmetrix|semrush|ahrefs|monitoring/i

function device(ua: string): string {
  if (/iPad|Tablet/i.test(ua)) return 'Tablet'
  if (/Mobi|Android|iPhone/i.test(ua)) return 'Mobile'
  return 'Desktop'
}

/** Record one page view. Public, unauthenticated, fire-and-forget. */
export async function POST(req: NextRequest) {
  const ua = req.headers.get('user-agent') || ''
  // Never store bot traffic: it would drown the real numbers.
  if (BOT.test(ua)) return NextResponse.json({ ok: true, skipped: 'bot' })

  const b = await req.json().catch(() => null)
  if (!b?.path || typeof b.path !== 'string') return NextResponse.json({ ok: false }, { status: 400 })

  const s = (v: unknown, n = 255) => (typeof v === 'string' && v ? v.slice(0, n) : null)
  try {
    await ensureDb()
    await run(
      `INSERT INTO page_views (visitor_id, session_id, path, title, referrer, channel, source, medium, campaign, device, country)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        s(b.visitorId, 64), s(b.sessionId, 64), s(b.path, 300), s(b.title, 200), s(b.referrer, 300),
        s(b.channel, 40) || 'Direct', s(b.source, 80), s(b.medium, 60), s(b.campaign, 120),
        device(ua), s(req.headers.get('x-vercel-ip-country'), 4),
      ]
    )
  } catch { /* analytics must never break a page */ }
  return NextResponse.json({ ok: true })
}
