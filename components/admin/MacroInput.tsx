'use client'

/**
 * A text field that knows about {{placeholders}}. Type "{{" and a list of the
 * available fields drops in, the way an editor would: arrow keys to move,
 * Enter or Tab to insert, Escape to dismiss. Chips underneath insert at the
 * caret for anyone who would rather click than type.
 */
import { useEffect, useMemo, useRef, useState } from 'react'

export type Macro = { key: string; label: string; sample: string }

/** The fields a lead email can use. Sample values are what the preview shows. */
export const LEAD_MACROS: Macro[] = [
  { key: 'name', label: 'Their name', sample: 'Priya Raman' },
  { key: 'company', label: 'Their company', sample: 'Northfield Clinic' },
  { key: 'company_paren', label: 'Company in brackets, or nothing', sample: ' (Northfield Clinic)' },
  { key: 'email', label: 'Their email', sample: 'priya@northfieldclinic.ca' },
  { key: 'phone', label: 'Their phone', sample: '416 555 0188' },
  { key: 'form', label: 'Which form they used', sample: 'Contact form' },
  { key: 'form_lower', label: 'Form name, lower case', sample: 'contact form' },
  { key: 'budget', label: 'Budget they gave', sample: '25k-50k' },
  { key: 'timeline', label: 'Timeline they gave', sample: 'Within the next month' },
  { key: 'reference', label: 'Lead reference number', sample: 'MR-2026-0142' },
]

export default function MacroInput({
  value, onChange, multiline, rows = 2, placeholder, macros = LEAD_MACROS, id,
}: {
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  rows?: number
  placeholder?: string
  macros?: Macro[]
  id?: string
}) {
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [idx, setIdx] = useState(0)
  const [caret, setCaret] = useState(0)

  const matches = useMemo(() => {
    const q = query.toLowerCase()
    return macros.filter((m) => !q || m.key.toLowerCase().includes(q) || m.label.toLowerCase().includes(q))
  }, [macros, query])

  useEffect(() => { setIdx(0) }, [query])

  /** Is the caret sitting just after an unclosed "{{partial"? */
  function detect(text: string, pos: number) {
    const before = text.slice(0, pos)
    const m = before.match(/\{\{(\w*)$/)
    if (m) { setQuery(m[1]); setOpen(true); setCaret(pos) }
    else setOpen(false)
  }

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    onChange(e.target.value)
    detect(e.target.value, e.target.selectionStart ?? 0)
  }

  /** Replace the "{{partial" being typed with the full placeholder. */
  function insert(key: string) {
    const el = ref.current
    const pos = el?.selectionStart ?? caret
    const before = value.slice(0, pos)
    const open2 = before.lastIndexOf('{{')
    if (open2 === -1) return
    const next = value.slice(0, open2) + `{{${key}}}` + value.slice(pos)
    onChange(next)
    setOpen(false)
    // put the caret just after what we inserted
    requestAnimationFrame(() => {
      const at = open2 + key.length + 4
      el?.focus()
      el?.setSelectionRange(at, at)
    })
  }

  /** Chip click: drop a placeholder in wherever the caret was. */
  function insertAtCaret(key: string) {
    const el = ref.current
    const pos = el?.selectionStart ?? value.length
    const next = value.slice(0, pos) + `{{${key}}}` + value.slice(pos)
    onChange(next)
    requestAnimationFrame(() => {
      const at = pos + key.length + 4
      el?.focus()
      el?.setSelectionRange(at, at)
    })
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || matches.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(matches.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insert(matches[idx].key) }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false) }
  }

  const common = {
    ref: ref as any,
    id,
    className: 'ad-input',
    value,
    placeholder,
    onChange: handle,
    onKeyDown,
    onBlur: () => setTimeout(() => setOpen(false), 150),
    onClick: (e: any) => detect(value, e.target.selectionStart ?? 0),
  }

  return (
    <div className="ad-macro">
      {multiline ? <textarea rows={rows} {...common} /> : <input type="text" {...common} />}

      {open && matches.length > 0 && (
        <div className="ad-macro-pop" role="listbox">
          <div className="hd">Insert a field</div>
          {matches.map((m, i) => (
            <button type="button" key={m.key} role="option" aria-selected={i === idx}
              className={i === idx ? 'on' : ''}
              onMouseEnter={() => setIdx(i)}
              onMouseDown={(e) => { e.preventDefault(); insert(m.key) }}>
              <code>{`{{${m.key}}}`}</code>
              <span className="lb">{m.label}</span>
              <span className="sm">{m.sample}</span>
            </button>
          ))}
          <div className="ft"><kbd>↑↓</kbd> move <kbd>↵</kbd> insert <kbd>esc</kbd> close</div>
        </div>
      )}

      <div className="ad-macro-chips">
        {macros.slice(0, 6).map((m) => (
          <button type="button" key={m.key} onClick={() => insertAtCaret(m.key)} title={`${m.label} - e.g. ${m.sample}`}>
            {`{{${m.key}}}`}
          </button>
        ))}
      </div>
    </div>
  )
}
