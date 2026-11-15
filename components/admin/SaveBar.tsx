'use client'

/**
 * Sticky "you have unsaved changes" bar. Appears the moment a page is dirty,
 * sits above the content, and is the one place to Save or Discard. Also warns
 * before the tab is closed with unsaved work.
 */
import { useEffect } from 'react'
import { Save, RotateCcw } from 'lucide-react'

export default function SaveBar({
  dirty, busy, onSave, onDiscard, label = 'Save changes', note,
}: {
  dirty: boolean
  busy?: boolean
  onSave: () => void
  onDiscard?: () => void
  label?: string
  note?: string
}) {
  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  useEffect(() => {
    if (!dirty) return
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (!busy) onSave() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [dirty, busy, onSave])

  return (
    <div className={`ad-savebar${dirty ? ' on' : ''}`} aria-hidden={!dirty}>
      <div className="ad-savebar-in">
        <span className="dot" />
        <span className="tx">
          <b>Unsaved changes</b>
          <small>{note || 'Nothing is live until you save. Press Ctrl/Cmd+S to save.'}</small>
        </span>
        {onDiscard && (
          <button type="button" className="ad-btn-ghost sm" onClick={onDiscard} disabled={busy}>
            <RotateCcw size={14} /> Discard
          </button>
        )}
        <button type="button" className="ad-btn sm" onClick={onSave} disabled={busy}>
          <Save size={14} /> {busy ? 'Saving…' : label}
        </button>
      </div>
    </div>
  )
}
