'use client'

/**
 * Pick an image for anything that needs one (promo pop-up, logos). Two ways:
 * choose from what is already in Storage, or upload from this computer.
 * Returns the file's site path, e.g. /uploads/promo.jpg.
 */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react'
import { Upload, Images, X, Check, Film } from 'lucide-react'
import { useToast } from './Toast'
import { fmtBytes } from './StorageMeter'

type Media = { id: number; filename: string; relPath: string; kind: 'photo' | 'video'; size: number; addedAt: string }

export function MediaField({ value, onChange, label, hint, accept = 'photo' }: { value: string; onChange: (path: string) => void; label: string; hint?: string; accept?: 'photo' | 'video' | 'any' }) {
  const [open, setOpen] = useState(false)
  const isVideo = /\.(mp4|webm|mov)$/i.test(value)
  return (
    <div className="ad-mediafield">
      <label className="ad-label">{label}</label>
      <div className="row">
        <div className="thumb">
          {value ? (isVideo ? <video src={value} muted playsInline preload="metadata" /> : <img src={value} alt="" />) : <span>None</span>}
        </div>
        <div className="ctl">
          <div className="btns">
            <button type="button" className="ad-btn-ghost sm" onClick={() => setOpen(true)}><Images size={14} /> {value ? 'Change' : 'Choose'}</button>
            {value && <button type="button" className="ad-btn-ghost sm" onClick={() => onChange('')}><X size={14} /> Remove</button>}
          </div>
          {value ? <code className="path">{value}</code> : hint && <p className="ad-soft" style={{ fontSize: 12, margin: '6px 0 0' }}>{hint}</p>}
        </div>
      </div>
      {open && <MediaPicker accept={accept} onClose={() => setOpen(false)} onPick={(p) => { onChange(p); setOpen(false) }} />}
    </div>
  )
}

export default function MediaPicker({ onPick, onClose, accept = 'photo' }: { onPick: (path: string) => void; onClose: () => void; accept?: 'photo' | 'video' | 'any' }) {
  const { toast } = useToast()
  const [tab, setTab] = useState<'library' | 'upload'>('library')
  const [media, setMedia] = useState<Media[] | null>(null)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => fetch('/api/admin/media', { cache: 'no-store' }).then((r) => r.json()).then((d) => setMedia(d.media || []))
  useEffect(() => { load() }, [])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const list = (media || []).filter((m) => accept === 'any' || m.kind === accept).filter((m) => !q || m.filename.toLowerCase().includes(q.toLowerCase()))

  async function upload(f: File) {
    setBusy(true)
    const fd = new FormData()
    fd.append('file', f)
    const r = await fetch('/api/admin/media', { method: 'POST', body: fd })
    const d = await r.json().catch(() => ({}))
    setBusy(false)
    if (!r.ok) { toast({ kind: 'err', title: 'Upload failed', detail: d.error || 'Try a smaller file.' }); return }
    toast({ title: 'Uploaded', detail: `${f.name} is now in Storage and selected here.` })
    onPick(d.relPath)
  }

  return (
    <div className="ad-overlay" onClick={onClose}>
      <div className="ad-modal wide ad-picker" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Choose media">
        <header className="ad-picker-head">
          <div className="ad-seg small">
            <button type="button" className={tab === 'library' ? 'on' : ''} onClick={() => setTab('library')}><Images size={14} /> From Storage</button>
            <button type="button" className={tab === 'upload' ? 'on' : ''} onClick={() => setTab('upload')}><Upload size={14} /> Upload from this computer</button>
          </div>
          <button className="ad-icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </header>

        {tab === 'library' ? (
          <>
            <input className="ad-input" placeholder="Search by file name…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 12 }} />
            {media === null ? <div className="ad-skel" style={{ height: 200 }} /> : list.length === 0 ? (
              <div className="ad-empty"><b>Nothing here yet</b><span>Upload a file from this computer using the tab above.</span></div>
            ) : (
              <div className="ad-picker-grid">
                {list.map((m) => (
                  <button type="button" key={m.id} className={`ad-picker-tile${sel === m.relPath ? ' on' : ''}`} onClick={() => setSel(m.relPath)} onDoubleClick={() => onPick(m.relPath)} title={m.filename}>
                    <span className="img">{m.kind === 'video' ? <><video src={m.relPath} muted playsInline preload="metadata" /><i className="vid"><Film size={12} /></i></> : <img src={m.relPath} alt="" loading="lazy" />}</span>
                    <span className="nm">{m.filename}</span>
                    <span className="sz">{fmtBytes(m.size)}</span>
                    {sel === m.relPath && <span className="chk"><Check size={12} /></span>}
                  </button>
                ))}
              </div>
            )}
            <footer className="ad-picker-foot">
              <span className="ad-soft" style={{ fontSize: 12 }}>{sel ? sel : 'Click a file, then Use it. Double-click to use straight away.'}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="ad-btn-ghost sm" onClick={onClose}>Cancel</button>
                <button className="ad-btn sm" disabled={!sel} onClick={() => sel && onPick(sel)}>Use this file</button>
              </div>
            </footer>
          </>
        ) : (
          <div className={`ad-drop${drag ? ' over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) upload(f) }}>
            <input ref={fileRef} type="file" accept={accept === 'video' ? 'video/*' : accept === 'any' ? 'image/*,video/*' : 'image/*'} hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
            <Upload size={22} />
            <b>{busy ? 'Uploading…' : 'Drop a file here'}</b>
            <span>or</span>
            <button className="ad-btn sm" disabled={busy} onClick={() => fileRef.current?.click()}>Choose a file</button>
            <small>Up to 200 MB. It goes into Storage and is selected here when done.</small>
          </div>
        )}
      </div>
    </div>
  )
}
