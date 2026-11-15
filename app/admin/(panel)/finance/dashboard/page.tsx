'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Plus, Settings2 } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import { Kpi, BarChart, Panel, Seg, Breakdown } from '@/components/admin/viz'
import { useToast } from '@/components/admin/Toast'
import { fmtMoney, fmtMoneyShort, CURRENCIES } from '@/lib/admin/finance'
import { fmtDate } from '@/lib/admin/dates'

type Stats = {
  fx: { base: string; updatedAt?: string; rates: Record<string, number> }
  kpis: { monthlyRunRate: number; annualRunRate: number; activeSubscriptions: number; oneOffYTD: number; spendThisMonth: number; totalExpenses: number }
  series12: { month: string; recurring: number; oneoff: number; total: number }[]
  recByCategory: { label: string; value: number }[]
  offByCategory: { label: string; value: number }[]
  byTool: { label: string; value: number }[]
  byAccount: { label: string; value: number }[]
  byCurrency: { label: string; value: number }[]
  byFrequency: { label: string; count: number; monthly: number }[]
  marketingTotal: number
  marketingByType: { label: string; value: number }[]
  marketingByPlatform: { label: string; value: number }[]
  byPerson: { label: string; value: number }[]
  upcoming: { expense_id: string; name: string; date: string; amount_cad: number; amount_original: number; currency: string; frequency: string }[]
}
type Tab = 'category' | 'subs' | 'oneoff' | 'account' | 'marketing' | 'platform' | 'person'
const money = (n: number) => fmtMoneyShort(n)
const MONTH = (ym: string) => new Date(`${ym}-15`).toLocaleDateString('en-CA', { month: 'short' })

export default function FinanceDashboard() {
  const [s, setS] = useState<Stats | null>(null)
  const [tab, setTab] = useState<Tab>('category')
  const [showFx, setShowFx] = useState(false)
  const load = () => fetch('/api/admin/finance/stats', { cache: 'no-store' }).then((r) => r.json()).then(setS).catch(() => {})
  useEffect(() => { load() }, [])

  const k = s?.kpis
  const breakdown = useMemo(() => {
    if (!s) return { data: [], sub: '' }
    switch (tab) {
      case 'category': return { data: s.recByCategory, sub: 'Recurring, per month' }
      case 'subs': return { data: s.byTool, sub: 'Biggest subscriptions, per month' }
      case 'oneoff': return { data: s.offByCategory, sub: 'One-off spend this year' }
      case 'account': return { data: s.byAccount, sub: 'Monthly run-rate by billing account' }
      case 'marketing': return { data: s.marketingByType, sub: `Marketing & ads, ${fmtMoney(s.marketingTotal)} in total` }
      case 'platform': return { data: s.marketingByPlatform, sub: 'Marketing & ads by platform' }
      case 'person': return { data: s.byPerson, sub: 'Who logged the spend' }
    }
  }, [s, tab])

  const tabs: { v: Tab; l: string }[] = [
    { v: 'category', l: 'Category' }, { v: 'subs', l: 'Subscriptions' }, { v: 'oneoff', l: 'One-off' }, { v: 'account', l: 'Account' },
    ...(s?.marketingByType.length ? [{ v: 'marketing' as Tab, l: 'Marketing' }, { v: 'platform' as Tab, l: 'Platform' }] : []),
    ...(s?.byPerson.length ? [{ v: 'person' as Tab, l: 'Person' }] : []),
  ]

  return (
    <div className="ad-page ad-dash">
      <PageHeader kicker="Billing & Revenue" title="Expenses"
        description="What the studio spends. Recurring costs shown as a monthly run-rate; one-off costs when they happen. Everything in CAD."
        actions={<>
          <button type="button" className="ad-btn-ghost sm" onClick={() => setShowFx(!showFx)}><Settings2 size={14} /> Exchange rates</button>
          <Link href="/admin/finance/expenses" className="ad-btn sm"><Plus size={14} /> Log an expense</Link>
        </>} />

      {showFx && s && <FxCard fx={s.fx} onSaved={() => { load(); setShowFx(false) }} />}

      <div className="ad-kpis four">
        <Kpi label="Monthly run-rate" value={k ? money(k.monthlyRunRate) : '–'} exact={k ? fmtMoney(k.monthlyRunRate) : undefined} sub={k ? `${k.activeSubscriptions} active subscriptions` : undefined} />
        <Kpi label="Projected for the year" value={k ? money(k.annualRunRate) : '–'} exact={k ? fmtMoney(k.annualRunRate) : undefined} sub="run-rate × 12" />
        <Kpi label="Spend this month" value={k ? money(k.spendThisMonth) : '–'} exact={k ? fmtMoney(k.spendThisMonth) : undefined} sub="recurring + one-off" />
        <Kpi label="One-off this year" value={k ? money(k.oneOffYTD) : '–'} exact={k ? fmtMoney(k.oneOffYTD) : undefined} sub={k ? `${k.totalExpenses} records in total` : undefined} />
      </div>

      <Panel title="Spend, last 12 months" sub="Recurring stacked under one-off. Hover a month.">
        {!s ? <div className="ad-skel" style={{ height: 230 }} /> : (
          <BarChart stacked labels={s.series12.map((d) => MONTH(d.month))}
            series={[{ name: 'Recurring', values: s.series12.map((d) => d.recurring) }, { name: 'One-off', values: s.series12.map((d) => d.oneoff) }]} format={money} height={230} />
        )}
      </Panel>

      <div className="ad-two wide-left">
        <Panel title="Where the money goes" sub={breakdown.sub} right={<Seg small value={tab} onChange={setTab} options={tabs} />}>
          {!s ? <div className="ad-skel" style={{ height: 240 }} /> : <Breakdown data={breakdown.data} format={money} />}
        </Panel>
        <Panel title="Renewing soon" sub="Next 60 days">
          {!s ? <div className="ad-skel" style={{ height: 200 }} /> : s.upcoming.length === 0 ? <div className="ad-viz-empty">Nothing renews in the next 60 days.</div> : (
            <ul className="ad-list">
              {s.upcoming.slice(0, 8).map((u) => (
                <li key={u.expense_id + u.date}>
                  <span><b>{u.name}</b><small>{fmtDate(u.date)} · {u.frequency}</small></span>
                  <span className="r"><b>{fmtMoney(u.amount_cad)}</b>{u.currency !== 'CAD' && <small>{fmtMoney(u.amount_original, u.currency)}</small>}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="ad-two">
        <Panel title="Currency mix" sub="Original amounts before conversion">
          {!s ? <div className="ad-skel" style={{ height: 120 }} /> : <Breakdown data={s.byCurrency} format={(n) => fmtMoney(n)} mono />}
        </Panel>
        <Panel title="How often things bill" sub="Recurring expenses by frequency">
          {!s ? <div className="ad-skel" style={{ height: 120 }} /> : s.byFrequency.length === 0 ? <div className="ad-viz-empty">No recurring expenses yet.</div> : (
            <table className="ad-table plain">
              <thead><tr><th>Frequency</th><th>Count</th><th style={{ textAlign: 'right' }}>Per month</th></tr></thead>
              <tbody>{s.byFrequency.map((f) => <tr key={f.label}><td style={{ textTransform: 'capitalize' }}>{f.label}</td><td>{f.count}</td><td style={{ textAlign: 'right' }}>{fmtMoney(f.monthly)}</td></tr>)}</tbody>
            </table>
          )}
        </Panel>
      </div>

      <div className="ad-foot-links">
        <Link href="/admin/finance/expenses">All expenses <ArrowRight size={13} /></Link>
        <Link href="/admin/finance/accounts">Billing accounts <ArrowRight size={13} /></Link>
        <Link href="/admin/finance/revenue">Revenue <ArrowRight size={13} /></Link>
      </div>
    </div>
  )
}

function FxCard({ fx, onSaved }: { fx: Stats['fx']; onSaved: () => void }) {
  const { toast } = useToast()
  const [rates, setRates] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {}
    CURRENCIES.forEach((c) => { o[c] = String(fx.rates?.[c] ?? '') })
    return o
  })
  const [busy, setBusy] = useState(false)
  async function save() {
    setBusy(true)
    const payload = { rates: Object.fromEntries(CURRENCIES.map((c) => [c, Number(rates[c])])) }
    const res = await fetch('/api/admin/finance/fx', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setBusy(false)
    if (res.ok) { toast({ title: 'Exchange rates saved', detail: 'Totals on this page now use the new rates.' }); onSaved() }
    else toast({ kind: 'err', title: 'Rates were not saved', detail: 'Check the numbers and try again.' })
  }
  return (
    <div className="ad-card" style={{ marginBottom: 18 }}>
      <div className="ad-kicker" style={{ marginBottom: 6 }}>Exchange rates to CAD</div>
      <p className="ad-soft" style={{ fontSize: 12.5, marginBottom: 12 }}>1 unit of each currency equals this many Canadian dollars.{fx.updatedAt ? ` Last updated ${fmtDate(fx.updatedAt)}.` : ''}</p>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {CURRENCIES.map((c) => (
          <label key={c} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="ad-label" style={{ marginBottom: 0 }}>1 {c} =</span>
            <input className="ad-input" style={{ width: 110 }} inputMode="decimal" disabled={c === 'CAD'} value={rates[c]} onChange={(e) => setRates({ ...rates, [c]: e.target.value.replace(/[^\d.]/g, '') })} />
          </label>
        ))}
        <button className="ad-btn sm" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save rates'}</button>
      </div>
    </div>
  )
}
