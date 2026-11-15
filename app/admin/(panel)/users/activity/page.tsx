'use client'

/**
 * Sign-in activity. Admin-only. Who signed in and out, from where, and when,
 * shown in Eastern time by default with a time-zone switch for travel.
 */
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, LogIn, LogOut, ShieldAlert } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import { Kpi, Panel, Seg } from '@/components/admin/viz'

type Ev = { id: number; user_id: number | null; user_email: string | null; user_name: string | null; event: 'login' | 'logout' | 'failed'; ip: string | null; user_agent: string | null; created_at: string }
type Person = { user_email: string; user_name: string | null; logins: number; last_login: string | null }

const TZ_KEY = 'marrelay_admin_tz'
const ZONES: { v: string; l: string }[] = [
  { v: 'America/Toronto', l: 'Eastern (Toronto)' },
  { v: 'America/Vancouver', l: 'Pacific (Vancouver)' },
  { v: 'America/Edmonton', l: 'Mountain (Edmonton)' },
  { v: 'America/Winnipeg', l: 'Central (Winnipeg)' },
  { v: 'America/Halifax', l: 'Atlantic (Halifax)' },
  { v: 'Europe/London', l: 'London' },
  { v: 'Europe/Paris', l: 'Paris / Berlin' },
  { v: 'Asia/Kolkata', l: 'India' },
  { v: 'Asia/Dubai', l: 'Dubai' },
  { v: 'Asia/Singapore', l: 'Singapore' },
  { v: 'Australia/Sydney', l: 'Sydney' },
  { v: 'UTC', l: 'UTC' },
]

function fmtIn(iso: string, tz: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-CA', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString('en-CA', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true })
  const abbr = new Intl.DateTimeFormat('en-CA', { timeZone: tz, timeZoneName: 'short' }).formatToParts(d).find((p) => p.type === 'timeZoneName')?.value ?? ''
  return { date, time, abbr }
}
function device(ua: string | null) {
  if (!ua) return ''
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : ''
  const br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : ''
  return [br, os].filter(Boolean).join(' on ')
}

export default function ActivityPage() {
  const [data, setData] = useState<{ events: Ev[]; people: Person[] } | null>(null)
  const [days, setDays] = useState<'7' | '30' | '90' | '365'>('30')
  const [user, setUser] = useState('')
  const [kind, setKind] = useState<'all' | 'login' | 'logout' | 'failed'>('all')
  const [tz, setTz] = useState('America/Toronto')
  const [err, setErr] = useState('')

  useEffect(() => { const saved = localStorage.getItem(TZ_KEY); if (saved) setTz(saved) }, [])
  function pickTz(z: string) { setTz(z); localStorage.setItem(TZ_KEY, z) }

  useEffect(() => {
    const p = new URLSearchParams({ days })
    if (user) p.set('user', user)
    fetch(`/api/admin/login-history?${p}`, { cache: 'no-store' })
      .then(async (r) => { if (!r.ok) throw new Error(r.status === 403 ? 'Only administrators can see sign-in activity.' : 'Could not load activity.'); return r.json() })
      .then(setData).catch((e) => setErr(e.message))
  }, [days, user])

  const events = useMemo(() => (data?.events ?? []).filter((e) => kind === 'all' || e.event === kind), [data, kind])
  const counts = useMemo(() => {
    const ev = data?.events ?? []
    return { login: ev.filter((e) => e.event === 'login').length, logout: ev.filter((e) => e.event === 'logout').length, failed: ev.filter((e) => e.event === 'failed').length }
  }, [data])

  // Group rows by day in the chosen zone so the list reads like a diary.
  const grouped = useMemo(() => {
    const m = new Map<string, Ev[]>()
    for (const e of events) { const k = fmtIn(e.created_at, tz).date; m.set(k, [...(m.get(k) ?? []), e]) }
    return [...m.entries()]
  }, [events, tz])

  if (err) return <div className="ad-page"><div className="ad-alert err">{err}</div></div>

  return (
    <div className="ad-page ad-dash">
      <PageHeader kicker="Settings · Admins only" title="Sign-in activity"
        description="Every sign-in, sign-out and failed attempt on this portal. Times are shown in Eastern by default; switch the zone if you are travelling."
        actions={<Link href="/admin/users" className="ad-btn-ghost sm">Access Management <ArrowRight size={14} /></Link>} />

      <div className="ad-filters">
        <Seg value={days} onChange={setDays} options={[{ v: '7', l: '7 days' }, { v: '30', l: '30 days' }, { v: '90', l: '90 days' }, { v: '365', l: '12 months' }]} />
        <select className="ad-select-sm" value={user} onChange={(e) => setUser(e.target.value)} aria-label="Person">
          <option value="">Everyone</option>
          {(data?.people ?? []).map((p) => <option key={p.user_email} value={p.user_email}>{p.user_name || p.user_email}</option>)}
        </select>
        <Seg small value={kind} onChange={setKind} options={[{ v: 'all', l: 'All' }, { v: 'login', l: 'Sign-ins' }, { v: 'logout', l: 'Sign-outs' }, { v: 'failed', l: 'Failed' }]} />
        <label className="ad-tz">
          <span className="ad-label" style={{ marginBottom: 0 }}>Time zone</span>
          <select className="ad-select-sm" value={tz} onChange={(e) => pickTz(e.target.value)}>
            {ZONES.map((z) => <option key={z.v} value={z.v}>{z.l}</option>)}
          </select>
        </label>
      </div>

      <div className="ad-kpis three">
        <Kpi label="Sign-ins" value={data ? counts.login : '–'} sub={`last ${days} days`} />
        <Kpi label="Sign-outs" value={data ? counts.logout : '–'} sub="explicit sign-outs; closed tabs are not counted" />
        <Kpi label="Failed attempts" value={data ? counts.failed : '–'} sub={counts.failed > 0 ? 'Worth a look if you do not recognise them' : 'None in this period'} tone={counts.failed > 0 ? 'red' : undefined} />
      </div>

      <div className="ad-two wide-left">
        <Panel title="Activity" sub={`${events.length} event${events.length === 1 ? '' : 's'}`}>
          {!data ? <div className="ad-skel" style={{ height: 240 }} /> : grouped.length === 0 ? (
            <div className="ad-viz-empty">No activity in this period. Sign-ins are recorded from now on; older sessions were not logged.</div>
          ) : grouped.map(([day, rows]) => (
            <div key={day} className="ad-day">
              <div className="ad-day-h">{day}</div>
              {rows.map((e) => {
                const t = fmtIn(e.created_at, tz)
                const Icon = e.event === 'login' ? LogIn : e.event === 'logout' ? LogOut : ShieldAlert
                return (
                  <div key={e.id} className={`ad-ev ${e.event}`}>
                    <span className="ic"><Icon size={14} /></span>
                    <span className="who"><b>{e.user_name || e.user_email || 'Unknown'}</b>{e.user_name && e.user_email && <small>{e.user_email}</small>}</span>
                    <span className="what">{e.event === 'login' ? 'signed in' : e.event === 'logout' ? 'signed out' : 'failed to sign in'}</span>
                    <span className="meta">{device(e.user_agent)}{e.ip ? ` · ${e.ip.split(',')[0]}` : ''}</span>
                    <span className="when" title={e.created_at}><b>{t.time}</b> <small>{t.abbr}</small></span>
                  </div>
                )
              })}
            </div>
          ))}
        </Panel>
        <Panel title="People" sub="Who has signed in during this period">
          {!data ? <div className="ad-skel" style={{ height: 160 }} /> : data.people.length === 0 ? <div className="ad-viz-empty">Nobody yet.</div> : (
            <ul className="ad-list">
              {data.people.map((p) => {
                const t = p.last_login ? fmtIn(p.last_login, tz) : null
                return (
                  <li key={p.user_email} className={user === p.user_email ? 'on' : ''} onClick={() => setUser(user === p.user_email ? '' : p.user_email)} style={{ cursor: 'pointer' }}>
                    <span><b>{p.user_name || p.user_email}</b><small>{p.logins} sign-in{p.logins === 1 ? '' : 's'}</small></span>
                    <span className="r">{t ? <><b>{t.date}</b><small>{t.time} {t.abbr}</small></> : <small>never</small>}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
