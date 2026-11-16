'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { COUNTRIES_SORTED, countryByCode, digitsOf, formatNational, type Country } from '@/lib/form-validate'

/** 🇨🇦 from "CA". Windows has no flag glyphs and falls back to the letters, which still reads. */
function flagOf(code: string) {
  return code.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}

type Props = {
  digits: string
  country: string
  onChange: (next: { digits: string; country: string }) => void
  id?: string
  name?: string
  required?: boolean
  placeholder?: string
  onFocus?: () => void
  onBlur?: () => void
  /** Drives the green tick / red underline, owned by the form. */
  status?: 'idle' | 'ok' | 'error'
  /** For forms outside the site's .lead-form styling, such as the promo pop-up. */
  inputStyle?: React.CSSProperties
}

export default function PhoneField({
  digits, country, onChange, id, name = 'phone', required, placeholder, onFocus, onBlur,
  status = 'idle', inputStyle,
}: Props) {
  const c = countryByCode(country)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COUNTRIES_SORTED
    const digitsQ = q.replace(/\D/g, '')
    return COUNTRIES_SORTED.filter(
      (x) =>
        x.name.toLowerCase().includes(q) ||
        x.code.toLowerCase() === q ||
        (digitsQ.length > 0 && x.dial.replace(/\D/g, '').startsWith(digitsQ)),
    )
  }, [query])

  // Close on an outside click or Escape, and focus the search as it opens.
  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => { setActive(0) }, [query])

  useEffect(() => {
    if (!open) return
    const el = listRef.current?.children[active] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  function pick(next: Country) {
    onChange({ digits, country: next.code })
    setOpen(false)
    setQuery('')
  }

  function onSearchKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, matches.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (matches[active]) pick(matches[active]) }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false) }
  }

  return (
    <div className={`phone-field${open ? ' open' : ''}`} ref={wrapRef}>
      <div className="phone-row">
        <button
          type="button"
          className="dial-btn"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Country code: ${c.name} ${c.dial}`}
          title={c.name}
          style={inputStyle ? { ...inputStyle, width: 'auto', flex: '0 0 auto' } : undefined}
        >
          <span className="flag" aria-hidden="true">{flagOf(c.code)}</span>
          <span className="dial">{c.dial}</span>
          <svg className="caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
            <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        <input
          id={id}
          name={name}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required={required}
          placeholder={placeholder || (c.code === 'CA' || c.code === 'US' ? '(416) 555 0123' : 'Phone number')}
          value={formatNational(digits, c.code)}
          onChange={(e) => onChange({ digits: digitsOf(e.target.value).slice(0, 15), country: c.code })}
          onFocus={onFocus}
          onBlur={onBlur}
          className="phone-input"
          style={inputStyle ? { ...inputStyle, flex: '1 1 auto', minWidth: 0 } : undefined}
        />
      </div>

      {open && (
        <div className="dial-pop">
          <input
            ref={searchRef}
            type="text"
            className="dial-search"
            placeholder="Search country or code"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKey}
            aria-label="Search for a country"
          />
          <ul className="dial-list" role="listbox" ref={listRef}>
            {matches.map((x, i) => (
              <li
                key={x.code}
                role="option"
                aria-selected={x.code === c.code}
                className={`dial-opt${i === active ? ' active' : ''}${x.code === c.code ? ' current' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(x)}
              >
                <span className="flag" aria-hidden="true">{flagOf(x.code)}</span>
                <span className="nm">{x.name}</span>
                <span className="dl">{x.dial}</span>
              </li>
            ))}
            {matches.length === 0 && <li className="dial-empty">No country matches that.</li>}
          </ul>
        </div>
      )}

      {/* What actually reaches the server, so the form posts E.164 either way. */}
      <input type="hidden" name={`${name}_country`} value={c.code} />
      <span className="sr-only" aria-live="polite">{status === 'ok' ? 'Phone number looks complete' : ''}</span>
    </div>
  )
}
