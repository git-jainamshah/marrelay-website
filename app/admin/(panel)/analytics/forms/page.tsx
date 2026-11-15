'use client'

/**
 * Form funnel: how many people see a form, start it, how far they get, where
 * they give up, and how many become a lead.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import { Kpi, Panel, Seg, Breakdown, Funnel, type FunnelStep } from '@/components/admin/viz'

type Stats = {
  days: number; formId: string; formLabel: string
  forms: { id: string; label: string; events: number }[]
  kpis: { viewed: number; started: number; submitted: number; converted: number; startRate: number; completionRate: number; overallRate: number; submitSuccessRate: number; abandoned: number }
  funnel: FunnelStep[]
  friction: FunnelStep[]
  errorsByField: { label: string; value: number }[]
}

export default function FormFunnelPage() {
  const [s, setS] = useState<Stats | null>(null)
  const [days, setDays] = useState<'7' | '30' | '90'>('30')
  const [form, setForm] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    const p = new URLSearchParams({ days })
    if (form) p.set('form', form)
    fetch(`/api/admin/analytics/forms?${p}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load the form funnel.'))))
      .then(setS).catch((e) => setErr(e.message))
  }, [days, form])

  if (err) return <div className="ad-page"><div className="ad-alert err">{err}</div></div>
  const k = s?.kpis
  const empty = s && k && k.viewed === 0

  return (
    <div className="ad-page ad-dash">
      <PageHeader kicker="Overview" title="Form Funnel"
        description="Where people give up on your forms. Every step is counted once per visit, so one person filling the same field twice is still one person."
        actions={<Link href="/admin/analytics/site" className="ad-btn-ghost sm">Site analytics <ArrowRight size={14} /></Link>} />

      <div className="ad-filters">
        <Seg value={days} onChange={setDays} options={[{ v: '7', l: '7 days' }, { v: '30', l: '30 days' }, { v: '90', l: '90 days' }]} />
        {s && s.forms.length > 1 && (
          <select className="ad-select-sm" value={form || s.formId} onChange={(e) => setForm(e.target.value)} aria-label="Which form">
            {s.forms.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        )}
        {s && <span className="ad-soft" style={{ fontSize: 12 }}>{s.formLabel}</span>}
      </div>

      {empty && (
        <div className="ad-attn" style={{ borderLeftColor: 'var(--ink)' }}>
          <b>No form activity recorded yet.</b> Tracking starts with this version. Open the contact form on the site and come back; it fills in within a minute.
        </div>
      )}

      <div className="ad-kpis four">
        <Kpi label="Saw the form" value={k ? k.viewed : '–'} sub="visits that reached it" />
        <Kpi label="Started filling it" value={k ? k.started : '–'} sub={k ? `${k.startRate}% of those who saw it` : undefined} />
        <Kpi label="Became a lead" value={k ? k.converted : '–'} sub={k ? `${k.overallRate}% of everyone who saw it` : undefined} tone={k && k.converted > 0 ? 'ok' : undefined} href="/admin/leads" />
        <Kpi label="Started but gave up" value={k ? k.abandoned : '–'} sub={k ? `${100 - k.completionRate}% of starters` : undefined} tone={k && k.abandoned > 0 ? 'red' : undefined} />
      </div>

      <Panel title="The funnel" sub="Width is the share of everyone who saw the form. Red numbers are people lost at that step.">
        {s ? <Funnel steps={s.funnel} /> : <div className="ad-skel" style={{ height: 320 }} />}
      </Panel>

      <div className="ad-two">
        <Panel title="Friction points" sub="The steps that lose the most people">
          {!s ? <div className="ad-skel" style={{ height: 160 }} /> : s.friction.length === 0 ? (
            <div className="ad-viz-empty">Nothing is losing people yet.</div>
          ) : (
            <ul className="ad-list">
              {s.friction.map((f) => (
                <li key={f.key}>
                  <span><b>{f.label}</b><small>{f.dropPct}% of the people who got this far</small></span>
                  <span className="r"><b style={{ color: 'var(--brand-ink)' }}>−{f.dropFromPrev}</b><small>gave up</small></span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Validation errors" sub="Fields the form rejected, by how often">
          {!s ? <div className="ad-skel" style={{ height: 160 }} /> : s.errorsByField.length === 0 ? (
            <div className="ad-viz-empty">No validation errors. Nobody has been blocked by the form.</div>
          ) : (
            <>
              <Breakdown data={s.errorsByField} top={6} />
              <p className="ad-soft" style={{ fontSize: 12, marginTop: 10, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                A field high on this list is worth rewording, or making optional, before anything else.
              </p>
            </>
          )}
        </Panel>
      </div>

      <div className="ad-two">
        <Panel title="Rates">
          <dl className="ad-facts">
            <div><dt>Saw it, then started</dt><dd>{k ? `${k.startRate}%` : '–'}</dd></div>
            <div><dt>Started, then converted</dt><dd>{k ? `${k.completionRate}%` : '–'}</dd></div>
            <div><dt>Pressed send, then converted</dt><dd>{k ? `${k.submitSuccessRate}%` : '–'}</dd></div>
            <div><dt>Saw it, then converted</dt><dd>{k ? `${k.overallRate}%` : '–'}</dd></div>
          </dl>
          <p className="ad-soft" style={{ fontSize: 12, marginTop: 10, lineHeight: 1.55 }}>
            If &ldquo;pressed send, then converted&rdquo; is below 100%, some submissions are failing after the button, which is a bug rather than friction.
          </p>
        </Panel>
        <Panel title="How this is counted">
          <p className="ad-soft" style={{ fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>
            Counted per visit, first-party, with no cookies and no field contents: only that a field was filled, never what was typed.
            Optional fields are shown in grey and never counted as drop-off. A visit that fills a field, leaves, and comes back the next day counts twice, once per visit.
          </p>
        </Panel>
      </div>
    </div>
  )
}
