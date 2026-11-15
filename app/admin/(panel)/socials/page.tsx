'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Toggle } from '@/components/admin/ui'
import PageHeader from '@/components/admin/PageHeader'
import SaveBar from '@/components/admin/SaveBar'
import { HistoryButton } from '@/components/admin/HistoryDrawer'
import { loadSetting, saveSetting } from '@/lib/admin/client'

type Social = { platform: string; label: string; href: string; enabled: boolean }

const KNOWN_PLATFORMS = ['Instagram', 'LinkedIn', 'X', 'Facebook', 'YouTube', 'TikTok', 'Pinterest', 'Threads']

export default function SocialsPage() {
  const [socials, setSocials] = useState<Social[] | null>(null)
  const [saved, setSaved] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    loadSetting<Social[]>('socials').then((v) => { const list = v || []; setSocials(list); setSaved(JSON.stringify(list)) })
  }, [])

  const dirty = !!socials && JSON.stringify(socials) !== saved
  async function save() {
    setBusy(true)
    if (await saveSetting('socials', socials)) setSaved(JSON.stringify(socials))
    setBusy(false)
  }

  const set = (i: number, patch: Partial<Social>) =>
    setSocials((s) => (s ? s.map((x, j) => (j === i ? { ...x, ...patch } : x)) : s))

  if (!socials) return <p className="ad-mut" style={{ fontSize: 14 }}>Loading…</p>

  return (
    <div className="ad-page" style={{ maxWidth: 820 }}>
      <PageHeader kicker="Settings" title="Social Links"
        description="Your handles across platforms. Switch a platform off and it disappears from the live site (header, footer, mobile menu); switch it on to bring it back."
        actions={<HistoryButton settingKey="socials" onRestored={(v) => { setSocials(v); setSaved(JSON.stringify(v)) }} />} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {socials.map((s, i) => (
          <div key={i} className="ad-card" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', opacity: s.enabled ? 1 : 0.55 }}>
            <Toggle checked={s.enabled} onChange={(v) => set(i, { enabled: v })} ariaLabel={`Show ${s.platform} on site`} />
            <div style={{ width: 130 }}>
              <select className="ad-input" value={s.platform} onChange={(e) => set(i, { platform: e.target.value })}>
                {[...new Set([...KNOWN_PLATFORMS, s.platform])].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ width: 180 }}>
              <input className="ad-input" placeholder="@handle" value={s.label} onChange={(e) => set(i, { label: e.target.value })} />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <input className="ad-input mono" placeholder="https://…" value={s.href} onChange={(e) => set(i, { href: e.target.value })} />
            </div>
            <span className={`ad-badge ${s.enabled ? 'green' : 'grey'}`}>{s.enabled ? 'On site' : 'Hidden'}</span>
            <button className="ad-icon-btn danger" title="Remove"
              onClick={() => setSocials(socials.filter((_, j) => j !== i))}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <button className="ad-btn-ghost" style={{ marginTop: 16 }}
        onClick={() => setSocials([...socials, { platform: 'Instagram', label: '', href: '', enabled: false }])}>
        <Plus size={15} /> Add platform
      </button>
      <SaveBar dirty={dirty} busy={busy} onSave={save} onDiscard={() => saved && setSocials(JSON.parse(saved))} label="Save links" />
    </div>
  )
}
