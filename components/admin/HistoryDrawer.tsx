'use client'

/**
 * Version history for a setting. Lists every saved version (who, when), lets
 * you peek at what it contained, and restores it in one click. Restoring is
 * itself recorded, so it can always be undone.
 */
import { useEffect, useState } from 'react'
import { History, RotateCcw, X, ChevronDown } from 'lucide-react'
import { listVersions, restoreVersion, type SettingVersion } from '@/lib/admin/client'
import { SETTING_LABELS, type SettingKey } from '@/lib/admin/settings-keys'
import { fmtDateTime, fmtRelative } from '@/lib/admin/dates'

/** Short, human summary of a version's contents, per setting type. */
function summarize(key: SettingKey, v: any): string {
  try {
    switch (key) {
      case 'announcement': {
        const on = v?.enabled !== false
        const t = String(v?.default?.text || '').replace(/\*\*/g, '')
        return `${on ? 'On' : 'Off'} · ${v?.default?.pill ? `[${v.default.pill}] ` : ''}${t}`.slice(0, 140)
      }
      case 'promo_banner':
        return `${v?.enabled ? 'On' : 'Off'} · ${v?.template || 'copy'} · ${v?.title || '(no title)'}`.slice(0, 140)
      case 'company':
        return `${v?.name || ''} · ${v?.tagline || ''} · ${v?.email || ''}`.slice(0, 140)
      case 'socials':
        return Array.isArray(v) ? v.map((s: any) => `${s.platform}${s.enabled ? '' : ' (hidden)'}`).join(', ').slice(0, 140) : ''
      case 'legal_terms':
      case 'legal_privacy': {
        const text = String(v?.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        return `${text.length.toLocaleString()} characters · "${text.slice(0, 90)}…"`
      }
      default:
        return JSON.stringify(v).slice(0, 140)
    }
  } catch { return '' }
}

export function HistoryButton({ settingKey, onRestored, className }: { settingKey: SettingKey; onRestored?: (value: any) => void; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className={className || 'ad-btn-ghost sm'} onClick={() => setOpen(true)} title="See earlier versions and restore one">
        <History size={14} /> History
      </button>
      {open && <HistoryDrawer settingKey={settingKey} onClose={() => setOpen(false)} onRestored={onRestored} />}
    </>
  )
}

export default function HistoryDrawer({ settingKey, onClose, onRestored }: { settingKey: SettingKey; onClose: () => void; onRestored?: (value: any) => void }) {
  const [versions, setVersions] = useState<SettingVersion[] | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { listVersions(settingKey).then(setVersions) }, [settingKey])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  async function restore(id: number) {
    setBusy(true)
    const value = await restoreVersion(settingKey, id)
    setBusy(false)
    setConfirmId(null)
    if (value !== null) {
      onRestored?.(value)
      setVersions(await listVersions(settingKey))
    }
  }

  return (
    <div className="ad-drawer-scrim" onClick={onClose}>
      <aside className="ad-drawer" role="dialog" aria-modal="true" aria-label="Version history" onClick={(e) => e.stopPropagation()}>
        <header className="ad-drawer-head">
          <div>
            <div className="ad-kicker">Version history</div>
            <h2>{SETTING_LABELS[settingKey]}</h2>
          </div>
          <button className="ad-icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </header>

        <div className="ad-drawer-body">
          {versions === null && <p className="ad-mut" style={{ fontSize: 13 }}>Loading…</p>}
          {versions && versions.length === 0 && (
            <div className="ad-empty">
              <b>No versions yet</b>
              <span>History starts with your first save on this page. From then on every save is kept here and can be restored.</span>
            </div>
          )}
          {versions && versions.map((v, i) => {
            const current = i === 0
            const isOpen = openId === v.id
            return (
              <div key={v.id} className={`ad-ver${current ? ' current' : ''}`}>
                <button type="button" className="ad-ver-row" onClick={() => setOpenId(isOpen ? null : v.id)} aria-expanded={isOpen}>
                  <span className="when">
                    <b>{current ? 'Current' : fmtRelative(v.created_at)}</b>
                    <small title={fmtDateTime(v.created_at)}>{fmtDateTime(v.created_at)}</small>
                  </span>
                  <span className="who">
                    {v.changed_by ? v.changed_by.split('@')[0] : 'Before first edit'}
                    {v.note && v.note !== 'Before first edit' && <em> · {v.note}</em>}
                  </span>
                  <ChevronDown size={15} className={`ad-chevron${isOpen ? ' open' : ''}`} />
                </button>
                <div className="ad-ver-sum">{summarize(settingKey, v.value)}</div>
                {isOpen && (
                  <div className="ad-ver-detail">
                    <pre>{JSON.stringify(v.value, null, 2)}</pre>
                    {!current && (
                      confirmId === v.id ? (
                        <div className="ad-ver-confirm">
                          <span>Make this version live? The current one is kept in history.</span>
                          <button className="ad-btn sm" disabled={busy} onClick={() => restore(v.id)}>{busy ? 'Restoring…' : 'Yes, restore'}</button>
                          <button className="ad-btn-ghost sm" disabled={busy} onClick={() => setConfirmId(null)}>Keep current</button>
                        </div>
                      ) : (
                        <button className="ad-btn-ghost sm" onClick={() => setConfirmId(v.id)}><RotateCcw size={14} /> Restore this version</button>
                      )
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
