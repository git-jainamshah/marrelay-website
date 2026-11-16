'use client'

import { useCallback, useEffect, useState } from 'react'
import { X, Trash2, CheckSquare, Save } from 'lucide-react'
import { useToast } from './Toast'
import LeadFilters, { LeadFilterState, EMPTY_FILTERS, filtersToQs } from '@/components/admin/LeadFilters'
import { fmtDateTime, fmtDate, fmtRelative } from '@/lib/admin/dates'
import LeadActivityThread from './LeadActivityThread'

export type Lead = Record<string, any>

export const STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost']
export const STATUS_LABELS: Record<string, string> = {
  new: 'New', contacted: 'Contacted', qualified: 'Qualified', won: 'Won', lost: 'Lost',
}
export const SERVICE_LABELS: Record<string, string> = {
  web: 'Web Development', data: 'Data & Analytics', social: 'Social', seo: 'SEO & Ads', engineering: 'Engineering',
}
export const FORM_LABELS: Record<string, string> = {
  contact: 'Contact Form', 'promo-banner': 'Promo Banner', 'launch-offer': 'Launch Offer', offline: 'Offline Lead', pitch: 'Pitch', other: 'Other',
}
export const serviceNames = (arr: unknown) =>
  Array.isArray(arr) ? arr.map((s) => SERVICE_LABELS[s as string] ?? s).join(', ') : ''
export const STATUS_COLORS: Record<string, string> = {
  new: 'ad-badge blue', contacted: 'ad-badge amber', qualified: 'ad-badge purple',
  won: 'ad-badge green', lost: 'ad-badge grey',
}

export const extraOf = (l: Lead) => { try { return JSON.parse(l.extra || '{}') } catch { return {} } }

export function useLeads() {
  const [filters, setFilters] = useState<LeadFilterState>({ ...EMPTY_FILTERS })
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('')
  const [canEdit, setCanEdit] = useState(false)
  const qs = useCallback(() => filtersToQs(filters), [filters])
  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/admin/leads?${qs()}`).then((r) => r.json()).then((d) => setLeads(d.leads || [])).finally(() => setLoading(false))
  }, [qs])
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [load])
  useEffect(() => {
    fetch('/api/admin/me').then((r) => r.json()).then((d) => {
      setRole(d.user?.role || '')
      setCanEdit(!!d.canEditLeads)
    }).catch(() => {})
  }, [])
  return { filters, setFilters, leads, loading, load, qs, role, canEdit }
}

type LeadNote = { id: number; author_name: string; author_email: string; body: string; created_at: string }

export function LeadDrawer({ lead, onClose, onSaved, canEdit = true }: { lead: Lead; onClose: () => void; onSaved: () => void; canEdit?: boolean }) {
  const { toast } = useToast()
  const [teammates, setTeammates] = useState<any[]>([])
  const [busy, setBusy] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)

  /** Everything editable lives here, so nothing is written until Save. */
  const initial = useCallback((l: Lead) => {
    const e = extraOf(l)
    return {
      name: l.name || '', email: l.email || '', phone: l.phone || '', company: l.company || '',
      status: l.status || 'new', ownerUserId: l.owner_user_id ?? null as number | null,
      companyUrl: e.companyUrl || '', companyProvince: e.companyProvince || '', companyCountry: e.companyCountry || '',
      companyRemote: e.companyRemote || '', budget: e.budget || '', timeline: e.timeline || '',
      referral: e.referral || '', referralDetail: e.referralDetail || '',
      services: Array.isArray(e.services) ? [...e.services] : [] as string[],
    }
  }, [])

  const [form, setForm] = useState(() => initial(lead))
  const [saved, setSaved] = useState(() => JSON.stringify(initial(lead)))
  useEffect(() => { const i = initial(lead); setForm(i); setSaved(JSON.stringify(i)) }, [lead, initial])

  useEffect(() => {
    fetch('/api/admin/teammates', { cache: 'no-store' })
      .then((r) => r.json()).then((d) => setTeammates(d.users || [])).catch(() => {})
  }, [])

  const dirty = JSON.stringify(form) !== saved
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  const ex = extraOf(lead)
  const clicks = ['gclid', 'fbclid', 'li_fat_id', 'ttclid', 'epik', 'msclkid', 'twclid'].filter((c) => lead[c])

  async function save() {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone, company: form.company,
          status: form.status, ownerUserId: form.ownerUserId,
          extra: {
            companyUrl: form.companyUrl, companyProvince: form.companyProvince, companyCountry: form.companyCountry,
            companyRemote: form.companyRemote, budget: form.budget, timeline: form.timeline,
            referral: form.referral, referralDetail: form.referralDetail, services: form.services,
          },
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ kind: 'err', title: 'Lead was not saved', detail: d.error || 'Your changes are still here; try again.' })
        return
      }
      setSaved(JSON.stringify(form))
      toast({ title: 'Lead saved', detail: `${form.name || form.email || 'This lead'} has been updated.` })
      onSaved()
    } catch {
      toast({ kind: 'err', title: 'Lead was not saved', detail: 'Network problem. Your changes are still here.' })
    } finally { setBusy(false) }
  }

  function tryClose() {
    if (dirty && !confirmClose) { setConfirmClose(true); return }
    onClose()
  }

  const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
    <div style={{ display: 'flex', gap: 10, fontSize: 13 }}>
      <span className="ad-soft" style={{ width: 118, flexShrink: 0 }}>{k}</span>
      <span style={{ minWidth: 0, wordBreak: 'break-word' }}>{v || '-'}</span>
    </div>
  )
  const Field = ({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) => (
    <div>
      <label className="ad-label">{label}</label>
      <input className="ad-input" type={type} value={value} placeholder={placeholder} disabled={!canEdit} onChange={(e) => onChange(e.target.value)} />
    </div>
  )

  return (
    <div className="ad-lead-scrim" onClick={tryClose}>
      <div className="ad-lead-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Lead details">
        <div className="ad-lead-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0 }}>{lead.name || lead.email}</h2>
              <span className="ad-soft" style={{ fontSize: 12 }}>Lead ID: {lead.public_id || `#${lead.id}`}</span>
            </div>
            <button onClick={tryClose} className="ad-icon-btn" aria-label="Close"><X size={16} /></button>
          </div>

          {canEdit ? (
            <>
              <div className="ad-kicker" style={{ margin: '4px 0 10px' }}>Contact</div>
              <div className="ad-grid2">
                <Field label="Name" value={form.name} onChange={(v) => set({ name: v })} />
                <Field label="Phone" value={form.phone} onChange={(v) => set({ phone: v })} />
                <Field label="Email" type="email" value={form.email} onChange={(v) => set({ email: v })} />
                <Field label="Company" value={form.company} onChange={(v) => set({ company: v })} />
                <div className="span2"><Field label="Company website" value={form.companyUrl} onChange={(v) => set({ companyUrl: v })} placeholder="https://" /></div>
                <Field label="Province / state" value={form.companyProvince} onChange={(v) => set({ companyProvince: v })} />
                <Field label="Country" value={form.companyCountry} onChange={(v) => set({ companyCountry: v })} />
              </div>

              <div className="ad-kicker" style={{ margin: '18px 0 10px' }}>Qualification</div>
              <div className="ad-grid2">
                <Field label="Budget" value={form.budget} onChange={(v) => set({ budget: v })} placeholder="e.g. 10-25k" />
                <Field label="Timeline" value={form.timeline} onChange={(v) => set({ timeline: v })} placeholder="e.g. Next quarter" />
                <Field label="Heard via" value={form.referral} onChange={(v) => set({ referral: v })} />
                <Field label="Referral detail" value={form.referralDetail} onChange={(v) => set({ referralDetail: v })} />
                <div className="span2">
                  <label className="ad-label">Services wanted</label>
                  <div className="ad-chips">
                    {Object.entries(SERVICE_LABELS).map(([k, label]) => {
                      const on = form.services.includes(k)
                      return (
                        <button type="button" key={k} className={`ad-chip-toggle${on ? ' on' : ''}`}
                          onClick={() => set({ services: on ? form.services.filter((s) => s !== k) : [...form.services, k] })}>
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="ad-kicker" style={{ margin: '18px 0 10px' }}>Status and owner</div>
              <div className="ad-grid2">
                <div>
                  <label className="ad-label">Status</label>
                  <select className="ad-input" value={form.status} onChange={(e) => set({ status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="ad-label">Owner</label>
                  <select className="ad-input" value={form.ownerUserId ?? 'none'}
                    onChange={(e) => set({ ownerUserId: e.target.value === 'none' ? null : Number(e.target.value) })}>
                    <option value="none">Unassigned</option>
                    {teammates.map((t: any) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                  </select>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <Row k="Email" v={lead.email} />
              <Row k="Phone" v={lead.phone} />
              <Row k="Company" v={lead.company} />
              <Row k="Status" v={<span className={STATUS_COLORS[lead.status] || 'ad-badge grey'}>{STATUS_LABELS[lead.status] ?? lead.status}</span>} />
              <Row k="Owner" v={lead.owner_name || <span className="ad-soft">Unassigned</span>} />
              <Row k="Services" v={serviceNames(ex.services)} />
              <Row k="Budget" v={ex.budget} />
              <Row k="Timeline" v={ex.timeline} />
            </div>
          )}

          <div className="ad-kicker" style={{ margin: '18px 0 8px' }}>Enquiry</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 10 }}>
            <Row k="Received" v={`${fmtDateTime(lead.created_at)} (${fmtRelative(lead.created_at)})`} />
            <Row k="Consent" v={lead.consent ? `Yes${lead.consent_at ? ' - ' + fmtDate(lead.consent_at) : ''}` : 'No'} />
            <Row k="Form" v={FORM_LABELS[lead.form_type] ?? lead.form_type} />
            <Row k="Page" v={lead.source_page} />
            {lead.contact_method && <Row k="Contact method" v={lead.contact_method} />}
            {lead.added_by && <Row k="Added by" v={lead.added_by} />}
          </div>
          <p style={{ fontSize: 13.5, whiteSpace: 'pre-wrap', background: '#fff', border: '1px solid var(--rule)', padding: 12, margin: 0 }}>{lead.message || '-'}</p>
          <p className="ad-soft" style={{ fontSize: 11.5, margin: '6px 0 0' }}>
            Their original message and the acquisition data below are kept as sent, so the record stays true. Use the activity thread for updates.
          </p>

          <div className="ad-kicker" style={{ margin: '18px 0 8px' }}>Acquisition</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <Row k="Channel" v={lead.session_channel_group && <span className="ad-badge blue">{lead.session_channel_group}</span>} />
            <Row k="Source / medium" v={lead.session_source && `${lead.session_source} / ${lead.session_medium}`} />
            <Row k="Campaign" v={lead.session_campaign} />
            <Row k="Term / content" v={[lead.session_term, lead.session_content].filter(Boolean).join(' / ')} />
            <Row k="First touch" v={lead.first_source && `${lead.first_source} / ${lead.first_medium} (${lead.first_channel_group})`} />
            <Row k="First campaign" v={[lead.first_campaign, lead.first_term, lead.first_content].filter(Boolean).join(' / ')} />
            <Row k="Referrer" v={lead.referrer_url} />
            <Row k="Landing page" v={lead.landing_page} />
            <Row k="Click IDs" v={clicks.length ? clicks.map((c) => <span key={c} className="ad-chip" style={{ marginRight: 4 }}>{c}</span>) : ''} />
            <Row k="GA4 client" v={lead.ga_client_id} />
          </div>

          <LeadActivityThread leadId={lead.id} canEdit={canEdit} intakeNote={lead.notes} />
        </div>

        {canEdit && (
          <footer className="ad-lead-foot">
            {confirmClose ? (
              <>
                <span className="tx"><b>Close without saving?</b><small>Your changes will be lost.</small></span>
                <button className="ad-btn-ghost sm" onClick={onClose}>Discard and close</button>
                <button className="ad-btn sm" onClick={() => { setConfirmClose(false); save() }} disabled={busy}>Save and keep open</button>
              </>
            ) : (
              <>
                <span className="tx">
                  {dirty ? <><b>Unsaved changes</b><small>Nothing is stored until you save.</small></>
                         : <><b>All changes saved</b><small>Edit any field above to make a change.</small></>}
                </span>
                <button className="ad-btn-ghost sm" onClick={() => setForm(JSON.parse(saved))} disabled={!dirty || busy}>Undo</button>
                <button className="ad-btn sm" onClick={save} disabled={!dirty || busy}><Save size={14} /> {busy ? 'Saving…' : 'Save changes'}</button>
              </>
            )}
          </footer>
        )}
      </div>
    </div>
  )
}

/** Hand several leads to someone, or move them all to a status, at once. */
export function BulkOwnerBar({ selected, clear, onDone }: { selected: Set<number>; clear: () => void; onDone: () => void }) {
  const { toast } = useToast()
  const [teammates, setTeammates] = useState<any[]>([])
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    fetch('/api/admin/teammates', { cache: 'no-store' }).then((r) => r.json()).then((d) => setTeammates(d.users || [])).catch(() => {})
  }, [])
  if (selected.size === 0) return null

  async function apply(patch: Record<string, unknown>, what: string) {
    setBusy(true)
    const res = await fetch('/api/admin/leads/bulk', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...selected], ...patch }),
    })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { toast({ kind: 'err', title: 'Nothing was changed', detail: d.error || 'Try again.' }); return }
    toast({ title: `${d.count} lead${d.count === 1 ? '' : 's'} updated`, detail: what })
    clear()
    onDone()
  }

  return (
    <div className="ad-bulkbar">
      <b>{selected.size} selected</b>
      <label>
        <span>Give to</span>
        <select className="ad-select-sm" defaultValue="" disabled={busy}
          onChange={(e) => { const v = e.target.value; if (v === '') return; const t = teammates.find((x: any) => String(x.id) === v)
            apply({ ownerUserId: v === 'none' ? null : Number(v) }, v === 'none' ? 'They are now unassigned.' : `Now owned by ${t ? `${t.first_name} ${t.last_name}` : 'them'}.`); e.target.value = '' }}>
          <option value="">Choose a person…</option>
          <option value="none">Unassigned</option>
          {teammates.map((t: any) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
        </select>
      </label>
      <label>
        <span>Set status</span>
        <select className="ad-select-sm" defaultValue="" disabled={busy}
          onChange={(e) => { const v = e.target.value; if (!v) return; apply({ status: v }, `Status set to ${STATUS_LABELS[v]}.`); e.target.value = '' }}>
          <option value="">Choose a status…</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </label>
      <button className="ad-btn-ghost sm" onClick={clear} disabled={busy}>Clear selection</button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Bulk selection + delete (shared by Leads, Marketing, Delete Folder) */
/* ------------------------------------------------------------------ */

export function useSelection() {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const toggle = (id: number) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  const selectAll = (ids: number[]) => setSelected(new Set(ids))
  const clear = () => setSelected(new Set())
  return { selected, toggle, selectAll, clear }
}

/**
 * Selection bar + confirmation for bulk delete (soft delete into the
 * Delete Folder). Renders nothing when no rows are selected.
 */
export function BulkDeleteBar({
  visibleIds, selected, selectAll, clear, onDone,
}: {
  visibleIds: number[]
  selected: Set<number>
  selectAll: (ids: number[]) => void
  clear: () => void
  onDone: (msg: string) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  if (selected.size === 0) return null

  async function doDelete() {
    setBusy(true)
    const res = await fetch('/api/admin/leads/bulk', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', ids: [...selected] }),
    })
    const d = await res.json()
    setBusy(false)
    setConfirming(false)
    clear()
    onDone(res.ok
      ? `${d.count} record${d.count === 1 ? '' : 's'} deleted and moved to the Delete Folder. Recoverable for 60 days.`
      : d.error || 'Delete failed.')
  }

  return (
    <>
      <div className="ad-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', marginTop: 12, flexWrap: 'wrap' }}>
        <b style={{ fontSize: 13.5 }}>{selected.size} selected</b>
        {selected.size < visibleIds.length && (
          <button className="ad-btn-ghost" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={() => selectAll(visibleIds)}>
            <CheckSquare size={13} /> Select all {visibleIds.length} in this view
          </button>
        )}
        <button className="ad-btn-ghost" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={clear}>Clear selection</button>
        <button className="ad-btn-danger" style={{ padding: '8px 16px', fontSize: 12.5, marginLeft: 'auto' }} onClick={() => setConfirming(true)}>
          <Trash2 size={13} style={{ marginRight: 6, verticalAlign: -2 }} />Delete selected
        </button>
      </div>

      {confirming && (
        <div className="ad-overlay" onClick={() => !busy && setConfirming(false)}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete {selected.size} record{selected.size === 1 ? '' : 's'}?</h3>
            <p className="ad-mut" style={{ fontSize: 13.5, margin: '8px 0 18px' }}>
              They will move to the Delete Folder, where you can recover them for 60 days.
              After that they are removed permanently.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button disabled={busy} className="ad-btn-ghost" onClick={() => setConfirming(false)}>No, keep them</button>
              <button disabled={busy} className="ad-btn-danger" onClick={doDelete}>
                {busy ? 'Deleting…' : `Yes, delete ${selected.size}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/** Header + row checkbox helpers */
export function SelectHeaderCell({ visibleIds, selected, selectAll, clear, show = true }: {
  visibleIds: number[]; selected: Set<number>; selectAll: (ids: number[]) => void; clear: () => void; show?: boolean
}) {
  const all = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))
  if (!show) return null
  return (
    <th style={{ width: 36 }}>
      <input type="checkbox" checked={all} aria-label="Select all"
        onChange={() => (all ? clear() : selectAll(visibleIds))}
        style={{ width: 15, height: 15, accentColor: 'var(--brand)', cursor: 'pointer' }} />
    </th>
  )
}

export function SelectRowCell({ id, selected, toggle, show = true }: { id: number; selected: Set<number>; toggle: (id: number) => void; show?: boolean }) {
  if (!show) return null
  return (
    <td onClick={(e) => e.stopPropagation()} style={{ width: 36 }}>
      <input type="checkbox" checked={selected.has(id)} aria-label="Select record"
        onChange={() => toggle(id)}
        style={{ width: 15, height: 15, accentColor: 'var(--brand)', cursor: 'pointer' }} />
    </td>
  )
}
