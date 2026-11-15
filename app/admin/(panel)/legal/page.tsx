'use client'

import { useEffect, useState } from 'react'
import { Save, ExternalLink } from 'lucide-react'
import { Section } from '@/components/admin/ui'
import RichTextEditor from '@/components/admin/RichTextEditor'
import PageHeader from '@/components/admin/PageHeader'
import { HistoryButton } from '@/components/admin/HistoryDrawer'
import { saveSetting } from '@/lib/admin/client'
import type { SettingKey } from '@/lib/admin/settings-keys'

type LegalDoc = { html: string; updatedAt: string }

function fmtFull(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${d.toLocaleDateString('en-US', { weekday: 'long' })}`
}

function LegalEditor({ settingKey, title, pagePath }: { settingKey: SettingKey; title: string; pagePath: string }) {
  const [doc, setDoc] = useState<LegalDoc | null>(null)
  const [draftHtml, setDraftHtml] = useState('')
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editorKey, setEditorKey] = useState(0)

  useEffect(() => {
    fetch(`/api/admin/settings?key=${settingKey}`).then((r) => r.json()).then((d) => {
      if (d.value) {
        setDoc(d.value)
        setDraftHtml(d.value.html)
      }
    })
  }, [settingKey])

  async function save() {
    setBusy(true)
    const now = new Date().toISOString()
    const ok = await saveSetting(settingKey, { html: draftHtml }, { detail: `The live page now shows “Last Updated: ${fmtFull(now)}”. Previous version kept in History.` })
    setBusy(false)
    if (ok) {
      setDoc({ html: draftHtml, updatedAt: now })
      setDirty(false)
    }
  }
  function onRestored(v: LegalDoc) {
    setDoc(v); setDraftHtml(v.html); setDirty(false); setEditorKey((k) => k + 1)
  }

  if (!doc) return <p className="ad-mut" style={{ fontSize: 14 }}>Loading…</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <span className="ad-mut" style={{ fontSize: 13 }}>
          Last updated: <b>{fmtFull(doc.updatedAt)}</b> - updates automatically on every save.
        </span>
        <div style={{ display: 'flex', gap: 10 }}>
          <HistoryButton settingKey={settingKey} onRestored={onRestored} />
          <a href={pagePath} target="_blank" className="ad-btn-ghost" style={{ padding: '7px 14px', fontSize: 12.5 }}>
            <ExternalLink size={14} /> View live page
          </a>
          <button onClick={save} disabled={busy || !dirty} className="ad-btn" style={{ padding: '8px 16px', fontSize: 12.5 }}>
            <Save size={14} /> {busy ? 'Saving…' : dirty ? `Save ${title}` : 'Saved'}
          </button>
        </div>
      </div>
      <RichTextEditor key={editorKey} initialHtml={doc.html} onChange={(html) => { setDraftHtml(html); setDirty(true) }} />
    </div>
  )
}

export default function LegalPage() {
  return (
    <div className="ad-page" style={{ maxWidth: 900 }}>
      <PageHeader kicker="Site Content" title="Terms & Privacy"
        description="Edit the copy of both legal pages. Every save refreshes the “Last Updated” date on the live page and keeps the previous wording in History, so you can always go back." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Section kicker="/terms" title="Terms of Service" defaultOpen>
          <LegalEditor settingKey="legal_terms" title="Terms" pagePath="/terms" />
        </Section>
        <Section kicker="/privacy" title="Privacy Policy" defaultOpen={false}>
          <LegalEditor settingKey="legal_privacy" title="Privacy" pagePath="/privacy" />
        </Section>
      </div>
    </div>
  )
}
