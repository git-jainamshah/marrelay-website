'use client'

/**
 * Cmd/Ctrl+K: type what you want to do, go there. Searches every page the
 * signed-in role can see plus a short list of fast actions, so nothing in the
 * admin needs hunting for.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CornerDownLeft, Zap } from 'lucide-react'
import { visibleGroups, QUICK_ACTIONS, type NavItem } from './nav'

type Row = NavItem & { group: string; kind: 'page' | 'action' }

export default function CommandPalette({ role }: { role: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const rows = useMemo<Row[]>(() => {
    const pages: Row[] = visibleGroups(role).flatMap((g) => g.items.map((i) => ({ ...i, group: g.label, kind: 'page' as const })))
    const allowed = new Set(pages.map((p) => p.href.split('#')[0]))
    const actions: Row[] = QUICK_ACTIONS.filter((a) => allowed.has(a.href.split('#')[0])).map((a) => ({ ...a, group: 'Quick actions', kind: 'action' as const }))
    return [...actions, ...pages]
  }, [role])

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    const words = s.split(/\s+/)
    return rows
      .map((r) => {
        const hay = `${r.label} ${r.hint || ''} ${r.keywords || ''} ${r.group}`.toLowerCase()
        const score = words.every((w) => hay.includes(w)) ? (r.label.toLowerCase().startsWith(s) ? 3 : r.label.toLowerCase().includes(s) ? 2 : 1) : 0
        return { r, score }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.r)
  }, [rows, q])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o) }
      else if (e.key === 'Escape') setOpen(false)
    }
    const openEv = () => setOpen(true)
    window.addEventListener('keydown', h)
    window.addEventListener('admin:palette', openEv)
    return () => { window.removeEventListener('keydown', h); window.removeEventListener('admin:palette', openEv) }
  }, [])

  useEffect(() => {
    if (open) { setQ(''); setIdx(0); setTimeout(() => inputRef.current?.focus(), 10) }
  }, [open])
  useEffect(() => { setIdx(0) }, [q])

  function go(r: Row) {
    setOpen(false)
    router.push(r.href)
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(results.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Enter' && results[idx]) { e.preventDefault(); go(results[idx]) }
  }

  if (!open) return null

  let lastGroup = ''
  return (
    <div className="ad-pal-scrim" onClick={() => setOpen(false)}>
      <div className="ad-pal" role="dialog" aria-modal="true" aria-label="Go to" onClick={(e) => e.stopPropagation()}>
        <div className="ad-pal-bar">
          <Search size={17} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="What do you want to do? Try “pop-up”, “invoice”, “privacy”…" aria-label="Search the admin" />
          <kbd>Esc</kbd>
        </div>
        <div className="ad-pal-list" role="listbox">
          {results.length === 0 && <div className="ad-pal-empty">Nothing matches “{q}”. Try a page name or an action like “add a lead”.</div>}
          {results.map((r, i) => {
            const head = r.group !== lastGroup ? r.group : null
            lastGroup = r.group
            const Icon = r.icon
            return (
              <div key={`${r.kind}-${r.href}-${i}`}>
                {head && <div className="ad-pal-group">{head}</div>}
                <button type="button" role="option" aria-selected={i === idx}
                  className={`ad-pal-row${i === idx ? ' on' : ''}`}
                  onMouseEnter={() => setIdx(i)} onClick={() => go(r)}>
                  <span className="ic">{r.kind === 'action' ? <Zap size={15} /> : <Icon size={15} />}</span>
                  <span className="tx"><b>{r.label}</b>{r.hint && <small>{r.hint}</small>}</span>
                  {i === idx && <CornerDownLeft size={14} className="ret" />}
                </button>
              </div>
            )
          })}
        </div>
        <div className="ad-pal-foot"><span><kbd>↑↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>⌘K</kbd> toggle</span></div>
      </div>
    </div>
  )
}
