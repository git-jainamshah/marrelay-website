import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="v-wrap v-top v-sec-b v-404">
      <span className="v-kick">Error 404</span>
      <h1 className="v-big">This page took a coffee break.</h1>
      <p className="v-body" style={{ fontSize: 18, maxWidth: '30em' }}>
        It either moved, never existed, or is off somewhere shipping. Either way, the rest of the studio is very much
        open.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/" className="btn btn-dark">Back to home <span aria-hidden="true">→</span></Link>
        <Link href="/contact" className="btn btn-ghost">Tell us what broke</Link>
      </div>
    </section>
  )
}
