import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSessionUser } from '@/lib/admin/auth'
import { ensureDb } from '@/lib/admin/db'
import { q1 } from '@/lib/admin/pg'
import { getCompany } from '@/lib/site-config'
import { paymentState, INVOICE_STATUS_LABELS, InvoiceItem } from '@/lib/admin/billing'
import { CURRENCY_SYMBOL } from '@/lib/admin/finance'
import PrintButton from './PrintButton'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Receipt', robots: { index: false, follow: false } }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.marrelay.com'
const money = (n: number, cur: string) => (CURRENCY_SYMBOL[cur] || cur + ' ') + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
function fmtDate(v: unknown): string {
  if (!v) return '-'
  const d = v instanceof Date ? v : new Date(String(v).length <= 10 ? String(v) + 'T00:00:00' : String(v))
  if (isNaN(d.getTime())) return String(v).slice(0, 10)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user || !['admin', 'manager'].includes(user.role)) redirect(`/admin/login?next=/admin/receipt/${params.id}`)
  await ensureDb()

  const inv = await q1<any>(
    `SELECT i.*, c.name AS client_name, c.company AS client_company, c.email AS client_email, c.phone AS client_phone, c.address AS client_address,
       p.name AS project_name, p.public_id AS project_public_id
     FROM invoices i JOIN clients c ON c.id = i.client_id LEFT JOIN client_projects p ON p.id = i.project_id
     WHERE i.id = $1`, [Number(params.id)]
  )
  if (!inv) notFound()
  const company = await getCompany()

  const items: InvoiceItem[] = (() => { try { return JSON.parse(inv.items || '[]') } catch { return [] } })()
  const cur = inv.currency || 'CAD'
  const total = Number(inv.total) || 0
  const paid = Number(inv.amount_paid) || 0
  const balance = Math.round((total - paid) * 100) / 100
  const state = paymentState(inv)
  const isPaid = state === 'paid'
  const docTitle = isPaid ? 'RECEIPT' : 'INVOICE'

  return (
    <div style={{ background: '#F2F1EC', minHeight: '100vh' }}>
      <style>{`
        @page { size: A4; margin: 14mm; }
        @media print {
          .noprint { display: none !important; }
          body { background: #fff !important; }
          .rcpt-wrap { box-shadow: none !important; margin: 0 !important; border: 0 !important; padding: 0 !important; max-width: none !important; }
        }
        .rcpt-wrap { font-family: var(--font-geist-sans, ui-sans-serif), system-ui, sans-serif; color: #0E0E0D; }
        .rcpt-serif { font-family: var(--font-geist-sans, ui-sans-serif), system-ui, sans-serif; font-weight: 600; letter-spacing: -.03em; }
        .rcpt-label { font-family: var(--font-archivo, ui-sans-serif), system-ui, sans-serif; font-stretch: 125%; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: #6A6964; }
        .rcpt-t th { text-align: left; font-family: var(--font-archivo, ui-sans-serif), system-ui, sans-serif; font-stretch: 125%; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: #6A6964; padding: 8px 10px; border-bottom: 1px solid #0E0E0D; }
        .rcpt-t td { padding: 11px 10px; border-bottom: 1px solid #E7E5DE; font-size: 13.5px; vertical-align: top; }
        .rcpt-actions { display: flex; gap: 10px; justify-content: center; padding: 20px 14px 26px; flex-wrap: wrap; }
        .rcpt-btn { display: inline-flex; align-items: center; gap: 7px; background: transparent; color: #0E0E0D; border: 1px solid #0E0E0D; border-radius: 999px; padding: 10px 20px; font-size: 13.5px; font-family: var(--font-geist-sans, ui-sans-serif), system-ui, sans-serif; text-decoration: none; cursor: pointer; }
        .rcpt-btn:hover { background: #0E0E0D; color: #F2F1EC; }
        .rcpt-btn.primary { background: #D7262C; border-color: #D7262C; color: #fff; }
        .rcpt-btn.primary:hover { background: #B01E23; border-color: #B01E23; }
      `}</style>

      <PrintButton id={inv.id} label={isPaid ? 'receipt' : 'invoice'} />

      <div className="rcpt-wrap" style={{ maxWidth: 800, margin: '0 auto 40px', background: '#fff', border: '1px solid #D8D6CE', boxShadow: '0 18px 60px -30px rgba(14,14,13,.35)', padding: '44px 48px' }}>
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #D7262C', paddingBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={company.logoIcon || '/assets/marrelay-mark.png'} alt={company.name} width={44} height={44} />
              <div>
                <div className="rcpt-serif" style={{ fontSize: 23 }}>{company.name || 'Marrelay'}</div>
                <div style={{ fontSize: 12, color: '#6A6964' }}>{company.tagline || 'Digital studio'}</div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Barcode value={inv.invoice_number} mod={1} h={26} />
              <div style={{ fontFamily: 'var(--font-archivo, monospace)', fontSize: 9.5, letterSpacing: '.14em', color: '#6A6964', marginTop: 2 }}>{inv.invoice_number}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="rcpt-serif" style={{ fontSize: 28 }}>{docTitle}</div>
            <div style={{ fontSize: 13, color: '#6A6964' }}>{inv.invoice_number}</div>
            <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', padding: '4px 12px', borderRadius: 999, background: isPaid ? '#E7F3EC' : balance > 0 ? '#FCEEEF' : '#F2F1EC', color: isPaid ? '#2F6B4F' : balance > 0 ? '#D7262C' : '#6A6964' }}>{INVOICE_STATUS_LABELS[state] || state}</span>
          </div>
        </div>

        {/* parties */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 30, marginTop: 24 }}>
          <div style={{ flex: 1 }}>
            <div className="rcpt-label" style={{ marginBottom: 6 }}>From</div>
            <div style={{ fontWeight: 600 }}>{company.name || 'Marrelay'}</div>
            {[company.addressLine1, company.addressLine2].filter(Boolean).map((l, i) => <div key={i} style={{ fontSize: 13, color: '#2B2B30' }}>{l}</div>)}
            {company.email && <div style={{ fontSize: 13, color: '#2B2B30' }}>{company.email}</div>}
            {company.phone && <div style={{ fontSize: 13, color: '#2B2B30' }}>{company.phone}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <div className="rcpt-label" style={{ marginBottom: 6 }}>Bill to</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{inv.client_company || inv.client_name}</div>
            {inv.client_company && <div style={{ fontSize: 13, color: '#2B2B30', marginTop: 3 }}>Billed to: {inv.client_name}</div>}
            {inv.client_address && <div style={{ fontSize: 13, color: '#2B2B30', whiteSpace: 'pre-wrap', marginTop: 3 }}>{inv.client_address}</div>}
            {inv.client_email && <div style={{ fontSize: 13, color: '#2B2B30', marginTop: 3 }}>{inv.client_email}</div>}
            {inv.client_phone && <div style={{ fontSize: 13, color: '#2B2B30' }}>{inv.client_phone}</div>}
          </div>
          <div style={{ textAlign: 'right', fontSize: 13, minWidth: 150 }}>
            {inv.project_name && <div style={{ marginBottom: 6 }}><span style={{ color: '#6A6964' }}>Project</span><br /><b>{inv.project_name}</b></div>}
            <div><span style={{ color: '#6A6964' }}>Issued</span><br />{fmtDate(inv.issue_date)}</div>
            {inv.due_date && <div style={{ marginTop: 6 }}><span style={{ color: '#6A6964' }}>Due</span><br />{fmtDate(inv.due_date)}</div>}
          </div>
        </div>

        {/* items */}
        <table className="rcpt-t" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 26 }}>
          <thead><tr><th>Description</th><th style={{ textAlign: 'right', width: 70 }}>Qty</th><th style={{ textAlign: 'right', width: 110 }}>Unit price</th><th style={{ textAlign: 'right', width: 120 }}>Amount</th></tr></thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td>{it.description}</td>
                <td style={{ textAlign: 'right' }}>{it.quantity}</td>
                <td style={{ textAlign: 'right' }}>{money(it.unit_price, cur)}</td>
                <td style={{ textAlign: 'right' }}>{money((Number(it.quantity) || 0) * (Number(it.unit_price) || 0), cur)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <div style={{ width: 300 }}>
            <TotalRow k="Subtotal" v={money(Number(inv.subtotal), cur)} />
            {Number(inv.discount_amount) > 0 && <TotalRow k={`Discount${inv.discount_type === 'percent' ? ` (${Number(inv.discount_value)}%)` : ''}`} v={'- ' + money(Number(inv.discount_amount), cur)} />}
            <TotalRow k={`HST / Tax (${Number(inv.tax_rate)}%)`} v={money(Number(inv.tax_amount), cur)} />
            <div style={{ borderTop: '1px solid #0E0E0D', margin: '8px 0' }} />
            <TotalRow k="Total" v={money(total, cur)} big />
            <TotalRow k="Amount paid" v={money(paid, cur)} />
            <TotalRow k="Balance due" v={money(balance, cur)} big accent={balance > 0.005} />
          </div>
        </div>

        {inv.notes && <div style={{ marginTop: 24, fontSize: 13, color: '#2B2B30', textAlign: 'center' }}><b>Notes:</b> {inv.notes}</div>}

        <div style={{ marginTop: 30, paddingTop: 16, borderTop: '1px solid #E7E5DE', fontSize: 12, color: '#6A6964', textAlign: 'center' }}>
          {isPaid ? 'Thank you - this invoice has been paid in full.' : balance > 0 ? `Please remit ${money(balance, cur)} by ${inv.due_date ? fmtDate(inv.due_date) : 'the due date'}.` : 'Thank you for your business.'}
          <br />Questions? {company.email || 'hello@marrelay.com'}{company.phone ? ` · ${company.phone}` : ''}
          <br /><a href={SITE_URL} style={{ color: '#D7262C', fontWeight: 600, textDecoration: 'none' }}>{SITE_URL.replace(/^https?:\/\//, '')}</a>
        </div>
      </div>
    </div>
  )
}

// Code 39 barcode (self-contained, no dependencies). Encodes the invoice number.
const CODE39: Record<string, string> = {
  '0': 'NNNWWNWNN', '1': 'WNNWNNNNW', '2': 'NNWWNNNNW', '3': 'WNWWNNNNN', '4': 'NNNWWNNNW',
  '5': 'WNNWWNNNN', '6': 'NNWWWNNNN', '7': 'NNNWNNWNW', '8': 'WNNWNNWNN', '9': 'NNWWNNWNN',
  'A': 'WNNNNWNNW', 'B': 'NNWNNWNNW', 'C': 'WNWNNWNNN', 'D': 'NNNNWWNNW', 'E': 'WNNNWWNNN',
  'F': 'NNWNWWNNN', 'G': 'NNNNNWWNW', 'H': 'WNNNNWWNN', 'I': 'NNWNNWWNN', 'J': 'NNNNWWWNN',
  'K': 'WNNNNNNWW', 'L': 'NNWNNNNWW', 'M': 'WNWNNNNWN', 'N': 'NNNNWNNWW', 'O': 'WNNNWNNWN',
  'P': 'NNWNWNNWN', 'Q': 'NNNNNNWWW', 'R': 'WNNNNNWWN', 'S': 'NNWNNNWWN', 'T': 'NNNNWNWWN',
  'U': 'WWNNNNNNW', 'V': 'NWWNNNNNW', 'W': 'WWWNNNNNN', 'X': 'NWNNWNNNW', 'Y': 'WWNNWNNNN',
  'Z': 'NWWNWNNNN', '-': 'NWNNNNWNW', '.': 'WWNNNNWNN', ' ': 'NWWNNNWNN', '*': 'NWNNWNWNN',
}
function Barcode({ value, mod = 1.5, h = 42 }: { value: string; mod?: number; h?: number }) {
  const text = '*' + String(value).toUpperCase().replace(/[^0-9A-Z\- .]/g, '') + '*'
  let x = 0
  const bars: { x: number; w: number }[] = []
  for (const ch of text) {
    const p = CODE39[ch]
    if (!p) continue
    for (let i = 0; i < 9; i++) {
      const w = (p[i] === 'W' ? 3 : 1) * mod
      if (i % 2 === 0) bars.push({ x, w }) // bars sit on even indices
      x += w
    }
    x += mod // narrow inter-character gap
  }
  return (
    <svg width={x} height={h} viewBox={`0 0 ${x} ${h}`} role="img" aria-label={`Barcode ${value}`} style={{ maxWidth: '100%' }}>
      {bars.map((b, i) => <rect key={i} x={b.x} y={0} width={b.w} height={h} fill="#0E0E0D" />)}
    </svg>
  )
}

function TotalRow({ k, v, big, accent }: { k: string; v: string; big?: boolean; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: big ? 16 : 13, fontWeight: big ? 600 : 400, color: accent ? '#D7262C' : '#0E0E0D' }}>
      <span style={{ color: big ? undefined : '#6A6964' }}>{k}</span><span>{v}</span>
    </div>
  )
}
