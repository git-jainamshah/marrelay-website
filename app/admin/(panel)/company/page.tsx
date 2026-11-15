'use client'

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react'
import { Field } from '@/components/admin/ui'
import PageHeader from '@/components/admin/PageHeader'
import SaveBar from '@/components/admin/SaveBar'
import { HistoryButton } from '@/components/admin/HistoryDrawer'
import { loadSetting, saveSetting } from '@/lib/admin/client'
import { MediaField } from '@/components/admin/MediaPicker'

type Company = {
  name: string; tagline: string
  addressLine1: string; addressLine2: string
  email: string; phone: string
  logoFull: string; logoIcon: string
}

export default function CompanyPage() {
  const [c, setC] = useState<Company | null>(null)
  const [saved, setSaved] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    loadSetting<Company>('company').then((v) => { if (v) { setC(v); setSaved(JSON.stringify(v)) } })
  }, [])

  const dirty = !!c && JSON.stringify(c) !== saved
  async function save() {
    if (!c) return
    setBusy(true)
    if (await saveSetting('company', c)) setSaved(JSON.stringify(c))
    setBusy(false)
  }

  if (!c) return <p className="ad-mut" style={{ fontSize: 14 }}>Loading…</p>

  const logoPicker = (field: 'logoFull' | 'logoIcon', label: string, hint: string) => (
    <MediaField label={label} value={c[field]} onChange={(p) => setC({ ...c, [field]: p })} hint={hint} />
  )

  return (
    <div className="ad-page" style={{ maxWidth: 820 }}>
      <PageHeader kicker="Settings" title="Company Profile"
        description="The company details used across the site: footer, navigation, contact info and search-engine data."
        actions={<HistoryButton settingKey="company" onRestored={(v) => { setC(v); setSaved(JSON.stringify(v)) }} />} />

      <div className="ad-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Field label="Company name">
          <input className="ad-input" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
        </Field>
        <Field label="Tagline">
          <input className="ad-input" value={c.tagline} onChange={(e) => setC({ ...c, tagline: e.target.value })} />
        </Field>
        <Field label="Address line 1">
          <input className="ad-input" value={c.addressLine1} onChange={(e) => setC({ ...c, addressLine1: e.target.value })} />
        </Field>
        <Field label="Address line 2">
          <input className="ad-input" value={c.addressLine2} onChange={(e) => setC({ ...c, addressLine2: e.target.value })} />
        </Field>
        <Field label="Contact email">
          <input type="email" className="ad-input" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} />
        </Field>
        <Field label="Contact phone">
          <input className="ad-input" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} placeholder="+1 (___) ___-____" />
        </Field>
        <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {logoPicker('logoFull', 'Full logo', 'Wide logo - used for link previews & sharing.')}
          {logoPicker('logoIcon', 'Icon / mark', 'Square mark - used in the navigation bar and footer.')}
        </div>
      </div>
      <SaveBar dirty={dirty} busy={busy} onSave={save} onDiscard={() => saved && setC(JSON.parse(saved))} label="Save profile" />
    </div>
  )
}
