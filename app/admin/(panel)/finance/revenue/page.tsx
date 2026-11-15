'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Plus } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import { Kpi, BarChart, LineChart, Panel, Seg, Breakdown } from '@/components/admin/viz'
import { fmtMoney, fmtMoneyShort } from '@/lib/admin/finance'
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLOR } from '@/lib/admin/billing'
import { fmtDate } from '@/lib/admin/dates'

type Stats = {
  kpis: { billed: number; collected: number; outstanding: number; overdue: number; invoices: number; clients: number; projects: number; collectionRate: number }
  series12: { month: string; billed: number; collected: number }[]
  byStatus: { label: string; count: number; value: number }[]
  byClient: { label: string; billed: number; collected: number; outstanding: number }[]
  recent: { id: number; invoice_number: string; client_name: string; total: number; amount_paid: number; currency: string; status: string; issue_date: string; due_date: string | null }[]
}
const badge: Record<string, string> = { grey: 'grey', blue: 'blue', amber: 'amber', green: 'green', red: 'red' }
const money = (n: number) => fmtMoneyShort(n)
const MONTH = (ym: string) => new Date(`${ym}-15`).toLocaleDateString('en-CA', { month: 'short' })

export default function RevenueDashboard() {
  const [s, setS] = useState<Stats | null>(null)
  const [view, setView] = useState<'bars' | 'line' | 'cum'>('bars')
  const [tab, setTab] = useState<'clients' | 'owed' | 'status'>('clients')
  useEffect(() => { fetch('/api/admin/finance/revenue/stats', { cache: 'no-store' }).then((r) => r.json()).then(setS).catch(() => {}) }, [])

  const k = s?.kpis
  const labels = s?.series12.map((d) => MONTH(d.month)) ?? []
  const cum = (arr: number[]) => arr.reduce<number[]>((acc, v, i) => [...acc, (acc[i - 1] || 0) + v], [])

  return (
    <div className="ad-page ad-dash">
      <PageHeader kicker="Billing & Revenue" title="Revenue"
        description="What you have invoiced, what has been paid, and who still owes. Everything converted to CAD."
        actions={<>
          <Link href="/admin/finance/clients" className="ad-btn-ghost sm">Clients</Link>
          <Link href="/admin/finance/invoices" className="ad-btn sm"><Plus size={14} /> New invoice</Link>
        </>} />

      <div className="ad-kpis four">
        <Kpi label="Billed" value={k ? money(k.billed) : '–'} exact={k ? fmtMoney(k.billed) : undefined} sub="all invoices, not void" />
        <Kpi label="Collected" value={k ? money(k.collected) : '–'} exact={k ? fmtMoney(k.collected) : undefined} sub={k ? `${k.collectionRate}% of billed` : undefined} tone="ok" />
        <Kpi label="Outstanding" value={k ? money(k.outstanding) : '–'} exact={k ? fmtMoney(k.outstanding) : undefined} sub="billed, not yet paid" />
        <Kpi label="Overdue" value={k ? money(k.overdue) : '–'} exact={k ? fmtMoney(k.overdue) : undefined} sub="past the due date" tone={k && k.overdue > 0 ? 'red' : undefined} href="/admin/finance/invoices?status=overdue" />
      </div>

      <Panel title="Billed vs collected, last 12 months" sub="Hover a month. Click a legend item to hide it."
        right={<Seg small value={view} onChange={setView} options={[{ v: 'bars', l: 'Monthly' }, { v: 'line', l: 'Trend' }, { v: 'cum', l: 'Running total' }]} />}>
        {!s ? <div className="ad-skel" style={{ height: 230 }} /> : view === 'bars' ? (
          <BarChart labels={labels} series={[{ name: 'Billed', values: s.series12.map((d) => d.billed) }, { name: 'Collected', values: s.series12.map((d) => d.collected) }]} format={money} height={230} />
        ) : view === 'line' ? (
          <LineChart series={[{ name: 'Billed', data: s.series12.map((d) => ({ date: MONTH(d.month), value: d.billed })) }, { name: 'Collected', data: s.series12.map((d) => ({ date: MONTH(d.month), value: d.collected })) }]} format={money} height={230} />
        ) : (
          <LineChart series={[{ name: 'Billed to date', data: cum(s.series12.map((d) => d.billed)).map((v, i) => ({ date: labels[i], value: v })) }, { name: 'Collected to date', data: cum(s.series12.map((d) => d.collected)).map((v, i) => ({ date: labels[i], value: v })) }]} format={money} height={230} />
        )}
      </Panel>

      <div className="ad-two wide-left">
        <Panel title="Clients" sub={tab === 'clients' ? 'Ranked by revenue billed' : tab === 'owed' ? 'Who still owes you' : 'Invoices by payment status'}
          right={<Seg small value={tab} onChange={setTab} options={[{ v: 'clients', l: 'Top clients' }, { v: 'owed', l: 'Owed' }, { v: 'status', l: 'By status' }]} />}>
          {!s ? <div className="ad-skel" style={{ height: 240 }} /> : tab === 'clients' ? (
            <Breakdown data={s.byClient.map((c) => ({ label: c.label, value: c.billed }))} format={money} mono />
          ) : tab === 'owed' ? (
            <Breakdown data={s.byClient.filter((c) => c.outstanding > 0.005).sort((a, b) => b.outstanding - a.outstanding).map((c) => ({ label: c.label, value: c.outstanding }))} format={money} />
          ) : (
            <table className="ad-table plain">
              <thead><tr><th>Status</th><th>Invoices</th><th style={{ textAlign: 'right' }}>Billed</th></tr></thead>
              <tbody>
                {s.byStatus.length ? s.byStatus.map((r) => (
                  <tr key={r.label}><td><span className={`ad-badge ${badge[INVOICE_STATUS_COLOR[r.label]] || 'grey'}`}>{INVOICE_STATUS_LABELS[r.label] || r.label}</span></td><td>{r.count}</td><td style={{ textAlign: 'right' }}>{fmtMoney(r.value)}</td></tr>
                )) : <tr><td colSpan={3}><div className="ad-viz-empty">No invoices yet.</div></td></tr>}
              </tbody>
            </table>
          )}
        </Panel>
        <Panel title="At a glance">
          <dl className="ad-facts">
            <div><dt>Invoices</dt><dd>{k?.invoices ?? '–'}</dd></div>
            <div><dt>Clients</dt><dd>{k?.clients ?? '–'}</dd></div>
            <div><dt>Projects</dt><dd>{k?.projects ?? '–'}</dd></div>
            <div><dt>Collection rate</dt><dd>{k ? `${k.collectionRate}%` : '–'}</dd></div>
          </dl>
        </Panel>
      </div>

      <Panel title="Recent invoices" right={<Link href="/admin/finance/invoices" className="ad-more">All invoices <ArrowRight size={13} /></Link>}>
        {!s ? <div className="ad-skel" style={{ height: 160 }} /> : (
          <table className="ad-table plain">
            <thead><tr><th>Invoice</th><th>Client</th><th>Issued</th><th>Status</th><th style={{ textAlign: 'right' }}>Total</th><th></th></tr></thead>
            <tbody>
              {s.recent.length ? s.recent.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.invoice_number}</td>
                  <td className="ad-mut" style={{ fontSize: 12.5 }}>{r.client_name}</td>
                  <td className="ad-soft" style={{ fontSize: 12 }}>{fmtDate(r.issue_date)}</td>
                  <td><span className={`ad-badge ${badge[INVOICE_STATUS_COLOR[r.status]] || 'grey'}`}>{INVOICE_STATUS_LABELS[r.status] || r.status}</span></td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{fmtMoney(r.total, r.currency)}</td>
                  <td style={{ textAlign: 'right' }}><a href={`/admin/receipt/${r.id}`} target="_blank" className="ad-more">Receipt <ArrowRight size={12} /></a></td>
                </tr>
              )) : <tr><td colSpan={6}><div className="ad-viz-empty">No invoices yet. Create the first one from Invoices & Receipts.</div></td></tr>}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  )
}
