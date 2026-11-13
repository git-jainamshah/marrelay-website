import { Metadata } from 'next'
import { TERMS_DEFAULT_HTML } from '@/lib/admin/legal-defaults'
import LegalPage from '@/components/v3/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service',
  alternates: { canonical: '/terms' },
  openGraph: { title: 'Marrelay - Terms of Service', url: '/terms' },
  description: 'Terms of Service for Marrelay.',
}

export const revalidate = 60

async function getDoc() {
  try {
    const { getSetting } = require('@/lib/admin/db') as typeof import('@/lib/admin/db')
    const doc = await getSetting<{ html: string; updatedAt: string }>('legal_terms')
    if (doc?.html) return doc
  } catch { /* fall back */ }
  return { html: TERMS_DEFAULT_HTML, updatedAt: new Date().toISOString() }
}

export default async function TermsPage() {
  const doc = await getDoc()
  return (
    <LegalPage
      title="Terms of Service"
      active="terms"
      intro="The terms that apply when you use this website. Project work is covered by a separate agreement that we sign together before we start."
      doc={doc}
    />
  )
}
