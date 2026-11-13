import Link from 'next/link'

export type ServiceListItem = { key: string; full: string; intro: string; url: string; from: string }

/** /services overview: the five disciplines as a v3 list, prices from the admin. */
export default function ServicesView({ items }: { items: ServiceListItem[] }) {
  return (
    <>
      <section className="v-wrap v-top">
        <div className="v-crumb">
          <Link href="/">Home</Link><span>/</span><span className="here">Services</span>
        </div>
        <div className="v-phead">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <span className="v-label" data-reveal>Services</span>
            <h1 className="v-big" data-reveal data-delay="1">Five disciplines. One small team.</h1>
          </div>
          <p data-reveal data-delay="2">
            The people who build your site also set up the tracking and run the ads, so nothing gets lost between
            agencies. Most clients start with one and add another once it works.
          </p>
        </div>
      </section>

      <section className="v-wrap" style={{ paddingTop: 'clamp(56px,7vw,96px)' }}>
        <div className="v-svc-list always">
          {items.map((s, i) => (
            <Link key={s.key} href={s.url} className="v-svc-row" data-reveal>
              <span className="n">0{i + 1}</span>
              <span className="nm">{s.full}</span>
              <span className="ds">{s.intro}</span>
              <span className="fr">
                {s.from && <span>from {s.from}</span>}
                <span className="v-arrow-circle" style={{ color: 'var(--v-ink)' }}>→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="v-wrap v-sec v-sec-b">
        <div className="v-split">
          <div className="l" data-reveal>
            <span className="v-label">Not sure where to start?</span>
            <h2 className="v-h2-sm">Tell us the goal.</h2>
          </div>
          <div className="r" data-reveal style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: 'var(--v-ink-2)', maxWidth: '34em' }}>
              Thirty minutes, no pitch deck. We&apos;ll tell you which service fits, what it would cost, and if
              we&apos;re not the right team, who is.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/contact" className="btn btn-dark">Book a discovery call <span aria-hidden="true">→</span></Link>
              <Link href="/pricing" className="btn btn-ghost">Compare pricing</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

