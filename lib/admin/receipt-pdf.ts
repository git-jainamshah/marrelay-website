/**
 * A real, generated PDF of an invoice or receipt - not a printed web page.
 * Drawn with pdf-lib, so it is a single clean A4 page with proper margins,
 * selectable text and no browser chrome.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'

const INK = rgb(0.055, 0.055, 0.051)      // #0E0E0D
const MUT = rgb(0.416, 0.412, 0.392)      // #6A6964
const RULE = rgb(0.847, 0.839, 0.808)     // #D8D6CE
const RED = rgb(0.843, 0.149, 0.173)      // #D7262C
const PAPER = rgb(0.949, 0.945, 0.925)    // #F2F1EC

export type ReceiptData = {
  docTitle: string
  statusLabel: string
  isPaid: boolean
  invoiceNumber: string
  issueDate: string
  dueDate?: string
  projectName?: string
  company: { name: string; tagline?: string; addressLines: string[]; email?: string; phone?: string }
  client: { title: string; contact?: string; addressLines: string[]; email?: string; phone?: string }
  items: { description: string; quantity: number; unitPrice: number; amount: number }[]
  currencyPrefix: string
  subtotal: number
  discountLabel?: string
  discountAmount?: number
  taxLabel: string
  taxAmount: number
  total: number
  paid: number
  balance: number
  notes?: string
  footerLine: string
  contactLine: string
  siteLine: string
  logoPng?: Uint8Array | null
}

const A4 = { w: 595.28, h: 841.89 }
const M = 48 // margin

export async function buildReceiptPdf(d: ReceiptData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`${d.docTitle} ${d.invoiceNumber}`)
  pdf.setProducer('Marrelay')
  pdf.setCreator('Marrelay')

  const page = pdf.addPage([A4.w, A4.h])
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const reg = await pdf.embedFont(StandardFonts.Helvetica)
  const money = (n: number) => d.currencyPrefix + (Number(n) || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const right = A4.w - M
  let y = A4.h - M

  const text = (s: string, x: number, yy: number, o: { font?: PDFFont; size?: number; color?: any } = {}) =>
    page.drawText(s ?? '', { x, y: yy, font: o.font || reg, size: o.size || 10, color: o.color || INK })
  const textR = (s: string, xR: number, yy: number, o: { font?: PDFFont; size?: number; color?: any } = {}) => {
    const f = o.font || reg, sz = o.size || 10
    page.drawText(s ?? '', { x: xR - f.widthOfTextAtSize(s ?? '', sz), y: yy, font: f, size: sz, color: o.color || INK })
  }
  const line = (yy: number, color = RULE, thickness = 0.75) =>
    page.drawLine({ start: { x: M, y: yy }, end: { x: right, y: yy }, thickness, color })

  /* ---- header ---- */
  if (d.logoPng) {
    try {
      const img = await pdf.embedPng(d.logoPng)
      const h = 26, w = (img.width / img.height) * h
      page.drawImage(img, { x: M, y: y - h + 4, width: w, height: h })
      text(d.company.name, M + w + 10, y - 12, { font: bold, size: 17 })
      if (d.company.tagline) text(d.company.tagline, M + w + 10, y - 25, { size: 9, color: MUT })
    } catch { text(d.company.name, M, y - 12, { font: bold, size: 17 }) }
  } else {
    text(d.company.name, M, y - 12, { font: bold, size: 17 })
    if (d.company.tagline) text(d.company.tagline, M, y - 25, { size: 9, color: MUT })
  }

  textR(d.docTitle, right, y - 14, { font: bold, size: 24 })
  textR(d.invoiceNumber, right, y - 30, { size: 9.5, color: MUT })
  // status pill
  const pillText = d.statusLabel.toUpperCase()
  const pw = reg.widthOfTextAtSize(pillText, 8) + 16
  page.drawRectangle({ x: right - pw, y: y - 50, width: pw, height: 16, color: d.isPaid ? rgb(0.874, 0.941, 0.898) : rgb(0.984, 0.851, 0.855) })
  textR(pillText, right - 8, y - 45.5, { size: 8, font: bold, color: d.isPaid ? rgb(0.122, 0.478, 0.247) : RED })

  y -= 66
  line(y, RED, 1.5)
  y -= 24

  /* ---- parties ---- */
  const colW = (A4.w - M * 2) / 3
  const label = (s: string, x: number) => text(s.toUpperCase(), x, y, { size: 7.5, color: MUT })
  label('From', M); label('Bill to', M + colW)
  y -= 14

  let ly = y, ry = y
  text(d.company.name, M, ly, { font: bold, size: 11 }); ly -= 13
  for (const l of [...d.company.addressLines, d.company.email, d.company.phone].filter(Boolean) as string[]) {
    text(l, M, ly, { size: 9.5, color: MUT }); ly -= 12
  }
  text(d.client.title, M + colW, ry, { font: bold, size: 11 }); ry -= 13
  for (const l of [d.client.contact, ...d.client.addressLines, d.client.email, d.client.phone].filter(Boolean) as string[]) {
    text(l, M + colW, ry, { size: 9.5, color: MUT }); ry -= 12
  }
  let dy = y
  if (d.projectName) { textR('Project', right, dy, { size: 8.5, color: MUT }); dy -= 12; textR(d.projectName, right, dy, { font: bold, size: 10 }); dy -= 15 }
  textR('Issued', right, dy, { size: 8.5, color: MUT }); dy -= 12; textR(d.issueDate, right, dy, { size: 10 }); dy -= 15
  if (d.dueDate) { textR('Due', right, dy, { size: 8.5, color: MUT }); dy -= 12; textR(d.dueDate, right, dy, { size: 10 }); dy -= 15 }

  y = Math.min(ly, ry, dy) - 16

  /* ---- items ---- */
  const cQty = right - 230, cUnit = right - 130, cAmt = right
  text('DESCRIPTION', M, y, { size: 7.5, color: MUT })
  textR('QTY', cQty, y, { size: 7.5, color: MUT })
  textR('UNIT PRICE', cUnit, y, { size: 7.5, color: MUT })
  textR('AMOUNT', cAmt, y, { size: 7.5, color: MUT })
  y -= 8
  line(y, INK, 1)
  y -= 16

  for (const it of d.items) {
    // wrap long descriptions rather than letting them collide with Qty
    const maxW = cQty - M - 60
    const words = String(it.description || '').split(/\s+/)
    const lines: string[] = []
    let cur = ''
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w
      if (reg.widthOfTextAtSize(t, 10) > maxW && cur) { lines.push(cur); cur = w } else cur = t
    }
    if (cur) lines.push(cur)

    text(lines[0] || '', M, y, { size: 10 })
    textR(String(it.quantity), cQty, y, { size: 10 })
    textR(money(it.unitPrice), cUnit, y, { size: 10 })
    textR(money(it.amount), cAmt, y, { size: 10 })
    for (let i = 1; i < lines.length; i++) { y -= 12; text(lines[i], M, y, { size: 10, color: MUT }) }
    y -= 12
    line(y + 4)
    y -= 14
  }

  /* ---- totals ---- */
  y -= 6
  const tl = right - 230
  const totalRow = (k: string, v: string, o: { big?: boolean; accent?: boolean } = {}) => {
    text(k, tl, y, { size: o.big ? 11 : 9.5, color: o.big ? INK : MUT, font: o.big ? bold : reg })
    textR(v, right, y, { size: o.big ? 12 : 10, font: o.big ? bold : reg, color: o.accent ? RED : INK })
    y -= o.big ? 18 : 15
  }
  totalRow('Subtotal', money(d.subtotal))
  if (d.discountAmount && d.discountAmount > 0) totalRow(d.discountLabel || 'Discount', '- ' + money(d.discountAmount))
  totalRow(d.taxLabel, money(d.taxAmount))
  y -= 2
  page.drawLine({ start: { x: tl, y: y + 8 }, end: { x: right, y: y + 8 }, thickness: 1, color: INK })
  y -= 6
  totalRow('Total', money(d.total), { big: true })
  totalRow('Amount paid', money(d.paid))
  totalRow('Balance due', money(d.balance), { big: true, accent: d.balance > 0.005 })

  /* ---- notes + footer ---- */
  if (d.notes) {
    y -= 10
    text('NOTES', M, y, { size: 7.5, color: MUT }); y -= 13
    const maxW = right - M
    const words = d.notes.split(/\s+/)
    let cur = ''
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w
      if (reg.widthOfTextAtSize(t, 9.5) > maxW && cur) { text(cur, M, y, { size: 9.5, color: MUT }); y -= 12; cur = w } else cur = t
    }
    if (cur) { text(cur, M, y, { size: 9.5, color: MUT }); y -= 12 }
  }

  // footer pinned to the bottom, so the page always looks composed
  const fy = M + 40
  page.drawLine({ start: { x: M, y: fy + 26 }, end: { x: right, y: fy + 26 }, thickness: 0.75, color: RULE })
  const centre = (s: string, yy: number, o: { size?: number; color?: any; font?: PDFFont } = {}) => {
    const f = o.font || reg, sz = o.size || 9
    page.drawText(s, { x: (A4.w - f.widthOfTextAtSize(s, sz)) / 2, y: yy, font: f, size: sz, color: o.color || MUT })
  }
  centre(d.footerLine, fy + 12, { size: 9 })
  centre(d.contactLine, fy, { size: 9 })
  centre(d.siteLine, fy - 12, { size: 9, font: bold, color: RED })

  return pdf.save()
}
