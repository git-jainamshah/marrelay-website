'use client'

/**
 * iPhone-style storage summary: one bar split by media type, how much of
 * the ceiling is used, and (for administrators) the ceiling itself.
 */
import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { loadSetting, saveSetting } from '@/lib/admin/client'
import { DEFAULT_STORAGE_LIMIT_BYTES, type StorageCfg } from '@/lib/admin/settings-keys'

export type MediaLite = { kind: 'photo' | 'video' | string; size: number }

export const fmtBytes = (b: number) => {
  if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(2)} GB`
  if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(1)} MB`
  return `${Math.max(1, Math.round(b / 1024))} KB`
}

export function useStorageLimit() {
  const [limit, setLimit] = useState<number>(DEFAULT_STORAGE_LIMIT_BYTES)
  useEffect(() => { loadSetting<StorageCfg>('storage').then((v) => { if (v?.limitBytes) setLimit(v.limitBytes) }) }, [])
  return [limit, setLimit] as const
}

export default function StorageMeter({ media, role, compact }: { media: MediaLite[]; role?: string; compact?: boolean }) {
  const [limit, setLimit] = useStorageLimit()
  const [editing, setEditing] = useState(false)
  const [gb, setGb] = useState('')
  const [busy, setBusy] = useState(false)

  const photo = media.filter((m) => m.kind === 'photo')
  const video = media.filter((m) => m.kind === 'video')
  const other = media.filter((m) => m.kind !== 'photo' && m.kind !== 'video')
  const bytes = (xs: MediaLite[]) => xs.reduce((s, m) => s + (m.size || 0), 0)
  const used = bytes(media)
  const pct = Math.min(100, (used / limit) * 100)
  const segs = [
    { k: 'Photos', n: photo.length, b: bytes(photo), c: 'var(--brand)' },
    { k: 'Videos', n: video.length, b: bytes(video), c: 'var(--ink)' },
    ...(other.length ? [{ k: 'Other', n: other.length, b: bytes(other), c: 'var(--ink-mut)' }] : []),
  ]
  const tone = pct >= 90 ? 'full' : pct >= 75 ? 'warn' : ''

  async function saveLimit() {
    const n = Number(gb)
    if (!isFinite(n) || n <= 0) return
    setBusy(true)
    const next = Math.round(n * 1024 ** 3)
    if (await saveSetting('storage', { limitBytes: next }, { detail: `Uploads will be refused once the site reaches ${fmtBytes(next)}.` })) { setLimit(next); setEditing(false) }
    setBusy(false)
  }

  return (
    <div className={`ad-storage${compact ? ' compact' : ''} ${tone}`}>
      <div className="ad-storage-top">
        <div>
          <div className="ad-kicker">Site storage</div>
          <div className="ad-storage-h"><b>{fmtBytes(used)}</b> <span>of {fmtBytes(limit)} used</span></div>
        </div>
        <div className="ad-storage-pct">{pct < 1 && used > 0 ? '<1' : Math.round(pct)}%</div>
      </div>
      <div className="ad-storage-bar" role="img" aria-label={`${Math.round(pct)}% of storage used`}>
        {segs.map((s) => <i key={s.k} style={{ width: `${(s.b / limit) * 100}%`, background: s.c }} title={`${s.k}: ${fmtBytes(s.b)}`} />)}
      </div>
      <div className="ad-storage-legend">
        {segs.map((s) => <span key={s.k}><i style={{ background: s.c }} />{s.k} <b>{s.n}</b> <small>{fmtBytes(s.b)}</small></span>)}
        <span><i style={{ background: 'var(--paper-3)' }} />Free <small>{fmtBytes(Math.max(0, limit - used))}</small></span>
      </div>
      {tone && !compact && (
        <p className="ad-storage-note">{tone === 'full' ? 'Storage is almost full. New uploads will be refused once the limit is reached.' : 'Storage is getting full. Consider deleting files you no longer use.'}</p>
      )}
      {role === 'admin' && !compact && (
        <div className="ad-storage-limit">
          {editing ? (
            <>
              <label className="ad-label" style={{ marginBottom: 0 }}>Limit (GB)</label>
              <input className="ad-input" style={{ width: 90 }} inputMode="decimal" value={gb} onChange={(e) => setGb(e.target.value.replace(/[^\d.]/g, ''))} autoFocus />
              <button className="ad-btn sm" onClick={saveLimit} disabled={busy}>{busy ? 'Saving…' : 'Save limit'}</button>
              <button className="ad-btn-ghost sm" onClick={() => setEditing(false)}>Cancel</button>
            </>
          ) : (
            <button className="ad-btn-ghost sm" onClick={() => { setGb(String(limit / 1024 ** 3)); setEditing(true) }}><Pencil size={13} /> Change limit</button>
          )}
          <span className="ad-soft" style={{ fontSize: 12 }}>Administrators only. Applies to the whole site.</span>
        </div>
      )}
    </div>
  )
}
