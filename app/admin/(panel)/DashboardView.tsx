'use client'

/**
 * Home. Three numbers, one chart, what needs attention, latest leads, and the
 * handful of things people open the admin to do. Everything else lives on the
 * Leads and Revenue dashboards.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { Kpi, LineChart, Panel, Seg } from '@/components/admin/viz'
import { fmtDateTime, fmtRelative } from '@/lib/admin/dates'
import { isProduction, envLabel, SITE_URL } from '@/lib/env'
import { QUICK_ACTIONS } from '@/components/admin/nav'

const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')

type Stats = {
  kpis: {
    totalLeads: number; newLeads: number; mediaFiles: number; activeScripts: number; tagManagers: number; activeUsers: number
    last7: number; prev7: number; delta7: number | null; last30: number; prev30: number; delta30: number | null
    stale: number; blogViews: number
  }
  series: { date: string; value: number }[]
  byChannel: { label: string; value: number }[]
  recent: any[]
}

const STATUS_LABELS: Record<string, string> = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', won: 'Won', lost: 'Lost', spam: 'Spam' }
const FORM_LABELS: Record<string, string> = { contact: 'Contact form', 'promo-banner': 'Promo pop-up', offline: 'Offline', pitch: 'Pitch', other: 'Other' }
const STATUS_CLASS: Record<string, string> = { new: 'blue', contacted: 'amber', qualified: 'green', won: 'green', lost: 'red', spam: 'grey' }

export default function DashboardView({ firstName }: { firstName: string }) {
  const [s, setS] = useState<Stats | null>(null)
  const [days, setDays] = useState<'7' | '30' | '90'>('30')
  const [err, setErr] = useState('')
  const [updated, setUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)

  const load = (d = days) => {
    setLoading(true)
    fetch(`/api/admin/dashboard?days=${d}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load the dashboard.'))))
      .then((j) => { setS(j); setUpdated(new Date()); setErr('') })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load(days) }, [days]) // eslint-disable-line react-hooks/exhaustive-deps
  // Live: refresh every 60s while the tab is visible.
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') load() }, 60_000)
    return () => clearInterval(t)
  }, [days]) // eslint-disable-line react-hooks/exhaustive-deps

  const hour = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Toronto' }))
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  if (err) return <div className="ad-alert err">{err}</div>

  const k = s?.kpis
  return (
    <div className="ad-page ad-dash">
      <div className="ad-page-head" style={{ marginBottom: 22 }}>
        <div className="ad-page-head-main">
          <div className="ad-kicker">Overview</div>
          <h1>{greeting}, {firstName}</h1>
          <p className="ad-page-desc">
            {SITE_HOST} · Eastern time{!isProduction && <> · <b>{envLabel} data, not the live site</b></>}
            {updated && <span className="ad-soft"> · updated {fmtRelative(updated.toISOString())}</span>}
          </p>
        </div>
        <div className="ad-page-actions">
          <button type="button" className="ad-btn-ghost sm" onClick={() => load()} disabled={loading} title="Refresh now"><RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh</button>
          <button type="button" className="ad-btn-ghost sm" onClick={() => window.dispatchEvent(new Event('admin:palette'))}>Find anything <kbd className="ad-kbd">⌘K</kbd></button>
        </div>
      </div>

      {k && k.stale > 0 && (
        <Link href="/admin/leads?status=new" className="ad-attn">
          <b>{k.stale} lead{k.stale === 1 ? '' : 's'} still marked New after 48 hours.</b> Worth a reply before they go cold. <ArrowRight size={14} />
        </Link>
      )}

      <div className="ad-kpis three">
        <Kpi label="Leads this week" value={k ? k.last7 : '–'} delta={k?.delta7} deltaLabel="vs the week before" sub={k ? `${k.prev7} the week before` : undefined} href="/admin/leads" />
        <Kpi label="Leads, last 30 days" value={k ? k.last30 : '–'} delta={k?.delta30} deltaLabel="vs the previous 30 days" sub={k ? `${k.prev30} the previous 30` : undefined} href="/admin/leads" />
        <Kpi label="Waiting for a first reply" value={k ? k.newLeads : '–'} sub={k ? `${k.totalLeads} leads all time` : undefined} href="/admin/leads?status=new" tone={k && k.newLeads > 0 ? 'red' : undefined} />
      </div>

      <Panel title="Leads over time" sub="Hover a day for the count"
        right={<Seg small value={days} onChange={setDays} options={[{ v: '7', l: '7 days' }, { v: '30', l: '30 days' }, { v: '90', l: '90 days' }]} />}>
        {s ? <LineChart series={[{ name: 'Leads', data: s.series }]} height={200} /> : <div className="ad-skel" style={{ height: 200 }} />}
      </Panel>

      <div className="ad-two">
        <Panel title="Latest leads" right={<Link href="/admin/leads" className="ad-more">See all <ArrowRight size={13} /></Link>}>
          {!s ? <div className="ad-skel" style={{ height: 180 }} /> : s.recent.length === 0 ? (
            <div className="ad-viz-empty">No leads yet. They appear here the moment a visitor submits a form.</div>
          ) : (
            <table className="ad-table plain">
              <tbody>
                {s.recent.slice(0, 6).map((l: any) => (
                  <tr key={l.id}>
                    <td><div style={{ fontWeight: 500 }}>{l.name || 'Unnamed'}</div><div className="ad-soft" style={{ fontSize: 12 }}>{l.company || FORM_LABELS[l.form_type] || l.form_type || ''}</div></td>
                    <td><span className={`ad-badge ${STATUS_CLASS[l.status] || 'grey'}`}>{STATUS_LABELS[l.status] ?? l.status ?? 'New'}</span></td>
                    <td className="ad-soft" style={{ fontSize: 12, whiteSpace: 'nowrap', textAlign: 'right' }} title={fmtDateTime(l.created_at)}>{fmtRelative(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Do something" sub="The usual jobs, one click away">
          <div className="ad-quick col">
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon
              return (
                <Link key={a.href} href={a.href} className="ad-quick-item">
                  <span className="ic"><Icon size={15} /></span>
                  <span className="tx"><b>{a.label}</b><small>{a.hint}</small></span>
                  <ArrowRight size={14} className="go" />
                </Link>
              )
            })}
          </div>
        </Panel>
      </div>

      <div className="ad-foot-links">
        <Link href="/admin/leads/dashboard">Leads dashboard <ArrowRight size={13} /></Link>
        <Link href="/admin/finance/revenue">Revenue dashboard <ArrowRight size={13} /></Link>
        <Link href="/admin/storage">Storage <ArrowRight size={13} /></Link>
        <Link href="/admin/users">Access <ArrowRight size={13} /></Link>
      </div>
    </div>
  )
}
