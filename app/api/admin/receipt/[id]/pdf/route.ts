import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { getSessionUser } from '@/lib/admin/auth'
import { ensureDb } from '@/lib/admin/db'
import { q1 } from '@/lib/admin/pg'
import { getCompany } from '@/lib/site-config'
import { paymentState, INVOICE_STATUS_LABELS, type InvoiceItem } from '@/lib/admin/billing'
import { CURRENCY_SYMBOL } from '@/lib/admin/finance'
import { buildReceiptPdf } from '@/lib/admin/receipt-pdf'
import { SITE_URL } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function fmtDate(v: unknown): string {
  if (!v) return '-'
  const d = v instanceof Date ? v : new Date(String(v).length <= 10 ? String(v) + 'T00:00:00' : String(v))
  if (isNaN(d.getTime())) return String(v).slice(0, 10)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Download the invoice or receipt as a real PDF file. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user || !['admin', 'manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })
  }
  await ensureDb()

  const inv = await q1<any>(
    `SELECT i.*, c.name AS client_name, c.company AS client_company, c.email AS client_email, c.phone AS client_phone, c.address AS client_address,
       p.name AS project_name
     FROM invoices i JOIN clients c ON c.id = i.client_id LEFT JOIN client_projects p ON p.id = i.project_id
     WHERE i.id = $1`, [Number(params.id)]
  )
  if (!inv) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const company = await getCompany()
  const items: InvoiceItem[] = (() => { try { return JSON.parse(inv.items || '[]') } catch { return [] } })()
  const cur = inv.currency || 'CAD'
  const total = Number(inv.total) || 0
  const paid = Number(inv.amount_paid) || 0
  const balance = Math.round((total - paid) * 100) / 100
  const state = paymentState(inv)
  const isPaid = state === 'paid'
  const money = (n: number) => (CURRENCY_SYMBOL[cur] || cur + ' ') + (Number(n) || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // The logo, read from disk so the PDF is self-contained.
  let logoPng: Uint8Array | null = null
  try {
    const file = path.join(process.cwd(), 'public', 'assets', 'marrelay-mark.png')
    logoPng = new Uint8Array(await readFile(file))
  } catch { logoPng = null }

  const bytes = await buildReceiptPdf({
    docTitle: isPaid ? 'RECEIPT' : 'INVOICE',
    statusLabel: INVOICE_STATUS_LABELS[state] || state,
    isPaid,
    invoiceNumber: inv.invoice_number,
    issueDate: fmtDate(inv.issue_date),
    dueDate: inv.due_date ? fmtDate(inv.due_date) : undefined,
    projectName: inv.project_name || undefined,
    company: {
      name: company.name || 'Marrelay',
      tagline: company.tagline || 'Digital studio',
      addressLines: [company.addressLine1, company.addressLine2].filter(Boolean) as string[],
      email: company.email || undefined,
      phone: company.phone || undefined,
    },
    client: {
      title: inv.client_company || inv.client_name,
      contact: inv.client_company ? `Billed to: ${inv.client_name}` : undefined,
      addressLines: String(inv.client_address || '').split('\n').map((s) => s.trim()).filter(Boolean),
      email: inv.client_email || undefined,
      phone: inv.client_phone || undefined,
    },
    items: items.map((it) => ({
      description: it.description,
      quantity: Number(it.quantity) || 0,
      unitPrice: Number(it.unit_price) || 0,
      amount: (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
    })),
    currencyPrefix: CURRENCY_SYMBOL[cur] || cur + ' ',
    subtotal: Number(inv.subtotal) || 0,
    discountLabel: `Discount${inv.discount_type === 'percent' ? ` (${Number(inv.discount_value)}%)` : ''}`,
    discountAmount: Number(inv.discount_amount) || 0,
    taxLabel: `HST / Tax (${Number(inv.tax_rate)}%)`,
    taxAmount: Number(inv.tax_amount) || 0,
    total, paid, balance,
    notes: inv.notes || undefined,
    footerLine: isPaid
      ? 'Thank you - this invoice has been paid in full.'
      : balance > 0 ? `Please remit ${money(balance)} by ${inv.due_date ? fmtDate(inv.due_date) : 'the due date'}.` : 'Thank you for your business.',
    contactLine: `Questions? ${company.email || 'hello@marrelay.com'}${company.phone ? ` · ${company.phone}` : ''}`,
    siteLine: SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    logoPng,
  })

  const filename = `${isPaid ? 'Receipt' : 'Invoice'}-${inv.invoice_number}.pdf`
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
