import { NextRequest, NextResponse } from 'next/server'
import { listSettingVersions, getSettingVersion, setSetting, recordSettingVersion, audit } from '@/lib/admin/db'
import { requireUser, requireEditor } from '@/lib/admin/auth'
import { isSettingKey } from '@/lib/admin/settings-keys'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET ?key=announcement -> the saved versions of that setting, newest first. */
export async function GET(req: NextRequest) {
  const auth = await requireUser()
  if ('error' in auth) return auth.error
  const key = req.nextUrl.searchParams.get('key') || ''
  if (!isSettingKey(key)) return NextResponse.json({ error: 'Unknown setting.' }, { status: 400 })
  return NextResponse.json({ key, versions: await listSettingVersions(key) })
}

/** POST { key, id } -> make that version live again (recorded as a new version, so it is itself undoable). */
export async function POST(req: NextRequest) {
  const auth = await requireEditor()
  if ('error' in auth) return auth.error
  const { key, id } = await req.json().catch(() => ({}))
  if (!isSettingKey(key) || !Number.isInteger(id)) return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  const v = await getSettingVersion(key, id)
  if (!v) return NextResponse.json({ error: 'That version no longer exists.' }, { status: 404 })

  let value: any = v.value
  if ((key === 'legal_terms' || key === 'legal_privacy') && value && typeof value === 'object') {
    value = { ...value, updatedAt: new Date().toISOString() }
  }
  await recordSettingVersion(key, value, auth.user.email, `Restored version #${id}`)
  await setSetting(key, value)
  await audit(auth.user.email, 'setting_restore', `${key}#${id}`)
  return NextResponse.json({ ok: true, value })
}
