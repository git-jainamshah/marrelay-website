'use client'

import { useState } from 'react'

/** v3 accordion: one open at a time, all closed by default. */
export default function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(-1)
  return (
    <div className="v-faq">
      {items.map((f, i) => {
        const on = open === i
        return (
          <div key={f.q} className="v-faq-i">
            <button type="button" className="v-faq-q" aria-expanded={on} onClick={() => setOpen(on ? -1 : i)}>
              <span>{f.q}</span>
              <span className="sg" aria-hidden="true">{on ? '−' : '+'}</span>
            </button>
            {on && <p className="v-faq-a">{f.a}</p>}
          </div>
        )
      })}
    </div>
  )
}
