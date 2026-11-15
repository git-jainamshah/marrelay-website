'use client'

/**
 * Tiny client helpers so every settings page saves, loads and acknowledges
 * the same way. Toasts are raised here, so a page only has to call save().
 */
import { raiseToast } from '@/components/admin/Toast'
import { SETTING_LABELS, type SettingKey } from '@/lib/admin/settings-keys'

export async function loadSetting<T>(key: SettingKey): Promise<T | null> {
  const r = await fetch(`/api/admin/settings?key=${key}`, { cache: 'no-store' })
  if (!r.ok) return null
  const d = await r.json()
  return (d.value ?? null) as T | null
}

export async function saveSetting(key: SettingKey, value: unknown, opts?: { quiet?: boolean; detail?: string }): Promise<boolean> {
  const label = SETTING_LABELS[key]
  try {
    const r = await fetch('/api/admin/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }),
    })
    if (!r.ok) {
      const d = await r.json().catch(() => ({}))
      raiseToast({ kind: 'err', title: `${label} was not saved`, detail: d.error || `Server replied ${r.status}. Your changes are still on this page; try again.` })
      return false
    }
    if (!opts?.quiet) raiseToast({ kind: 'ok', title: `${label} saved`, detail: opts?.detail ?? 'Live on the site within a minute. Previous version kept in History.' })
    return true
  } catch {
    raiseToast({ kind: 'err', title: `${label} was not saved`, detail: 'Network problem. Your changes are still on this page; try again.' })
    return false
  }
}

export type SettingVersion = { id: number; key: string; value: any; changed_by: string | null; note: string | null; created_at: string }

export async function listVersions(key: SettingKey): Promise<SettingVersion[]> {
  const r = await fetch(`/api/admin/settings/history?key=${key}`, { cache: 'no-store' })
  if (!r.ok) return []
  return (await r.json()).versions || []
}

export async function restoreVersion(key: SettingKey, id: number): Promise<any | null> {
  const label = SETTING_LABELS[key]
  const r = await fetch('/api/admin/settings/history', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, id }),
  })
  if (!r.ok) {
    const d = await r.json().catch(() => ({}))
    raiseToast({ kind: 'err', title: `Could not restore ${label}`, detail: d.error || 'Try again.' })
    return null
  }
  const d = await r.json()
  raiseToast({ kind: 'ok', title: `${label} restored`, detail: 'That version is live again. The one you replaced is kept in History.' })
  return d.value
}
