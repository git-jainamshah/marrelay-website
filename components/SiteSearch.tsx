'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { searchDocs, SEARCH_INDEX } from '@/lib/search-index'
import { trackSiteSearch, trackSiteSearchSelect } from '@/analytics/events'

const SearchIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
  </svg>
)

// A few handy suggestions shown before the visitor types.
const QUICK = ['Web Development', 'Data & Analytics', 'SEO & Ads', 'Engineering & CAD', 'Case Studies', 'Pricing', 'Contact Us']

/** First clause of a description, so rows stay one line like the v3 overlay. */
const shortDesc = (t: string) => { const m = t.split(/ [-–] | \. |: /)[0]; return m.replace(/[.,;:\s]+$/, '') + (m.length < t.length ? '.' : '') }

export default function SiteSearch({ variant = 'icon' }: { variant?: 'icon' | 'drawer' | 'pill' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const results = useMemo(() => (query.trim() ? searchDocs(query, 8) : []), [query])
  const list = query.trim()
    ? results
    : QUICK.map((t) => SEARCH_INDEX.find((d) => d.title === t)).filter(Boolean) as typeof SEARCH_INDEX

  const openSearch = useCallback(() => setOpen(true), [])
  const close = useCallback(() => { setOpen(false); setQuery(''); setActive(0) }, [])

  // global open: Cmd/Ctrl+K, "/" (when not typing), and a custom event for the mobile trigger
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((v) => !v) }
      else if (e.key === '/' && !typing && !open) { e.preventDefault(); setOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-site-search', openSearch as EventListener)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-site-search', openSearch as EventListener)
    }
  }, [open, openSearch])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 20)
  }, [open])
  useEffect(() => { setActive(0) }, [query])

  // fire a debounced `site_search` event so we capture what people search for,
  // even when they don't click a result
  const lastTracked = useRef('')
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    const id = setTimeout(() => {
      if (q !== lastTracked.current) {
        lastTracked.current = q
        trackSiteSearch(q, searchDocs(q, 8).length)
      }
    }, 700)
    return () => clearTimeout(id)
  }, [query])

  const go = useCallback((url: string, position: number) => {
    trackSiteSearchSelect(query.trim(), url, position, results.length)
    close()
    router.push(url)
  }, [query, results.length, close, router])

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, list.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); const d = list[active]; if (d) go(d.url, active) }
    else if (e.key === 'Escape') { e.preventDefault(); close() }
  }

  // The overlay is portalled to the page root: the v3 header uses
  // backdrop-filter, which would otherwise trap a fixed overlay inside it.
  const [portalEl, setPortalEl] = useState<Element | null>(null)
  useEffect(() => { setPortalEl(document.querySelector('.v3') || document.body) }, [])

  const overlay = open && (
    <>
      <div className="search-scrim" aria-hidden="true" onClick={close} />
      <div className="search-sheet" role="dialog" aria-modal="true" aria-label="Site search">
        <div className="search-bar">
          <div className="search-bar-in">
            <SearchIcon size={17} />
            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              spellCheck={false}
              placeholder="How can Marrelay help you?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKey}
              aria-label="Search the site"
            />
            {query.trim() && (
              <button
                type="button"
                className="search-clear"
                onClick={() => { setQuery(''); inputRef.current?.focus() }}
                aria-label="Clear search"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            )}
            <span className="search-div" aria-hidden="true" />
            <button type="button" className="search-close" onClick={close}>Esc</button>
          </div>
        </div>

        <div className="search-body">
          <div className="search-body-in">
            {!query.trim() && (
              <div className="search-pop">
                <span className="lbl">POPULAR</span>
                {QUICK.map((t) => {
                  const d = SEARCH_INDEX.find((x) => x.title === t)
                  return d ? (
                    <button key={t} type="button" className="chip" onClick={() => go(d.url, 0)}>{t}</button>
                  ) : null
                })}
              </div>
            )}
            {query.trim() && results.length === 0 && (
              <div className="search-empty">No matches for &ldquo;{query}&rdquo;. Try &ldquo;web&rdquo;, &ldquo;analytics&rdquo;, &ldquo;CAD&rdquo;, or &ldquo;pricing&rdquo;.</div>
            )}
            {query.trim() && list.map((d, i) => (
              <a
                key={d.url}
                className={`search-row${i === active ? ' on' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(d.url, i)}
              >
                <svg className="ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                </svg>
                <span className="tx"><b>{d.title}</b><span className="muted"> {shortDesc(d.description)}</span></span>
                <span className="tag">{d.section}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {variant === 'pill' ? (
        <button type="button" className="v-search-btn" aria-label="Search the site" title="Search  ( / )" onClick={openSearch}>
          <SearchIcon size={15} />
          <span className="kbd" aria-hidden="true">⌘K</span>
        </button>
      ) : variant === 'icon' ? (
        <button type="button" className="nav-search" aria-label="Search the site" title="Search  ( / )" onClick={openSearch}>
          <SearchIcon />
        </button>
      ) : (
        <button type="button" className="m-search" onClick={openSearch}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><SearchIcon size={16} /> Search</span>
          <span className="ar"><SearchIcon size={14} /></span>
        </button>
      )}

      {overlay && (portalEl ? createPortal(overlay, portalEl) : overlay)}
    </>
  )
}
