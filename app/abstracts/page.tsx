import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Abstracts',
  description: 'View our abstracts and case studies.',
  alternates: { canonical: '/abstracts' },
  // Thin placeholder page: keep it out of the index so it does not dilute crawl budget.
  robots: { index: false, follow: true },
}

export default function AbstractsPage() {
  return (
    <section className="v-wrap v-top v-sec-b">
      <span className="v-kick">Abstracts</span>
      <h1 className="v-big" style={{ marginTop: 24 }}>Coming soon.</h1>
      <p className="v-body" style={{ fontSize: 18, marginTop: 24, maxWidth: '30em' }}>
        Our abstracts are on the way. In the meantime, the case studies show how we approach real problems.
      </p>
    </section>
  )
}
