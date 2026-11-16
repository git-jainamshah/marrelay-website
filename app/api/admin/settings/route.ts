import { NextRequest, NextResponse } from 'next/server'
import { getSetting, setSetting, audit, recordSettingVersion } from '@/lib/admin/db'
import { requireUser, requireEditor } from '@/lib/admin/auth'
import { isSettingKey } from '@/lib/admin/settings-keys'
import { SETTING_DEFAULTS } from '@/lib/admin/setting-defaults'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireUser()
  if ('error' in auth) return auth.error
  const key = req.nextUrl.searchParams.get('key') || ''
  if (!isSettingKey(key)) return NextResponse.json({ error: 'Unknown setting.' }, { status: 400 })
  // Keys added after the database was created have never been seeded, so fall
  // back to the shipped default rather than handing the admin a null.
  const value = (await getSetting(key)) ?? SETTING_DEFAULTS[key] ?? null
  return NextResponse.json({ key, value })
}

export async function PUT(req: NextRequest) {
  const auth = await requireEditor()
  if ('error' in auth) return auth.error
  const { key, value } = await req.json().catch(() => ({}))
  if (!isSettingKey(key)) return NextResponse.json({ error: 'Unknown setting.' }, { status: 400 })

  // The storage ceiling is an administrator decision.
  if (key === 'storage') {
    if (auth.user.role !== 'admin') return NextResponse.json({ error: 'Only administrators can change the storage limit.' }, { status: 403 })
    const gb = Number(value?.limitBytes) / (1024 * 1024 * 1024)
    if (!isFinite(gb) || gb < 0.1 || gb > 100) return NextResponse.json({ error: 'Storage limit must be between 0.1 and 100 GB.' }, { status: 400 })
  }

  let toStore = value
  if (key === 'legal_terms' || key === 'legal_privacy') {
    const { sanitizeHtml } = require('@/lib/admin/legal-defaults') as typeof import('@/lib/admin/legal-defaults')
    // Any edit auto-refreshes the "Last updated" date
    toStore = { html: sanitizeHtml(value?.html ?? ''), updatedAt: new Date().toISOString() }
  }

  // Version first (captures the pre-change baseline on the very first edit), then write.
  await recordSettingVersion(key, toStore, auth.user.email)
  await setSetting(key, toStore)
  await audit(auth.user.email, 'setting_update', key)
  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() })
}
