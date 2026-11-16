'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

export type SelectOption = { value: string; label: string; note?: string }

type Props = {
  id?: string
  name: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  /** Shown when nothing is picked. Write it as an instruction, not a shrug. */
  placeholder: string
  /** Long lists get a search box. Short ones do not need one. */
  searchable?: boolean
  required?: boolean
  disabled?: boolean
  ariaLabel?: string
}

/**
 * The site's dropdown, sharing the phone picker's popover so a country code
 * and a budget range behave the same way. A native select cannot be styled to
 * match the rest of the form, and on a long list it cannot be searched, so
 * both use this instead.
 *
 * A hidden input carries the value, which keeps the field visible to the form
 * funnel tracker and to anything that reads the form rather than React state.
 */
export default function SelectField({
  id, name, value, onChange, options, placeholder,
  searchable, required, disabled, ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [up, setUp] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const useSearch = searchable ?? options.length >= 10
  const selected = options.find((o) => o.value === value) || null

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [query, options])

  useEffect(() => {
    if (!open) return
    // Open upward when there is not enough room below, so the list is never
    // half off the bottom of a long form.
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setUp(window.innerHeight - r.bottom < 280 && r.top > 300)

    if (useSearch) searchRef.current?.focus()
    const i = Math.max(0, options.findIndex((o) => o.value === value))
    setActive(i)

    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, useSearch, options, value])

  useEffect(() => { setActive(0) }, [query])

  useEffect(() => {
    if (!open) return
    const el = listRef.current?.children[active] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  function pick(o: SelectOption) {
    onChange(o.value)
    setOpen(false)
    setQuery('')
    btnRef.current?.focus()
  }

  function onKey(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true) }
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, matches.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (matches[active]) pick(matches[active]) }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); btnRef.current?.focus() }
    else if (e.key === 'Tab') setOpen(false)
  }

  return (
    <div className={`mselect${open ? ' open' : ''}`} ref={wrapRef}>
      <button
        type="button"
        id={id}
        ref={btnRef}
        className={`sel-btn${selected ? '' : ' empty'}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKey}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="val">{selected ? selected.label : placeholder}</span>
        <svg className="caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open && (
        <div className={`sel-pop${up ? ' up' : ''}`}>
          {useSearch && (
            <input
              ref={searchRef}
              type="text"
              className="sel-search"
              placeholder="Type to narrow the list"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKey}
              aria-label="Search the options"
            />
          )}
          <ul className="sel-list" role="listbox" ref={listRef}>
            {matches.map((o, i) => (
              <li
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                className={`sel-opt${i === active ? ' active' : ''}${o.value === value ? ' current' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(o)}
              >
                <span className="nm">{o.label}</span>
                {o.note && <span className="dl">{o.note}</span>}
              </li>
            ))}
            {matches.length === 0 && <li className="sel-empty">Nothing matches that.</li>}
          </ul>
        </div>
      )}

      <input type="hidden" name={name} value={value} required={required} />
    </div>
  )
}
