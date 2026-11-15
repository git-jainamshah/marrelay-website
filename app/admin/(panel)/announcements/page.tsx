'use client'

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, ExternalLink, Eye } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import SaveBar from '@/components/admin/SaveBar'
import { HistoryButton } from '@/components/admin/HistoryDrawer'
import { Toggle } from '@/components/admin/ui'
import { loadSetting, saveSetting } from '@/lib/admin/client'
import { MediaField } from '@/components/admin/MediaPicker'

type Bar = { pill: string; text: string; ctaLabel: string; ctaHref: string; contactHref: string }
type Announcement = { enabled?: boolean; default: Bar; overrides: (Bar & { path: string })[] }
type Promo = {
  enabled: boolean; template: 'copy' | 'picture' | 'signup'
  title: string; body: string; imageUrl: string
  primaryLabel: string; primaryHref: string; secondaryLabel: string; secondaryHref: string
  delaySeconds: number; frequency: 'once-per-session' | 'every-visit'
}

const EMPTY_BAR: Bar & { path: string } = { path: '', pill: '', text: '', ctaLabel: '', ctaHref: '', contactHref: '' }

/* ---------- previews: same type, colours and spacing as the live components ---------- */

function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>
  )
}

function BarPreview({ bar, enabled, path }: { bar: Bar; enabled: boolean; path?: string }) {
  return (
    <div className={`ad-prev ad-prev-bar${enabled ? '' : ' off'}`} aria-label="Preview of the top bar">
      <div className="ad-prev-chrome"><i /><i /><i /><span>{path ? `marrelay.com${path}` : 'marrelay.com'}</span></div>
      <div className="bar">
        <span className="l">
          {bar.pill && <span className="pill">{bar.pill}</span>}
          <span>{renderBold(bar.text || 'Your message will appear here.')}</span>
        </span>
        {bar.ctaLabel && <span className="cta">{bar.ctaLabel} →</span>}
      </div>
      <div className="site">
        <span className="logo"><img src="/assets/marrelay-mark.png" alt="" /><b>Marrelay</b></span>
        <span className="nav"><i /><i /><i /><i /></span>
      </div>
      {!enabled && <div className="ad-prev-off">Bar is switched off. Visitors will not see it.</div>}
    </div>
  )
}

function PromoPreview({ p }: { p: Promo }) {
  return (
    <div className={`ad-prev ad-prev-promo${p.enabled ? '' : ' off'}`} aria-label="Preview of the promo pop-up">
      <div className="ad-prev-chrome"><i /><i /><i /><span>marrelay.com</span></div>
      <div className="scene">
        <div className="card">
          <span className="x">×</span>
          {p.template === 'picture' && (
            p.imageUrl ? <img src={p.imageUrl} alt="" className="pic" /> : <div className="pic ph">Add an image URL</div>
          )}
          <h3>{p.title || 'Your headline'}</h3>
          {p.body && <p>{p.body}</p>}
          {p.template === 'signup' ? (
            <div className="form">
              <span className="in">Your name</span>
              <span className="in">Email address</span>
              <span className="in">Phone number</span>
              <span className="consent"><i /> I consent to sharing my personal details…</span>
              <span className="btn pri">{p.primaryLabel || 'Sign up'}</span>
            </div>
          ) : (
            <div className="btns">
              {p.primaryLabel && <span className="btn pri">{p.primaryLabel}</span>}
              {p.secondaryLabel && <span className="btn sec">{p.secondaryLabel}</span>}
            </div>
          )}
        </div>
      </div>
      <div className="ad-prev-meta">
        {p.enabled
          ? <>Shows <b>{p.delaySeconds}s</b> after a page opens, <b>{p.frequency === 'once-per-session' ? 'once per visit' : 'on every page load'}</b>.</>
          : 'Pop-up is switched off. Visitors will not see it.'}
      </div>
    </div>
  )
}

/* ---------- page ---------- */

export default function AnnouncementsPage() {
  const [ann, setAnn] = useState<Announcement | null>(null)
  const [promo, setPromo] = useState<Promo | null>(null)
  const [savedAnn, setSavedAnn] = useState('')
  const [savedPromo, setSavedPromo] = useState('')
  const [busy, setBusy] = useState(false)
  const [previewPath, setPreviewPath] = useState<string>('')

  useEffect(() => {
    loadSetting<Announcement>('announcement').then((v) => { if (v) { setAnn(v); setSavedAnn(JSON.stringify(v)) } })
    loadSetting<Promo>('promo_banner').then((v) => { if (v) { setPromo(v); setSavedPromo(JSON.stringify(v)) } })
  }, [])

  const annDirty = !!ann && JSON.stringify(ann) !== savedAnn
  const promoDirty = !!promo && JSON.stringify(promo) !== savedPromo
  const dirty = annDirty || promoDirty

  async function saveAll() {
    setBusy(true)
    if (annDirty && ann) { if (await saveSetting('announcement', ann)) setSavedAnn(JSON.stringify(ann)) }
    if (promoDirty && promo) { if (await saveSetting('promo_banner', promo)) setSavedPromo(JSON.stringify(promo)) }
    setBusy(false)
  }
  function discard() {
    if (savedAnn) setAnn(JSON.parse(savedAnn))
    if (savedPromo) setPromo(JSON.parse(savedPromo))
  }

  const previewBar = useMemo<Bar | null>(() => {
    if (!ann) return null
    return ann.overrides.find((o) => o.path && o.path === previewPath) || ann.default
  }, [ann, previewPath])

  const input = 'ad-input'
  const barFields = (bar: Bar, set: (patch: Partial<Bar>) => void) => (
    <div className="ad-grid2">
      <div><label className="ad-label">Small label (pill)</label>
        <input className={input} value={bar.pill} placeholder="New" onChange={(e) => set({ pill: e.target.value })} /></div>
      <div><label className="ad-label">Button text</label>
        <input className={input} value={bar.ctaLabel} placeholder="See pricing" onChange={(e) => set({ ctaLabel: e.target.value })} /></div>
      <div className="span2"><label className="ad-label">Message · wrap words in **double asterisks** to make them bold</label>
        <input className={input} value={bar.text} onChange={(e) => set({ text: e.target.value })} /></div>
      <div><label className="ad-label">Button link</label>
        <input className={`${input} mono`} value={bar.ctaHref} placeholder="/pricing" onChange={(e) => set({ ctaHref: e.target.value })} /></div>
      <div><label className="ad-label">Contact link</label>
        <input className={`${input} mono`} value={bar.contactHref} placeholder="/contact" onChange={(e) => set({ contactHref: e.target.value })} /></div>
    </div>
  )

  return (
    <div className="ad-page">
      <PageHeader
        kicker="Site Content"
        title="Announcements & Pop-up"
        description="Two ways to put a message in front of visitors: the thin bar at the very top of every page, and the pop-up that appears a few seconds after a page opens. Both switch on and off here. What you see in the previews is what visitors see."
        actions={<a href="/" target="_blank" className="ad-btn-ghost sm"><ExternalLink size={14} /> Open site</a>}
      />

      {/* ================= Top bar ================= */}
      {ann && (
        <section className="ad-block" id="bar">
          <header className="ad-block-head">
            <div>
              <h2>Top announcement bar</h2>
              <p>The thin black strip above the menu. Good for an offer, a launch, or a short notice.</p>
            </div>
            <div className="ad-block-tools">
              <HistoryButton settingKey="announcement" onRestored={(v) => { setAnn(v); setSavedAnn(JSON.stringify(v)) }} />
              <div className="ad-live-ctl">
                <Toggle checked={ann.enabled !== false} onChange={(v) => setAnn({ ...ann, enabled: v })} ariaLabel="Enable the top bar on the live site" />
                <span className={ann.enabled !== false ? 'on' : ''}>{ann.enabled !== false ? 'Enabled on LIVE site' : 'Not shown on the live site'}</span>
                {ann.enabled !== false
                  ? <button type="button" className="ad-btn-ghost sm danger" onClick={() => setAnn({ ...ann, enabled: false })}>End / disable bar now</button>
                  : <button type="button" className="ad-btn sm" onClick={() => setAnn({ ...ann, enabled: true })}>Enable on LIVE site</button>}
              </div>
            </div>
          </header>

          <div className="ad-split">
            <div className="ad-split-form">
              <div className="ad-card">
                <div className="ad-kicker" style={{ marginBottom: 12 }}>Default · every page</div>
                {barFields(ann.default, (p) => setAnn({ ...ann, default: { ...ann.default, ...p } }))}
              </div>

              {ann.overrides.map((o, i) => (
                <div key={i} className="ad-card">
                  <div className="ad-row-between" style={{ marginBottom: 12 }}>
                    <div className="ad-kicker">Different message on one page</div>
                    <button className="ad-icon-btn danger" title="Remove this page's message"
                      onClick={() => setAnn({ ...ann, overrides: ann.overrides.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label className="ad-label">Page address (for example /services/social)</label>
                    <input className={`${input} mono`} value={o.path} placeholder="/pricing"
                      onChange={(e) => setAnn({ ...ann, overrides: ann.overrides.map((x, j) => (j === i ? { ...x, path: e.target.value } : x)) })} />
                  </div>
                  {barFields(o, (p) => setAnn({ ...ann, overrides: ann.overrides.map((x, j) => (j === i ? { ...x, ...p } : x)) }))}
                </div>
              ))}

              <button className="ad-btn-ghost sm" onClick={() => setAnn({ ...ann, overrides: [...ann.overrides, { ...EMPTY_BAR }] })}>
                <Plus size={14} /> Show a different message on one page
              </button>
            </div>

            <aside className="ad-split-preview">
              <div className="ad-prev-head">
                <span><Eye size={14} /> Live preview</span>
                {ann.overrides.some((o) => o.path) && (
                  <select className="ad-select-sm" value={previewPath} onChange={(e) => setPreviewPath(e.target.value)} aria-label="Preview which page">
                    <option value="">Default (most pages)</option>
                    {ann.overrides.filter((o) => o.path).map((o) => <option key={o.path} value={o.path}>{o.path}</option>)}
                  </select>
                )}
              </div>
              {previewBar && <BarPreview bar={previewBar} enabled={ann.enabled !== false} path={previewPath} />}
              <p className="ad-prev-note">Updates as you type. On phones the button is hidden and only the message shows.</p>
            </aside>
          </div>
        </section>
      )}

      {/* ================= Promo pop-up ================= */}
      {promo && (
        <section className="ad-block" id="promo">
          <header className="ad-block-head">
            <div>
              <h2>Promo pop-up</h2>
              <p>A card that appears over the page. Use it for a time-limited offer or to collect sign-ups. Keep it off when there is nothing to say.</p>
            </div>
            <div className="ad-block-tools">
              <HistoryButton settingKey="promo_banner" onRestored={(v) => { setPromo(v); setSavedPromo(JSON.stringify(v)) }} />
              <div className="ad-live-ctl">
                <Toggle checked={promo.enabled} onChange={(v) => setPromo({ ...promo, enabled: v })} ariaLabel="Enable the pop-up on the live site" />
                <span className={promo.enabled ? 'on' : ''}>{promo.enabled ? 'Enabled on LIVE site' : 'Not shown on the live site'}</span>
                {promo.enabled
                  ? <button type="button" className="ad-btn-ghost sm danger" onClick={() => setPromo({ ...promo, enabled: false })}>End / disable pop-up now</button>
                  : <button type="button" className="ad-btn sm" onClick={() => setPromo({ ...promo, enabled: true })}>Enable on LIVE site</button>}
              </div>
            </div>
          </header>

          <div className="ad-split">
            <div className="ad-split-form">
              <div className="ad-card">
                <label className="ad-label">Style</label>
                <div className="ad-seg">
                  {([
                    ['copy', 'Text + buttons', 'A headline, a line of text and up to two buttons.'],
                    ['picture', 'Picture + buttons', 'Same, with an image on top.'],
                    ['signup', 'Sign-up form', 'Name, email and phone. Goes straight into Leads.'],
                  ] as const).map(([k, label, hint]) => (
                    <button key={k} type="button" className={promo.template === k ? 'on' : ''} onClick={() => setPromo({ ...promo, template: k })} title={hint}>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="ad-grid2" style={{ marginTop: 16 }}>
                  <div className="span2"><label className="ad-label">Headline</label>
                    <input className={input} value={promo.title} onChange={(e) => setPromo({ ...promo, title: e.target.value })} /></div>
                  <div className="span2"><label className="ad-label">Text</label>
                    <textarea rows={2} className={input} value={promo.body} onChange={(e) => setPromo({ ...promo, body: e.target.value })} /></div>
                  {promo.template === 'picture' && (
                    <div className="span2">
                      <MediaField label="Picture" value={promo.imageUrl} onChange={(p) => setPromo({ ...promo, imageUrl: p })}
                        hint="Pick one already in Storage, or upload from this computer. Landscape images look best." />
                    </div>
                  )}
                  <div><label className="ad-label">{promo.template === 'signup' ? 'Submit button' : 'Main button'}</label>
                    <input className={input} value={promo.primaryLabel} onChange={(e) => setPromo({ ...promo, primaryLabel: e.target.value })} /></div>
                  {promo.template !== 'signup' && (
                    <div><label className="ad-label">Main button link</label>
                      <input className={`${input} mono`} value={promo.primaryHref} placeholder="/contact" onChange={(e) => setPromo({ ...promo, primaryHref: e.target.value })} /></div>
                  )}
                  {promo.template !== 'signup' && (
                    <>
                      <div><label className="ad-label">Second button (optional)</label>
                        <input className={input} value={promo.secondaryLabel} onChange={(e) => setPromo({ ...promo, secondaryLabel: e.target.value })} /></div>
                      <div><label className="ad-label">Second button link</label>
                        <input className={`${input} mono`} value={promo.secondaryHref} onChange={(e) => setPromo({ ...promo, secondaryHref: e.target.value })} /></div>
                    </>
                  )}
                  <div><label className="ad-label">Show after (seconds)</label>
                    <input type="number" min={0} className={input} value={promo.delaySeconds}
                      onChange={(e) => setPromo({ ...promo, delaySeconds: Number(e.target.value) })} /></div>
                  <div><label className="ad-label">How often</label>
                    <select className={input} value={promo.frequency} onChange={(e) => setPromo({ ...promo, frequency: e.target.value as Promo['frequency'] })}>
                      <option value="once-per-session">Once per visit (recommended)</option>
                      <option value="every-visit">Every page load</option>
                    </select></div>
                </div>
                {promo.template === 'signup' && <p className="ad-hint">Sign-ups land in Leads automatically, tagged “promo-banner”. Phone is required, as on the contact form.</p>}
              </div>
            </div>

            <aside className="ad-split-preview">
              <div className="ad-prev-head"><span><Eye size={14} /> Live preview</span></div>
              <PromoPreview p={promo} />
              <p className="ad-prev-note">Already dismissed it on the live site? It shows once per visit, so open the site in a private window to see it again.</p>
            </aside>
          </div>
        </section>
      )}

      <SaveBar dirty={dirty} busy={busy} onSave={saveAll} onDiscard={discard}
        note={annDirty && promoDirty ? 'Both the top bar and the pop-up have changes.' : annDirty ? 'The top bar has changes.' : 'The pop-up has changes.'} />
    </div>
  )
}
