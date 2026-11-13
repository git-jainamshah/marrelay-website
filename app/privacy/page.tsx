import { Metadata } from 'next'
import { PRIVACY_DEFAULT_HTML } from '@/lib/admin/legal-defaults'
import LegalPage from '@/components/v3/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  alternates: { canonical: '/privacy' },
  openGraph: { title: 'Marrelay - Privacy Policy', url: '/privacy' },
  description: 'Privacy Policy for Marrelay website.',
}

export const revalidate = 60

async function getDoc() {
  try {
    const { getSetting } = require('@/lib/admin/db') as typeof import('@/lib/admin/db')
    const doc = await getSetting<{ html: string; updatedAt: string }>('legal_privacy')
    if (doc?.html) return doc
  } catch { /* fall back */ }
  return { html: PRIVACY_DEFAULT_HTML, updatedAt: new Date().toISOString() }
}

export default async function PrivacyPage() {
  const doc = await getDoc()
  return (
    <LegalPage
      title="Privacy Policy"
      active="privacy"
      intro="What we collect when you use this site or talk to us about a project, why we collect it, and what you can ask us to do with it."
      doc={doc}
    />
  )
}
