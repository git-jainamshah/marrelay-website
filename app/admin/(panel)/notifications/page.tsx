'use client'

/**
 * New-lead email alerts: who gets told, and a test send so you can prove it
 * works without waiting for a real lead.
 */
import { useEffect, useState } from 'react'
import { Plus, Trash2, Send, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react'
import { Seg } from '@/components/admin/viz'
import PageHeader from '@/components/admin/PageHeader'
import SaveBar from '@/components/admin/SaveBar'
import { HistoryButton } from '@/components/admin/HistoryDrawer'
import { Toggle } from '@/components/admin/ui'
import { useToast } from '@/components/admin/Toast'
import { loadSetting, saveSetting } from '@/lib/admin/client'

type Cfg = { enabled: boolean; from: string; to: string[]; cc: string[]; includeSpam?: boolean }
type Tpl = { subject: string; intro: string; footerNote: string; buttonLabel: string; showScore: boolean }
const TPL_DEFAULTS: Tpl = {
  subject: 'New lead: {{name}}{{company_paren}} · {{form}}',
  intro: '{{name}} just got in touch through the {{form_lower}}. Reply to this email and it goes straight to them.',
  footerNote: 'Sent automatically by the Marrelay website when a new lead arrives.',
  buttonLabel: 'Open this lead in the admin',
  showScore: true,
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

export default function NotificationsPage() {
  const { toast } = useToast()
  const [c, setC] = useState<Cfg | null>(null)
  const [saved, setSaved] = useState('')
  const [busy, setBusy] = useState(false)
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState<{ configured: boolean; missing: string[] } | null>(null)
  const [tpl, setTpl] = useState<Tpl | null>(null)
  const [tplSaved, setTplSaved] = useState('')
  const [previewEnv, setPreviewEnv] = useState<'production' | 'staging'>('production')
  const [preview, setPreview] = useState<{ html: string; subject: string; score: any } | null>(null)

  useEffect(() => {
    loadSetting<Cfg>('lead_alerts').then((v) => { if (v) { setC(v); setSaved(JSON.stringify(v)) } })
    fetch('/api/admin/notifications/test', { cache: 'no-store' }).then((r) => r.json()).then(setStatus).catch(() => {})
    loadSetting<Tpl>('lead_email_template').then((v) => {
      const t = { ...TPL_DEFAULTS, ...(v || {}) }
      setTpl(t); setTplSaved(JSON.stringify(t))
    })
  }, [])

  // Re-render the preview as the template is edited.
  useEffect(() => {
    if (!tpl) return
    const t = setTimeout(() => {
      fetch(`/api/admin/notifications/preview?format=json&env=${previewEnv}&cfg=${encodeURIComponent(JSON.stringify(tpl))}`, { cache: 'no-store' })
        .then((r) => r.json()).then(setPreview).catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [tpl, previewEnv])

  const tplDirty = !!tpl && JSON.stringify(tpl) !== tplSaved
  const dirty = (!!c && JSON.stringify(c) !== saved) || tplDirty
  async function save() {
    setBusy(true)
    if (c && JSON.stringify(c) !== saved) { if (await saveSetting('lead_alerts', c)) setSaved(JSON.stringify(c)) }
    if (tpl && tplDirty) { if (await saveSetting('lead_email_template', tpl)) setTplSaved(JSON.stringify(tpl)) }
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
    <div className="ad-page">
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

          {tpl && (
            <section className="ad-block" id="template">
              <header className="ad-block-head">
                <div>
                  <h2>What the email looks like</h2>
                  <p>Edit the wording; the preview updates as you type. {'{{name}}'}, {'{{company}}'}, {'{{form}}'}, {'{{budget}}'}, {'{{timeline}}'} and {'{{reference}}'} are filled in from the lead.</p>
                </div>
                <div className="ad-block-tools">
                  <HistoryButton settingKey="lead_email_template" onRestored={(v) => { setTpl({ ...TPL_DEFAULTS, ...v }); setTplSaved(JSON.stringify({ ...TPL_DEFAULTS, ...v })) }} />
                  <button className="ad-btn-ghost sm" onClick={() => setTpl({ ...TPL_DEFAULTS })}><RotateCcw size={14} /> Reset wording</button>
                </div>
              </header>

              <div className="ad-split">
                <div className="ad-split-form">
                  <div className="ad-card">
                    <label className="ad-label">Subject line</label>
                    <input className="ad-input" value={tpl.subject} onChange={(e) => setTpl({ ...tpl, subject: e.target.value })} />
                    {preview && <p className="ad-soft" style={{ fontSize: 12, margin: '6px 0 0' }}>Appears as: <b>{preview.subject}</b></p>}

                    <div style={{ marginTop: 16 }}>
                      <label className="ad-label">Opening line</label>
                      <textarea rows={2} className="ad-input" value={tpl.intro} onChange={(e) => setTpl({ ...tpl, intro: e.target.value })} />
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <label className="ad-label">Button</label>
                      <input className="ad-input" value={tpl.buttonLabel} onChange={(e) => setTpl({ ...tpl, buttonLabel: e.target.value })} />
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <label className="ad-label">Footer note</label>
                      <input className="ad-input" value={tpl.footerNote} onChange={(e) => setTpl({ ...tpl, footerNote: e.target.value })} />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 18, fontSize: 13 }}>
                      <input type="checkbox" checked={tpl.showScore} onChange={(e) => setTpl({ ...tpl, showScore: e.target.checked })} />
                      Show the importance score
                    </label>
                    <p className="ad-soft" style={{ fontSize: 12, margin: '8px 0 0', lineHeight: 1.55 }}>
                      Scored out of 5, mostly on the budget asked for, lifted by how urgent the timeline is and by whether they gave a company, a phone number and a real message.
                    </p>
                  </div>
                </div>

                <aside className="ad-split-preview">
                  <div className="ad-prev-head">
                    <span>Preview</span>
                    <Seg small value={previewEnv} onChange={setPreviewEnv} options={[{ v: 'production', l: 'Production' }, { v: 'staging', l: 'Dev / QA' }]} />
                  </div>
                  {preview ? (
                    <iframe title="Email preview" srcDoc={preview.html} className="ad-email-prev" />
                  ) : <div className="ad-skel" style={{ height: 420 }} />}
                  <p className="ad-prev-note">
                    Production is what clients-facing alerts look like. Dev / QA adds a blue banner and an environment tag in the subject, so a test lead is never mistaken for a real one.
                    <a href={`/api/admin/notifications/preview?env=${previewEnv}`} target="_blank" style={{ marginLeft: 6, textDecoration: 'underline' }}>Open full size</a>
                  </p>
                </aside>
              </div>
            </section>
          )}

          <p className="ad-soft" style={{ fontSize: 12, lineHeight: 1.6 }}>
            Replies go to the person who enquired, so you can answer straight from the alert. If an alert ever fails to send, the lead is still saved;
            email is never allowed to block a submission.
          </p>

          <SaveBar dirty={dirty} busy={busy} onSave={save} label="Save alerts" onDiscard={() => { if (saved) setC(JSON.parse(saved)); if (tplSaved) setTpl(JSON.parse(tplSaved)) }} />
        </>
      )}
    </div>
  )
}
