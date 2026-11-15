'use client'

/**
 * First-party form tracking. Records that a form was seen, started, which
 * fields got filled, whether it failed validation, and whether it converted.
 * Fire-and-forget: a tracking failure must never affect the form.
 */
const VID_KEY = 'mr_vid'
const SID_KEY = 'mr_sid'

function rid() {
  try { return crypto.randomUUID().replace(/-/g, '').slice(0, 24) } catch { return Math.random().toString(36).slice(2) + Date.now().toString(36) }
}
function ids() {
  try {
    let v = localStorage.getItem(VID_KEY)
    if (!v) { v = rid(); localStorage.setItem(VID_KEY, v) }
    let s = sessionStorage.getItem('mr_traffic_session_id') || sessionStorage.getItem(SID_KEY)
    if (!s) { s = rid(); sessionStorage.setItem(SID_KEY, s) }
    return { visitorId: v, sessionId: s }
  } catch { return { visitorId: '', sessionId: '' } }
}

export type FormEventKind = 'view' | 'start' | 'field' | 'error' | 'submit' | 'success'

function send(body: Record<string, unknown>) {
  try {
    const payload = JSON.stringify({ ...ids(), path: location.pathname, ...body })
    if (navigator.sendBeacon) navigator.sendBeacon('/api/public/fe', new Blob([payload], { type: 'application/json' }))
    else fetch('/api/public/fe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true })
  } catch { /* never break a form */ }
}

/** One tracker per form instance. Each step is only reported once per visit. */
export function createFormTracker(formId: string, formType: string) {
  const seen = new Set<string>()
  const once = (key: string, fn: () => void) => { if (seen.has(key)) return; seen.add(key); fn() }

  const track = (event: FormEventKind, field?: string) => send({ formId, formType, event, field: field || null })

  return {
    view: () => once('view', () => track('view')),
    start: () => once('start', () => track('start')),
    /** A field the visitor actually filled in. Reported once per field. */
    field: (name: string) => { if (name) once(`f:${name}`, () => track('field', name)) },
    /** Validation stopped them. Reported for each offending field, once each. */
    error: (fields: string[]) => fields.forEach((f) => once(`e:${f}`, () => track('error', f))),
    submit: () => track('submit'),
    success: () => track('success'),
    /**
     * Attach to a form element to capture field completion without touching
     * every input: onBlurCapture for text fields, onChangeCapture for choices.
     */
    handlers: {
      onBlurCapture: (e: React.FocusEvent<HTMLFormElement>) => {
        const t = e.target as unknown as HTMLInputElement | HTMLTextAreaElement
        if (!t?.name || t.type === 'checkbox' || t.type === 'radio') return
        if (t.value && t.value.trim()) { if (t.name) once(`f:${t.name}`, () => track('field', t.name)) }
      },
      onChangeCapture: (e: React.ChangeEvent<HTMLFormElement>) => {
        const t = e.target as unknown as HTMLInputElement
        if (!t || (t.type !== 'checkbox' && t.type !== 'radio')) return
        if (t.checked) {
          const name = t.name === 'service' ? 'services' : t.name || 'consent'
          once(`f:${name}`, () => track('field', name))
        }
      },
    },
  }
}
export type FormTracker = ReturnType<typeof createFormTracker>
