'use client'

/**
 * Site analytics from our own data: no tag manager, no ad-blocker losses,
 * and the same channel grouping the leads use.
 */
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Settings2 } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import { Kpi, LineChart, Panel, Seg, Breakdown, Share } from '@/components/admin/viz'

type Row = { label: string; value: number }
type Stats = {
  days: number
  kpis: {
    users: number; sessions: number; views: number
    deltaUsers: number | null; deltaSessions: number | null; deltaViews: number | null
    prevUsers: number; prevSessions: number; prevViews: number
    viewsPerSession: number; bounceRate: number; leads: number; conversionRate: number
  }
  series: { date: string; views: number; sessions: number; users: number }[]
  byChannel: Row[]; bySource: Row[]; byDevice: Row[]; byCountry: Row[]
  pages: Row[]; landing: Row[]; referrers: Row[]
}

type Metric = 'sessions' | 'users' | 'views'
type Tab = 'pages' | 'landing' | 'source' | 'referrers' | 'country' | 'device'

const REGION = typeof Intl !== 'undefined' && (Intl as any).DisplayNames ? new (Intl as any).DisplayNames(['en'], { type: 'region' }) : null
const country = (code: string) => { try { return code && code.length === 2 ? REGION?.of(code) || code : code } catch { return code } }

export default function SiteAnalyticsPage() {
  const [s, setS] = useState<Stats | null>(null)
  const [days, setDays] = useState<'7' | '30' | '90'>('30')
  const [metric, setMetric] = useState<Metric>('sessions')
  const [tab, setTab] = useState<Tab>('pages')
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch(`/api/admin/analytics/site?days=${days}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load site analytics.'))))
      .then(setS).catch((e) => setErr(e.message))
  }, [days])

  const k = s?.kpis
  const breakdown = useMemo(() => {
    if (!s) return { data: [] as Row[], sub: '' }
    switch (tab) {
      case 'pages': return { data: s.pages, sub: 'Most viewed pages, by page view' }
      case 'landing': return { data: s.landing, sub: 'The first page of each visit' }
      case 'source': return { data: s.bySource, sub: 'Where the visit came from, by session' }
      case 'referrers': return { data: s.referrers, sub: 'Sites linking to you, by session' }
      case 'country': return { data: s.byCountry.map((r) => ({ ...r, label: country(r.label) })), sub: 'Visitor country, by session' }
      case 'device': return { data: s.byDevice, sub: 'Device type, by session' }
    }
  }, [s, tab])

  if (err) return <div className="ad-page"><div className="ad-alert err">{err}</div></div>

  const empty = s && s.kpis.views === 0

  return (
    <div className="ad-page ad-dash">
      <PageHeader kicker="Overview" title="Site Analytics"
        description="Traffic measured by the site itself: no tag manager, nothing lost to ad blockers, and the same channel grouping your leads carry. Times in Eastern."
        actions={<>
          <Link href="/admin/analytics" className="ad-btn-ghost sm"><Settings2 size={14} /> Tracking scripts</Link>
          <Link href="/admin/analytics/forms" className="ad-btn sm">Form funnel <ArrowRight size={14} /></Link>
        </>} />

      <div className="ad-filters">
        <Seg value={days} onChange={setDays} options={[{ v: '7', l: '7 days' }, { v: '30', l: '30 days' }, { v: '90', l: '90 days' }]} />
      </div>

      {empty && (
        <div className="ad-attn" style={{ borderLeftColor: 'var(--ink)' }}>
          <b>No page views recorded yet.</b> Collection starts the moment this version is live; open the site in a new tab and this page fills up within a minute.
        </div>
      )}

      <div className="ad-kpis four">
        <Kpi label="Users" value={k ? k.users : '–'} delta={k?.deltaUsers} sub={k ? `${k.prevUsers} in the previous ${days} days` : undefined} />
        <Kpi label="Sessions" value={k ? k.sessions : '–'} delta={k?.deltaSessions} sub={k ? `${k.viewsPerSession} pages per session` : undefined} />
        <Kpi label="Page views" value={k ? k.views : '–'} delta={k?.deltaViews} sub={k ? `${k.prevViews} in the previous ${days} days` : undefined} />
        <Kpi label="Leads from the site" value={k ? k.leads : '–'} sub={k ? `${k.conversionRate}% of sessions became a lead` : undefined} tone={k && k.leads > 0 ? 'ok' : undefined} href="/admin/leads" />
      </div>

      <Panel title="Traffic over time" sub="Hover a day for the exact figure"
        right={<Seg small value={metric} onChange={setMetric} options={[{ v: 'sessions', l: 'Sessions' }, { v: 'users', l: 'Users' }, { v: 'views', l: 'Page views' }]} />}>
        {s ? (
          <LineChart height={220} series={[{ name: metric === 'sessions' ? 'Sessions' : metric === 'users' ? 'Users' : 'Page views', data: s.series.map((d) => ({ date: d.date, value: d[metric] })) }]} />
        ) : <div className="ad-skel" style={{ height: 220 }} />}
      </Panel>

      <div className="ad-two wide-left">
        <Panel title="What people look at, and where they come from" sub={breakdown.sub}
          right={<Seg small value={tab} onChange={setTab} options={[
            { v: 'pages', l: 'Pages' }, { v: 'landing', l: 'Landing' }, { v: 'source', l: 'Source' },
            { v: 'referrers', l: 'Referrers' }, { v: 'country', l: 'Country' }, { v: 'device', l: 'Device' },
          ]} />}>
          {s ? <Breakdown data={breakdown.data} top={10} /> : <div className="ad-skel" style={{ height: 260 }} />}
        </Panel>

        <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
          <Panel title="Channel mix" sub="Share of sessions by how the visit started">
            {s ? <Share data={s.byChannel} /> : <div className="ad-skel" style={{ height: 120 }} />}
          </Panel>
          <Panel title="Engagement">
            <dl className="ad-facts">
              <div><dt>Pages per session</dt><dd>{k ? k.viewsPerSession : '–'}</dd></div>
              <div><dt>Single-page visits</dt><dd>{k ? `${k.bounceRate}%` : '–'}</dd></div>
              <div><dt>Sessions per user</dt><dd>{k && k.users ? Math.round((k.sessions / k.users) * 10) / 10 : '–'}</dd></div>
              <div><dt>Session to lead</dt><dd>{k ? `${k.conversionRate}%` : '–'}</dd></div>
            </dl>
          </Panel>
        </div>
      </div>

      <p className="ad-soft" style={{ fontSize: 12, lineHeight: 1.6 }}>
        Counted first-party: a random id in the visitor&rsquo;s own browser storage, no cookies and no personal details.
        Known bots are discarded. Figures will not match GA4 exactly, and are usually a little higher, because nothing is blocked.
      </p>
    </div>
  )
}
