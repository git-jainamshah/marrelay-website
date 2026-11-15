'use client'

/**
 * One toast system for the whole admin. Every save, restore or failure is
 * acknowledged the same way, in the same place (top right), so nobody has to
 * wonder whether a click "took".
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Check, AlertTriangle, Info, X } from 'lucide-react'

export type ToastKind = 'ok' | 'err' | 'info'
export type ToastInput = { kind?: ToastKind; title: string; detail?: string; duration?: number; action?: { label: string; onClick: () => void } }
type ToastItem = ToastInput & { id: number }

const Ctx = createContext<{ toast: (t: ToastInput) => void } | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), [])
  const toast = useCallback((t: ToastInput) => {
    const id = ++seq.current
    setItems((xs) => [...xs.slice(-3), { ...t, id }])
    const ms = t.duration ?? (t.kind === 'err' ? 7000 : 4200)
    if (ms > 0) setTimeout(() => dismiss(id), ms)
  }, [dismiss])

  // Allow non-React code (fetch helpers) to raise a toast via a DOM event.
  useEffect(() => {
    const h = (e: Event) => toast((e as CustomEvent<ToastInput>).detail)
    window.addEventListener('admin:toast', h)
    return () => window.removeEventListener('admin:toast', h)
  }, [toast])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="ad-toasts" aria-live="polite">
        {items.map((t) => {
          const Icon = t.kind === 'err' ? AlertTriangle : t.kind === 'info' ? Info : Check
          return (
            <div key={t.id} className={`ad-toast2 ${t.kind || 'ok'}`} role="status">
              <span className="ic"><Icon size={15} /></span>
              <span className="tx">
                <b>{t.title}</b>
                {t.detail && <small>{t.detail}</small>}
              </span>
              {t.action && (
                <button className="act" onClick={() => { t.action!.onClick(); dismiss(t.id) }}>{t.action.label}</button>
              )}
              <button className="x" onClick={() => dismiss(t.id)} aria-label="Dismiss"><X size={14} /></button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const c = useContext(Ctx)
  if (!c) {
    // Outside the provider (should not happen in the panel): fall back to the event bus.
    return { toast: (t: ToastInput) => window.dispatchEvent(new CustomEvent('admin:toast', { detail: t })) }
  }
  return c
}

/** Raise a toast from anywhere (fetch helpers, non-component code). */
export function raiseToast(t: ToastInput) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('admin:toast', { detail: t }))
}
