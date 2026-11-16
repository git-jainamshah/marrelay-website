'use client'

/**
 * New-lead email alerts: who gets told, and a test send so you can prove it
 * works without waiting for a real lead.
 */
import { useEffect, useState } from 'react'
import { Plus, Trash2, Send, CheckCircle2, AlertTriangle } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import SaveBar from '@/components/admin/SaveBar'
import { HistoryButton } from '@/components/admin/HistoryDrawer'
import { Toggle } from '@/components/admin/ui'
import { useToast } from '@/components/admin/Toast'
import { loadSetting, saveSetting } from '@/lib/admin/client'

type Cfg = { enabled: boolean; from: string; to: string[]; cc: string[]; includeSpam?: boolean }

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

export default function NotificationsPage() {
  const { toast } = useToast()
  const [c, setC] = useState<Cfg | null>(null)
  const [saved, setSaved] = useState('')
  const [busy, setBusy] = useState(false)
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState<{ configured: boolean; missing: string[] } | null>(null)

  useEffect(() => {
    loadSetting<Cfg>('lead_alerts').then((v) => { if (v) { setC(v); setSaved(JSON.stringify(v)) } })
    fetch('/api/admin/notifications/test', { cache: 'no-store' }).then((r) => r.json()).then(setStatus).catch(() => {})
  }, [])

  const dirty = !!c && JSON.stringify(c) !== saved
  async function save() {
    if (!c) return
    setBusy(true)
    if (await saveSetting('lead_alerts', c)) setSaved(JSON.stringify(c))
    setBusy(false)
  }

  async function sendTest() {
    setTesting(true)
    const r = await fetch('/api/admin/notifications/test', { method: 'POST' })
    const d = await r.json().catch(() => ({}))
    setTesting(false)
    if (r.ok) toast({ title: 'Test sent', detail: 'Check the inboxes listed below. If nothing arrives in a minute, look in junk.' })
    else toast({ kind: 'err', title: 'Test failed', detail: d.error || 'Check the settings and try again.', duration: 12000 })
  }

  const list = (key: 'to' | 'cc', label: string, hint: string) => c && (
    <div style={{ marginTop: 18 }}>
      <label className="ad-label">{label}</label>
      <p className="ad-soft" style={{ fontSize: 12, margin: '0 0 8px' }}>{hint}</p>
      {c[key].map((addr, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input className={`ad-input${addr && !isEmail(addr) ? ' invalid' : ''}`} value={addr} placeholder="name@example.com"
            onChange={(e) => setC({ ...c, [key]: c[key].map((x, j) => (j === i ? e.target.value : x)) })} />
          <button className="ad-icon-btn danger" title="Remove" onClick={() => setC({ ...c, [key]: c[key].filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
        </div>
      ))}
      <button className="ad-btn-ghost sm" onClick={() => setC({ ...c, [key]: [...c[key], ''] })}><Plus size={14} /> Add address</button>
    </div>
  )

  return (
    <div className="ad-page" style={{ maxWidth: 760 }}>
      <PageHeader kicker="Settings" title="Lead Alerts"
        description="Email the team the moment a lead comes in, from any form on the site, so nothing is missed between checking the admin."
        actions={c && <HistoryButton settingKey="lead_alerts" onRestored={(v) => { setC(v); setSaved(JSON.stringify(v)) }} />} />

      {status && (
        <div className={`ad-alert ${status.configured ? 'ok' : 'warn'}`} style={{ marginBottom: 18 }}>
          {status.configured ? (
            <><CheckCircle2 size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Microsoft 365 is connected. Alerts will send.</>
          ) : (
            <>
              <AlertTriangle size={15} style={{ verticalAlign: -3, marginRight: 6 }} />
              <b>Microsoft 365 is not connected yet, so nothing will send.</b>
              <div style={{ marginTop: 6, fontSize: 12.5 }}>
                Missing in the hosting environment: {status.missing.join(', ')}. Everything else on this page can be set up now and will start working the moment those are added.
              </div>
            </>
          )}
        </div>
      )}

      {c && (
        <>
          <section className="ad-block">
            <header className="ad-block-head">
              <div>
                <h2>Email me when a lead arrives</h2>
                <p>Covers every form: the contact form and the promo pop-up.</p>
              </div>
              <div className="ad-live-ctl">
                <Toggle checked={c.enabled} onChange={(v) => setC({ ...c, enabled: v })} ariaLabel="Send an email when a lead arrives" />
                <span className={c.enabled ? 'on' : ''}>{c.enabled ? 'On' : 'Off'}</span>
              </div>
            </header>

            <div className="ad-card">
              <label className="ad-label">Sent from</label>
              <p className="ad-soft" style={{ fontSize: 12, margin: '0 0 8px' }}>
                A real mailbox in your Microsoft 365 tenant. An alias on its own will be rejected by Microsoft.
              </p>
              <input className={`ad-input${c.from && !isEmail(c.from) ? ' invalid' : ''}`} value={c.from} onChange={(e) => setC({ ...c, from: e.target.value })} />

              {list('to', 'Send to', 'The main recipients.')}
              {list('cc', 'Copy to', 'Everyone else who should see it.')}

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button className="ad-btn-ghost sm" onClick={sendTest} disabled={testing || dirty}>
                  <Send size={14} /> {testing ? 'Sending…' : 'Send a test email'}
                </button>
                <span className="ad-soft" style={{ fontSize: 12 }}>
                  {dirty ? 'Save your changes first, then send a test.' : 'Sends a sample alert to the addresses above. No lead is created.'}
                </span>
              </div>
            </div>
          </section>

          <p className="ad-soft" style={{ fontSize: 12, lineHeight: 1.6 }}>
            Replies go to the person who enquired, so you can answer straight from the alert. If an alert ever fails to send, the lead is still saved;
            email is never allowed to block a submission.
          </p>

          <SaveBar dirty={dirty} busy={busy} onSave={save} onDiscard={() => saved && setC(JSON.parse(saved))} label="Save alerts" />
        </>
      )}
    </div>
  )
}
