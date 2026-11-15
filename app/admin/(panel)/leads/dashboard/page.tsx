'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Download } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import { Kpi, LineChart, Panel, Seg, Breakdown, Share } from '@/components/admin/viz'
import { fmtDateTime } from '@/lib/admin/dates'

type Stats = {
  total: number; withCompany: number; withClickId: number
  byStatus: { label: string; value: number }[]
  byService: { label: string; value: number }[]
  byBudget: { label: string; value: number }[]
  byChannel: { label: string; value: number }[]
  bySourceMedium: { label: string; value: number }[]
  byForm: { label: string; value: number }[]
  byLanding: { label: string; value: number }[]
  topCompanies: { company: string; name: string; status: string; created: string }[]
  series: { date: string; value: number }[]
}

const SERVICE_LABELS: Record<string, string> = { web: 'Web Development', data: 'Data & Analytics', social: 'Social', seo: 'SEO & Ads', engineering: 'Engineering' }
const STATUS_LABELS: Record<string, string> = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', won: 'Won', lost: 'Lost', spam: 'Spam' }
const FORM_LABELS: Record<string, string> = { contact: 'Contact form', 'promo-banner': 'Promo pop-up', offline: 'Offline', pitch: 'Pitch' }

type Range = '30' | '90' | '365' | 'all' | 'custom'
type Tab = 'channel' | 'status' | 'service' | 'budget' | 'source' | 'landing' | 'form'

const isoDaysAgo = (n: number) => new Date(Date.now() - n * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Toronto' })

export default function LeadsDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [range, setRange] = useState<Range>('90')
  const [from, setFrom] = useState(isoDaysAgo(90))
  const [to, setTo] = useState('')
  const [formType, setFormType] = useState('')
  const [tab, setTab] = useState<Tab>('channel')
  const [loading, setLoading] = useState(false)

  function pickRange(r: Range) {
    setRange(r)
    if (r === '30') { setFrom(isoDaysAgo(30)); setTo('') }
    else if (r === '90') { setFrom(isoDaysAgo(90)); setTo('') }
    else if (r === '365') { setFrom(isoDaysAgo(365)); setTo('') }
    else if (r === 'all') { setFrom(''); setTo('') }
  }

  useEffect(() => {
    const p = new URLSearchParams()
    if (from) p.set('from', from)
    if (to) p.set('to', to)
    if (formType) p.set('formType', formType)
    setLoading(true)
    const t = setTimeout(() => {
      fetch(`/api/admin/leads/stats?${p}`, { cache: 'no-store' }).then((r) => r.json()).then((d) => setStats(d.stats)).finally(() => setLoading(false))
    }, 150)
    return () => clearTimeout(t)
  }, [from, to, formType])

  const won = stats?.byStatus.find((s) => s.label === 'won')?.value ?? 0
  const lost = stats?.byStatus.find((s) => s.label === 'lost')?.value ?? 0
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null

  const breakdown = useMemo(() => {
    if (!stats) return []
    switch (tab) {
      case 'channel': return stats.byChannel
      case 'status': return stats.byStatus.map((s) => ({ ...s, label: STATUS_LABELS[s.label] ?? s.label }))
      case 'service': return stats.byService.map((s) => ({ ...s, label: SERVICE_LABELS[s.label] ?? s.label }))
      case 'budget': return stats.byBudget
      case 'source': return stats.bySourceMedium
      case 'landing': return stats.byLanding
      case 'form': return stats.byForm.map((s) => ({ ...s, label: FORM_LABELS[s.label] ?? s.label }))
    }
  }, [stats, tab])

  const exportParams = new URLSearchParams(); if (from) exportParams.set('from', from); if (to) exportParams.set('to', to); if (formType) exportParams.set('formType', formType)
  const exportHref = `/api/admin/leads/export?${exportParams}`

  return (
    <div className="ad-page ad-dash">
      <PageHeader kicker="Leads & Pitches" title="Leads Dashboard"
        description="How many enquiries you get, where they come from, and what they ask for. Pick a period; every number below follows it."
        actions={<>
          <a href={exportHref} className="ad-btn-ghost sm"><Download size={14} /> Export CSV</a>
          <Link href="/admin/leads" className="ad-btn sm">Open leads <ArrowRight size={14} /></Link>
        </>} />

      <div className="ad-filters">
        <Seg value={range} onChange={pickRange} options={[{ v: '30', l: '30 days' }, { v: '90', l: '90 days' }, { v: '365', l: '12 months' }, { v: 'all', l: 'All time' }, { v: 'custom', l: 'Custom' }]} />
        {range === 'custom' && (
          <div className="ad-filters-dates">
            <input type="date" className="ad-input" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
            <span className="ad-soft">to</span>
            <input type="date" className="ad-input" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" />
          </div>
        )}
        <select className="ad-select-sm" value={formType} onChange={(e) => setFormType(e.target.value)} aria-label="Which form">
          <option value="">Every form</option>
          <option value="contact">Contact form</option>
          <option value="promo-banner">Promo pop-up</option>
          <option value="offline">Offline leads</option>
          <option value="pitch">Pitches</option>
        </select>
        {loading && <span className="ad-soft" style={{ fontSize: 12 }}>Updating…</span>}
      </div>

      <div className="ad-kpis four">
        <Kpi label="Leads" value={stats ? stats.total : '–'} sub="in this period" />
        <Kpi label="From companies" value={stats ? stats.withCompany : '–'} sub={stats && stats.total ? `${Math.round((stats.withCompany / stats.total) * 100)}% gave a company` : undefined} />
        <Kpi label="From paid ads" value={stats ? stats.withClickId : '–'} sub={stats && stats.total ? `${Math.round((stats.withClickId / stats.total) * 100)}% arrived with a click ID` : undefined} />
        <Kpi label="Won" value={stats ? won : '–'} sub={winRate !== null ? `${winRate}% of decided leads` : 'No decided leads yet'} tone={won > 0 ? 'ok' : undefined} />
      </div>

      <Panel title="Leads over time" sub="One point per day. Hover for the count.">
        {stats ? <LineChart series={[{ name: 'Leads', data: stats.series }]} height={220} /> : <div className="ad-skel" style={{ height: 220 }} />}
      </Panel>

      <div className="ad-two wide-left">
        <Panel title="Where they come from and what they want" sub="Switch the view; click a status to open those leads."
          right={<Seg small value={tab} onChange={setTab} options={[
            { v: 'channel', l: 'Channel' }, { v: 'status', l: 'Status' }, { v: 'service', l: 'Service' }, { v: 'budget', l: 'Budget' },
            { v: 'source', l: 'Source' }, { v: 'landing', l: 'Page' }, { v: 'form', l: 'Form' },
          ]} />}>
          {stats ? (
            <Breakdown data={breakdown} top={8}
              onPick={tab === 'status' ? (label) => { const k = Object.entries(STATUS_LABELS).find(([, v]) => v === label)?.[0]; if (k) window.location.href = `/admin/leads?status=${k}` } : undefined} />
          ) : <div className="ad-skel" style={{ height: 240 }} />}
        </Panel>
        <Panel title="Channel mix" sub="Share of leads by how the visit started">
          {stats ? <Share data={stats.byChannel} /> : <div className="ad-skel" style={{ height: 120 }} />}
        </Panel>
      </div>

      <Panel title="Recent company leads" sub="Enquiries that named a company" right={<Link href="/admin/leads" className="ad-more">All leads <ArrowRight size={13} /></Link>}>
        {!stats ? <div className="ad-skel" style={{ height: 160 }} /> : stats.topCompanies.length === 0 ? (
          <div className="ad-viz-empty">No company leads in this period.</div>
        ) : (
          <table className="ad-table plain">
            <thead><tr><th>Company</th><th>Contact</th><th>Status</th><th style={{ textAlign: 'right' }}>Received</th></tr></thead>
            <tbody>
              {stats.topCompanies.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{c.company}</td>
                  <td className="ad-mut">{c.name}</td>
                  <td><span className="ad-badge grey">{STATUS_LABELS[c.status] ?? c.status}</span></td>
                  <td className="ad-soft" style={{ fontSize: 12, textAlign: 'right', whiteSpace: 'nowrap' }}>{fmtDateTime(c.created)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  )
}
