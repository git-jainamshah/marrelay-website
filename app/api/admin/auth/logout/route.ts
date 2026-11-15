import { NextRequest, NextResponse } from 'next/server'
import { destroySession, SESSION_COOKIE, getSessionUser } from '@/lib/admin/auth'
import { recordLoginEvent } from '@/lib/admin/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (token) {
    const me = await getSessionUser().catch(() => null)
    if (me) {
      await recordLoginEvent({
        userId: me.id, email: me.email, name: `${me.first_name} ${me.last_name}`, event: 'logout',
        ip: req.headers.get('x-forwarded-for') ?? 'local', userAgent: req.headers.get('user-agent'),
      })
    }
    await destroySession(token).catch(() => {})
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
