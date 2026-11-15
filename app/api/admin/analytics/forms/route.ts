import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/admin/auth'
import { ensureDb } from '@/lib/admin/db'
import { q } from '@/lib/admin/pg'
import { FORM_DEFS, formDef } from '@/lib/form-steps'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const num = (v: unknown) => Number(v) || 0

/** GET ?days=7|30|90&form=home-lead-form - the form funnel, counted by session. */
export async function GET(req: NextRequest) {
  const auth = await requireUser()
  if ('error' in auth) return auth.error
  await ensureDb()

  const d = Number(req.nextUrl.searchParams.get('days'))
  const days = [7, 30, 90].includes(d) ? d : 30
  const formId = req.nextUrl.searchParams.get('form') || FORM_DEFS[0].id
  const def = formDef(formId) || FORM_DEFS[0]
  const win = `created_at >= now() - ('${days}' || ' days')::interval`

  // Which forms actually have data, so the picker only offers real ones.
  const forms = (await q<{ form_id: string; c: number }>(
    `SELECT form_id, COUNT(*)::int AS c FROM form_events WHERE ${win} GROUP BY form_id ORDER BY c DESC`
  )).map((r) => ({ id: r.form_id, label: formDef(r.form_id)?.label || r.form_id, events: num(r.c) }))

  /** Distinct sessions that reached a given event (optionally a given field). */
  const rows = await q<{ event: string; field: string | null; c: number }>(
    `SELECT event, field, COUNT(DISTINCT session_id)::int AS c
       FROM form_events WHERE ${win} AND form_id = $1 GROUP BY event, field`,
    [def.id]
  )
  const at = (event: string, field?: string) =>
    num(rows.find((r) => r.event === event && (field ? r.field === field : r.field === null || r.field === undefined || !field))?.c)

  const viewed = num(rows.filter((r) => r.event === 'view').reduce((a, r) => a + num(r.c), 0))
  const started = num(rows.filter((r) => r.event === 'start').reduce((a, r) => a + num(r.c), 0))
  const submitted = num(rows.filter((r) => r.event === 'submit').reduce((a, r) => a + num(r.c), 0))
  const converted = num(rows.filter((r) => r.event === 'success').reduce((a, r) => a + num(r.c), 0))

  const fieldCount = (f: string) => num(rows.find((r) => r.event === 'field' && r.field === f)?.c)
  const errorCount = (f: string) => num(rows.find((r) => r.event === 'error' && r.field === f)?.c)

  // The funnel, in order. Each step's count is sessions that reached it.
  const steps = [
    { key: 'view', label: 'Saw the form', count: viewed, optional: false, errors: 0 },
    { key: 'start', label: 'Started filling it in', count: started, optional: false, errors: 0 },
    ...def.steps.map((st) => ({ key: st.field, label: `Filled: ${st.label}`, count: fieldCount(st.field), optional: !!st.optional, errors: errorCount(st.field) })),
    { key: 'submit', label: 'Pressed send', count: submitted, optional: false, errors: 0 },
    { key: 'success', label: 'Became a lead', count: converted, optional: false, errors: 0 },
  ]

  // Drop-off measured against the previous required step, so an optional
  // field left blank is not reported as people leaving.
  let prevRequired = viewed
  const funnel = steps.map((st, i) => {
    const ofTop = viewed ? Math.round((st.count / viewed) * 1000) / 10 : 0
    const dropFromPrev = i === 0 ? 0 : Math.max(0, prevRequired - st.count)
    const dropPct = i === 0 || prevRequired === 0 ? 0 : Math.round((dropFromPrev / prevRequired) * 1000) / 10
    const out = { ...st, ofTop, dropFromPrev, dropPct }
    if (!st.optional) prevRequired = st.count
    return out
  })

  // Where required steps lose the most people: the friction points.
  const friction = funnel
    .filter((f) => !f.optional && f.key !== 'view' && f.dropFromPrev > 0)
    .sort((a, b) => b.dropFromPrev - a.dropFromPrev)
    .slice(0, 5)

  const errorsByField = def.steps
    .map((st) => ({ label: st.label, value: errorCount(st.field) }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)

  return NextResponse.json({
    days, formId: def.id, formLabel: def.label, forms,
    kpis: {
      viewed, started, submitted, converted,
      startRate: viewed ? Math.round((started / viewed) * 1000) / 10 : 0,
      completionRate: started ? Math.round((converted / started) * 1000) / 10 : 0,
      overallRate: viewed ? Math.round((converted / viewed) * 1000) / 10 : 0,
      submitSuccessRate: submitted ? Math.round((converted / submitted) * 1000) / 10 : 0,
      abandoned: Math.max(0, started - converted),
    },
    funnel, friction, errorsByField,
  })
}
