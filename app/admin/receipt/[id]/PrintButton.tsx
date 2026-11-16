'use client'

import { Download, Printer, ArrowLeft } from 'lucide-react'

/**
 * Download is a real PDF file from the server, not the browser print dialog.
 * Printing is still offered, but it is the secondary action.
 */
export default function PrintButton({ id, label }: { id: number | string; label: string }) {
  return (
    <div className="noprint rcpt-actions">
      <a href={`/api/admin/receipt/${id}/pdf`} className="rcpt-btn primary">
        <Download size={15} /> Download {label} (PDF)
      </a>
      <button onClick={() => window.print()} className="rcpt-btn">
        <Printer size={15} /> Print
      </button>
      <a href="/admin/finance/invoices" className="rcpt-btn">
        <ArrowLeft size={15} /> Back to invoices
      </a>
    </div>
  )
}
